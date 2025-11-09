# expo-agent-cli

CLI tool for searching and fetching Expo documentation from the terminal. Inspired by [Hono CLI](https://github.com/honojs/cli).

## Features

- 📖 Fetch Expo documentation directly from GitHub in Markdown format
- 🔍 **Offline search** powered by FlexSearch (no external API required)
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
expo-agent-cli docs /versions/latest/sdk/camera

# Pretty-print markdown for terminal reading
expo-agent-cli docs /versions/latest/sdk/camera --pretty

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

This project uses a **monorepo structure** with Bun workspaces:

```
packages/
├── core/      # Shared parsers and utilities
├── search/    # Offline search engine
├── cli/       # CLI tool (published to npm)
└── indexer/   # Search index builder
```

### Setup

```bash
# Install dependencies
bun install

# Setup Expo documentation submodule (required for search index)
git submodule add https://github.com/expo/expo.git expo-docs
cd expo-docs && git checkout sdk-54 && cd ..

# Build all packages
bun run build

# Build search index (required for offline search)
bun run build-index
```

### Development Commands

```bash
# Build all packages
bun run build

# Development mode with watch (CLI only)
bun run dev

# Run tests
bun test

# Lint all packages
bun run lint

# Format all packages
bun run format
```

### Building the Search Index

The search feature requires a prebuilt index. To build it:

1. **Initialize the Expo docs submodule** (one-time setup):
   ```bash
   git submodule add https://github.com/expo/expo.git expo-docs
   cd expo-docs
   git checkout sdk-54  # or your target SDK version
   cd ..
   ```

2. **Build the search index**:
   ```bash
   bun run build-index
   ```

This will crawl all MDX files in `expo-docs/docs/pages` and create `packages/cli/src/data/search-docs.json`.

### Package Structure

- **@expo-agent/core**: Common parsers and utilities for MDX processing
- **@expo-agent/search**: FlexSearch-based offline search engine
- **@expo-agent/cli**: Main CLI tool (published as `expo-agent-cli`)
- **@expo-agent/indexer**: Tool for building search indexes from Expo docs

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
