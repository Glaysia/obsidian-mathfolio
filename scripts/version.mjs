import { readFileSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const read = (file) => JSON.parse(readFileSync(file, "utf8"));
const version = read("package.json").version;
assert.match(version, /^\d+\.\d+\.\d+$/, "Obsidian requires x.y.z versions");
const manifest = { ...read("manifest.json"), version };
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2) + "\n");
writeFileSync("versions.json", JSON.stringify({ ...read("versions.json"), [version]: manifest.minAppVersion }, null, 2) + "\n");
