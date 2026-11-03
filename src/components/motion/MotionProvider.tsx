import React,{type PropsWithChildren} from 'react';
import {MotionConfig} from 'motion/react';
import {iosDefaultSpring} from './transitions';
export default function MotionProvider({children}:PropsWithChildren){
 return <MotionConfig reducedMotion="user" transition={iosDefaultSpring}>{children}</MotionConfig>;
}
