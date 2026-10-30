import { existsSync } from "node:fs";
import { build } from "esbuild";

if (!existsSync("src/main.ts")) {
  console.error("No plugin main code yet. Implement PLAN.md before building a release.");
  process.exit(1);
}
// Extend this build with SDK asset embedding and license notices during implementation.
await build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs",
  platform: "browser",
  target: "es2022",
  outfile: "main.js",
  sourcemap: false,
  logLevel: "info",
});
