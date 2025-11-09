#!/usr/bin/env bun

/**
 * Build search index from Expo documentation
 *
 * This script crawls Expo's documentation from a local git submodule
 * and creates a search index that can be used for offline search.
 *
 * Prerequisites:
 *   1. Initialize expo submodule: git submodule add https://github.com/expo/expo.git expo-docs
 *   2. Update submodule to target branch: cd expo-docs && git checkout sdk-54 && cd ..
 *
 * Usage:
 *   bun scripts/build-search-index.ts [--docs-path ./expo-docs/docs]
 */

import { writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { crawlExpoDocs } from "../src/utils/doc-crawler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const docsPath: string = process.argv.includes("--docs-path")
	? process.argv[process.argv.indexOf("--docs-path") + 1] || join(__dirname, "../expo-docs/docs")
	: join(__dirname, "../expo-docs/docs");

async function buildSearchIndex() {
	console.log(`📚 Building search index from: ${docsPath}`);

	try {
		const docs = await crawlExpoDocs(docsPath);

		console.log(`✅ Processed ${docs.length} pages`);

		// Save raw documents as JSON
		const dataDir = join(__dirname, "../src/data");
		await mkdir(dataDir, { recursive: true });

		const outputPath = join(dataDir, "search-docs.json");
		await writeFile(outputPath, JSON.stringify(docs, null, 2));

		console.log(`💾 Saved search data to ${outputPath}`);
		console.log(`📊 Total documents: ${docs.length}`);

		// Print some stats
		const categories = new Set(docs.map((d) => d.hierarchy.lvl0).filter(Boolean));
		console.log(`📁 Categories: ${categories.size}`);
		console.log(
			`📝 Average content length: ${Math.round(docs.reduce((sum, d) => sum + d.content.length, 0) / docs.length)} chars`,
		);
	} catch (error) {
		console.error("❌ Error building search index:", error);
		process.exit(1);
	}
}

buildSearchIndex();
