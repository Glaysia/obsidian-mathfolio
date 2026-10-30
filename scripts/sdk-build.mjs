// SPDX-License-Identifier: AGPL-3.0-only
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
import { homedir } from "node:os";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = resolve(process.argv[2] ?? "/home/harry/Projects/RustProjects/mathfolio");
const pin = JSON.parse(readFileSync("sdk.lock.json", "utf8"));
assert.equal(execFileSync("git", ["-C", source, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(), pin.sourceCommit);
const cargoHome = process.env.CARGO_HOME ?? join(homedir(), ".cargo");
// Rust panic locations otherwise contain the builder's absolute registry paths,
// producing different WASM hashes on the local machine and GitHub's runner.
const remap = [`--remap-path-prefix=${source}=/mathfolio`, `--remap-path-prefix=${cargoHome}=/cargo`];
execFileSync(process.platform === "win32" ? "python" : "python3", [join(source, "scripts/build-wasm.py")], {
  cwd: source, stdio: "inherit", env: { ...process.env,
    PATH: join(cargoHome, "bin") + (process.platform === "win32" ? ";" : ":") + process.env.PATH,
    RUSTFLAGS: [...remap, process.env.RUSTFLAGS ?? ""].join(" ").trim(),
  },
});
