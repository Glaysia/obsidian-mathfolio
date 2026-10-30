# Release procedure

Plugin and SDK versions are independent. The plugin uses Mathfolio SDK 0.1.1 / protocol 1.

## Pinned SDK

`npm ci` installs the exact GitHub Release tarball URL in package.json. package-lock.json pins npm integrity; sdk.lock.json records the upstream source commit, release tag, archive SHA-256 and original WASM SHA-256. `npm run sdk:verify` checks the installed package version and WASM. No local symlink or Rust toolchain is needed for a release build.

The build optimizes the pinned WASM with Binaryen 132, validates it, packs it with the static Worker and notices, and Brotli-compresses the payload. A printable binary encoding keeps main.js within 5,000,000 bytes. Desktop Obsidian's built-in Node zlib decodes it locally. Font data is stored in generated styles.css. Source CSS is css/plugin.css; never edit generated styles.css.

Local `sdk:build` and `sdk:link` are for SDK development. Updating the distribution SDK requires updating its URL, lockfile, sdk.lock.json and verification record together.

## Verification and versioning

```sh
npm ci
npm run check
npm run lint
npm audit --audit-level=moderate
npm test
npm run build
npm run check:release
```

Packaging changes require actual Obsidian WASM/Worker execution from only main.js, manifest.json and styles.css. Record the environment, results and untested platforms in VERIFICATION.md.

Use `npm version 0.1.7 --no-git-tag-version` to update package.json, lockfile, manifest.json and versions.json together. Commit the reviewed changes. Add the corresponding docs/releases/0.1.7.md before tagging.

## Final tag and CI publication

```sh
git push origin main
git tag -a 0.1.7 -m "Mathfolio for Obsidian 0.1.7"
git push origin 0.1.7
```

The tag must exactly match manifest.version, without a v prefix. For this update, 0.1.1 through 0.1.6 are sequential source commits only; only 0.1.7 receives a plugin tag and release.

The release workflow installs locked dependencies, runs checks/lint/audit/tests, builds and checks the file size limits. It creates GitHub artifact attestations for main.js and styles.css. It then creates a draft containing exactly main.js, manifest.json and styles.css, checks the tag and asset names, and publishes the verified draft in CI. Checksums are retained in the workflow summary, not attached as an unsupported extra asset.

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
