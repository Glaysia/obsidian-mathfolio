// SPDX-License-Identifier: AGPL-3.0-only
import { mkdirSync, existsSync, copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";

const vault = resolve(process.argv[2] ?? process.env.b2 ?? "/home/harry/Documents/b2");
const config = join(vault, ".obsidian");
assert.ok(existsSync(config), "Target is not an Obsidian Vault");
const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
assert.ok(existsSync("main.js"), "Run npm run build first");
const target = join(config, "plugins", manifest.id);
const backup = resolve(".local-backups", new Date().toISOString().replace(/[:.]/g, "-"));
mkdirSync(backup, { recursive: true });
mkdirSync(target, { recursive: true });
for (const file of ["main.js", "manifest.json", "styles.css"]) {
  if (existsSync(join(target, file))) copyFileSync(join(target, file), join(backup, file));
  copyFileSync(file, join(target, file));
}
const enabledFile = join(config, "community-plugins.json");
if (existsSync(enabledFile)) copyFileSync(enabledFile, join(backup, "community-plugins.json"));
const enabled = existsSync(enabledFile) ? JSON.parse(readFileSync(enabledFile, "utf8")) : [];
if (!enabled.includes(manifest.id)) {
  enabled.push(manifest.id);
  writeFileSync(enabledFile, JSON.stringify(enabled, null, 2) + "\n");
}
console.log(`Installed ${manifest.name} ${manifest.version} to ${target}. Backup: ${backup}`);
console.log("Reload/enable the plugin in Obsidian to activate this build.");
