import React,{forwardRef,type ComponentProps} from 'react';
import {motion,useReducedMotion,useWillChange,type HTMLMotionProps} from 'motion/react';
import {GlassButton} from '@zakisheriff/liquid-glass';
import {iosQuickSpring} from './transitions';
import {BUTTON_HOVER,BUTTON_TAP,BUTTON_REST,INSTANT} from '../../services/motion-presets.js';
type GlassProps=ComponentProps<typeof GlassButton>;
export type IOSButtonProps=Omit<GlassProps,keyof HTMLMotionProps<'button'>> & HTMLMotionProps<'button'>;
const MotionGlassButton=motion.create(GlassButton);
/** Keeps the app's glass material and button DOM/ref contract. */
const IOSButton=forwardRef<HTMLButtonElement,IOSButtonProps>(function IOSButton({children,className='',disabled,type='button',style,...props},ref){
 const reduced=useReducedMotion(),willChange=useWillChange();
 return <MotionGlassButton {...props} ref={ref} type={type} disabled={disabled} className={`ios-motion-button ${className}`}
  whileHover={disabled||reduced?BUTTON_REST:BUTTON_HOVER}
  whileTap={disabled||reduced?BUTTON_REST:BUTTON_TAP}
  transition={reduced?INSTANT:iosQuickSpring} style={{...style,willChange}}>{children}</MotionGlassButton>;
});
export default IOSButton;
