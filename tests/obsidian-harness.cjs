// Test-only Obsidian plugin. Install only in a disposable Vault named QA.
const { Plugin } = require('obsidian');
const sleep = ms => new Promise(resolve => window.setTimeout(resolve,ms));
async function until(predicate,label) {
  const end=Date.now()+45000;
  while(!predicate()){if(Date.now()>end)throw new Error('Timeout: '+label);await sleep(30)}
}
module.exports = class MathfolioQA extends Plugin {
  onload(){
    if(this.app.vault.getName()!=='QA')return;
    this.app.workspace.onLayoutReady(()=>{void this.verify()});
  }
  async verify(){
    const checks=[];
    const check=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name)};
    const report={started:new Date().toISOString(),checks};
    let settings;
    try{
      await until(()=>this.app.plugins.plugins.mathfolio,'plugin registered');
      const plugin=this.app.plugins.plugins.mathfolio;
      report.version=plugin.manifest.version;
      const tab=this.app.setting.pluginTabs.find(t=>t.id==='mathfolio');
      settings={...plugin.settings};
      check(tab.getSettingDefinitions().length===3,'searchable settings');
      await tab.setControlValue('autosave',false);
      await tab.setControlValue('theme','nord');
      check(plugin.settings.theme==='nord','theme settings applied');
      await tab.setControlValue('theme','follow_host');
      const fixture=JSON.parse(await this.app.vault.read(this.app.vault.getAbstractFileByPath('QA.mathfolio')));
      const number=n=>({kind:{Number:String(n)},children:[]});
      fixture.title='Integration';fixture.next_id=2;
      fixture.regions=[{id:1,left:38,top:38,content:{Math:{kind:{Binary:'Evaluate'},children:[{kind:{Binary:'Add'},children:[number(2),number(3)]},{kind:'Placeholder',children:[]}]}},source_region:null}];
      fixture.calculation_cache=null;
      const path='Integration-'+Date.now()+'.mathfolio';
      const file=await plugin.createFile(path,new TextEncoder().encode(JSON.stringify(fixture)));
      await plugin.openFile(file);
      const view=()=>[...plugin.views].find(v=>v.file?.path===path&&v.editor);
      await until(()=>!!view(),'WASM view mount');
      let v=view();
      check(v.editor.state().worker_count===0,'open does not calculate');
      v.command('calculate_worksheet');
      await until(()=>!v.editor.state().calculating&&v.editor.state().worker_count===1,'calculation Worker');
      check(v.editor.inspectResults().get(1)?.value?.quantity?.value?.[0]===5,'real Worker computes 2+3=5');
      await v.save();
      check(!v.editor.state().dirty,'save acknowledged after Vault write');
      const saved=JSON.parse(await this.app.vault.read(file));
      check(saved.calculation_cache.rows.some(r=>r.numeric_source?.data.includes('[5.0,0.0]')),'calculation cache saved');
      const pdf=v.editor.exportPdf();
      check(new TextDecoder().decode(pdf.subarray(0,5))==='%PDF-','PDF bytes generated');
      report.pdfBytes=pdf.length;
      await plugin.createFile(path.replace('.mathfolio','.pdf'),pdf);
      const leaf=v.leaf;
      await leaf.setViewState({type:'empty'});
      await leaf.openFile(file);
      await until(()=>!!view(),'reopened editor');
      v=view();
      check(v.editor.state().worker_count===0,'reopen starts no Worker');
      check(JSON.parse(v.editor.inspectDocument()).calculation_cache.rows.some(r=>r.numeric_source?.data.includes('[5.0,0.0]')),'cached result preserved after reopen');
      await this.app.workspace.revealLeaf(v.leaf);
      v.updateActive();
      const canvas=v.contentEl.querySelector('canvas');
      await until(()=>canvas.getBoundingClientRect().width>0,'visible canvas');
      canvas.focus();
      for(const [key,code,ctrlKey] of [['a','KeyA',true],['Delete','Delete',false]]){
        for(const type of ['keydown','keyup'])canvas.dispatchEvent(new KeyboardEvent(type,{key,code,ctrlKey,bubbles:true,cancelable:true}));
        await sleep(150);
      }
      await until(()=>v.editor.state().dirty,'DOM selection and deletion');
      check(v.editor.state().regions===0,'Ctrl+A and Delete reach the Rust editor');
      const external=JSON.stringify({...JSON.parse(await this.app.vault.read(file)),title:'External edit'});
      await this.app.vault.modifyBinary(file,new TextEncoder().encode(external).buffer);
      let conflict=false;try{await v.save()}catch(error){conflict=/File changed outside/.test(error.message)}
      check(conflict,'external edit causes SaveConflict');
      check(await this.app.vault.read(file)===external,'external content preserved');
      const recovery=this.app.vault.getAbstractFileByPath('Mathfolio Recovery');
      check(recovery?.children?.some(f=>f.extension==='mathfolio'),'unsaved recovery copy written');
      report.ok=true;
    }catch(error){report.ok=false;report.error=String(error);report.stack=error.stack;console.error('Mathfolio QA',error)}
    finally{
      const plugin=this.app.plugins.plugins.mathfolio;
      if(settings&&plugin){plugin.settings=settings;await plugin.saveData(settings)}
      report.finished=new Date().toISOString();
      const json=JSON.stringify(report,null,2);
      const old=this.app.vault.getAbstractFileByPath('QA-report.json');
      if(old)await this.app.vault.modify(old,json);else await this.app.vault.create('QA-report.json',json);
      const text='# Mathfolio '+report.version+' integration QA\n\n'+(report.ok?'PASS':'FAIL: '+report.error)+'\n\n'+checks.map(c=>'- [x] '+c).join('\n')+'\n\n'+report.finished+'\n';
      let summary=this.app.vault.getAbstractFileByPath('QA-report.md');
      if(summary)await this.app.vault.modify(summary,text);else summary=await this.app.vault.create('QA-report.md',text);
      await this.app.workspace.getLeaf('tab').openFile(summary);
    }
  }
};
