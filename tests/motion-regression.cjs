const {createContext:fixtureContext,renderFixture}=require('./source-loader.cjs');
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const {APP_SPRING,pageFrames,cardTarget}=await import('../src/services/motion-presets.ts');
 const {spring}=await import('motion');const generator=spring({...APP_SPRING,keyframes:[16,0]});let previous=16;
 for(let ms=0;ms<=2000;ms+=16){const x=generator.next(ms).value;assert(x>=-.001&&x<=previous+.001,'Mola sem overshoot');previous=x}assert(previous<.01);
 assert.deepEqual(pageFrames(true),{opacity:[.65,1]});assert.equal(cardTarget({pressed:true}).scale,.97);assert.equal(cardTarget({pressed:true,reduced:true}).scale,1);assert.equal(cardTarget({hovered:true}).y,-3);
 let controls=[];const media={matches:false,addEventListener(){}};
 const ctx=fixtureContext({window:{},setTimeout,clearTimeout,APP_SPRING,FADE:{duration:.16},PRESS_SPRING:APP_SPRING,pageFrames,cardTarget,matchMedia:()=>media,Map,WeakMap,sessionStorage:{removeItem(){}},addEventListener(){},requestAnimationFrame(){},cancelAnimationFrame(){},document:{readyState:'loading',addEventListener(){}},MutationObserver:class{},animate:(node,frames,options)=>{const control={stopped:false,stop(){this.stopped=true},options,frames};controls.push(control);return control}});
 vm.runInContext(require('./source-loader.cjs').readExecutableSource('src/services/page-motion.ts').replace(/^import .*;$/gm,''),ctx);
 const removed=[],node={isConnected:true,dataset:{},style:{removeProperty:k=>removed.push(k)},removeAttribute(){}};
 ctx.node=node;vm.runInContext('reveal(node,true);reveal(node,true)',ctx);assert(controls[0].stopped);const count=removed.length;controls[0].options.onComplete();assert.equal(removed.length,count,'Conclusão antiga não limpa animação nova');controls[1].options.onComplete();assert(removed.includes('filter'));media.matches=true;vm.runInContext('reveal(node,true)',ctx);assert(!('y' in controls[2].frames));assert(!('backdropFilter' in controls[2].frames));
 const transition=fs.readFileSync('src/components/motion/PageTransition.tsx','utf8');assert(transition.includes('mode="wait"'));assert(transition.includes('inert={!present'));for(const file of ['src/services/session-motion.ts','src/services/login-transition.ts','src/components/motion/PageTransition.tsx'])assert(!/clipPath|backdropFilter|height:|width:|top:|left:/.test(fs.readFileSync(file,'utf8')),file+' somente opacity/transform');
 console.log('PASS motion: mola amortecida, 16 px, compressão .97, redução de movimento e interrupção sem estilos presos.');
})().catch(e=>{console.error(e);process.exitCode=1});
