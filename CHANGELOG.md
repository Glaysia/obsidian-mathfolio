# Changelog

## 0.1.5 — Scoped file browsing

- Browse worksheets one folder at a time instead of enumerating the Vault.
- Limit recovery lookup to the recovery folder and clarify its command name.

## 0.1.4 — Release provenance

- Attest main.js and styles.css with GitHub build provenance.
- Attach only supported Obsidian plugin files; retain checksums in CI output.
- Validate release asset names before CI publishes the release.

## 0.1.3 — English documentation

- Add an English README covering installation, features, local processing and compatibility.
- Retain the Korean guide as README.ko.md.

## 0.1.2 — Obsidian APIs

- Adopt declarative searchable settings, window-owned timers and Obsidian DOM helpers.
- Remove deprecated beforeunload assignment and CSS !important.
- Keep strict lint rules and recognize Mathfolio as a brand name.

## 0.1.1 — SDK dependency and types

- Install the pinned Mathfolio SDK and its declarations through npm ci.
- Validate persisted settings and incoming Worker message envelopes.
- Treat untyped wasm-bindgen results and caught errors as unknown.

## 0.1.0

- Initial public Obsidian integration with the Mathfolio Rust WASM editor.
