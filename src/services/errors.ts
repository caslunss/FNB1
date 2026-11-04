/** Narrow thrown values at UI/network boundaries without assuming an Error instance. */
export function errorDetails(value:unknown):{message:string;name:string;code?:string;status?:number;retryAfter?:string} {
 if(value instanceof Error)return value;
 if(value&&typeof value==='object'){
  const row=value as Record<string,unknown>;
  return {message:typeof row.message==='string'?row.message:'Não foi possível concluir.',name:typeof row.name==='string'?row.name:'Error',code:typeof row.code==='string'?row.code:undefined,status:typeof row.status==='number'?row.status:undefined};
 }
 return {message:typeof value==='string'?value:'Não foi possível concluir.',name:'Error'};
}
