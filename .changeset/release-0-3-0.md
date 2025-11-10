---
"expo-agent-cli": minor
"expo-agent-core": minor
"expo-agent-search": minor
---

Release 0.3.0 with Changesets integration and deprecation ranking feature

Major changes:
- Integrate Changesets for version management and automated publishing
- Add deprecation ranking: packages with `isDeprecated: true` get lower search scores
- Add comprehensive tests for crawler functions (25 new tests)
- Update Turborepo configuration with lint and test tasks
