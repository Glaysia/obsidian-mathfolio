# Changelog

## 0.1.7 — Verified integration

- Validate compressed assets in a separate Linux Obsidian 1.14.5 Vault.
- Split font data to respect Chromium CSS value limits and copy Node Buffer views safely.
- Confirm calculation, save/reopen without recalculation, PDF, settings and conflict recovery.
- Require lint and dependency audit in CI; publish only the final 0.1.7 plugin tag.

## 0.1.6 — Offline bundle size

- Optimize and Brotli-compress the packaged WASM/Worker payload with printable binary encoding.
- Keep Korean font data in generated styles.css; each installed file is below 5,000,000 bytes.
- Decode locally through the desktop runtime; no server or CDN dependency.
- Add settings, Worker protocol and binary transport regression tests.

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
