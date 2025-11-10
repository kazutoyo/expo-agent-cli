import { describe, expect, test } from "bun:test";
import {
	getExpoDocsBaseUrl,
	getExpoDocsUrl,
	getVersionInfo,
} from "./constants.js";

describe("constants", () => {
	describe("getVersionInfo", () => {
		test("returns version info with correct types", () => {
			const info = getVersionInfo();
			expect(info).toHaveProperty("version");
			expect(info).toHaveProperty("expoVersion");
			expect(typeof info.version).toBe("string");
			// expoVersion can be string or null depending on whether expo is installed
			expect(
				typeof info.expoVersion === "string" || info.expoVersion === null,
			).toBe(true);
		});

		test("detects expo version from installed package", () => {
			const info = getVersionInfo();
			// In this test environment, expo is installed in root devDependencies
			// So expoVersion should be detected as sdk-XX format
			expect(info.expoVersion).not.toBeNull();
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

		test("maps latest to detected Expo version or latest branch", () => {
			const url = getExpoDocsBaseUrl("latest");
			const expoVersion = getVersionInfo().expoVersion;
			const expectedBranch = expoVersion || "latest";
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

		test("handles latest version parameter with detected expo version", () => {
			const url = getExpoDocsUrl("/sdk/camera", "latest");
			const expoVersion = getVersionInfo().expoVersion;
			// In test environment, expo is installed, so it should resolve to sdk-XX
			expect(expoVersion).not.toBeNull();
			expect(url).toBe(
				`https://raw.githubusercontent.com/expo/expo/refs/heads/${expoVersion}/docs/pages/sdk/camera.mdx`,
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
