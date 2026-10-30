import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { build } from "esbuild";

async function load(file) {
  const result = await build({ entryPoints: [file], bundle: true, format: "esm", platform: "node", write: false });
  return import("data:text/javascript;base64," + Buffer.from(result.outputFiles[0].text).toString("base64"));
}
const { readSettings } = await load("src/settings.ts");
const { isWorkerInput } = await load("src/worker-protocol.ts");
const { encode91, decode91 } = await load("src/encoding.ts");

test("corrupt persisted settings cannot install unknown theme or auto-save values", () => {
  for (const input of [null, [], 3, { theme: {}, autosave: "false" }]) {
    assert.deepEqual(readSettings(input), { theme: "follow_host", autosave: true });
  }
  assert.deepEqual(readSettings({ theme: "nord", autosave: false }), { theme: "nord", autosave: false });
});
test("Worker envelope accepts valid Rust requests and rejects malformed generations", () => {
  const job = { generation: 7, source: "x", automatic: false, requests: [], plots: [] };
  assert.equal(isWorkerInput([job, null]), true);
  for (const value of [null, [], [job], [{ ...job, generation: -1 }, null], [{ ...job, generation: "7" }, null], [{ ...job, source: null }, null]]) {
    assert.equal(isWorkerInput(value), false);
  }
});
test("printable asset encoding preserves tails, all byte values and large buffers", () => {
  for (const bytes of [new Uint8Array(), Uint8Array.from({ length: 256 }, (_, i) => i), ...[1, 2, 3, 7, 31, 8193, 131072].map(size => randomBytes(size))]) {
    assert.deepEqual(Buffer.from(decode91(encode91(bytes))), Buffer.from(bytes));
    assert.doesNotMatch(encode91(bytes), /["\\\s]/);
  }
});
test("invalid asset transport is rejected", () => {
  assert.throws(() => decode91('"'), /Invalid packaged asset/);
  assert.throws(() => decode91("한"), /Invalid packaged asset/);
});
