const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('src/finance/workspace.js','utf8');
const c=vm.createContext({social:{friends:[{sender:'me',recipient:'yes',status:'accepted'},{sender:'me',recipient:'no',status:'pending'}]},socialUser:()=> 'me',usernames:{yes:'ana&bia'},esc:x=>String(x).replaceAll('&','&amp;').replaceAll('"','&quot;'),shoppingMoney:n=>(n/100).toFixed(2).replace('.',',')});
vm.runInContext(src.slice(src.indexOf('function friendCode('),src.indexOf('function socialView(')),c);
let form=vm.runInContext("friendDivisionForm({name:'Produto',priceCents:10001,shippingCents:999})",c);
assert(form.includes('value="yes"'));assert(!form.includes('value="no"'));assert(form.includes('@ana&amp;bia'));assert(form.includes('110,00'));assert(form.includes('enviar não cria gastos'));
vm.runInContext('social.friends=[]',c);assert(!vm.runInContext('friendDivisionForm()',c).includes('<form'));
c.socialUser=()=>null;assert(vm.runInContext('friendDivisionForm()',c).includes('Entre com Google'));
assert(src.includes("tab:'s'"));assert(src.includes('socialView()+vDivision()'));const entry=src.slice(src.indexOf('function vI(){'),src.indexOf('function debtInstallments'));assert(!entry.includes('vDivision()'));const division=src.slice(src.indexOf('function vDivision(){'),src.indexOf("document.addEventListener('change'",src.indexOf('function vDivision(){')));assert(!division.includes('split-create-floating'));assert(division.includes('Dividir com amigo'));console.log('PASS amigos: apenas aceitos, escape, compra com frete e bloqueio de visitante.');
