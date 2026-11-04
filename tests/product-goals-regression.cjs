const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const {reserveForMonth,productGoalReport}=await import('../src/services/product-goals.js');
 const goal={id:'goal',name:'Produto',productGoal:true,status:'planned',goalMode:'save',priceCents:100000,shippingCents:0,reservedCents:10000,monthlyReserveCents:30000,date:'2026-11-04',installments:1,category:'Gastos Variáveis'};
 assert.deepEqual(['2026-11','2026-12','2027-01','2027-02'].map(m=>reserveForMonth(goal,m,'2026-11-04')),[30000,30000,30000,0]);
 assert.equal(reserveForMonth({...goal,status:'purchased'},'2026-11','2026-11-04'),0);
 assert.equal(reserveForMonth({...goal,date:'2027-01-04'},'2026-11','2026-11-04'),0);
 const months=['2026-11','2026-12','2027-01'].map(key=>({key,availableCents:80000,purchaseAfterCents:40000,paymentCents:33333,complete:true}));
 const context={asOf:'2026-11-04',goals:[goal,{...goal,id:'other',monthlyReserveCents:20000}],months};const before=JSON.stringify(context);
 let report=productGoalReport(goal,context);assert.equal(report.rows[0].afterCents,30000);assert.equal(report.monthsToGoal,3);assert.equal(JSON.stringify(context),before);
 report=productGoalReport(goal,{...context,months:[{...months[0],complete:false}]});assert.equal(report.status,'incomplete');
 report=productGoalReport(goal,{...context,months:[{...months[0],availableCents:10000}]});assert.equal(report.status,'attention');
 report=productGoalReport({...goal,goalMode:'credit',priceCents:100001},{...context,card:{active:true,availableCents:100000}});assert.equal(report.credit.shortfallCents,1);assert.equal(report.status,'attention');assert.equal(report.rows[0].afterCents,20000);
 report=productGoalReport({...goal,goalMode:'credit'},context);assert.equal(report.status,'incomplete');
 report=productGoalReport({...goal,goalMode:'cash'},context);assert.equal(report.rows[0].afterCents,20000);
 const credit=await import('../src/services/credit.js');const raw=fs.readFileSync('src/finance/workspace.js','utf8').split('// FINANCE_CORE\n')[1],core=raw.slice(0,raw.indexOf('function tiles('))+raw.slice(raw.indexOf('function splitShares'),raw.indexOf('function registerSplit'));
 function fixture(data={}){const storage={...data};const ctx=vm.createContext({...credit,Date:class extends Date{constructor(...args){super(...(args.length?args:['2026-11-04T12:00:00']))}},crypto:require('node:crypto').webcrypto,URL,document:{querySelector:()=>null},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},draw(){},setTimeout(){},addEventListener(){}});vm.runInContext(core,ctx);return {storage,run:s=>vm.runInContext(s,ctx)}}
 const f=fixture();const input={...goal,id:undefined,targetCents:100000,priority:'normal',people:[],goal:false,url:''};f.run(`saveShopping(${JSON.stringify(input)},'cart')`);assert.equal(f.run('CART[0].productGoal'),true);assert.equal(f.run('S.items.length'),0);const reloaded=fixture(f.storage);assert.equal(reloaded.run('CART[0].monthlyReserveCents'),30000);assert.equal(reloaded.run('CART[0].goalMode'),'save');assert.throws(()=>f.run(`saveShopping(${JSON.stringify({...input,monthlyReserveCents:0})},'cart')`));
 assert.throws(()=>f.run(`saveShopping(${JSON.stringify({...input,goalMode:'credit',creditCardId:''})},'cart')`));
 console.log('PASS metas de produtos: centavos, reservas limitadas ao alvo, múltiplas metas, dados incompletos, limite total no crédito, persistência sem gasto automático e validação.');
})().catch(e=>{console.error(e);process.exitCode=1});
