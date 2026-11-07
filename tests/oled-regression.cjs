const assert=require('node:assert/strict');
(async()=>{
 const p=await import('../src/services/layout-preferences.ts');
 assert.equal(p.normalizeLayout().dark.oled,false);
 assert.equal(p.normalizeLayout({version:1,dark:{oled:'true'}}).dark.oled,false);
 const standard=p.layoutTokens(p.DEFAULT_LAYOUT,'light');
 for(const palette of p.PALETTES){const saved={...p.DEFAULT_LAYOUT,palette:palette.id,dark:{...p.DEFAULT_LAYOUT.dark,oled:true}},before=JSON.stringify(saved),tokens=p.layoutTokens(saved,'dark');
  assert.equal(tokens['--bg'],'#000000');assert.equal(tokens['--card'],'#202022');assert.equal(tokens['--content-panel-fill'],'rgb(32 32 34 / 1)');
  for(const key of ['--lb','--layout-card-text','--layout-card-accent'])assert(p.contrast(tokens[key],key==='--lb'?'#000000':'#202022')>=4.5);
  assert.equal(JSON.stringify(saved),before,'OLED must not rewrite palette data');
  const light=p.layoutTokens(saved,'light'),normal=p.layoutTokens({...saved,dark:{...saved.dark,oled:false}},'light');assert.deepEqual(light,normal,'OLED must be inactive in light mode');
 }
 assert.equal(p.layoutTokens({...p.DEFAULT_LAYOUT,dark:{...p.DEFAULT_LAYOUT.dark,oled:true}},'light')['--bg'],standard['--bg']);
 const data={};let fail=false;
 global.window={planAuth:{ready:Promise.resolve(),key:k=>k,storage:{getItem:k=>data[k]||null,setItem:(k,v)=>{if(fail)throw Error('quota');data[k]=v}}},addEventListener(){}};
 global.document={documentElement:{dataset:{theme:'dark'},style:{setProperty(){}}}};global.MutationObserver=class{observe(){}};
 await p.initializeLayout();p.setOledMode(true);assert.equal(JSON.parse(data.plan12layout_v1).dark.oled,true);assert.equal(document.documentElement.dataset.oled,'true');
 p.selectPalette('winter-mist');assert.equal(p.getLayout().dark.oled,true,'Palette changes retain OLED preference');
 fail=true;assert.throws(()=>p.setOledMode(false));assert.equal(p.getLayout().dark.oled,true,'Failed save does not change live state');fail=false;
 p.resetLayout('dark');assert.equal(p.getLayout().dark.oled,false);assert.equal(document.documentElement.dataset.oled,'false');
 console.log('PASS OLED: opt-in normalization, pure black, opaque gray cards, all-palette contrast, unchanged light mode, persistence, rollback and reset');
})().catch(error=>{console.error(error);process.exitCode=1});
