// SPDX-License-Identifier: AGPL-3.0-only
export function arrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer as ArrayBuffer;
}

export async function fingerprint(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const data = bytes instanceof Uint8Array ? arrayBuffer(bytes) : bytes;
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", data)),
    byte => byte.toString(16).padStart(2, "0")).join("");
}

export class SaveConflict extends Error {
  constructor() { super("File changed outside this view. Save a copy to keep both versions."); }
}

export interface SaveIO {
  read(): Promise<ArrayBuffer>;
  write(bytes: ArrayBuffer): Promise<void>;
}

// The caller serializes writes per Vault file and keeps the SDK alive until this resolves.
export async function writeSnapshot(io: SaveIO, expected: string, bytes: Uint8Array): Promise<string> {
  if (await fingerprint(await io.read()) !== expected) throw new SaveConflict();
  const next = await fingerprint(bytes);
  await io.write(arrayBuffer(bytes));
  return next;
}
