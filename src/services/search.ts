export interface SearchRecord {id:string;type:string;name:string;category?:string;date?:string;cents:number}
export interface SearchFilters {query?:string;type?:string;category?:string;from?:string;to?:string;min?:number;max?:number}
export function searchFinance(records:SearchRecord[],filters:SearchFilters={}){
  const fold=(x:unknown)=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const query=fold(filters.query).trim();
  const rows=records.filter(x=>(!filters.type||x.type===filters.type)&&(!filters.category||x.category===filters.category)&&(!filters.from||(x.date&&x.date>=filters.from))&&(!filters.to||(x.date&&x.date<=filters.to))&&(filters.min===undefined||x.cents>=filters.min)&&(filters.max===undefined||x.cents<=filters.max)&&(!query||fold(x.name+' '+x.category).includes(query))).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
  return {total:rows.length,rows:rows.slice(0,100)};
}
