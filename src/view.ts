// SPDX-License-Identifier: AGPL-3.0-only
import { EditableFileView, TFile, WorkspaceLeaf, Notice, Scope } from "obsidian";
import { MathfolioEditor, type Command, type HostRequest, type SessionState } from "@mathfolio/wasm-sdk";
import { wasm, font } from "mathfolio:assets";
import type MathfolioPlugin from "./main";
import { arrayBuffer, fingerprint, writeSnapshot } from "./save";
import { hostTheme } from "./theme";
import { askPath } from "./modals";

export const VIEW_TYPE = "mathfolio";

export class MathfolioView extends EditableFileView {
  editor?: MathfolioEditor;
  private canvas?: HTMLCanvasElement;
  private status?: HTMLElement;
  private expected = "";
  private loadedFile?: TFile;
  private timer?: ReturnType<typeof setTimeout>;
  private lastRevision = -1;
  private closing?: Promise<void>;
  private saveQueue: Promise<void> = Promise.resolve();
  private mounted?: Promise<void>;
  private generation = 0;
  private conflict = false;
  private saving = false;
  private lastRecoveryRevision = -1;

  constructor(leaf: WorkspaceLeaf, readonly plugin: MathfolioPlugin) {
    super(leaf);
    this.scope = new Scope(this.app.scope);
    this.scope.register(null, null, event => {
      // Returning true stops host command lookup without preventing the DOM event.
      // eframe can then receive Ctrl+T, undo/redo and its existing editing keys.
      const target = event.target;
      if (target instanceof HTMLElement && (this.contentEl.contains(target) || target.dataset.mathfolioInput === "true")) return true;
    });
  }
  getViewType(): string { return VIEW_TYPE; }
  getIcon(): string { return "square-function"; }
  canAcceptExtension(extension: string): boolean { return /^(mathfolio|mathcraft|mcdx)$/i.test(extension); }

  async onOpen(): Promise<void> {
    this.plugin.views.add(this);
    this.contentEl.empty();
    this.contentEl.addClass("mathfolio-view");
    const bar = this.contentEl.createDiv({ cls: "mathfolio-host-bar" });
    for (const [label, action] of [
      ["Save", () => this.save()], ["Save copy", () => this.saveCopy()],
      ["Calculate", async () => this.command("calculate_worksheet")],
      ["Stop", async () => this.command("stop")], ["PDF", () => this.exportPdf()],
    ] as const) bar.createEl("button", { text: label }).addEventListener("click", () => this.plugin.run(action));
    this.status = bar.createSpan({ cls: "mathfolio-host-status", text: "Loading Mathfolio…" });
    const stage = this.contentEl.createDiv({ cls: "mathfolio-stage" });
    this.canvas = stage.createEl("canvas", { cls: "mathfolio-canvas", attr: { tabindex: "0", "aria-label": "Mathfolio worksheet editor" } });
    this.registerDomEvent(this.canvas, "keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault(); event.stopPropagation();
        this.plugin.run(() => event.shiftKey ? this.saveCopy() : this.save());
      }
      if (event.key === "F5") { event.preventDefault(); event.stopPropagation(); this.command(event.ctrlKey ? "calculate_worksheet" : "calculate_now"); }
    }, { capture: true });
    this.registerDomEvent(this.contentEl.ownerDocument.defaultView!, "beforeunload", event => {
      if (this.editor?.state().dirty) { event.preventDefault(); event.returnValue = "Mathfolio has unsaved changes."; }
    });
    const observer = new ResizeObserver(() => this.updateActive());
    observer.observe(stage);
    this.register(() => observer.disconnect());
  }

  private async mount(): Promise<void> {
    this.mounted ??= (async () => {
      if (!this.canvas) throw new Error("Mathfolio view is not open");
      const editor = await MathfolioEditor.mount({ canvas: this.canvas, wasm: arrayBuffer(wasm),
        workerUrl: this.plugin.workerUrl, fonts: [{ name: "Nanum Gothic", bytes: font }] });
      if (this.closing) { editor.dispose(); return; }
      this.editor = editor;
      this.applyTheme();
      editor.subscribe(state => this.stateChanged(state));
      editor.onRequest(request => this.plugin.run(() => this.request(request)));
      this.updateActive();
    })();
    await this.mounted;
  }

  async onLoadFile(file: TFile): Promise<void> {
    if (this.editor?.state().dirty) await this.saveOrRecover();
    const generation = ++this.generation;
    try {
      const bytes = await this.app.vault.readBinary(file);
      await this.mount();
      if (this.closing || generation !== this.generation || !this.editor) return;
      const expected = await fingerprint(bytes);
      // A rejected load keeps the previous SDK document; keep its write target as well.
      this.editor.loadDocument(file.name, new Uint8Array(bytes), true);
      this.expected = expected;
      this.loadedFile = file;
      this.lastRecoveryRevision = -1;
      this.conflict = false;
      this.lastRevision = -1;
      this.stateChanged(this.editor.state());
    } catch (error) {
      if (this.status) this.status.textContent = `Could not open: ${String(error)}`;
      throw error;
    }
  }

  private stateChanged(state: SessionState): void {
    if (this.closing) return;
    if (this.status) this.status.textContent = this.conflict ? "External change — save a copy" :
      state.calculating ? "Calculating…" : state.dirty ? "Unsaved changes" : "Saved";
    this.contentEl.toggleClass("mathfolio-dirty", state.dirty);
    if (state.dirty && state.revision !== this.lastRevision) {
      this.lastRevision = state.revision;
      clearTimeout(this.timer);
      if (this.plugin.settings.autosave && !this.conflict) this.timer = setTimeout(() => this.plugin.run(() => this.save(false)), 900);
    }
  }

  save(force = true): Promise<void> {
    clearTimeout(this.timer);
    const next = this.saveQueue.catch(() => {}).then(async () => {
      const editor = this.editor;
      const file = this.loadedFile;
      if (!editor || !file || (!force && !editor.state().dirty)) return;
      // prepareSave commits active editor drafts before collecting a snapshot.
      const packet = editor.prepareSave(file.name);
      this.saving = true;
      try {
        this.expected = await this.plugin.exclusive(file.path, () => writeSnapshot({
          read: () => this.app.vault.readBinary(file),
          write: bytes => this.app.vault.modifyBinary(file, bytes),
        }, this.expected, packet.bytes));
        editor.acknowledgeSave(packet.id, true);
        this.conflict = false;
      } catch (error) {
        editor.acknowledgeSave(packet.id, false);
        this.conflict = true;
        await this.recoverIfDirty();
        throw error;
      } finally {
        this.saving = false;
        this.stateChanged(editor.state());
      }
    });
    this.saveQueue = next;
    return next;
  }

  async saveCopy(): Promise<void> {
    const editor = this.editor;
    if (!editor || !this.file) return;
    const path = await askPath(this.app, "Save worksheet copy", this.file.path.replace(/\.[^.]+$/, " copy.mathfolio"));
    if (!path) return;
    const bytes = editor.exportDocument("mathfolio");
    const file = await this.plugin.createFile(path.endsWith(".mathfolio") ? path : path + ".mathfolio", bytes);
    new Notice(`Saved copy: ${file.path}`);
    await this.plugin.openFile(file);
  }

  async exportPdf(): Promise<void> {
    if (!this.editor || !this.file) return;
    const path = await askPath(this.app, "Export PDF", this.file.path.replace(/\.[^.]+$/, ".pdf"));
    if (path) {
      const file = await this.plugin.createFile(path.endsWith(".pdf") ? path : path + ".pdf", this.editor.exportPdf());
      new Notice(`Exported: ${file.path}`);
    }
  }

  command(command: Command): void { this.editor?.command(command); }

  private async request(request: HostRequest): Promise<void> {
    switch (request.kind) {
      case "open": this.plugin.pickWorksheet(); break;
      case "save": await this.save(); break;
      case "save_as": await this.saveCopy(); break;
      case "pdf": case "print": await this.exportPdf(); break;
      case "close": await this.saveOrRecover(); this.leaf.detach(); break;
      case "export_mcdx": {
        if (!this.editor || !this.file) return;
        const path = await askPath(this.app, "Export MCDX", this.file.path.replace(/\.[^.]+$/, " export.mcdx"));
        if (path) await this.plugin.createFile(path.endsWith(".mcdx") ? path : path + ".mcdx", this.editor.exportDocument("mcdx"));
        break;
      }
    }
  }

  externalChanged(): void {
    if (!this.editor || this.saving || this.closing || !this.file) return;
    if (this.editor.state().dirty) { this.conflict = true; this.stateChanged(this.editor.state()); }
    else this.plugin.run(() => this.onLoadFile(this.file!));
  }

  applyTheme(): void {
    if (!this.editor || this.closing) return;
    this.editor.setThemeMode(this.plugin.settings.theme);
    if (this.plugin.settings.theme === "follow_host") this.editor.setTheme(hostTheme(this.contentEl));
  }
  updateActive(): void { if (this.editor && !this.closing) this.editor.setActive(this.contentEl.isShown()); }

  private async recoverIfDirty(): Promise<void> {
    if (!this.editor?.state().dirty) return;
    const revision = this.editor.state().revision;
    if (revision === this.lastRecoveryRevision) return;
    const bytes = this.editor.exportDocument("mathfolio");
    const path = await this.plugin.recover(this.file?.name ?? "worksheet", bytes);
    this.lastRecoveryRevision = revision;
    new Notice(`Mathfolio kept an unsaved recovery copy: ${path}`, 12000);
  }
  private async saveOrRecover(): Promise<void> {
    try { await this.save(false); } catch (error) {
      await this.recoverIfDirty();
      console.error("Mathfolio save failed; recovery retained", error);
    }
  }
  async onUnloadFile(): Promise<void> { clearTimeout(this.timer); await this.saveOrRecover(); }
  async onClose(): Promise<void> { await this.finish(); }
  finish(): Promise<void> {
    if (this.closing) return this.closing;
    clearTimeout(this.timer);
    this.closing = (async () => {
      await this.mounted?.catch(() => {});
      await this.saveOrRecover();
      this.editor?.dispose();
      this.editor = undefined;
      this.plugin.views.delete(this);
      this.contentEl.empty();
    })();
    return this.closing;
  }
}
