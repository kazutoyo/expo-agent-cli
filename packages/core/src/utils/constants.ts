import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

type VersionInfo = {
	version: string;
	expoVersion: string;
};

export const getVersionInfo = (): VersionInfo => {
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	// Read version from core package.json
	const packageJsonPath = join(__dirname, "../../package.json");
	const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
		version: string;
		expoVersion?: string;
	};

	// Try to detect expo version from installed expo package
	let expoVersion = packageJson.expoVersion || "sdk-54"; // fallback default
	try {
		const expoPackageJsonPath = require.resolve("expo/package.json");
		const expoPackageJson = JSON.parse(
			readFileSync(expoPackageJsonPath, "utf-8"),
		) as { version: string };
		const majorVersion = expoPackageJson.version.split(".")[0];
		expoVersion = `sdk-${majorVersion}`;
	} catch {
		// If expo package is not found, use fallback from package.json
	}

	return {
		version: packageJson.version,
		expoVersion,
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
