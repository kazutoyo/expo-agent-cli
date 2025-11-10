import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

// Read version from package.json at build time
function getPackageVersion(): string {
	try {
		const packageJsonPath = join(process.cwd(), "package.json");
		const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
		const packageJson = JSON.parse(packageJsonContent) as { version: string };

		if (!packageJson.version || typeof packageJson.version !== "string") {
			throw new Error("Invalid or missing version in package.json");
		}

		return packageJson.version;
	} catch (error) {
		console.error("Failed to read package.json version:", error);
		throw error;
	}
}

const packageVersion = getPackageVersion();

export default defineConfig({
	entry: ["src/cli.ts"],
	format: ["esm"],
	target: "esnext",
	dts: false,
	clean: true,
	sourcemap: true,
	noExternal: ["expo-agent-core", "expo-agent-search"],
	shims: true,
	banner: {
		js: "#!/usr/bin/env node",
	},
	define: {
		__CLI_VERSION__: JSON.stringify(packageVersion),
	},
	onSuccess: async () => {
		// Copy compressed search index to dist
		try {
			mkdirSync(join(process.cwd(), "dist", "data"), { recursive: true });
			// copy search index
			copyFileSync(
				join(process.cwd(), "src", "data", "search-index.gz"),
				join(process.cwd(), "dist", "data", "search-index.gz"),
			);
			console.log("✅ Copied compressed search index to dist/data/");
		} catch (error) {
			console.warn("⚠️  Warning: Could not copy search index:", error);
		}
	},
});
