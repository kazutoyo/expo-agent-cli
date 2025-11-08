/**
 * Parse APIInstallSection tags from MDX content and replace with installation instructions
 */

/**
 * Extract packageName from MDX frontmatter
 */
function extractPackageNameFromFrontmatter(mdxContent: string): string | null {
	// Match YAML frontmatter between --- delimiters
	const frontmatterMatch = mdxContent.match(/^---\n([\s\S]*?)\n---/);
	if (!frontmatterMatch) return null;

	const frontmatter = frontmatterMatch[1];

	// Extract packageName
	const packageNameMatch = frontmatter.match(/packageName:\s*['"]([^'"]+)['"]/);
	return packageNameMatch ? packageNameMatch[1] : null;
}

/**
 * Generate installation markdown for a package
 */
function generateInstallationMarkdown(
	packageName: string,
	customCmd?: string,
): string {
	const cmd = customCmd || `npx expo install ${packageName}`;

	const markdown = `
### Installation

Install the package:

\`\`\`bash
${cmd}
\`\`\`

> **Note:** If you are installing this in an existing React Native app (bare workflow), make sure to install \`expo\` in your project first. See the [installation instructions](https://docs.expo.dev/bare/installing-expo-modules/) for more details.
`;

	return markdown.trim();
}

/**
 * Parse APIInstallSection attributes from a tag
 */
function parseInstallSectionTag(tag: string): {
	packageName?: string;
	cmd?: string;
	hideBareInstructions?: boolean;
} | null {
	// Match attributes
	const packageNameMatch = tag.match(/packageName=["']([^"']+)["']/);
	const cmdMatch = tag.match(/cmd=\{?\[["']([^"'\]]+)["']\]?\}?/);
	const hideBareMatch = tag.match(/hideBareInstructions(?:=\{?(true)\}?)?/);

	return {
		packageName: packageNameMatch?.[1],
		cmd: cmdMatch?.[1],
		hideBareInstructions: !!hideBareMatch,
	};
}

/**
 * Process APIInstallSection tags in MDX content
 */
export function processInstallSections(mdxContent: string): string {
	// Extract packageName from frontmatter
	const defaultPackageName = extractPackageNameFromFrontmatter(mdxContent);

	// Find all APIInstallSection and InstallSection tags
	const installSectionRegex = /<(API)?InstallSection[^>]*\/>/g;
	const matches = mdxContent.match(installSectionRegex);

	if (!matches || matches.length === 0) {
		return mdxContent;
	}

	let processedContent = mdxContent;

	// Process each InstallSection tag
	for (const match of matches) {
		const attrs = parseInstallSectionTag(match);
		if (!attrs) {
			console.warn(`Failed to parse InstallSection tag: ${match}`);
			continue;
		}

		// Use packageName from tag, or fall back to frontmatter
		const packageName = attrs.packageName || defaultPackageName;

		if (!packageName) {
			console.warn(
				"No packageName found in tag or frontmatter for InstallSection",
			);
			processedContent = processedContent.replace(
				match,
				"\n> **Note:** Installation instructions unavailable (no package name specified).\n",
			);
			continue;
		}

		// Generate installation markdown
		const markdown = generateInstallationMarkdown(packageName, attrs.cmd);

		// Replace the tag with generated markdown
		// Check if there's an "## Installation" heading right before the tag
		const escapedMatch = match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const withHeadingPattern = new RegExp(
			`##\\s+Installation\\s*\\n+\\s*${escapedMatch}`,
		);

		if (withHeadingPattern.test(processedContent)) {
			// Replace both the heading and the tag
			processedContent = processedContent.replace(withHeadingPattern, markdown);
		} else {
			// Just replace the tag
			processedContent = processedContent.replace(match, `\n${markdown}\n`);
		}
	}

	return processedContent;
}
