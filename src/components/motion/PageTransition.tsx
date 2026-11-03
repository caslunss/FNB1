import React,{type ReactNode} from 'react';
import {AnimatePresence,motion,useIsPresent,useReducedMotion,useWillChange} from 'motion/react';
import {iosDefaultSpring} from './transitions';
type Props={routeKey:string;children:ReactNode;direction?:1|-1;className?:string;initial?:boolean;slide?:boolean};
function Page({children,direction,slide,className}:Omit<Props,'routeKey'|'initial'>){
 const reduced=useReducedMotion(),present=useIsPresent(),willChange=useWillChange();
 return <motion.div className={className} inert={!present||undefined} aria-hidden={!present||undefined}
  initial={reduced?{opacity:0}:{opacity:0,x:slide?18*(direction||1):0,scale:slide ? .99 : 1}}
  animate={{opacity:1,x:0,scale:1}}
  exit={reduced?{opacity:0}:{opacity:0,x:slide?-12*(direction||1):0,scale:slide ? .99 : 1}}
  transition={{...iosDefaultSpring,opacity:{duration:.14}}} style={{willChange}}>{children}</motion.div>;
}
/** Exactly one route is interactive; no absolute-positioned duplicate forms. */
export default function PageTransition({routeKey,children,direction=1,className,initial=true,slide=true}:Props){
 return <AnimatePresence mode="wait" initial={initial}><Page key={routeKey} direction={direction} slide={slide} className={className}>{children}</Page></AnimatePresence>;
}
