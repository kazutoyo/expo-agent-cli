# expo-agent-cli

CLI tool for searching and fetching Expo documentation from the terminal. Inspired by [Hono CLI](https://github.com/honojs/cli).

## Features

- 📖 Fetch Expo documentation directly from GitHub in Markdown format
- 🔍 Search Expo documentation using Algolia
- 🎨 Pretty terminal output with color formatting
- 🤖 JSON output for AI agents and piping
- ⚡️ Fast and lightweight

## Installation

```bash
npm install -g expo-agent-cli
```

## Usage

```bash
# Show help
expo-agent-cli --help

# Display documentation (defaults to llms.txt when path is omitted)
expo-agent-cli docs

# Fetch a specific page
expo-agent-cli docs /guides/routing

# Pretty-print markdown for terminal reading
expo-agent-cli docs /guides/routing --pretty

# Search documentation
expo-agent-cli search camera

# Display the Expo SDK version branch
expo-agent-cli version
```

## Commands

- `docs [path]` - Display Expo documentation in Markdown format
- `search <query>` - Search Expo documentation
- `version` - Show the Expo SDK version branch used by the CLI

## Development

```bash
# Install dependencies
bun install

# Build for production (runs publint via postbuild)
bun run build

# Development mode with watch
bun run dev

# Run tests
bun test

# Lint source files
bun run lint

# Format source files
bun run format
```

### Release workflow

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) and uses [`np`](https://github.com/sindresorhus/np) to guide npm publishing.

```bash
bun run release
```

You can validate commit messages with `commitlint`, for example: `bun run commitlint -- --from HEAD~1`.

## License

MIT

## Related Projects

- [Hono CLI](https://github.com/honojs/cli) - Inspiration for this project
- [Expo](https://expo.dev) - The framework this CLI supports
