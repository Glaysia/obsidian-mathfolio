// SPDX-License-Identifier: AGPL-3.0-only
import { App, Modal, Setting, FuzzySuggestModal, TFile, TFolder, type TAbstractFile } from "obsidian";

export class WorksheetPicker extends FuzzySuggestModal<TAbstractFile> {
  constructor(app: App, private readonly choose: (file: TFile) => void,
    private readonly folder: TFolder = app.vault.getRoot()) {
    super(app);
    this.setPlaceholder(`Open worksheet — ${folder.path || "/"}`);
  }
  getItems(): TAbstractFile[] {
    const items = this.folder.children.filter(file => file instanceof TFolder || (file instanceof TFile && /^(mathfolio|mathcraft|mcdx)$/i.test(file.extension)));
    return this.folder.parent ? [this.folder.parent, ...items] : items;
  }
  getItemText(file: TAbstractFile): string {
    return file === this.folder.parent ? "../ (parent folder)" : file instanceof TFolder ? `${file.name}/` : file.name;
  }
  onChooseItem(file: TAbstractFile): void {
    if (file instanceof TFolder) new WorksheetPicker(this.app, this.choose, file).open();
    else if (file instanceof TFile) this.choose(file);
  }
}

export function askPath(app: App, title: string, initial: string): Promise<string | null> {
  return new Promise(resolve => {
    class PathModal extends Modal {
      private submitted = false;
      onOpen(): void {
        this.setTitle(title);
        let value = initial;
        const input = new Setting(this.contentEl).setName("Vault path").addText(text => {
          text.setValue(initial).onChange(next => value = next);
          text.inputEl.addEventListener("keydown", event => { if (event.key === "Enter") submit(); });
          this.contentEl.win.setTimeout(() => { text.inputEl.focus(); text.inputEl.select(); }, 0);
        });
        const submit = () => { if (value.trim()) { this.submitted = true; resolve(value.trim()); this.close(); } };
        new Setting(this.contentEl).addButton(button => button.setButtonText("Cancel").onClick(() => this.close()))
          .addButton(button => button.setButtonText("Create").setCta().onClick(submit));
        void input;
      }
      onClose(): void { if (!this.submitted) resolve(null); this.contentEl.empty(); }
    }
    new PathModal(app).open();
  });
}

export class NoticesModal extends Modal {
  constructor(app: App, private readonly notices: string) { super(app); }
  onOpen(): void {
    this.setTitle("Mathfolio — licenses and source");
    this.contentEl.createEl("pre", { text: this.notices, cls: "mathfolio-notices" });
  }
}
