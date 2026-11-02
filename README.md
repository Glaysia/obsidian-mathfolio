# Mathfolio for Obsidian

Edit and calculate mathematical worksheets in Obsidian with the shared [Mathfolio](https://github.com/Glaysia/mathfolio) Rust editor and calculation engine.

**0.1.8 development:** browser-compatible asset loading with Mathfolio SDK 0.1.2-rc2. The public release remains 0.1.7.

[한국어 안내](README.ko.md) · [Development plan](PLAN.md) · [Verification](docs/VERIFICATION.md)

## Features

- Create and edit `.mathfolio` worksheets; open legacy `.mathcraft` and `.mcdx` documents.
- Calculate formulas, units and matrices in a local calculation Worker.
- Save automatically or manually, save copies, and export vector PDF or MCDX files.
- Detect external file changes before saving and preserve unsaved work in recovery copies.
- Follow the Obsidian theme or select Light, Dark or Nord. Settings are searchable.

The worksheet editor, document state, history, calculation and PDF generation remain in Rust. The TypeScript plugin connects the SDK to Obsidian's Vault, views, commands and settings.

## Installation

Download `main.js`, `manifest.json` and `styles.css` from a [published release](https://github.com/Glaysia/obsidian-mathfolio/releases). Put them in `<vault>/.obsidian/plugins/mathfolio/` and enable Mathfolio in Community plugins. Back up existing plugin files before replacing them. Community directory registration is separate from GitHub releases.

The standard installation files contain the WASM, Korean font and license data. A browser gzip stream decompresses these binary assets locally; the calculation Worker is static JavaScript bundled in main.js. Each installed file is below 5 MB. The plugin does not require a separate Mathfolio installation, Rust, Node.js, an SDK asset server or a CDN.

## Usage

Use **Mathfolio: Create worksheet** in the command palette or the formula ribbon icon. Click an empty part of the worksheet to enter a formula. The shared editor keeps Mathfolio's editing tools and shortcuts. Use **Calculate** to calculate the worksheet and **Save** to save it. Auto-save runs after editing pauses, unless disabled in settings.

**Save copy** creates a new `.mathfolio` file. **PDF** and MCDX export create new Vault files without silently replacing an existing export.

If a save conflicts with an external edit or fails, the plugin keeps unsaved work in `Mathfolio Recovery/`. **Mathfolio: Open latest recovery copy** opens the newest recovery copy. The content check and Vault write do not provide an operating-system-level atomic lock against other applications.

## Data access and privacy

All calculation happens locally. The plugin reads and writes worksheets and exports selected by the user, stores settings in its plugin directory, and creates recovery copies in the Vault. It does not send worksheet contents or telemetry to a server.

The worksheet picker lists only the folder selected by the user, with navigation into subfolders. Recovery lookup is limited to the recovery folder. The plugin does not enumerate every file in the Vault or read unrelated file contents. See the verification notes for tested behavior and limits.

## Development

Use Node.js 24 and npm. For the current development SDK, first run `node scripts/sdk-prepare.mjs /path/to/mathfolio` against the pinned source checkout containing the tested SDK archive in dist/:

```sh
npm ci
npm run check
npm run lint
npm test
npm run build
```

`npm ci` installs the exact SDK archive recorded in package-lock.json. Version 0.1.8 currently uses a local SDK 0.1.2-rc2 development archive prepared by sdk-prepare; sdk.lock.json records its source commit, archive SHA-256 and WASM SHA-256. A public plugin release requires publishing the SDK and changing the dependency to its fixed release URL first.

The local SDK source checkout is `/home/harry/Projects/RustProjects/mathfolio`. SDK build/link tools remain available for SDK development. A local link must match the recorded source and WASM hash; distribution builds use the locked package.

```sh
npm run install:vault -- /path/to/vault
```

This installer backs up the existing plugin files and enabled-plugin list into `.local-backups/`. Reload Mathfolio in Obsidian to use the new build.

## Compatibility and releases

Minimum Obsidian version 1.14.4. Verified on Linux / Obsidian Desktop 1.14.5 and a PC browser web session running Obsidian 1.14.4. Web host compatibility is limited to the tested environment; it is not a claim that every Obsidian-derived host works. Windows plugin workflows, physical Korean IME and crash/power-loss recovery remain unverified. Mobile is not supported; the manifest retains its desktop-only flag.

Plugin and SDK versions are independent. Only release tags matching `manifest.json` exactly, without a `v` prefix, are used for Obsidian plugin distribution. See [release instructions](docs/RELEASING.md).

## License

Original plugin code, scripts and documentation use **AGPL-3.0-only**, matching Mathfolio. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). Bundled third-party components retain their own licenses. Full notices and SDK source provenance are available in the plugin settings.
