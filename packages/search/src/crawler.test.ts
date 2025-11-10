import { describe, expect, test } from "bun:test";
import { extractIsDeprecated, extractTitle } from "./crawler.js";

describe("extractIsDeprecated", () => {
	test("returns false when no frontmatter exists", () => {
		const mdx = "# Hello World\n\nSome content";
		expect(extractIsDeprecated(mdx)).toBe(false);
	});

	test("returns false when isDeprecated is not present", () => {
		const mdx = `---
title: Test
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(false);
	});

	test("returns true for lowercase 'true'", () => {
		const mdx = `---
title: Test
isDeprecated: true
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns true for uppercase 'TRUE'", () => {
		const mdx = `---
title: Test
isDeprecated: TRUE
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns true for capitalized 'True'", () => {
		const mdx = `---
title: Test
isDeprecated: True
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns true for single-quoted 'true'", () => {
		const mdx = `---
title: Test
isDeprecated: 'true'
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns true for double-quoted 'true'", () => {
		const mdx = `---
title: Test
isDeprecated: "true"
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns true for 'true' with trailing comment", () => {
		const mdx = `---
title: Test
isDeprecated: true # This package is deprecated
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns true for quoted 'TRUE' with comment", () => {
		const mdx = `---
title: Test
isDeprecated: "TRUE" # Deprecated in favor of expo-audio
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("returns false for lowercase 'false'", () => {
		const mdx = `---
title: Test
isDeprecated: false
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(false);
	});

	test("returns false for uppercase 'FALSE'", () => {
		const mdx = `---
title: Test
isDeprecated: FALSE
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(false);
	});

	test("returns false for quoted 'false'", () => {
		const mdx = `---
title: Test
isDeprecated: "false"
---
# Hello World`;
		expect(extractIsDeprecated(mdx)).toBe(false);
	});

	test("handles real-world expo-av example", () => {
		const mdx = `---
title: Audio (expo-av)
description: A library that provides an API to implement audio playback and recording in apps.
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-53/packages/expo-av'
packageName: 'expo-av'
iconUrl: '/static/images/packages/expo-av.png'
platforms: ['android', 'ios', 'tvos', 'web']
isDeprecated: true
---

# Audio`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});

	test("handles multi-line frontmatter with various fields", () => {
		const mdx = `---
title: Test Package
version: 1.0.0
author: Someone
isDeprecated: true
tags: [audio, video]
---
# Content`;
		expect(extractIsDeprecated(mdx)).toBe(true);
	});
});

describe("extractTitle", () => {
	test("extracts title from H1 heading", () => {
		const mdx = "# Hello World\n\nSome content";
		expect(extractTitle(mdx, "test.mdx")).toBe("Hello World");
	});

	test("extracts title from frontmatter when no H1 exists", () => {
		const mdx = `---
title: My Test Title
---

Some content without heading`;
		expect(extractTitle(mdx, "test.mdx")).toBe("My Test Title");
	});

	test("extracts title from frontmatter with quotes when no H1", () => {
		const mdx = `---
title: "Audio (expo-av)"
---

Content without heading`;
		expect(extractTitle(mdx, "test.mdx")).toBe("Audio (expo-av)");
	});

	test("extracts title from frontmatter with single quotes when no H1", () => {
		const mdx = `---
title: 'Camera Module'
---

Content without heading`;
		expect(extractTitle(mdx, "test.mdx")).toBe("Camera Module");
	});

	test("falls back to filename when no title found", () => {
		const mdx = "Some content without title";
		expect(extractTitle(mdx, "pages/test-module.mdx")).toBe("Test Module");
	});

	test("formats filename with multiple words", () => {
		const mdx = "Content";
		expect(extractTitle(mdx, "my-awesome-module.mdx")).toBe(
			"My Awesome Module",
		);
	});

	test("handles path with directories", () => {
		const mdx = "Content";
		expect(extractTitle(mdx, "pages/sdk/expo-camera.mdx")).toBe("Expo Camera");
	});

	test("prioritizes H1 over filename", () => {
		const mdx = "# Actual Title\n\nContent";
		expect(extractTitle(mdx, "different-name.mdx")).toBe("Actual Title");
	});

	test("prioritizes H1 over frontmatter", () => {
		const mdx = `---
title: Frontmatter Title
---
# H1 Title`;
		// The current implementation checks H1 first
		expect(extractTitle(mdx, "test.mdx")).toBe("H1 Title");
	});

	test("trims whitespace from title", () => {
		const mdx = "#   Spaced Title   \n\nContent";
		expect(extractTitle(mdx, "test.mdx")).toBe("Spaced Title");
	});

	test("handles empty filename gracefully", () => {
		const mdx = "Content";
		expect(extractTitle(mdx, "")).toBe("Untitled");
	});
});
