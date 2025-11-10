import { describe, expect, test } from "bun:test";
import { processInstallSections } from "./install-section-parser.js";

describe("processInstallSections", () => {
	test("should return content unchanged when no InstallSection tags", () => {
		const mdx = "# Hello\n\nThis is a test.";
		const result = processInstallSections(mdx);
		expect(result).toBe(mdx);
	});

	test("should process APIInstallSection with packageName from frontmatter", () => {
		const mdx = `---
title: Audio
packageName: 'expo-audio'
---

## Installation

<APIInstallSection />

Some content here.
`;

		const result = processInstallSections(mdx);

		// Should not contain the original tag
		expect(result).not.toContain("<APIInstallSection");

		// Should contain installation instructions
		expect(result).toContain("### Installation");
		expect(result).toContain("npx expo install expo-audio");
		expect(result).toContain("existing React Native app");
	});

	test("should process InstallSection with explicit packageName", () => {
		const mdx = `# Some Package

<InstallSection packageName="expo-camera" />
`;

		const result = processInstallSections(mdx);

		expect(result).not.toContain("<InstallSection");
		expect(result).toContain("### Installation");
		expect(result).toContain("npx expo install expo-camera");
	});

	test("should handle custom command", () => {
		const mdx = `---
packageName: 'my-package'
---

<APIInstallSection cmd={["npm install my-package"]} />
`;

		const result = processInstallSections(mdx);

		expect(result).toContain("npm install my-package");
		expect(result).not.toContain("npx expo install");
	});

	test("should handle missing packageName gracefully", () => {
		const mdx = `# Test

<APIInstallSection />
`;

		const result = processInstallSections(mdx);

		expect(result).toContain("unavailable");
	});

	test("should replace Installation heading with tag", () => {
		const mdx = `---
packageName: 'expo-audio'
---

## Installation

<APIInstallSection />

## Usage
`;

		const result = processInstallSections(mdx);

		// Should have the new ### Installation heading (in the generated content)
		const matches = result.match(/### Installation/g);
		expect(matches).toBeTruthy();
		expect(matches?.length).toBe(1);

		// Should not have the original ## Installation heading (level 2)
		const level2InstallationHeadings = result.match(/^## Installation$/gm);
		expect(level2InstallationHeadings).toBeNull();

		// Should still have the ## Usage heading
		expect(result).toContain("## Usage");
	});

	test("should handle multiple InstallSection tags", () => {
		const mdx = `---
packageName: 'expo-audio'
---

<APIInstallSection />

Some text.

<InstallSection packageName="expo-camera" />
`;

		const result = processInstallSections(mdx);

		// Should contain both package installations
		expect(result).toContain("expo-audio");
		expect(result).toContain("expo-camera");

		// Count occurrences of Installation heading
		const matches = result.match(/### Installation/g);
		expect(matches?.length).toBe(2);
	});
});
