import { describe, expect, mock, test } from "bun:test";
import {
	EXPO_ALGOLIA_API_KEY,
	EXPO_ALGOLIA_APP_ID,
	EXPO_ALGOLIA_INDEX_NAME,
	getExpoDocsBaseUrl,
	getExpoDocsUrl,
	getVersionInfo,
} from "./constants";

const mockedVersionInfo = {
	version: "1.0.0",
	expoVersion: "sdk-54",
};

mock.module("./constants", () => ({
	getVersionInfo: () => mockedVersionInfo,
}));

describe("constants", () => {
	test("Algolia config is defined", () => {
		expect(EXPO_ALGOLIA_APP_ID).toBeTypeOf("string");
		expect(EXPO_ALGOLIA_API_KEY).toBeTypeOf("string");
		expect(EXPO_ALGOLIA_INDEX_NAME).toBe("expo");
	});

	describe("getExpoDocsBaseUrl", () => {
		test("returns branch URL for explicit SDK version", () => {
			const url = getExpoDocsBaseUrl(getVersionInfo().expoVersion);
			expect(url).toBe(
				`https://raw.githubusercontent.com/expo/expo/refs/heads/${
					getVersionInfo().expoVersion
				}/docs/pages`,
			);
		});

		test("maps latest to configured Expo version", () => {
			const url = getExpoDocsBaseUrl("latest");
			const expectedBranch = getVersionInfo().expoVersion;
			expect(url).toBe(
				`https://raw.githubusercontent.com/expo/expo/refs/heads/${expectedBranch}/docs/pages`,
			);
		});
	});

	describe("getExpoDocsUrl", () => {
		test("normalizes paths without leading slash and .mdx suffix", () => {
			const url = getExpoDocsUrl(
				"guides/routing.mdx",
				getVersionInfo().expoVersion,
			);
			expect(url).toBe(
				`${getExpoDocsBaseUrl(getVersionInfo().expoVersion)}/guides/routing.mdx`,
			);
		});

		test("removes trailing slash while keeping .mdx suffix", () => {
			const url = getExpoDocsUrl(
				"/guides/routing/",
				getVersionInfo().expoVersion,
			);
			expect(url).toBe(
				`${getExpoDocsBaseUrl(getVersionInfo().expoVersion)}/guides/routing.mdx`,
			);
		});

		test("replaces latest path segment with configured Expo version", () => {
			const url = getExpoDocsUrl("/versions/latest/sdk/camera/", "latest");
			const versionSegment = "v54.0.0";

			const expectedUrl = `${getExpoDocsBaseUrl(
				"latest",
			)}/versions/${versionSegment}/sdk/camera.mdx`;

			expect(url).toBe(expectedUrl);
		});

		test("uses provided SDK version when explicitly passed", () => {
			const targetVersion = "sdk-55";
			const url = getExpoDocsUrl("/sdk/camera", targetVersion);

			expect(url).toBe(`${getExpoDocsBaseUrl(targetVersion)}/sdk/camera.mdx`);
		});
	});
});
