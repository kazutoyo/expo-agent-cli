/**
 * Parse APISection tags from MDX content and replace with API documentation
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { ApiDeclaration } from "../types/api-types.js";
import { convertApiToMarkdown } from "./api-markdown-converter.js";

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

	if (!packageNameMatch || !packageNameMatch[1]) return null;

	return {
		packageName: packageNameMatch[1],
		apiName: apiNameMatch?.[1],
	};
}

/**
 * Fetch or load API JSON data from Expo docs
 * @param packageName - The package name (e.g., "expo-camera")
 * @param sdkVersion - The SDK version (e.g., "sdk-54")
 * @param localDataPath - Optional path to local data directory (for indexing)
 */
async function fetchApiData(
	packageName: string,
	sdkVersion: string,
	localDataPath?: string,
): Promise<ApiDeclaration | null> {
	// Convert SDK version to data version format (e.g., sdk-54 -> v54.0.0)
	const versionMatch = sdkVersion.match(/sdk-(\d+)/);
	const dataVersion = versionMatch ? `v${versionMatch[1]}.0.0` : "v54.0.0";

	// Try to load from local path if provided (for indexing)
	if (localDataPath) {
		try {
			const localFilePath = join(
				localDataPath,
				dataVersion,
				`${packageName}.json`,
			);
			const fileContent = await readFile(localFilePath, "utf-8");
			return JSON.parse(fileContent) as ApiDeclaration;
		} catch (_error) {
			// If local file doesn't exist, fall through to HTTP
			console.warn(
				`Local API file not found for ${packageName}, using HTTP fallback`,
			);
		}
	}

	// Fetch from HTTP (for CLI usage or fallback)
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
 * @param mdxContent - The MDX content to process
 * @param sdkVersion - The SDK version (e.g., "sdk-54")
 * @param localDataPath - Optional path to local API data directory (for indexing)
 */
export async function processApiSections(
	mdxContent: string,
	sdkVersion: string,
	localDataPath?: string,
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
		const apiData = await fetchApiData(
			attrs.packageName,
			sdkVersion,
			localDataPath,
		);
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
