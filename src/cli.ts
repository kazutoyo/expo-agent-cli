import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { docsCommand } from "./commands/docs/index.js";
import { searchCommand } from "./commands/search/index.js";
import { versionCommand } from "./commands/version/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read version and expoVersion from package.json
const packageJsonPath = join(__dirname, "../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8")) as {
	version: string;
	expoVersion?: string;
};

const program = new Command();

program
	.name("expo-agent-cli")
	.description("CLI tool for accessing Expo SDK documentation and search")
	.version(packageJson.version);

// Register commands
const expoVersion = packageJson.expoVersion || "main";
docsCommand(program, expoVersion);
searchCommand(program, expoVersion);
versionCommand(program, packageJson.version, expoVersion);

program.parse();
