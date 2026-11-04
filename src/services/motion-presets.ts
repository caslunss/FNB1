// Universal motion source: numeric values are seconds / CSS pixels.
export const MOTION=Object.freeze({
 instant:0,fast:.16,standard:.2,calm:.3,skeleton:1.4,
 enterX:18,exitX:-12,pageScale:.99,hoverY:-1,pressScale:.96,
 cardHoverY:-3,cardPressScale:.97,profileY:12,profileExitY:8,profileScale:.98,
 loginScale:.985,loginExitScale:1.015,loginY:8,stagger:.045,delay:.04,
 sheetEnter:32,legacyEnter:4,revealEnter:6,sheetOpacity:.4,subtleOpacity:.5,navActive:1.1,navHover:1.18,cssHover:1.02,hoverOpacity:.92,
 ease:'easeOut' as const,cssEase:'cubic-bezier(.22,1,.36,1)',
});
export const iosDefaultSpring=Object.freeze({type:'spring' as const,stiffness:440,damping:44,mass:1});
export const iosQuickSpring=Object.freeze({type:'spring' as const,stiffness:650,damping:52,mass:1});
export const APP_SPRING=iosDefaultSpring;
export const PRESS_SPRING=iosQuickSpring;
export const FADE=Object.freeze({duration:MOTION.fast,ease:MOTION.ease});
export const INSTANT=Object.freeze({duration:0});
export const BUTTON_REST=Object.freeze({y:0,scale:1});
export const BUTTON_HOVER=Object.freeze({y:MOTION.hoverY});
export const BUTTON_TAP=Object.freeze({scale:MOTION.pressScale,y:0});
export const PROFILE_ENTER=Object.freeze({opacity:[0,1],y:[MOTION.profileY,0],scale:[MOTION.profileScale,1]});
export const PROFILE_EXIT=Object.freeze({opacity:0,y:MOTION.profileExitY,scale:MOTION.profileScale});
export function pageFrames(reduced=false){return reduced?{opacity:[.65,1]}:{opacity:[0,1],x:[MOTION.enterX,0],scale:[MOTION.pageScale,1]};}
export function cardTarget({hovered=false,pressed=false,reduced=false}={}){return {y:!reduced&&hovered&&!pressed?MOTION.cardHoverY:0,scale:!reduced&&pressed?MOTION.cardPressScale:1};}
// Publish the same constants to CSS; no duplicate CSS timing table to drift.
if(typeof document!=='undefined'){
 const style=document.documentElement.style;
 for(const key of ['instant','fast','standard','calm','skeleton'])style.setProperty('--motion-'+key,MOTION[key as keyof typeof MOTION]+'s');
 style.setProperty('--motion-ease',MOTION.cssEase);
 for(const key of ['sheetEnter','legacyEnter','revealEnter'])style.setProperty('--motion-'+key,MOTION[key as keyof typeof MOTION]+'px');
 style.setProperty('--motion-sheet-distance','100%');
 style.setProperty('--motion-login-scale',String(MOTION.loginScale));
 style.setProperty('--motion-sheet-opacity',String(MOTION.sheetOpacity));
 style.setProperty('--motion-subtle-opacity',String(MOTION.subtleOpacity));
 for(const [key,value] of Object.entries({press:MOTION.pressScale,hover:MOTION.cssHover,'nav-active':MOTION.navActive,'nav-hover':MOTION.navHover,'hover-opacity':MOTION.hoverOpacity}))style.setProperty('--motion-'+key,String(value));
}
