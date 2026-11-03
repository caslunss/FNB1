const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('src/finance/workspace.js','utf8');
(async()=>{
 const {MAIN_AREAS,availableViews,resolveAreaView}=await import('../src/services/navigation.js');
 assert.deepEqual(MAIN_AREAS.map(x=>x.label),['Resumo','Compromissos','Planejamento','Investimentos','Análises']);
 assert.equal(resolveAreaView('commitments:cards',{credit:false}),null);
 assert.equal(resolveAreaView('analysis:carbon',{carbon:false}),null);
 assert.equal(resolveAreaView('analysis:unknown'),null);
 const guard=source.slice(source.indexOf('function draw(){')+'function draw(){'.length,source.indexOf('\n if(transactionDepth)'));
 for(const [tab,sections,expected,view] of [
  ['v',{credit:false,carbon:true,calendar:true},'v',null],
  ['k',{credit:false,carbon:true,calendar:true},'d','debts'],
  ['k',{credit:true,carbon:true,calendar:true},'d','cards'],
  ['s',{credit:true,carbon:true,calendar:true},'d','friends'],
  ['e',{credit:true,carbon:false,calendar:true},'f','taxes'],
  ['e',{credit:true,carbon:true,calendar:true},'f','carbon'],
  ['c',{credit:true,carbon:true,calendar:false},'r',null],
 ]){
  const ctx={S:{tab},areaViews:{commitments:'debts',planning:'purchases',analysis:'taxes'},availableViews,getLayout:()=>({sections})};
  vm.runInNewContext(guard,ctx);assert.equal(ctx.S.tab,expected);
  if(view)assert.equal(ctx.areaViews[expected==='d'?'commitments':'analysis'],view);
 }
 const refresh=source.slice(source.indexOf('async function refreshSocial('),source.indexOf('\n',source.indexOf('async function refreshSocial(')));
 let panels=0,draws=0;const client={from:()=>({select:()=>({order:()=>({limit:async()=>({data:[],error:null})})})})};
 const c={socialUser:()=> 'me',social:{busy:false},window:{planAuth:{client}},refreshUsernames:async()=>{},renderNotifications(){},accountPanel:'friends',$:s=>s==='#accountOverlay'?{open:true}:{focus(){}},renderAccountPanel(){panels++},document:{activeElement:null},S:{tab:'r'},areaViews:{commitments:'friends'},draw(){draws++}};
 vm.runInNewContext(refresh,c);await c.refreshSocial();assert.equal(panels,1);assert.equal(draws,0);await c.refreshSocial(false);assert.equal(panels,1);
 c.accountPanel=null;c.S.tab='d';await c.refreshSocial();assert.equal(draws,1);
 c.document.activeElement={closest:()=>true};await c.refreshSocial();assert.equal(draws,1);
 assert.equal(c.social.busy,false);
 console.log('PASS navegação: cinco áreas, atalhos legados, seções opcionais e amigos sem interromper formulário/polling.');
})().catch(e=>{console.error(e);process.exitCode=1});
