// SPDX-License-Identifier: AGPL-3.0-only
import { App, Modal, Setting, FuzzySuggestModal, TFile } from "obsidian";

export class WorksheetPicker extends FuzzySuggestModal<TFile> {
  constructor(app: App, private readonly choose: (file: TFile) => void) {
    super(app);
    this.setPlaceholder("Open a Mathfolio worksheet");
  }
  getItems(): TFile[] { return this.app.vault.getFiles().filter(file => /^(mathfolio|mathcraft|mcdx)$/i.test(file.extension)); }
  getItemText(file: TFile): string { return file.path; }
  onChooseItem(file: TFile): void { this.choose(file); }
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
          setTimeout(() => { text.inputEl.focus(); text.inputEl.select(); }, 0);
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
