// SPDX-License-Identifier: AGPL-3.0-only
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const sdk = resolve("node_modules/@mathfolio/wasm-sdk");
const input = readFileSync(join(sdk, "mathfolio_bg.wasm"));
mkdirSync(".build", { recursive: true });
const candidate = resolve(".build/mathfolio-oz.wasm");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const cacheFile = ".build/wasm-cache.json";
const key = { input: hash(input), binaryen: "132.0.0", flags: "Oz-strip-debug-strip-producers-v1" };
const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, "utf8")) : {};
const reusable = existsSync(candidate) && JSON.stringify(cache.key) === JSON.stringify(key) && cache.output === hash(readFileSync(candidate));
if (!reusable) execFileSync(process.execPath, ["node_modules/binaryen/bin/wasm-opt", join(sdk, "mathfolio_bg.wasm"), "-Oz",
  "--enable-bulk-memory", "--enable-nontrapping-float-to-int", "--enable-sign-ext", "--enable-reference-types",
  "--enable-multivalue", "--strip-debug", "--strip-producers", "-o", candidate], { stdio: "inherit" });
const wasm = readFileSync(candidate);
if (!WebAssembly.validate(wasm)) throw new Error("Optimized WASM is invalid");
writeFileSync(cacheFile, JSON.stringify({ key, output: hash(wasm) }));
const worker = await build({ entryPoints: ["src/worker.ts"], bundle: true, minify: true, format: "iife", platform: "browser", target: "es2022",
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
const encoder = await build({ entryPoints: ["src/encoding.ts"], bundle: true, format: "esm", platform: "node", write: false });
const { encode91, decode91 } = await import("data:text/javascript;base64," + Buffer.from(encoder.outputFiles[0].contents).toString("base64"));
const font = readFileSync(join(sdk, "fonts/nanum/NanumGothic-Regular.ttf"));
const header = Buffer.alloc(12);
header.writeUInt32LE(0x3841464d); header.writeUInt32LE(wasm.length, 4); header.writeUInt32LE(font.length, 8);
const packed = Buffer.concat([header, wasm, font, Buffer.from(notices.join("\n\n"))]);
const compressed = gzipSync(packed, { level: 9 });
const encoded = encode91(compressed);
if (!Buffer.from(decode91(encoded)).equals(compressed)) throw new Error("Asset transport roundtrip failed");
// The standard installation has three files. Distribute binary asset data
// across main.js and CSS while keeping each file below 5,000,000 bytes.
// Worker JavaScript remains static code in main.js, never in the stylesheet.
const prefix = encoded.slice(0, 4_300_000);
const parts = encoded.slice(prefix.length).match(/.{1,524288}/g) ?? [""];
await build({ entryPoints: ["src/main.ts"], bundle: true, minify: true, keepNames: true,
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  format: "cjs", platform: "browser", target: "es2022", outfile: "main.js", sourcemap: false,
  legalComments: "inline", banner: { js: "/*! Mathfolio for Obsidian — AGPL-3.0-only. Packaged binary assets; see scripts/build.mjs and settings for notices. */" },
  logLevel: "info", logOverride: { "empty-import-meta": "silent" },
  plugins: [{ name: "embedded-sdk", setup(build) {
    build.onResolve({ filter: /^mathfolio:assets$/ }, () => ({ path: "assets", namespace: "mathfolio" }));
    build.onLoad({ filter: /.*/, namespace: "mathfolio" }, () => ({ loader: "js", contents: `
      export const packedPrefix = ${JSON.stringify(prefix)};
      export const workerSource = ${JSON.stringify(worker.outputFiles[0].text)};
    ` }));
  } }],
});
writeFileSync("styles.css", readFileSync("css/plugin.css", "utf8") +
  `\n/* Packaged WASM/font/license bytes. No JavaScript is stored or executed here. */\n:root { --mathfolio-asset-parts: ${parts.length};\n` +
  parts.map((part, i) => `--mathfolio-asset-${i}: "${part}";`).join("\n") + "\n}\n");
const sizes = Object.fromEntries(["main.js", "styles.css"].map(file => [file, readFileSync(file).length]));
writeFileSync("build-info.json", JSON.stringify({ sdk: JSON.parse(readFileSync("sdk.lock.json", "utf8")),
  bytes: sizes["main.js"], sizes, wasm: { inputBytes: input.length, optimizedBytes: wasm.length,
    optimizedSha256: createHash("sha256").update(wasm).digest("hex") },
  compression: "gzip", compressedBytes: compressed.length, assetsEmbedded: ["wasm", "worker", "font", "licenses"] }, null, 2) + "\n");
for (const [file, bytes] of Object.entries(sizes)) if (bytes >= 5_000_000) throw new Error(`${file} exceeds the installation file limit`);
console.log(JSON.stringify({ sizes, wasm: wasm.length, compressed: compressed.length }));
