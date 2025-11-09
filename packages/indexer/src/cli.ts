#!/usr/bin/env bun

/**
 * Build search index from Expo documentation
 *
 * This CLI crawls Expo's documentation from a local git submodule
 * and creates a search index that can be used for offline search.
 *
 * Prerequisites:
 *   1. Initialize expo submodule: git submodule add https://github.com/expo/expo.git expo-docs
 *   2. Update submodule to target branch: cd expo-docs && git checkout sdk-54 && cd ..
 *
 * Usage:
 *   bun packages/indexer/src/cli.ts [--docs-path ./expo-docs/docs] [--output ./output]
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlExpoDocs, OfflineSearchEngine } from "@expo-agent/search";
import { Command } from "commander";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

program
	.name("expo-indexer")
	.description("Build search index for Expo documentation")
	.option(
		"-d, --docs-path <path>",
		"Path to Expo docs directory",
		join(__dirname, "../../../expo-docs/docs"),
	)
	.option(
		"-o, --output <path>",
		"Output directory for search index",
		join(__dirname, "../../../packages/cli/src/data"),
	)
	.action(async (options) => {
		const docsPath = resolve(options.docsPath);
		const outputDir = resolve(options.output);

		console.log(`📚 Building search index from: ${docsPath}`);

		try {
			const docs = await crawlExpoDocs(docsPath);

			console.log(`✅ Processed ${docs.length} pages`);

			// Create output directory
			await mkdir(outputDir, { recursive: true });

			// Build FlexSearch index
			console.log("🔨 Building FlexSearch index...");
			const engine = new OfflineSearchEngine();
			await engine.loadDocuments(docs);

			// Export compressed index
			console.log("📦 Compressing index...");
			const compressed = await engine.exportCompressed();

			// Save compressed index
			const indexPath = join(outputDir, "search-index.gz");
			await writeFile(indexPath, compressed);

			console.log(`💾 Saved compressed index to ${indexPath}`);
			console.log(
				`📊 Compressed size: ${(compressed.length / 1024 / 1024).toFixed(2)} MB`,
			);
			console.log(`📊 Total documents: ${docs.length}`);

			// Print some stats
			const categories = new Set(
				docs.map((d) => d.hierarchy.lvl0).filter(Boolean),
			);
			console.log(`📁 Categories: ${categories.size}`);
			console.log(
				`📝 Average content length: ${Math.round(docs.reduce((sum, d) => sum + d.content.length, 0) / docs.length)} chars`,
			);
		} catch (error) {
			console.error("❌ Error building search index:", error);
			process.exit(1);
		}
	});

program.parse();
