import React from 'react';
import PageTransition from './motion/PageTransition.tsx';
// Fade sequencing only: async updates never tween dimensions or clone controls.
export default function SmoothState({state,children,className=''}){
 return <div className={`smooth-state ${className}`} data-motion-state={state}><PageTransition routeKey={state} initial={false} slide={false}>{children}</PageTransition></div>;
}
