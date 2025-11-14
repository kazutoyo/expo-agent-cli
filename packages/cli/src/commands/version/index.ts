import type { Command } from "commander";

export const versionCommand = (
	program: Command,
	cliVersion: string,
	expoVersion: string | null,
) => {
	program
		.command("version")
		.description("Show version information")
		.action(async () => {
			try {
				console.log(`CLI Version:  ${cliVersion}`);
				console.log(`Expo Version: ${expoVersion || "latest (not detected)"}`);
			} catch (error) {
				console.error(
					"Error displaying version information:",
					error instanceof Error ? error.message : error,
				);
				process.exit(1);
			}
		});
};
