import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatHighlight } from "@expo-agent/core";
import { OfflineSearchEngine as SearchEngine } from "@expo-agent/search";
import chalk from "chalk";
import type { Command } from "commander";

interface SearchOptions {
	limit?: string;
	pretty?: boolean;
}

let searchEngine: SearchEngine | null = null;

/**
 * Initialize search engine with prebuilt compressed index
 */
async function initSearchEngine(): Promise<SearchEngine> {
	if (searchEngine) {
		return searchEngine;
	}

	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	// Load prebuilt compressed index
	// In production (dist/cli.js), the path is dist/data/search-index.gz
	// __dirname will be the directory containing cli.js (dist/)
	const indexPath = join(__dirname, "data/search-index.gz");

	try {
		const compressedData = await readFile(indexPath);

		searchEngine = new SearchEngine();
		await searchEngine.importCompressed(compressedData);

		return searchEngine;
	} catch (error) {
		throw new Error(
			`Failed to load search index. Please run 'npm run build-index' first.\nError: ${error}`,
		);
	}
}

export const searchCommand = (program: Command) => {
	program
		.command("search")
		.description("Search Expo documentation (offline)")
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

				// Initialize search engine
				const engine = await initSearchEngine();

				// Search documents
				const results = await engine.search(query, limit);
				const total = results.length;

				if (options.pretty) {
					// Pretty output for humans
					console.log(
						chalk.bold.green(`\nFound ${total} results for: "${query}"\n`),
					);

					results.forEach((result, index) => {
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
							{
								query,
								total,
								results: results.map((r) => ({
									title: r.title,
									category: r.category,
									url: r.url,
									path: r.path,
								})),
							},
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
