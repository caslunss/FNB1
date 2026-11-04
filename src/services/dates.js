// Date-only controls follow the user's local calendar, never UTC slicing.
export function localDay(date=new Date()){
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export const localMonth=(date=new Date())=>localDay(date).slice(0,7);
