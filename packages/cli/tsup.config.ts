import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/cli.ts"],
	format: ["esm"],
	target: "esnext",
	dts: false,
	clean: true,
	sourcemap: true,
	external: ["@expo-agent/core", "@expo-agent/search"],
	shims: true,
	banner: {
		js: "#!/usr/bin/env node",
	},
	onSuccess: async () => {
		// Copy compressed search index to dist
		try {
			mkdirSync(join(process.cwd(), "dist", "data"), { recursive: true });
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
