const fs=require('node:fs'),path=require('node:path');const root=path.join(__dirname,'..');let script=require('./controller-source.cjs').replace(/^import .*;$/gm,'').replace('export async function startWorkspace({renderHTML}){','(async()=>{');script=script.replace(/\}\s*$/,'})();');
// VM fixtures exercise the legacy imperative boundary; browsers exercise the module runtime.
script=script.replaceAll('finance.taxes','window.planTaxes');
script=script.replaceAll('finance.credit','window.planCredit');
script=script.replaceAll('finance.productGoals','window.planProductGoals');
script=script.replaceAll('finance.goal','window.planGoal');
script=script.replaceAll('finance.mobile','window.planMobile');
script=script.replaceAll('finance.notifications','window.planNotifications');
script=script.replaceAll('finance.isMonthClosed','window.planIsMonthClosed');
script=script.replaceAll('finance.resetFinancialData','window.planResetFinancialData');
script=script.replaceAll('finance.searchRecords','window.planSearchRecords');
script=script.replaceAll('finance.openSearchResult','window.planOpenSearchResult');
script=script.replaceAll('finance.debtSources','window.planDebtSources');
script=script.replaceAll('finance.actionItems','window.planActionItems');module.exports=fs.readFileSync(path.join(__dirname,'fixtures/workspace-shell.html'),'utf8').replace('</body>','<script>'+script+'</script></body>');
