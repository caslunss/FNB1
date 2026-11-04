import {decimalCents} from '../../src/services/money.ts';
import {cleanProduct,publicURL} from './shopping-product.mjs';

// Only the server calls SerpApi: its API key is never returned or logged.
export async function searchProducts(query,env,net){
 if(!env.SERPAPI_API_KEY)return {status:503,body:{error:'Pesquisa de produtos não ativada. Configure SERPAPI_API_KEY no servidor.'}};
 const url=new URL('https://serpapi.com/search.json');
 url.search=new URLSearchParams({engine:'google_shopping',q:query,location:'Brazil',hl:'pt',gl:'br',google_domain:'google.com.br',api_key:env.SERPAPI_API_KEY}).toString();
 try{
  const response=await net(url.href,{signal:AbortSignal.timeout(25000)});
  if(!response.ok){
   const status=response.status===429?429:502;
   return {status,body:{error:response.status===429?'Limite de pesquisas atingido na SerpApi. Confira sua cota.':response.status===401||response.status===403?'Não foi possível autenticar a SerpApi. Confira a chave e o plano no servidor.':'Pesquisa de produtos indisponível. Tente novamente.'}};
  }
  const data=await response.json();
  if(data.error)return {status:502,body:{error:'A SerpApi não concluiu a pesquisa. Confira a configuração e a cota no painel.'}};
  const products=(Array.isArray(data.shopping_results)?data.shopping_results:[]).slice(0,12).flatMap(item=>{
   if(!item||typeof item!=='object')return [];
   if(typeof item.title!=='string'||!item.title.trim())return [];
   // gl=br alone is not proof of currency. Only confirmed BRL prices are stored.
   const brl=/R\s*\$|BRL/i.test(String(item.price||''))||item.currency==='BRL';
   const price=typeof item.extracted_price==='number'?item.extracted_price:NaN;
   const product=cleanProduct({name:item.title,url:publicURL(item.product_link)||publicURL(item.link),image:item.thumbnail,priceCents:brl&&Number.isFinite(price)&&price>0&&price<=1000000?decimalCents(price):null,specs:[],promotion:''});
   return [{...product,store:typeof item.source==='string'?item.source.slice(0,120):''}];
  });
  return {status:200,body:{products,sources:[],provider:'SerpApi · Google Shopping',checkedAt:new Date().toISOString(),suggestions:''}};
 }catch{return {status:502,body:{error:'Não foi possível consultar a SerpApi. Tente novamente.'}};}
}
