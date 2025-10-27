import { Command } from 'commander';
import { getExpoDocsUrl } from '../../utils/constants.js';
import { formatMarkdownForTerminal } from '../../utils/markdown-formatter.js';

interface DocsOptions {
  pretty?: boolean;
  sdkVersion?: string;
}

export const docsCommand = (program: Command, defaultExpoVersion: string) => {
  program
    .command('docs')
    .description('Fetch Expo documentation in Markdown format')
    .argument('[path]', 'Documentation path (e.g., /accounts/account-types)', '')
    .option('-p, --pretty', 'Display in human-readable format with colors')
    .option('--sdk-version <version>', 'Expo SDK version branch (e.g., sdk-54, sdk-53)')
    .action(async (pathArg: string, options: DocsOptions) => {
      // Use provided version or default
      const expoVersion = options.sdkVersion || defaultExpoVersion;
      try {
        let path = pathArg;

        // Support for piped input (stdin)
        if (!process.stdin.isTTY && !path) {
          let input = '';
          for await (const chunk of process.stdin) {
            input += chunk;
          }
          // Remove quotes from input (e.g., from jq output)
          path = input.trim().replace(/^"|"$/g, '');
        }

        // Default to llms.txt if no path provided
        let url: string;
        if (!path) {
          url = 'https://docs.expo.dev/llms.txt';
        } else {
          // Ensure path starts with /
          if (!path.startsWith('/')) {
            path = '/' + path;
          }

          // Remove trailing slash
          path = path.replace(/\/$/, '');

          // Remove .mdx extension if provided
          path = path.replace(/\.mdx$/, '');

          const baseUrl = getExpoDocsUrl(expoVersion);
          url = `${baseUrl}${path}.mdx`;
        }

        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 404) {
            console.error(`Documentation not found: ${path}`);
            console.error(`URL: ${url}`);
            process.exit(1);
          }
          throw new Error(`Failed to fetch documentation: ${response.statusText}`);
        }

        const content = await response.text();

        if (options.pretty) {
          // Display with terminal formatting
          console.log(formatMarkdownForTerminal(content));
        } else {
          // Output raw markdown (for piping/AI processing)
          console.log(content);
        }
      } catch (error) {
        console.error('Error fetching documentation:', error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
};
