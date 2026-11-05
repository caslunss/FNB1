import React from 'react';
import {AnimatePresence,motion} from 'motion/react';
import {FADE} from '../services/motion-presets';
import {FinanceGlassButton} from './LiquidControls';
export default function StartupScreen({state,message}:{state:'loading'|'ready'|'error';message:string}){
 return <AnimatePresence>{state!=='ready'&&<motion.div key="startup" className="startup-screen" role={state==='error'?'alert':'status'} aria-live="polite" initial={{opacity:1}} animate={{opacity:1}} exit={{opacity:0}} transition={FADE}>
 <img src="/assets/raccoon-logo.webp" alt="Guaxinim — logo do site" width="64" height="64"/>
 {state==='loading'&&<span className="startup-progress" aria-hidden="true"/>}<p>{message}</p>
 {state==='error'&&<FinanceGlassButton type="button" onClick={()=>location.reload()}>Tentar novamente</FinanceGlassButton>}
 </motion.div>}</AnimatePresence>;
}
