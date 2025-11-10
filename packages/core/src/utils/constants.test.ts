import { describe, expect, test } from "bun:test";
import {
	getExpoDocsBaseUrl,
	getExpoDocsUrl,
	getVersionInfo,
} from "./constants.js";

describe("constants", () => {
	describe("getVersionInfo", () => {
		test("returns version info from package.json", () => {
			const info = getVersionInfo();
			expect(info).toHaveProperty("version");
			expect(info).toHaveProperty("expoVersion");
			expect(typeof info.version).toBe("string");
			expect(typeof info.expoVersion).toBe("string");
		});

		test("expoVersion follows sdk-XX format", () => {
			const info = getVersionInfo();
			expect(info.expoVersion).toMatch(/^sdk-\d+$/);
		});
	});

	describe("getExpoDocsBaseUrl", () => {
		test("returns branch URL for explicit SDK version", () => {
			const url = getExpoDocsBaseUrl("sdk-54");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages",
			);
		});

		test("maps latest to configured Expo version", () => {
			const url = getExpoDocsBaseUrl("latest");
			const expectedBranch = getVersionInfo().expoVersion;
			expect(url).toBe(
				`https://raw.githubusercontent.com/expo/expo/refs/heads/${expectedBranch}/docs/pages`,
			);
		});

		test("handles different SDK versions", () => {
			const url = getExpoDocsBaseUrl("sdk-55");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-55/docs/pages",
			);
		});
	});

	describe("getExpoDocsUrl", () => {
		test("normalizes paths without leading slash", () => {
			const url = getExpoDocsUrl("guides/routing", "sdk-54");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/guides/routing.mdx",
			);
		});

		test("handles paths with leading slash", () => {
			const url = getExpoDocsUrl("/guides/routing", "sdk-54");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/guides/routing.mdx",
			);
		});

		test("removes .mdx suffix if provided", () => {
			const url = getExpoDocsUrl("guides/routing.mdx", "sdk-54");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/guides/routing.mdx",
			);
		});

		test("removes trailing slash", () => {
			const url = getExpoDocsUrl("/guides/routing/", "sdk-54");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/guides/routing.mdx",
			);
		});

		test("replaces latest path segment with version", () => {
			const url = getExpoDocsUrl("/versions/latest/sdk/camera/", "sdk-54");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-54/docs/pages/versions/v54.0.0/sdk/camera.mdx",
			);
		});

		test("handles latest version parameter", () => {
			const url = getExpoDocsUrl("/sdk/camera", "latest");
			const expectedBranch = getVersionInfo().expoVersion;
			expect(url).toBe(
				`https://raw.githubusercontent.com/expo/expo/refs/heads/${expectedBranch}/docs/pages/sdk/camera.mdx`,
			);
		});

		test("combines all normalization rules", () => {
			const url = getExpoDocsUrl("versions/latest/sdk/camera.mdx/", "sdk-55");
			expect(url).toBe(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/sdk-55/docs/pages/versions/v55.0.0/sdk/camera.mdx",
			);
		});
	});
});
