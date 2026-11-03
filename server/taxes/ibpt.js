import {allocateRounded,validDay,documentCalculation} from '../../src/services/taxes/domain.js';
export class TaxError extends Error{constructor(message,status=400,retryAfter=null){super(message);this.status=status;this.retryAfter=retryAfter}}
function date(value){const s=String(value||''),m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s),d=m?`${m[3]}-${m[2]}-${m[1]}`:s.slice(0,10);if(!validDay(d))throw new TaxError('A referência tributária não informou uma vigência válida.',502);return d;}
export async function rateFor(item,input,day,{env,net=fetch,cache}){
 if(!env.IBPT_TOKEN||!env.IBPT_CNPJ)throw new TaxError('Consulta tributária ainda não configurada.',503);
 const key=[env.IBPT_CNPJ,item.kind,item.code,input.uf,item.ex].join(':');
 const cached=await cache?.get(key,day);if(cached)return cached;
 const url=new URL(`https://apidoni.ibpt.org.br/api/v1/${item.kind==='produto'?'produtos':'servicos'}`);
 const q={token:env.IBPT_TOKEN,cnpj:env.IBPT_CNPJ,codigo:item.code,uf:input.uf,descricao:item.description,unidadeMedida:item.unit,valor:(item.unitValueCents/100).toFixed(2)};
 if(item.kind==='produto')Object.assign(q,{ex:String(item.ex),gtin:item.gtin});url.search=new URLSearchParams(q).toString();
 let response;try{response=await net(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000),redirect:'error'})}catch{throw new TaxError('A consulta tributária não respondeu. Tente novamente.',502)}
 if([401,403].includes(response.status))throw new TaxError('Credencial tributária recusada. Confira a configuração no servidor.',503);
 if(response.status===404)throw new TaxError('Classificação não encontrada.',404);
 if(response.status===429)throw new TaxError('Limite de consultas atingido. Tente depois do prazo informado.',429,response.headers.get('Retry-After'));
 if(!response.ok)throw new TaxError('Consulta tributária indisponível.',502);
 let body;try{body=await response.json()}catch{throw new TaxError('Resposta tributária inválida.',502)}
 const rows=(Array.isArray(body)?body:[body]).filter(x=>x&&String(x.Codigo)===item.code&&x.UF===input.uf&&(item.kind!=='produto'||Number(x.EX)===item.ex));
 if(rows.length!==1)throw new TaxError('A referência tributária está ausente ou ambígua.',422);
 const x=rows[0],reference={national:x.Nacional,imported:x.Importado,state:x.Estadual,municipal:x.Municipal,validFrom:date(x.VigenciaInicio),validUntil:date(x.VigenciaFim),version:String(x.Versao||''),source:String(x.Fonte||'IBPT'),key:String(x.Chave||'')};
 if(!reference.version||reference.validFrom>reference.validUntil)throw new TaxError('Versão tributária inválida.',502);
 if(day<reference.validFrom||day>reference.validUntil)throw new TaxError('Esta compra precisa de uma tabela histórica. A atual não foi aplicada.',422);
 await cache?.set(key,reference);return reference;
}
export async function calculate(input,expense,dependencies){
 const doc=documentCalculation(input,expense.cents);if(doc)return {...doc,items:[],references:[]};
 const parts=[],references=[],pending=[];let queries=0;
 // Bounded batches preserve partial coverage without inventing rates.
 for(const [i,item]of input.items.entries()){
  if(!item.code||!input.uf||item.origin==='desconhecida'||item.kind==='produto'&&!item.gtin){pending.push({index:i,reason:'Complete código, UF, origem e GTIN quando necessário.'});continue;}
  if(queries>=20){pending.push({index:i,reason:'Limite de 20 consultas por análise.'});continue;}
  queries++;try{const r=await rateFor(item,input,expense.date,dependencies);const values=allocateRounded(item.baseCents,[item.origin==='importado'?r.imported:r.national,r.state,r.municipal]);if(values.totalCents>item.baseCents)throw Error('Carga acima do valor da compra; revise a classificação.');parts.push({...values,baseCents:item.baseCents,index:i});references.push(r)}catch(e){if(e.status===429)throw e;pending.push({index:i,reason:e instanceof TaxError?e.message:'Alíquota inválida; item pendente.'});}
 }
 if(!parts.length&&input.cnae&&input.uf){const profile=await dependencies.profile?.(input.cnae,input.uf,expense.date);if(profile){const tax=Number((BigInt(expense.cents)*BigInt(profile.effective_rate_ppm)+500000n)/1000000n);return {method:'cnae_proxy',status:'estimated',confidence:'low',totalCents:tax,coveredCents:expense.cents,baseCents:expense.cents,federalCents:null,stateCents:null,municipalCents:null,profileId:profile.id,note:profile.methodology,items:[],references:[]}}}
 const sum=k=>parts.reduce((n,p)=>n+p[k],0),covered=sum('baseCents');return {method:'ibpt_item',status:covered?'estimated':'pending',confidence:'item',baseCents:expense.cents,coveredCents:covered,totalCents:covered?sum('totalCents'):null,federalCents:covered?sum('federalCents'):null,stateCents:covered?sum('stateCents'):null,municipalCents:covered?sum('municipalCents'):null,items:parts,references,pending};
}
