import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { Command } from "commander";

// Mock fetch
globalThis.fetch = mock(() =>
	Promise.resolve({
		ok: true,
		text: () => Promise.resolve(""),
	} as Response),
);

import { docsCommand } from "./index.js";

describe("docsCommand", () => {
	let program: Command;
	let consoleLogMock: ReturnType<typeof mock>;
	let consoleErrorMock: ReturnType<typeof mock>;
	let originalIsTTY: boolean | undefined;

	beforeEach(() => {
		program = new Command();
		docsCommand(program);

		consoleLogMock = mock(() => {});
		consoleErrorMock = mock(() => {});
		console.log = consoleLogMock;
		console.error = consoleErrorMock;

		// Save original isTTY and set to true for tests by default
		originalIsTTY = process.stdin.isTTY;
		process.stdin.isTTY = true;

		// Clear all mocks
		(globalThis.fetch as any).mockClear();
		consoleLogMock.mockClear();
		consoleErrorMock.mockClear();
	});

	afterEach(() => {
		// Restore original isTTY
		if (originalIsTTY !== undefined) {
			process.stdin.isTTY = originalIsTTY;
		} else {
			delete (process.stdin as any).isTTY;
		}
	});

	it("should fetch and display llms.txt when no path provided", async () => {
		const mockContent =
			"Expo is an open-source React Native framework for apps that run natively on Android, iOS, and the web.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync(["node", "test", "docs"]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://docs.expo.dev/llms.txt",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should fetch documentation for specified path", async () => {
		const mockContent =
			"---\ntitle: Account Types\n---\n\nExpo supports personal and organization accounts.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync([
			"node",
			"test",
			"docs",
			"/accounts/account-types",
		]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/accounts/account-types.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should normalize paths without leading slash", async () => {
		const mockContent =
			"---\ntitle: Introduction\n---\n\nGet started with Expo.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync([
			"node",
			"test",
			"docs",
			"get-started/introduction",
		]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/get-started/introduction.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should remove .mdx extension if provided", async () => {
		const mockContent = "---\ntitle: Routing\n---\n\nLearn about Expo Router.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync(["node", "test", "docs", "/guides/routing.mdx"]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/routing.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should handle 404 errors gracefully", async () => {
		(globalThis.fetch as any).mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response);

		// Mock process.exit to prevent test from exiting
		const originalExit = process.exit;
		let exitCode: number | undefined;
		process.exit = mock((code?: number) => {
			exitCode = code;
			throw new Error("process.exit called");
		}) as any;

		try {
			await program.parseAsync(["node", "test", "docs", "/nonexistent-page"]);
		} catch (_error) {
			// Expected to throw due to process.exit
		}

		expect(
			consoleErrorMock.mock.calls.some(
				(call: any[]) =>
					call[0] === "Documentation not found: /nonexistent-page",
			),
		).toBe(true);
		expect(exitCode).toBe(1);

		// Restore process.exit
		process.exit = originalExit;
	});

	it("should handle network errors gracefully", async () => {
		const networkError = new Error("Network error");
		(globalThis.fetch as any).mockRejectedValue(networkError);

		// Mock process.exit to prevent test from exiting
		const originalExit = process.exit;
		let exitCode: number | undefined;
		process.exit = mock((code?: number) => {
			exitCode = code;
			throw new Error("process.exit called");
		}) as any;

		try {
			await program.parseAsync([
				"node",
				"test",
				"docs",
				"/get-started/introduction",
			]);
		} catch (_error) {
			// Expected to throw due to process.exit
		}

		expect(
			consoleErrorMock.mock.calls.some(
				(call: any[]) => call[0] === "Error fetching documentation:",
			),
		).toBe(true);
		expect(exitCode).toBe(1);

		// Restore process.exit
		process.exit = originalExit;
	});

	it("should handle stdin input when no path provided", async () => {
		const mockContent = "---\ntitle: Camera\n---\n\nUse the camera API.";
		const stdinPath = "/guides/camera";

		// Mock process.stdin
		const mockStdin = {
			isTTY: false,
			[Symbol.asyncIterator]: async function* () {
				yield Buffer.from(stdinPath);
			},
		};
		Object.assign(process.stdin, mockStdin);

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync(["node", "test", "docs"]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/camera.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should handle quoted stdin input (jq output without -r)", async () => {
		const mockContent = "---\ntitle: API\n---\n\nAPI documentation.";
		const quotedStdinPath = '"/get-started/create-a-project"'; // Quoted path from jq

		// Mock process.stdin
		const mockStdin = {
			isTTY: false,
			[Symbol.asyncIterator]: async function* () {
				yield Buffer.from(quotedStdinPath);
			},
		};
		Object.assign(process.stdin, mockStdin);

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync(["node", "test", "docs"]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/get-started/create-a-project.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should display pretty formatted output when --pretty flag is used", async () => {
		const mockContent = "# Introduction\n\n**Expo** is a framework.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync([
			"node",
			"test",
			"docs",
			"/get-started/introduction",
			"--pretty",
		]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		expect(consoleLogMock.mock.calls.length).toBeGreaterThan(0);
		// The output should be formatted, not raw markdown
		const output = consoleLogMock.mock.calls[0][0];
		expect(typeof output).toBe("string");
	});

	it("should always use latest version", async () => {
		const mockContent = "# Camera\n\nCamera API guide.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync(["node", "test", "docs", "/guides/camera"]);

		expect((globalThis.fetch as any).mock.calls.length).toBe(1);
		// Should always use latest
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/guides/camera.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should fallback to index.mdx when directory path returns 404", async () => {
		const mockContent = "# Expo UI\n\nUI components documentation.";
		let callCount = 0;

		// First call (direct .mdx) returns 404, second call (index.mdx) succeeds
		(globalThis.fetch as any).mockImplementation(() => {
			callCount++;
			if (callCount === 1) {
				return Promise.resolve({
					ok: false,
					status: 404,
					statusText: "Not Found",
				} as Response);
			}
			return Promise.resolve({
				ok: true,
				text: () => Promise.resolve(mockContent),
			} as Response);
		});

		await program.parseAsync([
			"node",
			"test",
			"docs",
			"/versions/v54.0.0/sdk/ui/",
		]);

		// Should try two URLs: first .mdx, then /index.mdx
		expect((globalThis.fetch as any).mock.calls.length).toBe(2);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v54.0.0/sdk/ui.mdx",
		);
		expect((globalThis.fetch as any).mock.calls[1][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/v54.0.0/sdk/ui/index.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should handle unversioned paths", async () => {
		const mockContent = "# Unversioned UI\n\nLatest UI documentation.";

		(globalThis.fetch as any).mockResolvedValue({
			ok: true,
			text: () => Promise.resolve(mockContent),
		} as Response);

		await program.parseAsync([
			"node",
			"test",
			"docs",
			"/versions/unversioned/sdk/camera",
		]);

		expect((globalThis.fetch as any).mock.calls.length).toBeGreaterThan(0);
		expect((globalThis.fetch as any).mock.calls[0][0]).toBe(
			"https://raw.githubusercontent.com/expo/expo/refs/heads/main/docs/pages/versions/unversioned/sdk/camera.mdx",
		);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should resolve next version by fetching app.json and use it for processApiSections", async () => {
		const mockContent = "# Next Version UI\n\nNext version documentation.";

		(globalThis.fetch as any).mockImplementation((url: string) => {
			// First call: fetch app.json (may be cached)
			if (url.includes("app.json")) {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							expo: {
								sdkVersion: "54.0.0",
							},
						}),
				} as Response);
			}
			// Second call: fetch the documentation
			return Promise.resolve({
				ok: true,
				text: () => Promise.resolve(mockContent),
			} as Response);
		});

		await program.parseAsync([
			"node",
			"test",
			"docs",
			"/versions/next/sdk/camera",
		]);

		// Should resolve next to v54.0.0 and fetch the documentation
		// Note: app.json may be cached, so we just check that the resolved path contains v54.0.0
		const fetchCalls = (globalThis.fetch as any).mock.calls;
		const hasResolvedPath = fetchCalls.some((call: string[]) =>
			call[0]?.includes("v54.0.0"),
		);
		expect(hasResolvedPath).toBe(true);
		expect(
			consoleLogMock.mock.calls.some((call: any[]) => call[0] === mockContent),
		).toBe(true);
	});

	it("should show all tried URLs when all fail", async () => {
		(globalThis.fetch as any).mockResolvedValue({
			ok: false,
			status: 404,
			statusText: "Not Found",
		} as Response);

		// Mock process.exit to prevent test from exiting
		const originalExit = process.exit;
		let exitCode: number | undefined;
		process.exit = mock((code?: number) => {
			exitCode = code;
			throw new Error("process.exit called");
		}) as any;

		try {
			await program.parseAsync([
				"node",
				"test",
				"docs",
				"/versions/v54.0.0/sdk/nonexistent/",
			]);
		} catch (_error) {
			// Expected to throw due to process.exit
		}

		expect(
			consoleErrorMock.mock.calls.some((call: any[]) =>
				call[0].includes("Tried URLs:"),
			),
		).toBe(true);
		expect(exitCode).toBe(1);

		// Restore process.exit
		process.exit = originalExit;
	});
});
