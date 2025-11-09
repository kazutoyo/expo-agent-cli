import { Command } from "commander";
import { getVersionInfo } from "expo-agent-core";
import { docsCommand } from "./commands/docs/index.js";
import { searchCommand } from "./commands/search/index.js";
import { versionCommand } from "./commands/version/index.js";

const program = new Command();

program
	.name("expo-agent-cli")
	.description("CLI tool for accessing Expo SDK documentation and search")
	.version(getVersionInfo().version);
// Register commands
docsCommand(program, getVersionInfo().expoVersion);
searchCommand(program);
versionCommand(program, getVersionInfo().version, getVersionInfo().expoVersion);

program.parse();
