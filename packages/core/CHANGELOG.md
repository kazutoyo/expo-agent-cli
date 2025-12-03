# expo-agent-core

## 0.6.1

### Patch Changes

- Bump version to 0.6.1 for republish (0.6.0 was unpublished)

## 0.6.0

### Minor Changes

- Release v0.6.0 with improved documentation path resolution and error handling

  ## New Features

  - **Enhanced Path Resolution**: Improved documentation fetching with fallback mechanism (.mdx → /index.mdx)
  - **Dynamic Version Resolution**: Support for "next" version paths that resolve to latest SDK version
  - **Timeout Support**: All fetch requests now have 10-second timeout to prevent hanging
  - **Better Error Handling**: MDX processing failures no longer crash the application

  ## Improvements

  - **Type Safety**: New `SdkVersion` type for better version string validation
  - **Error Messages**: Show all attempted URLs when documentation is not found
  - **Automatic Version Detection**: Removed --sdk-version option in favor of path-based detection

  ## Documentation

  - Updated README to reflect new branch strategy (main instead of sdk-54)

## 0.5.0

### Minor Changes

- Update dependencies to align with CLI version

## 0.4.0

### Minor Changes

- Detect Expo Version

## 0.2.0

### Minor Changes

- 3391d77: Release 0.3.0 with Changesets integration and deprecation ranking feature

  Major changes:

  - Integrate Changesets for version management and automated publishing
  - Add deprecation ranking: packages with `isDeprecated: true` get lower search scores
  - Add comprehensive tests for crawler functions (25 new tests)
  - Update Turborepo configuration with lint and test tasks

- detect expo version
