import { test } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";

const compiled = await build({ entryPoints: ["src/save.ts"], bundle: true, format: "esm", platform: "node", write: false });
const { arrayBuffer, fingerprint, writeSnapshot, SaveConflict } = await import("data:text/javascript;base64," + Buffer.from(compiled.outputFiles[0].text).toString("base64"));
const bytes = text => new TextEncoder().encode(text);

test("writes the complete byte snapshot after checking current file contents", async () => {
  let disk = arrayBuffer(bytes("previous"));
  const result = await writeSnapshot({ read: async () => disk, write: async next => { disk = next; } }, await fingerprint(disk), bytes("edited"));
  assert.equal(new TextDecoder().decode(disk), "edited");
  assert.equal(result, await fingerprint(disk));
});

test("external edits never get overwritten", async () => {
  const baseline = await fingerprint(bytes("original"));
  let writes = 0;
  await assert.rejects(writeSnapshot({ read: async () => arrayBuffer(bytes("external edit")), write: async () => { writes++; } }, baseline, bytes("my edit")), SaveConflict);
  assert.equal(writes, 0);
});

test("write failure is propagated and does not produce a success fingerprint", async () => {
  const original = arrayBuffer(bytes("original"));
  await assert.rejects(writeSnapshot({ read: async () => original, write: async () => { throw new Error("disk full"); } }, await fingerprint(original), bytes("new")), /disk full/);
});

test("fingerprinting and writes respect typed-array offsets", async () => {
  const backing = bytes("prefixPAYLOADsuffix");
  const payload = backing.subarray(6, 13);
  assert.equal(new TextDecoder().decode(arrayBuffer(payload)), "PAYLOAD");
  assert.equal(await fingerprint(payload), await fingerprint(bytes("PAYLOAD")));
});

test("Node Buffer views cannot expose the packed header or neighboring bytes", async () => {
  const payload = Buffer.from("headerPAYLOADtrailer").subarray(6, 13);
  const copied = arrayBuffer(payload);
  assert.equal(copied.byteLength, 7);
  assert.equal(new TextDecoder().decode(copied), "PAYLOAD");
  assert.equal(await fingerprint(payload), await fingerprint(bytes("PAYLOAD")));
  payload.fill(0);
  assert.equal(new TextDecoder().decode(copied), "PAYLOAD");
});
