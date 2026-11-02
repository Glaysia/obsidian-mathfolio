// SPDX-License-Identifier: AGPL-3.0-only
import { packedPrefix, workerSource } from "mathfolio:assets";
import { inflateAssets, type PackedAssets } from "./packed";
export { workerSource };
export type { PackedAssets };

export function readAssetText(element: HTMLElement): string {
  const style = element.win.getComputedStyle(element);
  const count = Number(style.getPropertyValue("--mathfolio-asset-parts").trim());
  if (!Number.isSafeInteger(count) || count < 1 || count > 32) throw new Error("Mathfolio assets missing; install the matching styles.css");
  const parts = [packedPrefix];
  for (let i = 0; i < count; i++) {
    const value = style.getPropertyValue(`--mathfolio-asset-${i}`).trim();
    if (!value.startsWith('"') || !value.endsWith('"')) throw new Error("Mathfolio asset data is incomplete");
    parts.push(value.slice(1, -1));
  }
  return parts.join("");
}
export function loadAssets(element: HTMLElement): Promise<PackedAssets> {
  return inflateAssets(readAssetText(element));
}
