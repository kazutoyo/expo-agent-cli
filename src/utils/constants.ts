import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Algolia configuration from expo/styleguide
export const EXPO_ALGOLIA_APP_ID = "QEX7PB7D46";
export const EXPO_ALGOLIA_API_KEY = "6652d26570e8628af4601e1d78ad456b";
export const EXPO_ALGOLIA_INDEX_NAME = "expo";

type VersionInfo = {
	version: string;
	expoVersion: string;
};

export const getVersionInfo = (): VersionInfo => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	// Read version and expoVersion from package.json
	const packageJsonPath = join(__dirname, "../package.json");
	return JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
		version: string;
		expoVersion: string;
	};
};

const resolveExpoBranch = (targetExpoVersion: string): string =>
	targetExpoVersion === "latest"
		? getVersionInfo().expoVersion
		: targetExpoVersion;

const toVersionSegment = (branch: string): string | null => {
	if (branch.startsWith("sdk-")) {
		return `v${branch.replace("sdk-", "")}.0.0`;
	}

	const match = branch.match(/^v(\d+)/);
	if (match?.[1]) {
		return `v${match[1]}.0.0`;
	}

	return null;
};

// Helper function to build docs URL with version
export function getExpoDocsBaseUrl(targetExpoVersion: string): string {
	const branch = resolveExpoBranch(targetExpoVersion);
	return `https://raw.githubusercontent.com/expo/expo/refs/heads/${branch}/docs/pages`;
}

export function getExpoDocsUrl(
	path: string,
	targetExpoVersion: string,
): string {
	const branch = resolveExpoBranch(targetExpoVersion);

	let normalizedPath = path;
	// Ensure path starts with /
	if (!normalizedPath.startsWith("/")) {
		normalizedPath = `/${normalizedPath}`;
	}

	// Remove trailing slash
	normalizedPath = normalizedPath.replace(/\/$/, "");

	// Remove .mdx extension if provided
	normalizedPath = normalizedPath.replace(/\.mdx$/, "");

	const versionSegment = toVersionSegment(branch);
	if (versionSegment) {
		normalizedPath = normalizedPath.replace(
			/\/versions\/latest\//,
			`/versions/${versionSegment}/`,
		);
	}

	const baseUrl = getExpoDocsBaseUrl(targetExpoVersion);
	return `${baseUrl}${normalizedPath}.mdx`;
}
