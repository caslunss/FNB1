import React,{forwardRef,type ComponentProps} from 'react';
import {motion,useReducedMotion,useWillChange,type HTMLMotionProps} from 'motion/react';
import {GlassButton} from '@zakisheriff/liquid-glass';
import {iosQuickSpring} from './transitions';
type GlassProps=ComponentProps<typeof GlassButton>;
export type IOSButtonProps=Omit<GlassProps,keyof HTMLMotionProps<'button'>> & HTMLMotionProps<'button'>;
const MotionGlassButton=motion.create(GlassButton);
/** Keeps the app's glass material and button DOM/ref contract. */
const IOSButton=forwardRef<HTMLButtonElement,IOSButtonProps>(function IOSButton({children,className='',disabled,type='button',style,...props},ref){
 const reduced=useReducedMotion(),willChange=useWillChange();
 return <MotionGlassButton {...props} ref={ref} type={type} disabled={disabled} className={`ios-motion-button ${className}`}
  whileHover={disabled||reduced?undefined:{y:-1}}
  whileTap={disabled||reduced?undefined:{scale:.96,y:0}}
  transition={iosQuickSpring} style={{...style,willChange}}>{children}</MotionGlassButton>;
});
export default IOSButton;
