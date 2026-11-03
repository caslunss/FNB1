// Product tuning inspired by HIG, not Apple-defined constants.
export const iosDefaultSpring=Object.freeze({type:'spring',stiffness:440,damping:44,mass:1});
export const iosQuickSpring=Object.freeze({type:'spring',stiffness:650,damping:52,mass:1});
export const APP_SPRING=iosDefaultSpring;
export const PRESS_SPRING=iosQuickSpring;
export const FADE={duration:.16,ease:'easeOut'};
export function pageFrames(reduced=false){return reduced?{opacity:[.65,1]}:{opacity:[0,1],x:[18,0],scale:[.99,1]};}
export function cardTarget({hovered=false,pressed=false,reduced=false}={}){return {y:!reduced&&hovered&&!pressed?-3:0,scale:!reduced&&pressed ? .97 : 1};}
