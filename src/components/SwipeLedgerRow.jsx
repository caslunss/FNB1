import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {FinanceGlassButton as Button} from './LiquidControls.jsx';
import {useMobileLayout} from '../services/mobile-layout.js';

export default function SwipeLedgerRow({children,kind,id,...props}){
  const mobile=useMobileLayout(),root=useRef(null),start=useRef(null),timer=useRef(null),held=useRef(false),dialog=useRef(null),opener=useRef(null);
  const [offset,setOffset]=useState(0),[open,setOpen]=useState(false);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  if(!mobile)return <div {...props}>{children}</div>;
  const readonly=!!window.planIsMonthClosed?.();
  const reset=()=>{setOpen(false);setOffset(0)};
  function context(){reset();root.current?.querySelector('.te-action-menu .lg-menu-anchor>button')?.click();}
  function down(e){if(readonly||e.button!==0||e.clientX<24||e.target.closest('.mobile-swipe-actions,dialog'))return;start.current={x:e.clientX,y:e.clientY,base:open?-112:0};held.current=false;timer.current=setTimeout(()=>{start.current=null;context();held.current=true},500);}
  function move(e){const point=start.current;if(!point)return;const dx=e.clientX-point.x,dy=e.clientY-point.y;if(Math.abs(dx)>8||Math.abs(dy)>8)clearTimeout(timer.current);if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>12){start.current=null;reset();return;}if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.5){e.currentTarget.setPointerCapture(e.pointerId);setOffset(Math.max(-112,Math.min(0,point.base+dx)));}}
  function up(e){clearTimeout(timer.current);const point=start.current;start.current=null;if(!point)return;const dx=e.clientX-point.x;if(Math.abs(dx)>12)held.current=true;const next=point.base+dx<-56;setOpen(next);setOffset(next?-112:0);}
  return <div ref={root} className={`mobile-ledger-row ${open?'is-revealed':''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={()=>{clearTimeout(timer.current);start.current=null;reset()}} onContextMenu={e=>{if(!readonly){e.preventDefault();context()}}} onClickCapture={e=>{if(e.target.closest('dialog'))return;if(held.current){e.preventDefault();e.stopPropagation();held.current=false;}else if(open&&!e.target.closest('.mobile-swipe-actions')){reset();e.preventDefault();e.stopPropagation();}}}>
    <div className="mobile-swipe-actions" inert={!open} aria-hidden={!open}><Button aria-label="Editar lançamento" onClick={()=>{reset();window.planMobile?.rowAction('edit',kind,id)}}>Editar</Button><Button destructive aria-label="Apagar lançamento" onClick={e=>{opener.current=e.currentTarget;dialog.current.showModal()}}>Apagar</Button></div>
    <div {...props} className={`${props.className||''} mobile-ledger-content`} style={{...props.style,transform:`translateX(${offset}px)`}}>{children}</div>
    {createPortal(<dialog ref={dialog} className="mobile-confirm-sheet" aria-labelledby={`delete-${kind}-${id}`} onClose={()=>opener.current?.isConnected&&opener.current.focus()} onClick={e=>{if(e.target===dialog.current)dialog.current.close()}}><h2 id={`delete-${kind}-${id}`}>Apagar lançamento?</h2><p>O lançamento será removido dos seus dados. Para recuperar, será necessário importar um backup.</p><div className="mobile-confirm-actions"><Button onClick={()=>dialog.current.close()}>Cancelar</Button><Button destructive onClick={()=>{dialog.current.close();reset();window.planMobile?.rowAction('delete',kind,id)}}>Apagar</Button></div></dialog>,document.body)}
  </div>;
}
