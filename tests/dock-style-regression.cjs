const assert=require('node:assert/strict');
(async()=>{
 const p=await import('../src/services/layout-preferences.ts');
 for(const value of ['pinned','default','mini'])assert.equal(p.normalizeDockStyle(value),value);
 for(const value of [null,false,0,{},[], 'unknown','Mini'])assert.equal(p.normalizeDockStyle(value),'default');
 assert.equal(p.normalizeDockStyle(undefined,'Mini'),'mini');assert.equal(p.normalizeDockStyle(undefined,'mini'),'mini');
 assert.equal(p.normalizeDockStyle(undefined,'Default'),'default');assert.equal(p.normalizeDockStyle('invalid','mini'),'default');
 assert.equal(p.normalizeLayout({version:1,dockSize:'Mini'}).dockStyle,'mini');
 assert.equal(p.normalizeLayout({version:1}).dockStyle,'default');
 let raw=JSON.stringify({version:1,dockSize:'Mini',sections:{calendar:false}}),fail=false,storageEvent;
 global.window={planAuth:{ready:Promise.resolve(),key:key=>'account:test:'+key,storage:{getItem:()=>raw,setItem:(_key,value)=>{if(fail)throw Error('quota');raw=value}}},addEventListener:(name,listener)=>{if(name==='storage')storageEvent=listener}};
 global.document={documentElement:{dataset:{theme:'light'},style:{setProperty(){}}}};
 global.MutationObserver=class{observe(){}};
 await p.initializeLayout();assert.equal(p.getLayout().dockStyle,'mini');assert.equal(document.documentElement.dataset.dockStyle,'mini');
 for(const style of ['pinned','default','mini']){p.setDockStyle(style);assert.equal(p.getLayout().dockStyle,style);assert.equal(JSON.parse(raw).dockStyle,style);assert.equal(JSON.parse(raw).dockSize,'Mini');assert.equal(JSON.parse(raw).sections.calendar,false)}
 assert.throws(()=>p.setDockStyle('bad'));fail=true;const before=p.getLayout();assert.throws(()=>p.setDockStyle('pinned'));assert.equal(p.getLayout(),before);fail=false;
 storageEvent({key:'account:test:plan12layout_v1',newValue:JSON.stringify({version:1,dockStyle:'pinned'})});assert.equal(p.getLayout().dockStyle,'pinned');
 storageEvent({key:'account:test:plan12layout_v1',newValue:'bad JSON'});assert.equal(p.getLayout().dockStyle,'pinned');
 storageEvent({key:'account:test:plan12layout_v1',newValue:JSON.stringify({version:1,dockStyle:'invalid'})});assert.equal(p.getLayout().dockStyle,'default');
 p.setDockStyle('mini');p.resetLayout('light');assert.equal(p.getLayout().dockStyle,'default');
 console.log('PASS dock style: strict union/fallback, defensive old dockSize alias, scoped persistence, preserved legacy data, failed writes, storage events and reset');
})().catch(error=>{console.error(error);process.exitCode=1});
