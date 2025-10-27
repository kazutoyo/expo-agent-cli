# expo-agent-cli

CLI tool for accessing Expo SDK documentation and search functionality. Inspired by [Hono CLI](https://github.com/honojs/cli).

## Features

- 📖 Fetch Expo documentation directly from GitHub in Markdown format
- 🔍 Search Expo documentation using Algolia
- 🎨 Pretty terminal output with color formatting
- 🤖 JSON output for AI agents and piping
- ⚡️ Fast and lightweight

## Installation

### From Source

```bash
# Install dependencies
bun install

# Build the CLI
bun run build

# Run locally
node dist/cli.js --help
```

### Development

```bash
# Watch mode for development
bun run dev
```

### Release workflow

This project follows Conventional Commits and uses `standard-version` to update the CHANGELOG and bump versions automatically.

```bash
# 1. Commit your changes (e.g., feat(search): add new filter)
# 2. Run the release script
bun run release

# 3. Push the generated changes (package.json, CHANGELOG.md) and tags
git push origin <branch> && git push --follow-tags
```

You can validate commit messages with `commitlint`, for example: `bun run commitlint -- --from HEAD~1`.

## Usage

### Commands

#### `docs [path]` - Fetch Expo Documentation

Fetch Expo documentation in Markdown format from GitHub.

```bash
# Fetch specific documentation page
expo-agent-cli docs /get-started/introduction

# Fetch with pretty formatting for terminal display
expo-agent-cli docs /accounts/account-types --pretty

# Support for piping
echo "/get-started/introduction" | expo-agent-cli docs
```

**Options:**
- `-p, --pretty` - Display in human-readable format with ANSI colors

**Examples:**
```bash
# Get raw markdown (for AI processing)
expo-agent-cli docs /guides/routing

# Get formatted output for terminal reading
expo-agent-cli docs /guides/routing --pretty
```

---

#### `search <query>` - Search Expo Documentation

Search through Expo documentation using Algolia search.

```bash
# Search for "camera"
expo-agent-cli search "camera"

# Limit results and show pretty output
expo-agent-cli search "navigation" --limit 5 --pretty
```

**Options:**
- `-l, --limit <number>` - Number of results to show (default: 5, max: 20)
- `-p, --pretty` - Display results in human-readable format

**Examples:**
```bash
# JSON output (default) - for piping/AI processing
expo-agent-cli search "expo-router" --limit 10

# Pretty output for humans
expo-agent-cli search "push notifications" --pretty
```

---

#### `version` - Show Version Information

Display CLI and Expo SDK version information.

```bash
expo-agent-cli version
```

---

## Project Structure

```
expo-agent-cli/
├── src/
│   ├── cli.ts                    # Main entry point
│   ├── commands/                 # Command implementations
│   │   ├── docs/
│   │   │   └── index.ts         # Docs command
│   │   ├── search/
│   │   │   └── index.ts         # Search command
│   │   └── version/
│   │       └── index.ts         # Version command
│   └── utils/
│       ├── constants.ts          # Constants (URLs, API keys)
│       └── markdown-formatter.ts # Markdown formatting utilities
├── dist/                         # Build output
├── package.json
├── tsconfig.json
└── tsup.config.ts               # Build configuration
```

## Technical Details

### Built With

- **[Commander.js](https://github.com/tj/commander.js)** - CLI framework
- **[Algolia Search](https://www.algolia.com/)** - Documentation search
- **[Chalk](https://github.com/chalk/chalk)** - Terminal styling
- **[tsup](https://github.com/egoist/tsup)** - TypeScript bundler
- **[Bun](https://bun.sh)** - JavaScript runtime and package manager

### Data Sources

- **Documentation**: Fetched directly from [expo/expo GitHub repository](https://github.com/expo/expo/tree/main/docs/pages)
- **Search**: Powered by Expo's public Algolia search API

## Development

### Scripts

```bash
# Build for production
bun run build

# Development mode with watch
bun run dev

# Run tests
bun test
```

### Design Principles

- **Modular**: Each command is a self-contained module
- **Type-Safe**: Strict TypeScript throughout
- **Piping Support**: Stdin/stdout support for integration with other tools
- **AI-Friendly**: JSON output by default for machine processing
- **Human-Friendly**: Pretty output option for terminal reading

## Examples

### Integration with jq

```bash
# Search and extract URLs
expo-agent-cli search "camera" | jq -r '.results[].url'

# Get specific field from docs
expo-agent-cli docs /get-started/introduction | grep "^#" | head -1
```

### Use with AI Agents

```bash
# Get documentation for AI processing
expo-agent-cli docs /guides/routing > context.md

# Search and pass results to AI
expo-agent-cli search "authentication" --limit 10 > search-results.json
```

## License

MIT

## Related Projects

- [Hono CLI](https://github.com/honojs/cli) - Inspiration for this project
- [Expo](https://expo.dev) - The framework this CLI supports
