import { defineConfig } from "tsup";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"parsers/index": "src/parsers/index.ts",
		"types/index": "src/types/index.ts",
		"utils/index": "src/utils/index.ts",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	sourcemap: true,
	splitting: false,
	treeshake: true,
});
