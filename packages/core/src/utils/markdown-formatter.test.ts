import { describe, expect, test } from "bun:test";
import {
	cleanHighlight,
	formatHighlight,
	formatMarkdownForTerminal,
	stripHtmlTags,
} from "./markdown-formatter.js";

describe("formatMarkdownForTerminal", () => {
	test("formats headers", () => {
		const input = "# Header 1\n## Header 2\n### Header 3";
		const output = formatMarkdownForTerminal(input);

		// Should contain header markers
		expect(output).toContain("# Header 1");
		expect(output).toContain("## Header 2");
		expect(output).toContain("### Header 3");
	});

	test("formats bold text with **", () => {
		const input = "This is **bold** text";
		const output = formatMarkdownForTerminal(input);

		// Should not contain markdown syntax
		expect(output).not.toContain("**");
	});

	test("formats bold text with __", () => {
		const input = "This is __bold__ text";
		const output = formatMarkdownForTerminal(input);

		// Should not contain markdown syntax
		expect(output).not.toContain("__");
	});

	test("formats italic text with *", () => {
		const input = "This is *italic* text";
		const output = formatMarkdownForTerminal(input);

		// Should not contain markdown syntax for italic (but bold ** still exists)
		expect(output).toContain("italic");
	});

	test("formats inline code", () => {
		const input = "Use `console.log()` for debugging";
		const output = formatMarkdownForTerminal(input);

		// Should contain the code content
		expect(output).toContain("console.log()");
	});

	test("formats links", () => {
		const input = "[Expo Docs](https://docs.expo.dev)";
		const output = formatMarkdownForTerminal(input);

		// Should contain text and URL
		expect(output).toContain("Expo Docs");
		expect(output).toContain("https://docs.expo.dev");
		// Should not contain markdown syntax
		expect(output).not.toContain("[Expo Docs]");
	});

	test("formats code blocks", () => {
		const input = "```js\nconsole.log('hello');\n```";
		const output = formatMarkdownForTerminal(input);

		// Should contain code content
		expect(output).toContain("console.log('hello');");
		// Should include language label
		expect(output).toContain("js");
	});

	test("formats code blocks without language", () => {
		const input = "```\nsome code\n```";
		const output = formatMarkdownForTerminal(input);

		// Should contain code content
		expect(output).toContain("some code");
	});

	test("formats bullet points with -", () => {
		const input = "- Item 1\n- Item 2";
		const output = formatMarkdownForTerminal(input);

		// Should contain items
		expect(output).toContain("Item 1");
		expect(output).toContain("Item 2");
		// Should have bullet markers
		expect(output).toContain("●");
	});

	test("formats bullet points with *", () => {
		const input = "* Item 1\n* Item 2";
		const output = formatMarkdownForTerminal(input);

		// Should contain items
		expect(output).toContain("Item 1");
		expect(output).toContain("Item 2");
	});

	test("formats numbered lists", () => {
		const input = "1. First\n2. Second\n3. Third";
		const output = formatMarkdownForTerminal(input);

		// Should contain items
		expect(output).toContain("First");
		expect(output).toContain("Second");
		expect(output).toContain("Third");
		// Should contain numbers
		expect(output).toContain("1.");
		expect(output).toContain("2.");
		expect(output).toContain("3.");
	});

	test("handles mixed markdown elements", () => {
		const input = "## Title\n\nThis is **bold** and *italic*.\n\n- List item";
		const output = formatMarkdownForTerminal(input);

		// Should contain all elements
		expect(output).toContain("Title");
		expect(output).toContain("bold");
		expect(output).toContain("italic");
		expect(output).toContain("List item");
	});
});

describe("stripHtmlTags", () => {
	test("removes simple HTML tags", () => {
		const input = "<p>Hello</p>";
		const output = stripHtmlTags(input);
		expect(output).toBe("Hello");
	});

	test("removes multiple tags", () => {
		const input = "<div><span>Hello</span> <strong>World</strong></div>";
		const output = stripHtmlTags(input);
		expect(output).toBe("Hello World");
	});

	test("removes self-closing tags", () => {
		const input = "Text <br/> More text";
		const output = stripHtmlTags(input);
		expect(output).toBe("Text  More text");
	});

	test("handles tags with attributes", () => {
		const input = '<a href="http://example.com">Link</a>';
		const output = stripHtmlTags(input);
		expect(output).toBe("Link");
	});

	test("returns unchanged text without tags", () => {
		const input = "Plain text";
		const output = stripHtmlTags(input);
		expect(output).toBe("Plain text");
	});
});

describe("cleanHighlight", () => {
	test("removes <em> tags", () => {
		const input = "This is <em>highlighted</em> text";
		const output = cleanHighlight(input);
		expect(output).toBe("This is highlighted text");
	});

	test("removes Algolia highlight spans", () => {
		const input =
			'Search <span class="algolia-docsearch-suggestion--highlight">result</span>';
		const output = cleanHighlight(input);
		expect(output).toBe("Search result");
	});

	test("removes all HTML tags", () => {
		const input = "<div><p>Test</p></div>";
		const output = cleanHighlight(input);
		expect(output).toBe("Test");
	});
});

describe("formatHighlight", () => {
	test("formats <em> tags", () => {
		const input = "This is <em>highlighted</em>";
		const output = formatHighlight(input);

		// Should not contain HTML tags
		expect(output).not.toContain("<em>");
		expect(output).not.toContain("</em>");
		// Should contain the text
		expect(output).toContain("highlighted");
	});

	test("formats Algolia highlight spans", () => {
		const input =
			'Search <span class="algolia-docsearch-suggestion--highlight">term</span>';
		const output = formatHighlight(input);

		// Should not contain HTML
		expect(output).not.toContain("<span");
		expect(output).not.toContain("</span>");
		// Should contain the text
		expect(output).toContain("term");
	});

	test("formats multiple highlights", () => {
		const input = "Text with <em>first</em> and <em>second</em> highlights";
		const output = formatHighlight(input);

		// Should not contain tags
		expect(output).not.toContain("<em>");
		// Should contain both words
		expect(output).toContain("first");
		expect(output).toContain("second");
	});

	test("removes remaining HTML tags after highlighting", () => {
		const input = "<div>Text with <em>highlight</em></div>";
		const output = formatHighlight(input);

		// Should not contain any HTML tags
		expect(output).not.toContain("<");
		expect(output).not.toContain(">");
		// Should contain the text
		expect(output).toContain("Text with highlight");
	});

	test("handles text without highlights", () => {
		const input = "Plain text";
		const output = formatHighlight(input);
		expect(output).toBe("Plain text");
	});
});
