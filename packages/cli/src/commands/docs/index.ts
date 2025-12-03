import type { Command } from "commander";
import {
	formatMarkdownForTerminal,
	processApiSections,
	processInstallSections,
	processPermissionSections,
} from "expo-agent-core";
import { getExpoDocsInfo } from "../../utils/constants";

interface DocsOptions {
	pretty?: boolean;
}

export const docsCommand = (program: Command) => {
	program
		.command("docs")
		.description("Fetch Expo documentation in Markdown format")
		.argument(
			"[path]",
			"Documentation path (e.g., /accounts/account-types)",
			"",
		)
		.option("-p, --pretty", "Display in human-readable format with colors")
		.action(async (pathArg: string, options: DocsOptions) => {
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
				if (!path) {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 10000);
					try {
						const llmResult = await fetch("https://docs.expo.dev/llms.txt", {
							signal: controller.signal,
						});
						clearTimeout(timeoutId);
						const content = await llmResult.text();
						if (options.pretty) {
							// Display with terminal formatting
							console.log(formatMarkdownForTerminal(content));
						} else {
							// Output raw markdown (for piping/AI processing)
							console.log(content);
						}
						return;
					} catch (error) {
						clearTimeout(timeoutId);
						if (
							error instanceof Error &&
							error.name === "AbortError"
						) {
							throw new Error(
								"Request timeout: Failed to fetch llms.txt after 10 seconds",
							);
						}
						throw error;
					}
				}

				let url = "";
				let response: Response | null = null;

				// Get URLs and resolved version
				const { urls, resolvedVersion } = await getExpoDocsInfo(path);
				const expoVersion = resolvedVersion;

				// Try each URL until one succeeds
				let lastError: Error | null = null;
				for (const tryUrl of urls) {
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 10000);
					try {
						const tryResponse = await fetch(tryUrl, {
							signal: controller.signal,
						});
						clearTimeout(timeoutId);
						if (tryResponse.ok) {
							url = tryUrl;
							response = tryResponse;
							break;
						}
						if (tryResponse.status === 404) {
							// Try next URL
							continue;
						}
						// Non-404 error, throw
						throw new Error(
							`Failed to fetch documentation: ${tryResponse.statusText}`,
						);
					} catch (error) {
						clearTimeout(timeoutId);
						if (
							error instanceof Error &&
							error.name === "AbortError"
						) {
							lastError = new Error(
								`Request timeout: ${tryUrl} took more than 10 seconds`,
							);
						} else {
							lastError =
								error instanceof Error ? error : new Error(String(error));
						}
					}
				}

				// If no URL succeeded, show error
				if (!response) {
					console.error(`Documentation not found: ${path}`);
					console.error(
						`Tried URLs:\n${urls.map((u) => `  - ${u}`).join("\n")}`,
					);
					if (lastError) {
						console.error(`Last error: ${lastError.message}`);
					}
					process.exit(1);
				}

				if (!response || !response.ok) {
					if (response?.status === 404) {
						console.error(`Documentation not found: ${path}`);
						console.error(`URL: ${url}`);
						process.exit(1);
					}
					throw new Error(
						`Failed to fetch documentation: ${
							response?.statusText ?? "Unknown error"
						}`,
					);
				}

				let content = await response.text();

				// Process MDX sections with error handling
				// If processing fails, continue with original content
				try {
					// Process InstallSection tags in MDX content
					content = processInstallSections(content);

					// Process Permission tags in MDX content
					content = await processPermissionSections(content);

					// Process APISection tags in MDX content
					content = await processApiSections(content, expoVersion);
				} catch (error) {
					// Log warning but continue with original content
					if (process.env.DEBUG) {
						console.warn(
							"Warning: Failed to process some MDX sections:",
							error instanceof Error ? error.message : error,
						);
					}
				}

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
