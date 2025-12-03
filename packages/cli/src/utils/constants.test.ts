import { describe, expect, test } from "bun:test";
import {
	extractVersionFromPath,
	getExpoDocsInfo,
	getVersionInfo,
	normalizePath,
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

	describe("normalizePath", () => {
		test("adds leading slash if missing", () => {
			const normalized = normalizePath("guides/routing");
			expect(normalized).toBe("/guides/routing");
		});

		test("preserves leading slash", () => {
			const normalized = normalizePath("/guides/routing");
			expect(normalized).toBe("/guides/routing");
		});

		test("removes trailing slash", () => {
			const normalized = normalizePath("/guides/routing/");
			expect(normalized).toBe("/guides/routing");
		});

		test("removes .mdx extension", () => {
			const normalized = normalizePath("/guides/routing.mdx");
			expect(normalized).toBe("/guides/routing");
		});

		test("handles multiple normalizations", () => {
			const normalized = normalizePath("guides/routing.mdx/");
			expect(normalized).toBe("/guides/routing");
		});

		test("handles path with version", () => {
			const normalized = normalizePath("/versions/v54.0.0/sdk/calendar/");
			expect(normalized).toBe("/versions/v54.0.0/sdk/calendar");
		});

		test("handles empty path", () => {
			const normalized = normalizePath("");
			expect(normalized).toBe("");
		});

		test("handles root path with trailing slash", () => {
			const normalized = normalizePath("/");
			expect(normalized).toBe("");
		});
	});

	describe("extractVersionFromPath", () => {
		test("extracts version from path with v{major}.{minor}.{patch} format", () => {
			const version = extractVersionFromPath("/versions/v54.0.0/sdk/calendar/");
			expect(version).toBe("sdk-54");
		});

		test("extracts version from path with v{major} format", () => {
			const version = extractVersionFromPath("/versions/v53/sdk/camera/");
			expect(version).toBe("sdk-53");
		});

		test("extracts version from path without trailing slash", () => {
			const version = extractVersionFromPath("/versions/v52.0.0/sdk/audio");
			expect(version).toBe("sdk-52");
		});

		test("returns latest for path without version", () => {
			const version = extractVersionFromPath("/guides/apple-privacy/");
			expect(version).toBe("latest");
		});

		test("returns latest for root path", () => {
			const version = extractVersionFromPath("/");
			expect(version).toBe("latest");
		});

		test("returns latest for empty path", () => {
			const version = extractVersionFromPath("");
			expect(version).toBe("latest");
		});

		test("returns latest for path with latest keyword", () => {
			const version = extractVersionFromPath("/versions/latest/sdk/camera/");
			expect(version).toBe("latest");
		});

		test("returns unversioned for path with unversioned keyword", () => {
			const version = extractVersionFromPath("/versions/unversioned/sdk/ui/");
			expect(version).toBe("unversioned");
		});
	});

	describe("getExpoDocsInfo", () => {
		test("normalizes paths without leading slash", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("guides/routing");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/routing.mdx",
			);
			expect(resolvedVersion).toBe("latest");
		});

		test("handles paths with leading slash", async () => {
			const { urls } = await getExpoDocsInfo("/guides/routing");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/routing.mdx",
			);
		});

		test("removes .mdx suffix if provided", async () => {
			const { urls } = await getExpoDocsInfo("guides/routing.mdx");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/routing.mdx",
			);
		});

		test("removes trailing slash", async () => {
			const { urls } = await getExpoDocsInfo("/guides/routing/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/routing.mdx",
			);
		});

		test("handles versioned SDK paths with trailing slash", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/v54.0.0/sdk/ui/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v54.0.0/sdk/ui.mdx",
			);
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v54.0.0/sdk/ui/index.mdx",
			);
			expect(resolvedVersion).toBe("sdk-54");
		});

		test("handles unversioned SDK paths with trailing slash", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/unversioned/sdk/ui/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/unversioned/sdk/ui.mdx",
			);
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/unversioned/sdk/ui/index.mdx",
			);
			expect(resolvedVersion).toBe("unversioned");
		});

		test("resolves next version by fetching app.json", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/next/sdk/ui/");
			// The URL should contain a version number fetched from app.json
			expect(urls[0]).toMatch(
				/^https:\/\/raw\.githubusercontent\.com\/expo\/expo\/refs\/heads\/main\/docs\/pages\/versions\/v\d+\.\d+\.\d+\/sdk\/ui\.mdx$/,
			);
			expect(urls[1]).toMatch(
				/^https:\/\/raw\.githubusercontent\.com\/expo\/expo\/refs\/heads\/main\/docs\/pages\/versions\/v\d+\.\d+\.\d+\/sdk\/ui\/index\.mdx$/,
			);
			expect(resolvedVersion).toMatch(/^sdk-\d+$/);
		});

		test("handles guide paths with trailing slash", async () => {
			const { urls } = await getExpoDocsInfo("/guides/overview/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/overview.mdx",
			);
		});

		test("handles config paths with trailing slash", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/v54.0.0/config/app/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v54.0.0/config/app.mdx",
			);
			expect(resolvedVersion).toBe("sdk-54");
		});

		test("extracts version from path and uses it", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/v54.0.0/sdk/calendar/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v54.0.0/sdk/calendar.mdx",
			);
			expect(resolvedVersion).toBe("sdk-54");
		});

		test("handles path with version v53", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/v53.0.0/sdk/audio");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v53.0.0/sdk/audio.mdx",
			);
			expect(resolvedVersion).toBe("sdk-53");
		});

		test("replaces latest path segment with resolved version", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("/versions/latest/sdk/camera/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/latest/sdk/camera.mdx",
			);
			expect(resolvedVersion).toBe("latest");
		});

		test("handles path without version (uses main branch)", async () => {
			const { urls } = await getExpoDocsInfo("/sdk/camera");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/sdk/camera.mdx",
			);
		});

		test("combines all normalization rules with version extraction", async () => {
			const { urls, resolvedVersion } = await getExpoDocsInfo("versions/v55.0.0/sdk/camera.mdx/");
			expect(urls).toContain(
				"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v55.0.0/sdk/camera.mdx",
			);
			expect(resolvedVersion).toBe("sdk-55");
		});
	});
});
