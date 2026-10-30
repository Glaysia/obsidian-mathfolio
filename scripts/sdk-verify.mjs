// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const pin = JSON.parse(readFileSync("sdk.lock.json", "utf8"));
const pkg = JSON.parse(readFileSync("node_modules/@mathfolio/wasm-sdk/package.json", "utf8"));
assert.equal(pkg.name, pin.package);
assert.equal(pkg.version, pin.version);
assert.equal(createHash("sha256").update(readFileSync("node_modules/@mathfolio/wasm-sdk/mathfolio_bg.wasm")).digest("hex"), pin.wasmSha256);
console.log(`Verified ${pkg.name}@${pkg.version} WASM SHA-256.`);
