import React from 'react';
import {FinanceGlassCard} from './LiquidControls.tsx';

// Ready for the tax page: an actionable summary needs a real detail action.
export default function TaxSummaryCard({onOpen,label,children,...props}:Omit<React.ComponentProps<typeof FinanceGlassCard>,'onClick'> & {label:string;onOpen?:(event:React.MouseEvent<HTMLElement>|React.KeyboardEvent<HTMLElement>)=>void}){
 return <FinanceGlassCard {...props} data-tax-summary="" role={onOpen?'button':undefined} tabIndex={onOpen?0:undefined} aria-label={label} onClick={onOpen} onKeyDown={onOpen?e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();onOpen(e)}}:undefined}>{children}</FinanceGlassCard>;
}
