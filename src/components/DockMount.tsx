import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {createPortal} from 'react-dom';

/** Move the same portal container so changing attachment preserves dock state. */
export default function DockMount({pinned,children}:{pinned:boolean;children:ReactNode}){
 const anchor=useRef<HTMLSpanElement>(null);
 const [container]=useState(()=>{
  const node=document.createElement('div');
  node.dataset.dockContainer='';node.style.display='contents';
  return node;
 });
 useLayoutEffect(()=>{
  if(pinned)document.body.appendChild(container);
  else anchor.current?.parentNode?.insertBefore(container,anchor.current);
  return()=>container.remove();
 },[pinned,container]);
 return <><span ref={anchor} style={{display:'contents'}}/>{createPortal(children,container)}</>;
}
