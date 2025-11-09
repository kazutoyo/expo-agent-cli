# @expo-agent/search

Offline search engine for Expo documentation using FlexSearch.

## Features

- **Document Crawler**: Extract and parse MDX files from Expo repository
- **FlexSearch Integration**: Fast, offline full-text search
- **Hierarchical Search**: Search across document titles, content, and categories

## Usage

```typescript
import { crawlExpoDocs, OfflineSearchEngine } from "@expo-agent/search";

// Crawl documentation
const docs = await crawlExpoDocs("./expo-docs/docs");

// Create search engine
const engine = new OfflineSearchEngine();
await engine.loadDocuments(docs);

// Search
const results = await engine.search("camera", 5);
console.log(results);
```

## License

MIT
