# TypeScript host

- main.ts: plugin registration, commands, settings and Vault file creation.
- view.ts: Canvas lifecycle, SDK events, save queue and recovery handling.
- save.ts: byte snapshots and external-change conflict checks.
- theme.ts: Obsidian CSS colors resolved to the SDK integer RGBA contract.
- worker.ts: bundled calculation Worker, initialized from the embedded WASM Blob.

Worksheet editing, math evaluation, document state and history remain in the Rust SDK.
