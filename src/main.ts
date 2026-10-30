// SPDX-License-Identifier: AGPL-3.0-only
import { Plugin, TFile, normalizePath, PluginSettingTab, Notice, type SettingDefinitionItem } from "obsidian";
import { DEFAULT_SETTINGS, readSettings, themeMode, errorMessage, type MathfolioSettingsData } from "./settings";
import { wasm, workerSource, notices } from "mathfolio:assets";
import { MathfolioView, VIEW_TYPE } from "./view";
import { WorksheetPicker, askPath, NoticesModal } from "./modals";
import { arrayBuffer } from "./save";

// Empty native document template from Mathfolio CanvasDocument::default; no TS math model.
const EMPTY = new TextEncoder().encode(JSON.stringify({ version: 2, title: "Untitled worksheet",
  width: 793.7007874015748, height: 1122.51968503937, grid: 18.89763779527559,
  next_id: 1, regions: [], native_archive: null }));

export default class MathfolioPlugin extends Plugin {
  settings: MathfolioSettingsData = { ...DEFAULT_SETTINGS };
  workerUrl = "";
  private wasmUrl = "";
  private readonly writes = new Map<string, Promise<unknown>>();
  readonly views = new Set<MathfolioView>();

  async onload(): Promise<void> {
    const stored: unknown = await this.loadData();
    this.settings = readSettings(stored);
    this.wasmUrl = URL.createObjectURL(new Blob([arrayBuffer(wasm)], { type: "application/wasm" }));
    this.workerUrl = URL.createObjectURL(new Blob([
      `const MATHFOLIO_WASM_URL = ${JSON.stringify(this.wasmUrl)};\n`, workerSource,
    ], { type: "text/javascript" }));
    this.registerView(VIEW_TYPE, leaf => new MathfolioView(leaf, this));
    this.registerExtensions(["mathfolio", "mathcraft", "mcdx"], VIEW_TYPE);
    this.addRibbonIcon("square-function", "Create Mathfolio worksheet", () => this.run(() => this.createWorksheet()));
    this.addCommand({ id: "new-worksheet", name: "Create worksheet", callback: () => this.run(() => this.createWorksheet()) });
    this.addCommand({ id: "open-worksheet", name: "Open worksheet", callback: () => this.pickWorksheet() });
    this.addCommand({ id: "show-licenses", name: "Show licenses and source", callback: () => new NoticesModal(this.app, notices).open() });
    this.addCommand({ id: "recover-worksheet", name: "Open recovery folder", callback: () => this.run(() => this.showRecovery()) });
    for (const [id, name, action] of [
      ["save-worksheet", "Save worksheet", (view: MathfolioView) => view.save()],
      ["save-copy", "Save worksheet as a copy", (view: MathfolioView) => view.saveCopy()],
      ["calculate-worksheet", "Calculate worksheet", (view: MathfolioView) => view.command("calculate_worksheet")],
      ["stop-calculation", "Stop calculation", (view: MathfolioView) => view.command("stop")],
      ["export-pdf", "Export worksheet to PDF", (view: MathfolioView) => view.exportPdf()],
    ] as const) {
      this.addCommand({ id, name, checkCallback: checking => {
        const view = this.app.workspace.getActiveViewOfType(MathfolioView);
        if (!view) return false;
        if (!checking) this.run(async () => { await action(view); });
        return true;
      } });
    }
    this.registerEvent(this.app.workspace.on("css-change", () => this.views.forEach(view => view.applyTheme())));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.views.forEach(view => view.updateActive())));
    this.registerEvent(this.app.vault.on("modify", file => {
      if (file instanceof TFile) this.views.forEach(view => { if (view.file === file) view.externalChanged(); });
    }));
    this.addSettingTab(new MathfolioSettings(this));
  }

  run(action: () => Promise<unknown>): void {
    void action().catch(error => { console.error("Mathfolio", error); new Notice(`Mathfolio: ${errorMessage(error)}`, 9000); });
  }

  async exclusive<T>(path: string, action: () => Promise<T>): Promise<T> {
    const previous = this.writes.get(path) ?? Promise.resolve();
    const next = previous.catch(() => {}).then(action);
    this.writes.set(path, next);
    try { return await next; } finally { if (this.writes.get(path) === next) this.writes.delete(path); }
  }

  pickWorksheet(): void { new WorksheetPicker(this.app, file => this.run(() => this.openFile(file))).open(); }
  async openFile(file: TFile): Promise<void> { await this.app.workspace.getLeaf("tab").openFile(file, { active: true }); }

  async createWorksheet(): Promise<void> {
    const folder = this.app.fileManager.getNewFileParent(this.app.workspace.getActiveFile()?.path ?? "");
    const path = await askPath(this.app, "Create Mathfolio worksheet", `${folder.path ? folder.path + "/" : ""}Untitled.mathfolio`);
    if (!path) return;
    await this.openFile(await this.createFile(path.endsWith(".mathfolio") ? path : path + ".mathfolio", EMPTY));
  }

  async createFile(input: string, bytes: Uint8Array): Promise<TFile> {
    const path = normalizePath(input);
    if (!path || input.startsWith("/") || input.includes("\\") || path.split("/").some(part => part === ".." || part.startsWith("."))) {
      throw new Error("Choose a visible relative path inside the Vault.");
    }
    const parent = path.slice(0, path.lastIndexOf("/"));
    if (path.includes("/") && !this.app.vault.getAbstractFileByPath(parent)) await this.app.vault.createFolder(parent);
    return this.app.vault.createBinary(path, arrayBuffer(bytes));
  }

  async recover(original: string, bytes: Uint8Array): Promise<string> {
    const folder = "Mathfolio Recovery";
    const filename = original.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "worksheet";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const file = await this.createFile(`${folder}/${filename}-${stamp}-${crypto.randomUUID().slice(0, 6)}.mathfolio`, bytes);
    return file.path;
  }

  async showRecovery(): Promise<void> {
    const files = this.app.vault.getFiles().filter(file => file.path.startsWith("Mathfolio Recovery/"));
    if (!files.length) { new Notice("No Mathfolio recovery copies."); return; }
    files.sort((a, b) => b.stat.mtime - a.stat.mtime);
    await this.openFile(files[0]);
  }

  onunload(): void {
    // Component unload is synchronous; keep the sessions alive for their final asynchronous save/recovery.
    const closing = [...this.views].map(view => view.finish());
    void Promise.allSettled(closing).then(() => { URL.revokeObjectURL(this.workerUrl); URL.revokeObjectURL(this.wasmUrl); });
  }
}

class MathfolioSettings extends PluginSettingTab {
  constructor(private readonly plugin: MathfolioPlugin) { super(plugin.app, plugin); }
  getSettingDefinitions(): SettingDefinitionItem[] {
    return [
      { name: "Theme", control: { type: "dropdown", key: "theme", defaultValue: "follow_host",
        options: { follow_host: "Follow Obsidian", light: "Light", dark: "Dark", nord: "Nord" } } },
      { name: "Auto-save", desc: "Save after editing pauses. External changes are kept as conflicts.",
        control: { type: "toggle", key: "autosave", defaultValue: true } },
      { name: "Licenses and source", action: () => new NoticesModal(this.app, notices).open() },
    ];
  }
  async setControlValue(key: string, value: unknown): Promise<void> {
    if (key === "theme") this.plugin.settings.theme = themeMode(value);
    else if (key === "autosave" && typeof value === "boolean") this.plugin.settings.autosave = value;
    else return;
    await this.plugin.saveData(this.plugin.settings);
    if (key === "theme") this.plugin.views.forEach(view => view.applyTheme());
  }
}
