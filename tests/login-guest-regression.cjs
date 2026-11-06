const assert=require('node:assert/strict');
class Element extends EventTarget {
 hidden=false; value=''; textContent=''; attributes=new Map(); focused=false;
 setAttribute(key,value){this.attributes.set(key,value)}
 focus(){this.focused=true}
}
(async()=>{
 const {bindGuestAccess}=await import('../src/services/login-guest.ts');
 const nodes=Object.fromEntries(['guestToggle','guestForm','guestName','guestStatus'].map(id=>['#'+id,new Element()]));
 const root={querySelector:selector=>nodes[selector]||null},calls=[];
 const auth={useLocal:name=>{if(!name.trim())throw Error('Informe seu nome.');calls.push(name)}};
 const bind=()=>bindGuestAccess(root,()=>auth);
 nodes['#guestForm'].hidden=true;
 let cleanup=bind();
 nodes['#guestToggle'].dispatchEvent(new Event('click'));
 assert.equal(nodes['#guestForm'].hidden,false);
 assert.equal(nodes['#guestToggle'].attributes.get('aria-expanded'),'true');
 assert.equal(nodes['#guestName'].focused,true);
 const invalid=new Event('submit',{cancelable:true});nodes['#guestForm'].dispatchEvent(invalid);
 assert.equal(invalid.defaultPrevented,true);assert.equal(nodes['#guestStatus'].textContent,'Informe seu nome.');assert.equal(calls.length,0);
 nodes['#guestName'].value='Visitante';nodes['#guestForm'].dispatchEvent(new Event('submit',{cancelable:true}));assert.deepEqual(calls,['Visitante']);
 cleanup();cleanup();nodes['#guestForm'].dispatchEvent(new Event('submit'));assert.equal(calls.length,1);
 cleanup=bind();nodes['#guestForm'].dispatchEvent(new Event('submit'));assert.equal(calls.length,2,'Effect restart must register only one listener');cleanup();
 assert.doesNotThrow(()=>bindGuestAccess({querySelector:()=>null},()=>auth)());
 console.log('PASS independent guest access: toggle, focus, validation, existing auth call, cleanup and effect restart');
})().catch(error=>{console.error(error);process.exitCode=1});
