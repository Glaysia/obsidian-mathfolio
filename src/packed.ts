// SPDX-License-Identifier: AGPL-3.0-only
import { decode91 } from "./encoding";

export interface PackedAssets { wasm: Uint8Array; font: Uint8Array; notices: string }
const LIMIT = 32 * 1024 * 1024;

export function unpack(bytes: Uint8Array): PackedAssets {
  if (bytes.length < 12 || bytes.length > LIMIT) throw new Error("Invalid Mathfolio asset size");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== 0x3841464d) throw new Error("Unsupported Mathfolio asset package");
  const endWasm = 12 + view.getUint32(4, true);
  const endFont = endWasm + view.getUint32(8, true);
  if (endWasm < 20 || endFont <= endWasm || endFont > bytes.length) throw new Error("Truncated Mathfolio asset package");
  const wasm = bytes.subarray(12, endWasm);
  if (wasm[0] !== 0 || wasm[1] !== 97 || wasm[2] !== 115 || wasm[3] !== 109) throw new Error("Invalid Mathfolio WASM header");
  return { wasm, font: bytes.subarray(endWasm, endFont),
    notices: new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(endFont)) };
}

export async function inflateAssets(encoded: string): Promise<PackedAssets> {
  if (encoded.length > 12_000_000) throw new Error("Mathfolio asset transport exceeds the size limit");
  if (typeof DecompressionStream === "undefined") throw new Error("This browser does not support packaged Mathfolio assets");
  const compressed = decode91(encoded);
  const stream = new Blob([new Uint8Array(compressed).buffer]).stream().pipeThrough(new DecompressionStream("gzip"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > LIMIT) throw new Error("Mathfolio assets exceed the size limit");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return unpack(bytes);
}
