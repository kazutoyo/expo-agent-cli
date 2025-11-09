# expo-agent-cli

[![CI](https://github.com/kazutoyo/expo-agent-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/kazutoyo/expo-agent-cli/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/expo-agent-cli.svg)](https://www.npmjs.com/package/expo-agent-cli)
[![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/kazutoyo/expo-agent-cli?utm_source=oss&utm_medium=github&utm_campaign=kazutoyo%2Fexpo-agent-cli&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)](https://coderabbit.ai)

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

## For AI Agents

To help AI agents effectively use `expo-agent-cli` in your Expo projects, add the following section to your project's `CLAUDE.md` or `AGENTS.md`:

<details>
<summary>📋 Click to copy: AI Agent instructions for using expo-agent-cli</summary>

```markdown
## How to Search Expo Documentation

This project uses `expo-agent-cli` to retrieve the latest Expo documentation.

### Basic Usage

​```bash
# 1. Search for information
expo-agent-cli search <query>

# 2. View documentation
expo-agent-cli docs <path>

# 3. Search and get documentation for the first result (recommended)
expo-agent-cli search <query> | jq '.results[0].path' | xargs -I {} expo-agent-cli docs {}
​```

### Usage Examples

​```bash
# Look up expo-audio
expo-agent-cli search expo-audio | jq '.results[0].path' | xargs -I {} expo-agent-cli docs {}

# Look up expo-haptics
expo-agent-cli search expo-haptics | jq '.results[0].path' | xargs -I {} expo-agent-cli docs {}

# Look up expo-router
expo-agent-cli search expo-router | jq '.results[0].path' | xargs -I {} expo-agent-cli docs {}
​```

### Search Result Format

`expo-agent-cli search` returns results in the following JSON format:

​```json
{
  "query": "expo-haptics",
  "total": 5,
  "results": [
    {
      "title": "...",
      "category": "...",
      "url": "https://docs.expo.dev/...",
      "path": "/versions/v54.0.0/sdk/haptics/"
    }
  ]
}
​```

### Best Practices for Implementation

Before implementing new Expo features:
1. Search for the latest documentation using `expo-agent-cli search`
2. Check the documentation for version 54 (this project's Expo version)
3. Review the API, limitations, and platform compatibility
4. Implement based on the sample code
```

</details>

By adding this section to your AI agent configuration files, the agent will know how to:
- Search for Expo documentation efficiently
- Retrieve and parse documentation in a structured format
- Follow best practices when implementing Expo features

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

This will crawl all MDX files in `expo-docs/docs/pages` and create `packages/cli/src/data/search-index.gz`.

### Package Structure

- **expo-agent-core**: Common parsers and utilities for MDX processing
- **expo-agent-search**: FlexSearch-based offline search engine (with gzip compression)
- **expo-agent-cli**: Main CLI tool (published to npm)
- **expo-agent-indexer**: Tool for building search indexes from Expo docs

### Release workflow

This project follows [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

```bash
# Release to npm (from packages/cli directory)
bun run release
```

You can validate commit messages with `commitlint`, for example: `bun run commitlint -- --from HEAD~1`.

### CI/CD

The project includes GitHub Actions workflows for:
- **Testing**: Runs all tests in the `packages/` directory
- **Linting**: Runs Biome for code quality checks
- **Building**: Ensures all packages build successfully

## License

MIT

## Related Projects

- [Hono CLI](https://github.com/honojs/cli) - Inspiration for this project
- [Expo](https://expo.dev) - The framework this CLI supports
