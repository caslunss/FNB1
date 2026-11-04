const assert=require('node:assert/strict'),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{sessionStorage.setItem('plan12-access','local');sessionStorage.setItem('plan12-guest-name','QA')});await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:5173');await page.waitForFunction(()=>window.planCredit);
 const result=await page.evaluate(async()=>{
  const {finance,getFinanceSnapshot}=await import('/src/services/finance-runtime.ts');const today=finance.taxes.getState().today;
  const expense=finance.taxes.addExpense({description:'Sem duplicar',value:'12,34',date:today,category:'Gastos Essenciais'});
  const card=finance.credit.saveCard({name:'Teste',limitCents:1000000,closingDay:10,dueDay:20});
  const goal=finance.productGoals.save({name:'Parcelado',priceCents:100001,reservedCents:0,monthlyReserveCents:0,goalMode:'credit',date:today,category:'Gastos Variáveis',installments:3,creditCardId:card.id});
  const context=finance.productGoals.context(goal);finance.goal.save({amountCents:500000,mode:'months',months:6,date:''},{redraw:false});
  return {expense,installments:context.months.map(x=>x.paymentCents),goal:finance.goal.getState().v,id:goal.id,same:window.planTaxes===finance.taxes,snapshot:getFinanceSnapshot('taxes').expenses.length};
 });
 assert.equal(result.expense.category,'Gastos Essenciais');assert.equal(result.expense.cents,1234);assert.equal(result.installments.reduce((a,b)=>a+b,0),100001);assert.equal(result.goal,5000);assert.equal(result.same,true);assert.equal(result.snapshot,1);
 await page.evaluate(id=>window.planProductGoals.prepare(id),result.id);await page.waitForSelector('.purchase-review');await page.locator('.purchase-review input[name=confirmed]').check();await page.locator('.purchase-review').getByRole('button',{name:'Confirmar',exact:true}).click();await page.waitForFunction(()=>window.planTaxes.getState().expenses.length===4);assert.equal(await page.evaluate(()=>window.planCredit.getState().cards[0].usedCents),100001);assert.deepEqual(errors,[]);
 console.log('PASS migration: module API, category contract, exact installment cents, financial goal, legacy identity, store snapshot and confirmed credit purchase');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
