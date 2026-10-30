// SPDX-License-Identifier: AGPL-3.0-only
let cached: Uint8Array | undefined;
export function bundledFont(element: HTMLElement): Uint8Array {
  if (cached) return cached;
  // Font data lives in styles.css so each standard Obsidian install file stays
  // within Sync Standard's file limit. CSS contains font data, never WASM/code.
  const style = element.win.getComputedStyle(element);
  const count = Number(style.getPropertyValue("--mathfolio-font-parts").trim());
  if (!Number.isSafeInteger(count) || count < 1 || count > 16) throw new Error("Mathfolio font missing; install the matching styles.css");
  const parts: string[] = [];
  for (let i = 0; i < count; i++) {
    const value = style.getPropertyValue(`--mathfolio-font-${i}`).trim();
    if (!value.startsWith('"') || !value.endsWith('"')) throw new Error("Mathfolio font data is incomplete");
    parts.push(value.slice(1, -1));
  }
  cached = Uint8Array.from(atob(parts.join("")), char => char.charCodeAt(0));
  return cached;
}
