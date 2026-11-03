import React,{type PropsWithChildren} from 'react';
import {motion,useReducedMotion,useWillChange} from 'motion/react';
import {iosDefaultSpring} from './transitions';
export function LoginEntrance({children,className}:PropsWithChildren<{className?:string}>){
 const reduced=useReducedMotion(),willChange=useWillChange();
 return <motion.section className={className} initial="hidden" animate="visible" variants={{hidden:{opacity:0,scale:reduced?1:.985},visible:{opacity:1,scale:1,transition:{...iosDefaultSpring,staggerChildren:reduced?0:.045,delayChildren:reduced?0:.04}}}} style={{willChange}}>{children}</motion.section>;
}
export function LoginItem({children,className}:PropsWithChildren<{className?:string}>){
 const reduced=useReducedMotion();
 return <motion.div className={className} variants={{hidden:{opacity:0,y:reduced?0:8},visible:{opacity:1,y:0,transition:iosDefaultSpring}}}>{children}</motion.div>;
}
