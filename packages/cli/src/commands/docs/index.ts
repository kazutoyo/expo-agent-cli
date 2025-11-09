import {
	formatMarkdownForTerminal,
	getExpoDocsUrl,
	processApiSections,
	processInstallSections,
	processPermissionSections,
} from "@expo-agent/core";
import type { Command } from "commander";

interface DocsOptions {
	pretty?: boolean;
	sdkVersion?: string;
}

export const docsCommand = (program: Command, defaultExpoVersion: string) => {
	program
		.command("docs")
		.description("Fetch Expo documentation in Markdown format")
		.argument(
			"[path]",
			"Documentation path (e.g., /accounts/account-types)",
			"",
		)
		.option("-p, --pretty", "Display in human-readable format with colors")
		.option(
			"--sdk-version <version>",
			"Expo SDK version branch (e.g., sdk-54, sdk-53)",
		)
		.action(async (pathArg: string, options: DocsOptions) => {
			// Use provided version or default
			const expoVersion = options.sdkVersion || defaultExpoVersion;
			try {
				let path = pathArg;

				// Support for piped input (stdin)
				if (!process.stdin.isTTY && !path) {
					let input = "";
					for await (const chunk of process.stdin) {
						input += chunk;
					}
					// Remove quotes from input (e.g., from jq output)
					path = input.trim().replace(/^"|"$/g, "");
				}

				// Default to llms.txt if no path provided
				let url: string;
				if (!path) {
					url = "https://docs.expo.dev/llms.txt";
				} else {
					url = getExpoDocsUrl(path, expoVersion);
				}

				const response = await fetch(url);

				if (!response.ok) {
					if (response.status === 404) {
						console.error(`Documentation not found: ${path}`);
						console.error(`URL: ${url}`);
						process.exit(1);
					}
					throw new Error(
						`Failed to fetch documentation: ${response.statusText}`,
					);
				}

				let content = await response.text();

				// Process InstallSection tags in MDX content
				content = processInstallSections(content);

				// Process Permission tags in MDX content
				content = await processPermissionSections(content);

				// Process APISection tags in MDX content
				content = await processApiSections(content, expoVersion);

				if (options.pretty) {
					// Display with terminal formatting
					console.log(formatMarkdownForTerminal(content));
				} else {
					// Output raw markdown (for piping/AI processing)
					console.log(content);
				}
			} catch (error) {
				console.error(
					"Error fetching documentation:",
					error instanceof Error ? error.message : error,
				);
				process.exit(1);
			}
		});
};
