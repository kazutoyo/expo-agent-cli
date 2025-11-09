# expo-agent-core

Core utilities and parsers for Expo documentation processing.

## Features

- **MDX Parsers**: Parse and convert Expo's MDX documentation
  - API section parser (`<APISection>` tags)
  - Installation section parser (`<InstallSection>` tags)
  - Permission section parser (`<IOSPermissions>`, `<AndroidPermissions>` tags)
- **Type Definitions**: TypeScript types for Expo API and permission data
- **Utilities**: Common functions for markdown formatting and constants

## Usage

```typescript
import {
  processApiSections,
  processInstallSections,
  processPermissionSections,
  getExpoDocsUrl,
  formatMarkdownForTerminal,
} from "expo-agent-core";

// Process API sections in MDX
const processedMdx = await processApiSections(mdxContent, "sdk-54");

// Get Expo docs URL
const url = getExpoDocsUrl("/versions/latest/sdk/camera", "sdk-54");

// Format markdown for terminal
const formatted = formatMarkdownForTerminal(markdown);
```

## License

MIT
