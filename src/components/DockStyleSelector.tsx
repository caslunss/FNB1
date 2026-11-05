import {useId,useRef,useSyncExternalStore} from 'react';
import {motion,useReducedMotion} from 'motion/react';
import {FinanceOptionBar} from './LiquidControls';
import {BUTTON_CLASSES} from './control-classes';
import {BUTTON_HOVER,BUTTON_TAP,APP_SPRING} from '../services/motion-presets';
import {getLayout,subscribeLayout,setDockStyle,type DockStyle} from '../services/layout-preferences';

const options=[{value:'pinned',label:'Fixada'},{value:'default',label:'Padrão'},{value:'mini',label:'Mini'}] as const;

export default function DockStyleSelector({onMessage}:{onMessage:(message:string)=>void}){
 const style=useSyncExternalStore(subscribeLayout,()=>getLayout().dockStyle);
 const labelId=useId(),host=useRef<HTMLElement>(null);
 const reduced=useReducedMotion();
 function select(value:DockStyle){try{setDockStyle(value);onMessage('Estilo da dock salvo.')}catch{onMessage('Não foi possível salvar o estilo da dock.')}}
 return <section className="dock-style-setting">
  <h3 id={labelId}>Estilo da dock</h3>
  <FinanceOptionBar as="div" ref={host} className="te-glass-segments" role="radiogroup" aria-labelledby={labelId} onKeyDown={event=>{
   if(event.key==='Enter'){event.preventDefault();select(style);return;}
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
   event.preventDefault();
   const index=options.findIndex(option=>option.value===style);
   const next=event.key==='Home'?0:event.key==='End'?options.length-1:(index+(['ArrowRight','ArrowDown'].includes(event.key)?1:-1)+options.length)%options.length;
   const option=options[next];if(!option)return;
   select(option.value);host.current?.querySelectorAll<HTMLInputElement>('input[type=radio]')[next]?.focus({preventScroll:true});
  }}>
   {options.map(option=><motion.label key={option.value} className={`lg-button te-glass-button ${BUTTON_CLASSES} ui-option lg-track__item`} whileHover={reduced?undefined:BUTTON_HOVER} whileTap={reduced?undefined:BUTTON_TAP} transition={APP_SPRING}>
    <input type="radio" name={labelId} value={option.value} checked={style===option.value} aria-checked={style===option.value} tabIndex={style===option.value?0:-1} onChange={()=>select(option.value)}/>
    <span className="lg-button__label">{option.label}</span>
   </motion.label>)}
  </FinanceOptionBar>
 </section>;
}
