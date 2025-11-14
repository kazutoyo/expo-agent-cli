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

const resolveExpoBranch = (targetExpoVersion: string): string => {
	if (targetExpoVersion === "latest") {
		const expoVersion = getVersionInfo().expoVersion;
		return expoVersion || "main";
	}
	return targetExpoVersion;
};

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
