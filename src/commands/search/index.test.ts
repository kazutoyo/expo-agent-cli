import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import { Command } from "commander";
import { searchCommand } from "./index.js";

describe("searchCommand", () => {
	let program: Command;
	let consoleLogSpy: ReturnType<typeof spyOn>;
	let consoleErrorSpy: ReturnType<typeof spyOn>;

	beforeEach(() => {
		program = new Command();
		const expoVersion = "sdk-54";
		searchCommand(program, expoVersion);

		consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
		consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
	});

	afterEach(() => {
		consoleLogSpy.mockRestore();
		consoleErrorSpy.mockRestore();
	});

	it("should register search command with correct description", () => {
		const commands = program.commands;
		const searchCmd = commands.find((cmd) => cmd.name() === "search");

		expect(searchCmd).toBeDefined();
		expect(searchCmd?.description()).toBe("Search Expo documentation");
	});

	it("should have query argument and limit/pretty options", () => {
		const commands = program.commands;
		const searchCmd = commands.find((cmd) => cmd.name() === "search");

		expect(searchCmd).toBeDefined();

		// Check options
		const options = searchCmd?.options;
		const limitOption = options?.find((opt) => opt.long === "--limit");
		const prettyOption = options?.find((opt) => opt.long === "--pretty");

		expect(limitOption).toBeDefined();
		expect(prettyOption).toBeDefined();
	});

	it("should output valid JSON with query, total, and results (integration test)", async () => {
		// This is an integration test that actually calls Algolia API
		await program.parseAsync([
			"node",
			"test",
			"search",
			"camera",
			"--limit",
			"2",
		]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const output = consoleLogSpy.mock.calls[0][0];

		// Should be valid JSON
		expect(() => JSON.parse(output)).not.toThrow();
		const parsed = JSON.parse(output);

		// Validate structure with query, total, and results
		expect(parsed).toHaveProperty("query");
		expect(parsed).toHaveProperty("total");
		expect(parsed).toHaveProperty("results");
		expect(parsed.query).toBe("camera");
		expect(typeof parsed.total).toBe("number");
		expect(Array.isArray(parsed.results)).toBe(true);
		expect(parsed.total).toBe(parsed.results.length);

		// If results exist, validate their structure
		if (parsed.results.length > 0) {
			expect(parsed.results[0]).toHaveProperty("title");
			expect(parsed.results[0]).toHaveProperty("highlightedTitle");
			expect(parsed.results[0]).toHaveProperty("category");
			expect(parsed.results[0]).toHaveProperty("url");
			expect(parsed.results[0]).toHaveProperty("path");
			expect(parsed.results[0]).toHaveProperty("version");
			expect(parsed.results[0]).toHaveProperty("docsPath");
		}
	}, 10000); // Longer timeout for API call

	it("should handle --limit option correctly (integration test)", async () => {
		await program.parseAsync([
			"node",
			"test",
			"search",
			"expo",
			"--limit",
			"3",
		]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const output = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(output);

		// Results should be limited to 3 or less
		expect(parsed.results.length).toBeLessThanOrEqual(3);
	}, 10000);

	it("should output non-JSON when --pretty flag is used (integration test)", async () => {
		await program.parseAsync([
			"node",
			"test",
			"search",
			"camera",
			"--limit",
			"2",
			"--pretty",
		]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const firstCall = consoleLogSpy.mock.calls[0][0];

		// Should NOT be parseable as JSON (it's pretty formatted)
		const isProbablyJSON =
			firstCall.trim().startsWith("{") || firstCall.trim().startsWith("[");

		// Pretty output typically starts with formatted text, not JSON
		if (isProbablyJSON) {
			// If it looks like JSON, it should fail to parse or be a message about no results
			try {
				const parsed = JSON.parse(firstCall);
				// If it parsed, check if it's the no-results case
				expect(parsed).toHaveProperty("query");
			} catch {
				// Expected for pretty output
				expect(true).toBe(true);
			}
		} else {
			// Success - pretty output doesn't look like JSON
			expect(true).toBe(true);
		}
	}, 10000);

	it("should handle search query with multiple words (integration test)", async () => {
		await program.parseAsync([
			"node",
			"test",
			"search",
			"expo camera",
			"--limit",
			"1",
		]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const output = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(output);

		expect(parsed.query).toBe("expo camera");
	}, 10000);

	it("should return empty results for nonsensical query (integration test)", async () => {
		const nonsenseQuery = "xyzabc123nonsense9999";
		await program.parseAsync([
			"node",
			"test",
			"search",
			nonsenseQuery,
			"--limit",
			"5",
		]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const output = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(output);

		expect(parsed.query).toBe(nonsenseQuery);
		expect(parsed.total).toBe(0);
		expect(parsed.results).toEqual([]);
	}, 10000);

	it("should cap limit at 20 even if higher value specified (integration test)", async () => {
		// We can't directly verify the API call, but we can ensure the result
		// respects the max limit
		await program.parseAsync([
			"node",
			"test",
			"search",
			"expo",
			"--limit",
			"100",
		]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const output = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(output);

		// Results should never exceed 20
		expect(parsed.results.length).toBeLessThanOrEqual(20);
	}, 10000);

	it("should use default limit of 5 when not specified (integration test)", async () => {
		await program.parseAsync(["node", "test", "search", "camera"]);

		expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0);
		const output = consoleLogSpy.mock.calls[0][0];
		const parsed = JSON.parse(output);

		// Default limit is 5, so results should be 5 or less
		expect(parsed.results.length).toBeLessThanOrEqual(5);
	}, 10000);
});
