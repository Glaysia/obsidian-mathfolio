// SPDX-License-Identifier: AGPL-3.0-only
let cached: Uint8Array | undefined;
export function bundledFont(element: HTMLElement): Uint8Array {
  if (cached) return cached;
  // Font data lives in styles.css so each standard Obsidian install file stays
  // within Sync Standard's file limit. CSS contains font data, never WASM/code.
  const value = element.win.getComputedStyle(element).getPropertyValue("--mathfolio-font-ttf").trim();
  const prefix = '"data:font/ttf;base64,';
  if (!value.startsWith(prefix) || !value.endsWith('"')) throw new Error("Mathfolio font missing; install the matching styles.css");
  cached = Uint8Array.from(atob(value.slice(prefix.length, -1)), char => char.charCodeAt(0));
  return cached;
}
