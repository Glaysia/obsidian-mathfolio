# Project instructions

- This repository is the TypeScript Obsidian host for Mathfolio's Rust WASM SDK.
- Current scope is repository setup and planning. Do not start plugin main code
  until the user explicitly requests implementation.
- Use /home/harry/Projects/RustProjects/mathfolio for local SDK development.
  Do not modify that repository as a side effect of plugin setup.
- Keep editing, calculation, document state and history in the SDK.
- Use AGPL-3.0-only for original work and preserve third-party notices.
- Keep README and PLAN honest about implemented and unverified behavior.
- SDK release dependencies must be pinned; local symlinks are development only.
- Obsidian downloads main.js, manifest.json and optional styles.css. Verify all
  required SDK assets through that installation path before enabling release.
- Run npm run check for scaffold changes. A real plugin build is intentionally
  unavailable until src/main.ts exists. Never add a fake entrypoint to pass CI.
- Create draft GitHub releases using exact manifest version tags, without v.
