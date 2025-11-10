import { describe, expect, test } from "bun:test";
import type { ApiDeclaration } from "../types/api-types.js";
import { convertApiToMarkdown } from "./api-markdown-converter.js";

describe("convertApiToMarkdown", () => {
	test("should convert enum to markdown", () => {
		const apiData: ApiDeclaration = {
			name: "test-package",
			variant: "project",
			kind: 1,
			children: [
				{
					name: "AudioQuality",
					variant: "declaration",
					kind: 8, // Enum
					comment: {
						summary: [
							{
								kind: "text",
								text: "Audio quality levels for recording.",
							},
						],
					},
					children: [
						{
							name: "HIGH",
							variant: "declaration",
							kind: 16, // EnumMember
							comment: {
								summary: [
									{
										kind: "text",
										text: "High quality: good fidelity, larger file size.",
									},
								],
							},
							type: {
								type: "literal",
								value: 96,
							},
						},
						{
							name: "LOW",
							variant: "declaration",
							kind: 16,
							type: {
								type: "literal",
								value: 32,
							},
						},
					],
				},
			],
		};

		const result = convertApiToMarkdown(apiData, "Test");

		expect(result).toContain("## Test API");
		expect(result).toContain("### AudioQuality");
		expect(result).toContain("Audio quality levels for recording.");
		expect(result).toContain("- **HIGH**: `96`");
		expect(result).toContain("- **LOW**: `32`");
	});

	test("should convert class with properties to markdown", () => {
		const apiData: ApiDeclaration = {
			name: "test-package",
			variant: "project",
			kind: 1,
			children: [
				{
					name: "AudioPlayer",
					variant: "declaration",
					kind: 128, // Class
					comment: {
						summary: [
							{
								kind: "text",
								text: "Audio player class.",
							},
						],
					},
					children: [
						{
							name: "volume",
							variant: "declaration",
							kind: 1024, // Property
							comment: {
								summary: [
									{
										kind: "text",
										text: "The current volume.",
									},
								],
							},
							type: {
								type: "intrinsic",
								name: "number",
							},
						},
					],
				},
			],
		};

		const result = convertApiToMarkdown(apiData, "Test");

		expect(result).toContain("### AudioPlayer");
		expect(result).toContain("Audio player class.");
		expect(result).toContain("#### Properties");
		expect(result).toContain("- **volume**: `number`");
		expect(result).toContain("The current volume.");
	});

	test("should handle code blocks in comments", () => {
		const apiData: ApiDeclaration = {
			name: "test-package",
			variant: "project",
			kind: 1,
			children: [
				{
					name: "Player",
					variant: "declaration",
					kind: 128,
					children: [
						{
							name: "volume",
							variant: "declaration",
							kind: 1024,
							comment: {
								summary: [
									{
										kind: "text",
										text: "Volume range: ",
									},
									{
										kind: "code",
										text: "`0.0`",
									},
									{
										kind: "text",
										text: " to ",
									},
									{
										kind: "code",
										text: "`1.0`",
									},
								],
								blockTags: [
									{
										tag: "@example",
										content: [
											{
												kind: "code",
												text: "```tsx\nplayer.volume = 0.5;\n```",
											},
										],
									},
								],
							},
							type: {
								type: "intrinsic",
								name: "number",
							},
						},
					],
				},
			],
		};

		const result = convertApiToMarkdown(apiData, "Test");

		// Should not double-wrap backticks
		expect(result).toContain("`0.0`");
		expect(result).toContain("`1.0`");
		expect(result).not.toContain("``0.0``");

		// Should preserve code blocks
		expect(result).toContain("```tsx");
		expect(result).toContain("player.volume = 0.5;");
	});
});
