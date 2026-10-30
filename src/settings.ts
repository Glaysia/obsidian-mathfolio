// SPDX-License-Identifier: AGPL-3.0-only
import type { ThemeMode } from "@mathfolio/wasm-sdk";

export interface MathfolioSettingsData { theme: ThemeMode; autosave: boolean }
export const DEFAULT_SETTINGS: MathfolioSettingsData = { theme: "follow_host", autosave: true };
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function themeMode(value: unknown): ThemeMode {
  return value === "light" || value === "dark" || value === "nord" ? value : "follow_host";
}
export function readSettings(value: unknown): MathfolioSettingsData {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS };
  return { theme: themeMode(value.theme), autosave: typeof value.autosave === "boolean" ? value.autosave : true };
}
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
