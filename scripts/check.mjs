import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const pkg = read("package.json");
const manifest = read("manifest.json");
const versions = read("versions.json");
assert.equal(pkg.version, manifest.version, "package/manifest versions differ");
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.equal(manifest.id, "mathfolio");
assert.equal(manifest.name, "Mathfolio");
assert.equal(pkg.license, "AGPL-3.0-only");
assert.equal(versions[manifest.version], manifest.minAppVersion);
assert.equal(manifest.isDesktopOnly, true);
assert.ok(manifest.description.length <= 250 && manifest.description.endsWith("."));
if (existsSync("package-lock.json")) {
  const lock = read("package-lock.json");
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[""].version, pkg.version);
}
for (const file of ["LICENSE", "NOTICE.md", "README.md", "PLAN.md"]) {
  assert.ok(existsSync(file), `${file} is missing`);
}
if (existsSync("src/main.ts")) {
  execFileSync(process.execPath, ["node_modules/typescript/bin/tsc", "--noEmit"], { stdio: "inherit" });
} else {
  console.log("Scaffold only: src/main.ts is intentionally absent; plugin typecheck deferred.");
}
if (process.argv.includes("--release")) {
  assert.equal(read("release-state.json").ready, true, "Plugin release acceptance is still pending");
  const sdk = read("sdk.lock.json");
  assert.match(sdk.sourceCommit, /^[a-f0-9]{40}$/);
  assert.match(sdk.wasmSha256 ?? "", /^[a-f0-9]{64}$/);
  assert.equal(sdk.sourceRepository, "https://github.com/Glaysia/mathfolio");
  if (sdk.status === "released") {
    assert.match(sdk.sha256 ?? "", /^[a-f0-9]{64}$/);
    assert.ok(sdk.releaseTag && sdk.assetUrl?.startsWith("https://github.com/Glaysia/mathfolio/releases/download/"));
    assert.equal(pkg.dependencies?.[sdk.package], sdk.assetUrl, "SDK dependency must match its release pin");
  } else {
    assert.equal(sdk.status, "source-build", "SDK must have a pinned, reproducible source build or release");
    assert.equal(sdk.buildPaths, "remapped");
    assert.ok(existsSync("scripts/sdk-build.mjs"));
  }
  const info = read("build-info.json");
  assert.deepEqual(info.sdk, sdk, "Bundle SDK provenance differs from the release pin");
  assert.ok(existsSync("src/main.ts") && existsSync("main.js"), "Plugin implementation/build is missing");
  const tag = process.env.GITHUB_REF_TYPE === "tag" ? process.env.GITHUB_REF_NAME : undefined;
  if (tag) assert.equal(tag, manifest.version, "Tag must match manifest.version without a v prefix");
}
console.log("Metadata checks passed.");
