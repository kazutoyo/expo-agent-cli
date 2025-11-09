import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";
import {
	processApiSections,
	processInstallSections,
	processPermissionSections,
} from "expo-agent-core";

export interface DocMetadata {
	id: string;
	title: string;
	url: string;
	content: string;
	hierarchy: {
		lvl0?: string;
		lvl1?: string;
		lvl2?: string;
		lvl3?: string;
	};
	path: string;
}

/**
 * Extract title from MDX content
 */
function extractTitle(mdxContent: string, filePath: string): string {
	// Try to find H1 title
	const h1Match = mdxContent.match(/^#\s+(.+)$/m);
	if (h1Match?.[1]) {
		return h1Match[1].trim();
	}

	// Try to find title in frontmatter
	const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---/);
	if (frontmatterMatch?.[1]) {
		const titleMatch = frontmatterMatch[1].match(
			/title:\s*['"]?(.+?)['"]?\s*$/m,
		);
		if (titleMatch?.[1]) {
			return titleMatch[1].trim();
		}
	}

	// Fallback to filename
	const filename = filePath.split("/").pop()?.replace(".mdx", "") || "Untitled";
	return filename
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Extract content from MDX (process special sections, remove frontmatter and code blocks)
 * @param mdxContent - The MDX content to process
 * @param expoVersion - The Expo SDK version (default: "latest")
 * @param localApiDataPath - Optional path to local API data directory
 */
async function extractContent(
	mdxContent: string,
	expoVersion = "latest",
	localApiDataPath?: string,
): Promise<string> {
	// Remove frontmatter
	let content = mdxContent.replace(/^---\n[\s\S]*?\n---\n/m, "");

	// Process InstallSection tags in MDX content
	content = processInstallSections(content);

	// Process Permission tags in MDX content
	content = await processPermissionSections(content);

	// Process APISection tags in MDX content
	content = await processApiSections(content, expoVersion, localApiDataPath);

	// Remove code blocks first (to preserve code examples in documentation)
	content = content.replace(/```[\w]*\n[\s\S]*?\n```/g, "");

	// Remove import statements (including multi-line imports)
	// Matches: import ... from '...'  or  import { ... } from '...'
	content = content.replace(
		/import\s+(?:[\w*{},\s]+\s+from\s+)?['"][^'"]+['"];?/gs,
		"",
	);

	// Remove export statements (including multi-line exports)
	content = content.replace(
		/export\s+(?:default\s+)?(?:const|let|var|function|class|interface|type|enum)\s+[\w\s{},=:;<>()[\]]+;?/gs,
		"",
	);

	// Remove JSX/React components
	content = content.replace(/<[^>]+>/g, "");

	// Remove inline code backticks but keep the content
	content = content.replace(/`([^`]+)`/g, "$1");

	// Remove links but keep text
	content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

	// Remove bold/italic markers
	content = content.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, "$1");

	// Normalize whitespace
	content = content.replace(/\s+/g, " ").trim();

	return content;
}

/**
 * Build hierarchy from file path
 */
function buildHierarchy(
	relativePath: string,
	title: string,
): DocMetadata["hierarchy"] {
	const parts = relativePath.split("/").filter((p) => p && p !== "pages");
	const hierarchy: DocMetadata["hierarchy"] = {};

	if (parts.length > 0 && parts[0]) {
		// lvl0: main category (e.g., "guides", "sdk")
		if (parts[0] === "versions") {
			hierarchy.lvl0 = "SDK Reference";
		} else {
			hierarchy.lvl0 = parts[0]
				.split("-")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" ");
		}
	}

	if (parts.length > 1) {
		// lvl1: subcategory or module name
		const lvl1Index = parts.length === 2 ? 0 : parts.length - 2;
		const lvl1 = parts[lvl1Index];
		if (lvl1 && lvl1 !== "versions") {
			hierarchy.lvl1 = lvl1
				.split("-")
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(" ");
		}
	}

	// lvl2: page title
	hierarchy.lvl2 = title;

	return hierarchy;
}

/**
 * Convert file path to web URL
 */
function pathToUrl(relativePath: string): string {
	// Remove .mdx extension and convert to URL
	let urlPath = relativePath.replace(/\.mdx$/, "").replace(/\/index$/, "");

	// Remove leading slash if present
	if (urlPath.startsWith("/")) {
		urlPath = urlPath.slice(1);
	}

	return `https://docs.expo.dev/${urlPath}`;
}

/**
 * Recursively find all MDX files in a directory
 */
async function findMdxFiles(dir: string, baseDir: string): Promise<string[]> {
	const files: string[] = [];
	const entries = await readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);

		if (entry.isDirectory()) {
			// Recursively search subdirectories
			files.push(...(await findMdxFiles(fullPath, baseDir)));
		} else if (entry.isFile() && entry.name.endsWith(".mdx")) {
			files.push(fullPath);
		}
	}

	return files;
}

/**
 * Crawl Expo documentation from local git submodule
 *
 * @param docsPath - Path to expo/docs directory (e.g., './expo-docs/docs')
 */
export async function crawlExpoDocs(docsPath: string): Promise<DocMetadata[]> {
	const pagesDir = join(docsPath, "pages");
	const docs: DocMetadata[] = [];

	console.log(`📁 Scanning ${pagesDir}...`);

	// Check if directory exists
	try {
		await stat(pagesDir);
	} catch {
		throw new Error(
			`Directory ${pagesDir} not found. Make sure expo submodule is initialized.`,
		);
	}

	// Construct local API data path for indexing
	const localApiDataPath = join(docsPath, "public", "static", "data");

	// Find all MDX files
	const mdxFiles = await findMdxFiles(pagesDir, pagesDir);
	console.log(`📄 Found ${mdxFiles.length} MDX files`);

	for (const filePath of mdxFiles) {
		try {
			const mdxContent = await readFile(filePath, "utf-8");
			const relativePath = relative(pagesDir, filePath);
			const title = extractTitle(mdxContent, relativePath);
			const content = await extractContent(
				mdxContent,
				"latest",
				localApiDataPath,
			);
			const hierarchy = buildHierarchy(relativePath, title);
			const url = pathToUrl(relativePath);

			docs.push({
				id: relativePath,
				title,
				url,
				content,
				hierarchy,
				path: relativePath,
			});
		} catch (error) {
			console.error(`Failed to process ${filePath}:`, error);
		}
	}

	return docs;
}
