import {decimalCents} from '../../src/services/money.ts';
import {validDay} from '../../src/services/taxes/domain.ts';
export async function normalizeBankTransactions(rows,account,userId,month){
 const result=[],excluded=[];
 for(const entry of rows){const t=entry&&typeof entry==='object'?entry:{};const day=String(t.date||'').slice(0,10),operation=String(t.operationType||'');let reason='';
 if(!validDay(day)||!['CREDIT','DEBIT'].includes(t.type)||!String(t.providerId||t.id||'').trim())reason='Identificador, data ou tipo inválido';else if(t.currencyCode!=='BRL')reason='Moeda diferente de BRL';else if(t.status!=='POSTED')reason='Pendente ou futura';else if(!day.startsWith(month))reason='Fora do mês aberto';else if(['PAGAMENTO','PAGAMENTO_FATURA','ESTORNO','CASHBACK','OPERACOES_CREDITO_CONTRATADAS_CARTAO'].includes(operation)||/pagamento.*fatura|fatura.*pagamento/i.test(t.description||''))reason='Fatura, estorno ou operação de crédito';else if(account.type==='CREDIT'&&t.type!=='DEBIT')reason='Crédito ou ajuste de cartão';else if(['TED','TEF','TRANSFERENCIA'].includes(operation))reason='Transferência';else if(/invest|fixed income|loan|empréstimo/i.test(t.category||''))reason='Investimento ou empréstimo';
 let cents;try{cents=Math.abs(decimalCents(t.amount))}catch{cents=NaN;}if(!Number.isSafeInteger(cents)||cents<1||cents>100000000000)reason='Valor inválido';if(reason){excluded.push({reason});continue;}
 const raw=new TextEncoder().encode([userId,account.id,t.providerId||t.id].join(':')),digest=await crypto.subtle.digest('SHA-256',raw),id='of-'+Array.from(new Uint8Array(digest),x=>x.toString(16).padStart(2,'0')).join('').slice(0,32);
 result.push({id,type:t.type==='CREDIT'?'i':'g',credit:account.type==='CREDIT',date:day,cents,description:(String(t.description||t.merchant?.name||'Movimentação')+(t.creditCardMetadata?.totalInstallments>1?` (${t.creditCardMetadata.installmentNumber}/${t.creditCardMetadata.totalInstallments})`:'')).slice(0,240),category:'Gastos Variáveis',merchantCnpj:String(t.merchant?.cnpj||'').slice(0,18),cnae:String(t.merchant?.cnae||'').slice(0,9)});
 }
 return {rows:result,excludedCount:excluded.length};
}
