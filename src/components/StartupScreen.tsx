import React from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {FADE} from '../services/motion-presets';
import {FinanceGlassButton} from './LiquidControls';
export default function StartupScreen({state,message}:{state:'loading'|'ready'|'error';message:string}){
 return <AnimatePresence>{state!=='ready'&&<motion.div key="startup" className="startup-screen" role={state==='error'?'alert':'status'} aria-label={state==='loading'?'Carregando seu espaço':undefined} aria-live="polite" initial={{opacity:1}} animate={{opacity:1}} exit={{opacity:0}} transition={FADE}>
 <img src="/assets/login-raccoon.png" alt="" width="200" height="183"/>
 {state==='error'&&<p>{message}</p>}
 {state==='error'&&<FinanceGlassButton type="button" onClick={()=>location.reload()}>Tentar novamente</FinanceGlassButton>}
 </motion.div>}</AnimatePresence>;
}
