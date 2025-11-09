import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/cli.ts"],
	format: ["esm"],
	dts: false,
	clean: true,
	sourcemap: true,
	external: ["@expo-agent/core", "@expo-agent/search"],
	shims: true,
	banner: {
		js: "#!/usr/bin/env bun",
	},
});
