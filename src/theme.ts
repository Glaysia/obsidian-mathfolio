// SPDX-License-Identifier: AGPL-3.0-only
import type { HostTheme, RGBA } from "@mathfolio/wasm-sdk";

export function hostTheme(element: HTMLElement): HostTheme {
  const doc = element.ownerDocument;
  const dark = doc.body.classList.contains("theme-dark");
  const style = doc.defaultView!.getComputedStyle(doc.body);
  const color = (variable: string, fallback: string): RGBA => {
    const probe = doc.createElement("span");
    probe.style.color = style.getPropertyValue(variable).trim() || fallback;
    element.append(probe);
    const resolved = doc.defaultView!.getComputedStyle(probe).color;
    probe.remove();
    // Canvas resolves modern CSS color spaces and composites alpha to integer sRGB bytes.
    const canvas = doc.createElement("canvas");
    canvas.width = canvas.height = 1;
    const context = canvas.getContext("2d")!;
    context.fillStyle = dark ? "#1e1e1e" : "#ffffff";
    context.fillRect(0, 0, 1, 1);
    context.fillStyle = resolved;
    context.fillRect(0, 0, 1, 1);
    const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
    return [r, g, b, 255];
  };
  return {
    dark, high_contrast: false,
    workspace: color("--background-primary", dark ? "#1e1e1e" : "#ffffff"),
    panel: color("--background-secondary", dark ? "#262626" : "#f5f5f5"),
    surface: color("--background-primary-alt", dark ? "#303030" : "#eeeeee"),
    border: color("--background-modifier-border", "#808080"),
    text: color("--text-normal", dark ? "#eeeeee" : "#222222"),
    muted_text: color("--text-muted", "#888888"),
    accent: color("--interactive-accent", "#7f6df2"),
    button: color("--interactive-accent", "#7f6df2"),
    button_text: color("--text-on-accent", "#ffffff"),
    hover: color("--background-modifier-hover", dark ? "#444444" : "#eeeeee"),
    selection: color("--text-selection", "#6860a0"),
    selection_text: color("--text-normal", dark ? "#eeeeee" : "#222222"),
    focus: color("--interactive-accent", "#7f6df2"),
    error: color("--text-error", "#d85050"),
    warning: color("--text-warning", "#d9a346"),
    font_size: Number.parseFloat(style.getPropertyValue("--font-ui-small")) || 14,
    corner_radius: Number.parseFloat(style.getPropertyValue("--radius-s")) || 4,
  };
}
