import { existsSync, mkdirSync, readFileSync, symlinkSync, lstatSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

const source = resolve(process.argv[2] ?? "/home/harry/Projects/RustProjects/mathfolio");
const sdk = join(source, "dist", "wasm-sdk");
assert.ok(existsSync(join(sdk, "package.json")), `SDK not built: ${sdk}. Run scripts/build-wasm.py in Mathfolio first.`);
const pkg = JSON.parse(readFileSync(join(sdk, "package.json"), "utf8"));
assert.equal(pkg.name, "@mathfolio/wasm-sdk");
assert.equal(pkg.version, JSON.parse(readFileSync("sdk.lock.json", "utf8")).version);
for (const file of ["sdk.js", "sdk.d.ts", "mathfolio.js", "mathfolio_bg.wasm", "worker.js", "LICENSE", "NOTICE.md"]) {
  assert.ok(existsSync(join(sdk, file)), `SDK file missing: ${file}`);
}
const scope = resolve("node_modules/@mathfolio");
mkdirSync(scope, { recursive: true });
const link = join(scope, "wasm-sdk");
try {
  const existing = lstatSync(link);
  assert.ok(existing.isSymbolicLink(), `Refusing to replace installed package: ${link}`);
  unlinkSync(link);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
symlinkSync(sdk, link, process.platform === "win32" ? "junction" : "dir");
console.log(`Linked ${pkg.name}@${pkg.version} from ${sdk}. Development only; npm ci removes this link.`);
