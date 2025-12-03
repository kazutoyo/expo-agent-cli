import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type VersionInfo = {
	version: string;
	expoVersion: string | null;
};

export const getVersionInfo = (): VersionInfo => {
	// Get CLI version (injected at build time via tsup define)
	// In development, fallback to reading package.json
	let version: string;
	if (typeof __CLI_VERSION__ !== "undefined") {
		// Production: use build-time injected constant
		version = __CLI_VERSION__;
	} else {
		// Development: read from package.json
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = dirname(__filename);
		const packageJsonPath = join(__dirname, "../../package.json");
		const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
			version: string;
		};
		version = packageJson.version;
	}

	// Try to detect expo version from user's project
	let expoVersion: string | null = null;
	try {
		// Create a require function relative to user's current working directory
		// This handles monorepos, hoisting, and symlinks correctly
		const userRequire = createRequire(join(process.cwd(), "package.json"));
		const expoPackageJsonPath = userRequire.resolve("expo/package.json");
		const expoPackageJson = JSON.parse(
			readFileSync(expoPackageJsonPath, "utf-8"),
		) as { version: string };
		const majorVersion = expoPackageJson.version.split(".")[0];
		expoVersion = `sdk-${majorVersion}`;
	} catch {
		// If expo package is not found in user's project, return null
	}

	return {
		version,
		expoVersion,
	};
};

/**
 * Normalize documentation path
 * @param path - Raw path (e.g., "guides/routing", "/guides/routing/", "guides/routing.mdx")
 * @returns Normalized path (e.g., "/guides/routing")
 */
export const normalizePath = (path: string): string => {
	let normalized = path;

	// Ensure path starts with /
	if (!normalized.startsWith("/")) {
		normalized = `/${normalized}`;
	}

	// Remove trailing slash
	normalized = normalized.replace(/\/$/, "");

	// Remove .mdx extension if provided
	normalized = normalized.replace(/\.mdx$/, "");

	return normalized;
};

/**
 * Extract SDK version from path
 * @param path - Normalized path (e.g., "/versions/v54.0.0/sdk/calendar/", "/guides/apple-privacy/")
 * @returns SDK version string (e.g., "sdk-54") or "latest" if not found
 */
export const extractVersionFromPath = (path: string): string => {
	// Match /versions/v{major}.{minor}.{patch}/ or /versions/v{major}/
	const versionMatch = path.match(/\/versions\/v(\d+)(?:\.\d+\.\d+)?\//);
	if (versionMatch?.[1]) {
		return `sdk-${versionMatch[1]}`;
	}

	// Check for explicit "unversioned" in path
	if (path.includes("/versions/unversioned/")) {
		return "unversioned";
	}

	// Check for explicit "latest" in path
	if (path.includes("/versions/latest/") || path.includes("latest")) {
		return "latest";
	}

	// Default to "latest" for paths without version
	return "latest";
};

// Cache for latest SDK version to avoid redundant API calls
let latestSdkVersionCache: string | null = null;

/**
 * Fetch the latest SDK version from app.json (with caching)
 * @returns SDK version string (e.g., "54.0.0")
 */
const fetchLatestSdkVersion = async (): Promise<string> => {
	if (latestSdkVersionCache) {
		return latestSdkVersionCache;
	}

	const appJsonUrl =
		"https://raw.githubusercontent.com/expo/expo/refs/heads/main/apps/expo-go/app.json";
	const response = await fetch(appJsonUrl);
	if (!response.ok) {
		throw new Error(`Failed to fetch app.json: ${response.statusText}`);
	}
	const appJson = (await response.json()) as { expo: { sdkVersion: string } };
	latestSdkVersionCache = appJson.expo.sdkVersion;
	return latestSdkVersionCache;
};

/**
 * Resolve path with "next" version to actual version
 * @param path - Path that may contain "next" version
 * @returns Resolved path with actual version
 */
const resolveNextVersion = async (path: string): Promise<string> => {
	if (!path.includes("/versions/next/")) {
		return path;
	}

	const sdkVersion = await fetchLatestSdkVersion();
	return path.replace("/versions/next/", `/versions/v${sdkVersion}/`);
};

export type ExpoDocsInfo = {
	urls: string[];
	resolvedVersion: string;
};

/**
 * Get Expo documentation information for a given path
 * Returns an array of URLs to try (first .mdx, then /index.mdx if applicable)
 * along with the resolved version
 * @param path - Documentation path
 * @returns Object containing URLs to try and resolved version
 */
export async function getExpoDocsInfo(path: string): Promise<ExpoDocsInfo> {
	const normalizedPath = normalizePath(path);
	const resolvedPath = await resolveNextVersion(normalizedPath);

	const baseUrl =
		"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages";

	// First, try direct file path
	const urls = [`${baseUrl}${resolvedPath}.mdx`];

	// If path looks like it could be a directory, also try index.mdx
	if (resolvedPath.split("/").length > 1) {
		urls.push(`${baseUrl}${resolvedPath}/index.mdx`);
	}

	// Extract the resolved version from the path
	const resolvedVersion = extractVersionFromPath(resolvedPath);

	return {
		urls,
		resolvedVersion,
	};
}
