// SPDX-License-Identifier: AGPL-3.0-only
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "esbuild";

const sdk = resolve("node_modules/@mathfolio/wasm-sdk");
if (!existsSync(join(sdk, "mathfolio_bg.wasm"))) throw new Error("Mathfolio SDK is missing. Build the local SDK, then run npm run sdk:link.");
const binary = path => JSON.stringify(readFileSync(path).toString("base64"));
const worker = await build({ entryPoints: ["src/worker.ts"], bundle: true, format: "iife", platform: "browser", target: "es2022",
  write: false, legalComments: "inline", logOverride: { "empty-import-meta": "silent" } });
const notices = ["Mathfolio for Obsidian — AGPL-3.0-only", "Plugin source: https://github.com/Glaysia/obsidian-mathfolio",
  "SDK source: https://github.com/Glaysia/mathfolio", readFileSync("sdk.lock.json", "utf8"),
  readFileSync("LICENSE", "utf8"), readFileSync("NOTICE.md", "utf8")];
function include(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) include(path);
    else if (!/\.(ttf|otf|woff2?|wasm)$/i.test(entry.name)) notices.push(`\n--- ${path.slice(sdk.length + 1)} ---\n` + readFileSync(path, "utf8"));
  }
}
for (const file of ["LICENSE", "NOTICE.md"]) notices.push(readFileSync(join(sdk, file), "utf8"));
for (const folder of ["licenses", "fonts"]) if (existsSync(join(sdk, folder))) include(join(sdk, folder));
await build({ entryPoints: ["src/main.ts"], bundle: true, external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs", platform: "browser", target: "es2022", outfile: "main.js", sourcemap: false,
  legalComments: "inline", banner: { js: "/*! Mathfolio for Obsidian — AGPL-3.0-only. Bundled notices available in plugin settings. */" },
  logLevel: "info", logOverride: { "empty-import-meta": "silent" },
  plugins: [{ name: "embedded-sdk", setup(build) {
    build.onResolve({ filter: /^mathfolio:assets$/ }, () => ({ path: "assets", namespace: "mathfolio" }));
    build.onLoad({ filter: /.*/, namespace: "mathfolio" }, () => ({ loader: "js", contents: `
      const decode = text => Uint8Array.from(atob(text), char => char.charCodeAt(0));
      export const wasm = decode(${binary(join(sdk, "mathfolio_bg.wasm"))});
      export const font = decode(${binary(join(sdk, "fonts/nanum/NanumGothic-Regular.ttf"))});
      export const workerSource = ${JSON.stringify(worker.outputFiles[0].text)};
      export const notices = ${JSON.stringify(notices.join("\n\n"))};
    ` }));
  } }],
});
writeFileSync("build-info.json", JSON.stringify({ sdk: JSON.parse(readFileSync("sdk.lock.json", "utf8")),
  bytes: readFileSync("main.js").length, assetsEmbedded: ["wasm", "worker", "font", "licenses"] }, null, 2) + "\n");
