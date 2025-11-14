# expo-agent-cli

## 0.5.0

### Minor Changes

- Improve Expo version detection to support monorepos and dependency hoisting
- Update version command to display both CLI and Expo SDK versions
- Change fallback branch from "latest" to "main" when Expo is not detected

## 0.4.0

### Minor Changes

- Detect Expo Version

## 0.3.0

### Minor Changes

- 3391d77: Release 0.3.0 with Changesets integration and deprecation ranking feature

  Major changes:

  - Integrate Changesets for version management and automated publishing
  - Add deprecation ranking: packages with `isDeprecated: true` get lower search scores
  - Add comprehensive tests for crawler functions (25 new tests)
  - Update Turborepo configuration with lint and test tasks

- detect expo version
