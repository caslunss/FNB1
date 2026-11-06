/** Angles encode the real share; outer radii are a decorative category treatment. */
export function distributionSector(start:number,end:number,inner:number,outer:number){
  const point=(radius:number,angle:number)=>{const a=(angle-90)*Math.PI/180;return `${(150+radius*Math.cos(a)).toFixed(5)} ${(150+radius*Math.sin(a)).toFixed(5)}`};
  const span=end-start;
  if(!Number.isFinite(span)||span<=0||span>360.000001||inner<=0||outer<=inner)return '';
  if(span>=359.999999){const mid=start+180;return `M ${point(outer,start)} A ${outer} ${outer} 0 1 1 ${point(outer,mid)} A ${outer} ${outer} 0 1 1 ${point(outer,end)} L ${point(inner,end)} A ${inner} ${inner} 0 1 0 ${point(inner,mid)} A ${inner} ${inner} 0 1 0 ${point(inner,start)} Z`;}
  const large=span>180?1:0;
  return `M ${point(outer,start)} A ${outer} ${outer} 0 ${large} 1 ${point(outer,end)} L ${point(inner,end)} A ${inner} ${inner} 0 ${large} 0 ${point(inner,start)} Z`;
}
export function distributionSegments<T extends {value:number;index:number}>(rows:readonly T[],total:number){
  const largest=rows.reduce((best,row,index)=>row.value>(rows[best]?.value||0)?index:best,0);
  const before=rows.slice(0,largest).reduce((sum,row)=>sum+row.value,0);
  let angle=total>0?270-(before+(rows[largest]?.value||0)/2)/total*360:0;
  return rows.map(row=>{const start=angle;angle+=total>0?row.value/total*360:0;const outer=[124,114,106,120,111][row.index%5];return {...row,start,end:angle,outer,path:distributionSector(start,angle,68,outer)};});
}
