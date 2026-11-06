import {useId} from 'react';
import {distributionSegments} from '../services/distribution-geometry';

type DistributionRow={category:string;index:number;value:number;percentage:string};
export default function SpendingDistribution({rows,total,totalLabel,month}:{rows:DistributionRow[];total:number;totalLabel:string;month:string}){
 const id=useId().replaceAll(':',''),segments=distributionSegments(rows,total),amount=totalLabel.replace(/^R\$\s*/, '');
 const largest=rows.reduce<DistributionRow|undefined>((best,row)=>!best||row.value>best.value?row:best,undefined);
 return <div className="dn spending-distribution">
  <svg viewBox="0 0 300 300" role="img" aria-labelledby={`${id}-title ${id}-description`}>
   <title id={`${id}-title`}>Distribuição dos gastos de {month} por categoria</title>
   <desc id={`${id}-description`}>Total: {totalLabel}. O ângulo de cada segmento representa a participação real da categoria; as diferenças de altura são decorativas. {rows.map(row=>`${row.category}: ${row.percentage}`).join('; ')}.</desc>
   <defs>{segments.map(row=><linearGradient key={row.index} id={`${id}-segment-${row.index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={`var(--c${row.index})`}/><stop offset="1" stopColor={`var(--c${row.index})`} stopOpacity=".72"/></linearGradient>)}</defs>
   <circle cx="150" cy="150" r="68" className="distribution-halo"/>
   {segments.map(row=><path key={row.index} data-distribution-category={row.category} d={row.path} fill={`url(#${id}-segment-${row.index})`}><title>{row.category}: {row.percentage}</title></path>)}
   <circle cx="150" cy="150" r="51" className="distribution-center"/>
   <text x="150" y="148" textAnchor="middle" className="distribution-total" fontSize={Math.min(27,Math.max(13,190/Math.max(1,amount.length)))}>{amount}</text>
   <text x="150" y="170" textAnchor="middle" className="distribution-caption">Total · R$</text>
   {segments.filter(row=>row.category===largest?.category&&row.end-row.start>=42).map(row=>{const angle=((row.start+row.end)/2-90)*Math.PI/180,r=(68+row.outer)/2;return <text key={row.index} x={150+r*Math.cos(angle)} y={150+r*Math.sin(angle)} textAnchor="middle" dominantBaseline="middle" className="distribution-share">{row.percentage}</text>})}
  </svg>
  <div className="dl">{rows.map(row=><div className="item" key={row.index}><span className="dot" style={{background:`var(--c${row.index})`}}/><span>{row.category}</span><b>{row.percentage}</b></div>)}</div>
 </div>;
}
