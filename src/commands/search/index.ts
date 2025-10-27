import type { Command } from "commander";
import { algoliasearch } from "algoliasearch";
import chalk from "chalk";
import {
	EXPO_ALGOLIA_APP_ID,
	EXPO_ALGOLIA_API_KEY,
	EXPO_ALGOLIA_INDEX_NAME,
	getVersionForPath,
} from "../../utils/constants.js";
import {
	cleanHighlight,
	formatHighlight,
} from "../../utils/markdown-formatter.js";

interface SearchOptions {
	limit?: string;
	pretty?: boolean;
}

interface AlgoliaHit {
	objectID: string;
	title?: string;
	url?: string;
	content?: string;
	hierarchy?: {
		lvl0?: string;
		lvl1?: string;
		lvl2?: string;
		lvl3?: string;
	};
	_highlightResult?: {
		title?: { value: string };
		content?: { value: string };
		hierarchy?: {
			lvl0?: { value: string };
			lvl1?: { value: string };
			lvl2?: { value: string };
			lvl3?: { value: string };
		};
	};
}

export const searchCommand = (program: Command, expoVersion: string) => {
	program
		.command("search")
		.description("Search Expo documentation")
		.argument("<query>", "Search query")
		.option(
			"-l, --limit <number>",
			"Number of results to show (default: 5, max: 20)",
			"5",
		)
		.option("-p, --pretty", "Display results in human-readable format")
		.action(async (query: string, options: SearchOptions) => {
			try {
				const parsedLimit = parseInt(options.limit || "5", 10);
				const normalizedLimit =
					Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;
				const limit = Math.min(normalizedLimit, 20);

				const client = algoliasearch(EXPO_ALGOLIA_APP_ID, EXPO_ALGOLIA_API_KEY);

				const { results } = await client.search({
					requests: [
						{
							indexName: EXPO_ALGOLIA_INDEX_NAME,
							query,
							hitsPerPage: limit,
						},
					],
				});

				const hits = (results[0]?.hits as AlgoliaHit[]) || [];
				const total = hits.length;

				// Format results
				const formattedResults = hits.map((hit) => {
					// Get title from various sources
					let title = hit.title;
					let highlightedTitle = title || "";
					if (!title && hit._highlightResult?.hierarchy?.lvl1) {
						title = cleanHighlight(hit._highlightResult.hierarchy.lvl1.value);
						highlightedTitle = hit._highlightResult.hierarchy.lvl1.value;
					}
					if (!title) {
						title = hit.hierarchy?.lvl1 || hit.hierarchy?.lvl0 || "Untitled";
						highlightedTitle = title;
					}

					// Build hierarchy path
					const hierarchyParts: string[] = [];
					if (hit.hierarchy?.lvl0 && hit.hierarchy.lvl0 !== "Documentation") {
						hierarchyParts.push(hit.hierarchy.lvl0);
					}
					if (hit.hierarchy?.lvl1 && hit.hierarchy.lvl1 !== title) {
						hierarchyParts.push(cleanHighlight(hit.hierarchy.lvl1));
					}
					if (hit.hierarchy?.lvl2) {
						hierarchyParts.push(cleanHighlight(hit.hierarchy.lvl2));
					}

					const category =
						hierarchyParts.length > 0 ? hierarchyParts.join(" > ") : "";
					const url = hit.url || "";
					const urlPath = url ? new URL(url).pathname : "";

					// Extract version from path and convert to branch format
					const version = getVersionForPath(urlPath, expoVersion);

					// Extract docs path by removing version prefix
					// e.g., "/versions/v54.0.0/sdk/camera/" -> "/sdk/camera"
					let docsPath = urlPath;
					const versionMatch = urlPath.match(/\/versions\/[^/]+(\/.+)/);
					if (versionMatch?.[1]) {
						docsPath = versionMatch[1];
					}

					return {
						title,
						highlightedTitle,
						category,
						url,
						path: urlPath,
						version,
						docsPath,
					};
				});

				if (options.pretty) {
					// Pretty output for humans
					console.log(
						chalk.bold.green(`\nFound ${total} results for: "${query}"\n`),
					);

					formattedResults.forEach((result, index) => {
						// Use highlighted title for pretty output
						const displayTitle = formatHighlight(result.highlightedTitle);
						console.log(chalk.bold.cyan(`${index + 1}. ${displayTitle}`));

						if (result.category) {
							console.log(chalk.gray(`   ${result.category}`));
						}

						if (result.url) {
							console.log(chalk.gray(`   ${result.url}`));
						}

						console.log("");
					});
				} else {
					// JSON output for piping/AI processing
					console.log(
						JSON.stringify(
							{ query, total, results: formattedResults },
							null,
							2,
						),
					);
				}
			} catch (error) {
				console.error(
					"Error searching documentation:",
					error instanceof Error ? error.message : error,
				);
				process.exit(1);
			}
		});
};
