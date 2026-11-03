let cached;
export default async function handler(req){
  const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':status===200?'public, max-age=3600':'no-store'}});
  if(req.method!=='GET')return reply(405,{error:'Método inválido.'});
  try{if(cached&&Date.now()-cached.time<3600000)return reply(200,cached.value);
    const response=await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error();const rows=await response.json(),row=rows?.[0],annual=Number(row?.valor);if(!Number.isFinite(annual)||annual<0||annual>100||!/^\d{2}\/\d{2}\/\d{4}$/.test(row?.data||''))throw Error();
    const value={annual,date:row.data,source:'BCB · SGS 4389',checkedAt:new Date().toISOString()};cached={time:Date.now(),value};return reply(200,value);
  }catch{return reply(503,{error:'CDI indisponível. Informe uma taxa para simular.'});}
}
