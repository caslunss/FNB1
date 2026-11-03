const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/finance/workspace.js','utf8'),core=source.split('// FINANCE_CORE\n')[1].split('const CI=')[0],bridge=source.slice(source.indexOf('window.planMobile='),source.indexOf('window.planGoal='));
function fixture({closed=false,fail=false}={}){
 const data={},errors=[],sheets=[];
 const ctx=vm.createContext({window:{},crypto:require('node:crypto').webcrypto,Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-10-22T12:00:00']))}},document:{querySelector:()=>null},localStorage:{getItem:k=>data[k]||null,setItem:(k,v)=>{if(fail)throw Error('quota');data[k]=v}},draw(){},setTimeout(){},addEventListener(){},getLayout:()=>({sections:{carbon:true}}),openSheet:x=>sheets.push(x),closeMenu(){},scrollTo(){},errors});
 vm.runInContext(core+`;safely=fn=>{try{return atomic(fn)}catch(e){errors.push(e.message);return false}};`+bridge,ctx);
 vm.runInContext(`S.m=monthIndexFromDate('2026-10-22');S.items=[{id:'expense',d:'Teste',v:1234,c:'Gastos Essenciais',p:'Pix',date:'2026-10-22'}];S.receipts=[{id:'income',d:'Renda',v:5000,date:'2026-10-22'}];${closed?"CLOSED_REPORTS[monthKeyForIndex(S.m)]={closed:true};":''}`,ctx);
 return {run:code=>vm.runInContext(code,ctx),ctx,errors,sheets,data};
}
let f=fixture();f.ctx.window.planMobile.rowAction('edit','g','expense');assert.equal(f.sheets[0].dataset.id,'expense');assert.equal(f.run('S.items.length'),1);
f.ctx.window.planMobile.rowAction('delete','g','expense');assert.equal(f.run('S.items.length'),0);assert.equal(f.run('S.receipts.length'),1);assert.equal(JSON.parse(f.data.plan12workspace_v3).data.items.length,0);
f=fixture();f.ctx.window.planMobile.rowAction('delete','g','unknown');f.ctx.window.planMobile.rowAction('delete','d','expense');assert.equal(f.run('S.items.length'),1);
f=fixture({closed:true});f.ctx.window.planMobile.rowAction('delete','g','expense');f.ctx.window.planMobile.compose();assert.equal(f.run('S.items.length'),1);assert.equal(f.sheets.length,0);
f=fixture();f.run("S.items[0].splitId='shared'");f.ctx.window.planMobile.rowAction('delete','g','expense');assert.equal(f.run('S.items.length'),1);assert.match(f.errors[0],/Amigos/);
f=fixture({fail:true});f.ctx.window.planMobile.rowAction('delete','g','expense');assert.equal(f.run('S.items.length'),1);assert.equal(f.run('S.items[0].v'),1234);assert.equal(f.data.plan12workspace_v3,undefined);assert.equal(f.errors.length,1);
console.log('PASS ações mobile: edição, exclusão persistida, id e tipo, mês fechado, divisões e rollback de gravação.');
