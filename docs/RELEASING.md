# Release procedure

Plugin and SDK versions are independent. Plugin 0.1.8 uses the released Mathfolio SDK 0.1.2 / protocol 1, with URL, source commit and hashes pinned in sdk.lock.json.

## Pinned SDK

`npm ci` installs the exact GitHub Release tarball URL in package.json. package-lock.json pins npm integrity; sdk.lock.json records the upstream source commit, release tag, archive SHA-256 and original WASM SHA-256. `npm run sdk:verify` checks the installed package version and WASM. No local symlink or Rust toolchain is needed for a release build.

The build optimizes the pinned WASM with Binaryen 132, validates it, packs it with the font and license notices, and gzip-compresses the binary payload. Printable encoding distributes the data across main.js and generated styles.css, each below 5,000,000 bytes. Browser DecompressionStream decodes it locally; Worker JavaScript remains static code in main.js. Source CSS is css/plugin.css; never edit generated styles.css.

Local `sdk:build` and `sdk:link` are for SDK development. Updating the distribution SDK requires updating its URL, lockfile, sdk.lock.json and verification record together.

## Verification and versioning

```sh
npm ci
npm run check
npm run lint
npm run audit
npm test
npm run build
npm run check:release
```

The audit command enforces runtime audit and all unreviewed moderate/high/critical findings. Its one source-verified development-only legacy advisory assessment is documented in [DEPENDENCY-AUDIT.md](DEPENDENCY-AUDIT.md). Raw npm audit findings remain visible.

Packaging changes require actual Obsidian WASM/Worker execution from only main.js, manifest.json and styles.css. Record the environment, results and untested platforms in VERIFICATION.md.

Use `npm version 0.1.8 --no-git-tag-version` to update package.json, lockfile, manifest.json and versions.json together. Commit the reviewed changes. Add the corresponding docs/releases/0.1.8.md before tagging.

## Final tag and CI publication

```sh
git push origin main
git tag -a 0.1.8 -m "Mathfolio for Obsidian 0.1.8"
git push origin 0.1.8
```

The tag must exactly match manifest.version, without a v prefix. 0.1.8 is the next public plugin version after 0.1.7.

The release workflow installs locked dependencies, runs checks/lint/audit/tests, builds and checks the file size limits. It creates GitHub artifact attestations for main.js and styles.css. It then creates a draft containing exactly main.js, manifest.json and styles.css, checks the tag and asset names, downloads and byte-compares the three draft assets, and publishes the verified draft in CI. Checksums are retained in the workflow summary, not attached as an unsupported extra asset.

After publication, download the three release files, check manifest.version and asset sizes, and verify provenance:

```sh
gh attestation verify main.js --repo Glaysia/obsidian-mathfolio
gh attestation verify styles.css --repo Glaysia/obsidian-mathfolio
```

GitHub release publication does not itself confirm that Obsidian's community review has passed.

## References

- https://docs.obsidian.md/Plugins/Releasing/Submit%20your%20plugin
- https://docs.obsidian.md/Reference/Manifest
- https://github.com/obsidianmd/obsidian-sample-plugin/blob/master/.github/workflows/release.yml
- https://github.com/Glaysia/mathfolio/blob/main/docs/WASM-SDK.md
