# Project instructions

- This repository is the TypeScript Obsidian host for Mathfolio's Rust WASM SDK.
- The user authorized plugin implementation and installation in the b2 Vault.
  Keep new features within the Mathfolio SDK host scope.
- Use /home/harry/Projects/RustProjects/mathfolio for local SDK development.
  Do not modify that repository as a side effect of plugin setup.
- Keep editing, calculation, document state and history in the SDK.
- Use AGPL-3.0-only for original work and preserve third-party notices.
- Keep README and PLAN honest about implemented and unverified behavior.
- SDK release dependencies must be pinned; local symlinks are development only.
- Obsidian downloads main.js, manifest.json and optional styles.css. Verify all
  required SDK assets through that installation path before enabling release.
- Run npm run check, npm test and npm run build for implementation changes.
  Test real WASM/Worker execution in Obsidian for host or packaging changes.
- Create draft GitHub releases using exact manifest version tags, without v.
