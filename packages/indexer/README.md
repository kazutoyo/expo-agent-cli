# @expo-agent/indexer

CLI tool for building search indexes from Expo documentation.

## Usage

```bash
# Build index from default location
bun run build-index

# Specify custom paths
expo-indexer --docs-path ./expo-docs/docs --output ./output
```

## Options

- `-d, --docs-path <path>`: Path to Expo docs directory (default: `./expo-docs/docs`)
- `-o, --output <path>`: Output directory for search index (default: `./packages/cli/src/data`)

## How it Works

1. Crawls all MDX files in the Expo documentation
2. Extracts titles, content, and hierarchy
3. Saves as JSON for use by the search engine

## License

MIT
