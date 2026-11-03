import React from 'react';
import {FinanceGlassCard} from './LiquidControls.jsx';

// Ready for the tax page: an actionable summary needs a real detail action.
export default function TaxSummaryCard({onOpen,label,children,...props}){
 return <FinanceGlassCard {...props} data-tax-summary="" role={onOpen?'button':undefined} tabIndex={onOpen?0:undefined} aria-label={label} onClick={onOpen} onKeyDown={onOpen?e=>{if(e.target===e.currentTarget&&['Enter',' '].includes(e.key)){e.preventDefault();onOpen(e)}}:undefined}>{children}</FinanceGlassCard>;
}
