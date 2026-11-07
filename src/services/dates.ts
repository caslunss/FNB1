// Date-only controls follow the user's local calendar, never UTC slicing.
export function localDay(date=new Date()){
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export const localMonth=(date=new Date())=>localDay(date).slice(0,7);

/** Calendar arithmetic for estimates: date-only inputs, local noon, original anchors. */
export function validLocalDay(value:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const [year,month,day]=value.split('-').map(Number);if(year<2000||year>2199)return false;
 const date=new Date(year,month-1,day,12);return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day;
}
export function addLocalDays(value:string,days:number){
 if(!validLocalDay(value)||!Number.isInteger(days))throw Error('Data inválida.');
 const [year,month,day]=value.split('-').map(Number),date=new Date(year,month-1,day,12);date.setDate(date.getDate()+days);return localDay(date);
}
export function addLocalMonths(value:string,months:number,anchorDay=Number(value.slice(8))){
 if(!validLocalDay(value)||!Number.isInteger(months)||!Number.isInteger(anchorDay)||anchorDay<1||anchorDay>31)throw Error('Data inválida.');
 const [year,month]=value.split('-').map(Number),first=new Date(year,month-1+months,1,12),last=new Date(first.getFullYear(),first.getMonth()+1,0,12).getDate();
 first.setDate(Math.min(anchorDay,last));return localDay(first);
}
