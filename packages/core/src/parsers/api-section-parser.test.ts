import { describe, expect, test } from "bun:test";
import { processApiSections } from "./api-section-parser.js";

describe("processApiSections", () => {
	test("should return content unchanged when no APISection tags", async () => {
		const mdx = "# Hello\n\nThis is a test.";
		const result = await processApiSections(mdx, "sdk-54");
		expect(result).toBe(mdx);
	});

	test("should detect and process APISection tags", async () => {
		const mdx = `# Audio

## API

\`\`\`js
import { useAudioPlayer } from 'expo-audio';
\`\`\`

<APISection packageName="expo-audio" apiName="Audio" />
`;

		const result = await processApiSections(mdx, "sdk-54");

		// Should not contain the original tag
		expect(result).not.toContain("<APISection");

		// Should contain generated API documentation
		expect(result).toContain("## Audio API");
		expect(result).toContain("### AudioPlayer");
	});

	test("should handle missing API data gracefully", async () => {
		const mdx = '<APISection packageName="non-existent-package" />';

		const result = await processApiSections(mdx, "sdk-54");

		// Should contain error message
		expect(result).toContain("could not be loaded");
		expect(result).toContain("non-existent-package");
	});

	test("should handle multiple APISection tags", async () => {
		const mdx = `
<APISection packageName="expo-audio" apiName="Audio" />

Some text here.

<APISection packageName="expo-audio" apiName="Audio" />
`;

		const result = await processApiSections(mdx, "sdk-54");

		// Should process both tags
		const matches = result.match(/## Audio API/g);
		expect(matches).toBeTruthy();
		expect(matches?.length).toBe(2);
	});
});
