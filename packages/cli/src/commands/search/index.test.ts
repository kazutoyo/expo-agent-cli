import { describe, expect, it } from "bun:test";
import { Command } from "commander";
import { searchCommand } from "./index.js";

describe("searchCommand", () => {
	it("should register search command with correct description", () => {
		const program = new Command();
		searchCommand(program);

		const commands = program.commands;
		const searchCmd = commands.find((cmd) => cmd.name() === "search");

		expect(searchCmd).toBeDefined();
		expect(searchCmd?.description()).toBe(
			"Search Expo documentation (offline)",
		);
	});

	it("should have query argument and limit/pretty options", () => {
		const program = new Command();
		searchCommand(program);

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
});
