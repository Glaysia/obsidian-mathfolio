// SPDX-License-Identifier: AGPL-3.0-only
// Printable basE91 transport for packaged, compressed binary assets. This is
// encoding, not encryption; no JavaScript is evaluated by this module.
export const ALPHABET = Array.from({ length: 94 }, (_, index) => String.fromCharCode(33 + index))
  .filter(char => char !== '"' && char !== "\\").slice(0, 91).join("");

export function encode91(bytes: Uint8Array): string {
  const chunks: string[] = [];
  let buffer = 0, bits = 0, chunk = "";
  for (const byte of bytes) {
    buffer |= byte << bits; bits += 8;
    if (bits > 13) {
      let value = buffer & 8191;
      if (value > 88) { buffer >>>= 13; bits -= 13; }
      else { value = buffer & 16383; buffer >>>= 14; bits -= 14; }
      chunk += ALPHABET[value % 91] + ALPHABET[Math.floor(value / 91)];
      if (chunk.length >= 8192) { chunks.push(chunk); chunk = ""; }
    }
  }
  if (bits) {
    chunk += ALPHABET[buffer % 91];
    if (bits > 7 || buffer > 90) chunk += ALPHABET[Math.floor(buffer / 91)];
  }
  chunks.push(chunk);
  return chunks.join("");
}

export function decode91(text: string): Uint8Array {
  const table = new Int16Array(128).fill(-1);
  for (let i = 0; i < ALPHABET.length; i++) table[ALPHABET.charCodeAt(i)] = i;
  const bytes = new Uint8Array(Math.ceil(text.length * 7 / 8) + 1);
  let buffer = 0, bits = 0, value = -1, count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const digit = code < 128 ? table[code] : -1;
    if (digit < 0) throw new Error("Invalid packaged asset encoding");
    if (value < 0) value = digit;
    else {
      value += digit * 91;
      buffer |= value << bits;
      bits += (value & 8191) > 88 ? 13 : 14;
      do { bytes[count++] = buffer & 255; buffer >>>= 8; bits -= 8; } while (bits > 7);
      value = -1;
    }
  }
  if (value >= 0) bytes[count++] = (buffer | value << bits) & 255;
  return bytes.subarray(0, count);
}
