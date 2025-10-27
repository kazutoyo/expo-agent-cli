// Algolia configuration from expo/styleguide
export const EXPO_ALGOLIA_APP_ID = "QEX7PB7D46";
export const EXPO_ALGOLIA_API_KEY = "6652d26570e8628af4601e1d78ad456b";
export const EXPO_ALGOLIA_INDEX_NAME = "expo";

// Helper function to build docs URL with version
export function getExpoDocsUrl(expoVersion: string): string {
	const branch = expoVersion === "latest" ? "main" : expoVersion;
	return `https://raw.githubusercontent.com/expo/expo/refs/heads/${branch}/docs/pages`;
}

/**
 * Extract version from URL path like "/versions/v54.0.0/sdk/camera/"
 * Returns version in format "sdk-54" or null if not found
 */
export function extractVersionFromPath(path: string): string | null {
	// Match patterns like /versions/v54.0.0/ or /versions/latest/
	const versionMatch = path.match(/\/versions\/v?(\d+)(?:\.\d+)*\//);
	if (versionMatch) {
		const majorVersion = versionMatch[1];
		return `sdk-${majorVersion}`;
	}

	// Check for /versions/latest/
	if (path.includes("/versions/latest/")) {
		return "latest";
	}

	return null;
}

/**
 * Convert version from path to branch name
 * If version is "latest", use the provided defaultVersion
 * Examples:
 *   "/versions/v54.0.0/sdk/camera/" -> "sdk-54"
 *   "/versions/v53.0.0/sdk/camera/" -> "sdk-53"
 *   "/versions/latest/sdk/camera/" -> defaultVersion (e.g., "sdk-54")
 */
export function getVersionForPath(
	path: string,
	defaultVersion: string,
): string {
	const extractedVersion = extractVersionFromPath(path);

	if (extractedVersion === "latest") {
		return defaultVersion;
	}

	return extractedVersion || defaultVersion;
}
