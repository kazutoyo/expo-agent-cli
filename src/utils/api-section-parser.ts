/**
 * Parse APISection tags from MDX content and replace with API documentation
 */

import { convertApiToMarkdown } from "./api-markdown-converter.js";
import type { ApiDeclaration } from "./api-types.js";

/**
 * Extract APISection attributes from a tag
 */
function parseApiSectionTag(tag: string): {
	packageName: string;
	apiName?: string;
} | null {
	// Match <APISection packageName="..." apiName="..." />
	const packageNameMatch = tag.match(/packageName=["']([^"']+)["']/);
	const apiNameMatch = tag.match(/apiName=["']([^"']+)["']/);

	if (!packageNameMatch) return null;

	return {
		packageName: packageNameMatch[1],
		apiName: apiNameMatch?.[1],
	};
}

/**
 * Fetch API JSON data from Expo docs
 */
async function fetchApiData(
	packageName: string,
	sdkVersion: string,
): Promise<ApiDeclaration | null> {
	// Convert SDK version to data version format (e.g., sdk-54 -> v54.0.0)
	const versionMatch = sdkVersion.match(/sdk-(\d+)/);
	const dataVersion = versionMatch ? `v${versionMatch[1]}.0.0` : "v54.0.0";

	const url = `https://docs.expo.dev/static/data/${dataVersion}/${packageName}.json`;

	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.error(
				`Failed to fetch API data for ${packageName}: ${response.statusText}`,
			);
			return null;
		}
		return (await response.json()) as ApiDeclaration;
	} catch (error) {
		console.error(`Error fetching API data for ${packageName}:`, error);
		return null;
	}
}

/**
 * Process APISection tags in MDX content
 */
export async function processApiSections(
	mdxContent: string,
	sdkVersion: string,
): Promise<string> {
	// Find all APISection tags
	const apiSectionRegex = /<APISection[^>]*\/>/g;
	const matches = mdxContent.match(apiSectionRegex);

	if (!matches || matches.length === 0) {
		return mdxContent;
	}

	let processedContent = mdxContent;

	// Process each APISection tag
	for (const match of matches) {
		const attrs = parseApiSectionTag(match);
		if (!attrs) {
			console.warn(`Failed to parse APISection tag: ${match}`);
			continue;
		}

		// Fetch API data
		const apiData = await fetchApiData(attrs.packageName, sdkVersion);
		if (!apiData) {
			// Replace with error message
			processedContent = processedContent.replace(
				match,
				`\n> **Note:** API documentation for \`${attrs.packageName}\` could not be loaded.\n`,
			);
			continue;
		}

		// Convert to markdown
		const markdown = convertApiToMarkdown(apiData, attrs.apiName);

		// Replace the APISection tag with generated markdown
		processedContent = processedContent.replace(match, `\n${markdown}\n`);
	}

	return processedContent;
}
