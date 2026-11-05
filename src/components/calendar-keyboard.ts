import type React from 'react';
/** Spatial navigation over enabled dates/months without changing the chosen value. */
export function calendarKeys(event:React.KeyboardEvent<HTMLElement>,columns:number){
 const delta:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-columns,ArrowDown:columns};
 if(!(event.key in delta)&&!['Home','End'].includes(event.key))return;
 const items=[...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
 const current=items.indexOf(event.target as HTMLButtonElement);if(current<0)return;
 event.preventDefault();const target=event.key==='Home'?0:event.key==='End'?items.length-1:Math.max(0,Math.min(items.length-1,current+delta[event.key]));items[target]?.focus({preventScroll:true});
}
