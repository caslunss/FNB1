const assert=require('node:assert/strict');
(async()=>{
 const p=await import('../src/services/layout-preferences.ts');
 const saved={version:1,palette:'winter-sage',intensity:9,sections:{calendar:false},light:{opacity:95,blur:28},dark:{opacity:40,blur:0,dim:0}};
 let raw=JSON.stringify(saved),fail=false;
 const variables=new Map();
 global.window={planAuth:{ready:Promise.resolve(),key:key=>key,storage:{getItem:()=>raw,setItem:(_key,value)=>{if(fail)throw Error('quota');raw=value}}},addEventListener(){}};
 global.document={documentElement:{dataset:{theme:'light'},style:{setProperty:(key,value)=>variables.set(key,value)}}};
 global.MutationObserver=class{observe(){}};
 await p.initializeLayout();
 const effective=p.getLayout();
 assert.equal(effective.intensity,3);assert.equal(effective.light.opacity,66);assert.equal(effective.light.blur,6);assert.equal(effective.dark.opacity,64);assert.equal(effective.dark.blur,16);assert.equal(effective.dark.dim,70);
 assert.equal(raw,JSON.stringify(saved),'initialization leaves the stored record untouched');
 for(const theme of ['light','dark']){
  const expected=p.layoutTokens(p.normalizeLayout({version:1,palette:saved.palette}),theme);
  assert.deepEqual(p.layoutTokens(effective,theme),expected,'effective material equals existing defaults for the selected palette');
 }
 p.selectPalette('autumn-sand');
 const stored=JSON.parse(raw);assert.equal(stored.intensity,9);assert.deepEqual(stored.light,{...p.getLayout().light,...saved.light});assert.deepEqual(stored.dark,{...p.getLayout().dark,...saved.dark});assert.equal(stored.sections.calendar,false);
 assert.equal(p.getLayout().light.opacity,66);assert.equal(p.getLayout().dark.dim,70);
 fail=true;const before=p.getLayout();assert.throws(()=>p.selectPalette('winter-mist'));assert.equal(p.getLayout(),before);fail=false;
 p.resetLayout('dark');assert.equal(JSON.parse(raw).dark.dim,0);assert.equal(p.getLayout().dark.dim,70);
 console.log('PASS fixed glass: default effective tokens, custom saved values retained across palette/reset, failed writes preserve active state');
})().catch(error=>{console.error(error);process.exitCode=1});
