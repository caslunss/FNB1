const assert=require('node:assert/strict');
(async()=>{
 const p=await import('../src/services/username-policy.ts');
 const now=new Date(2026,10,5,12);let raw=null,fail=false;
 const storage={getItem:()=>raw,setItem:(_key,value)=>{if(fail)throw Error('quota');raw=value},removeItem:()=>{raw=null}};
 assert.equal(p.usernameChangeStatus(storage,now).allowed,true);
 const undo=p.reserveUsernameChange(storage,now);assert.equal(p.usernameChangeStatus(storage,now).allowed,false);assert.equal(p.usernameChangeStatus(storage,now).nextMonth,'2026-12');assert.throws(()=>p.reserveUsernameChange(storage,now),/uma vez por mês/);
 assert.equal(p.usernameChangeStatus(storage,new Date(2026,11,1,0)).allowed,true);
 undo();assert.equal(raw,null);
 raw=JSON.stringify({month:'2026-10'});const previous=raw;const undoNext=p.reserveUsernameChange(storage,now);undoNext();assert.equal(raw,previous);
 const rollback=p.reserveUsernameChange(storage,now);raw=JSON.stringify({month:'2026-11',reservationId:'other-tab'});rollback();assert.equal(JSON.parse(raw).reservationId,'other-tab');
 for(const invalid of ['bad JSON','{}','null',JSON.stringify({month:'2026-13'}),JSON.stringify({month:'0000-01'})]){raw=invalid;assert.equal(p.usernameChangeStatus(storage,now).unavailable,true)}
 raw=null;fail=true;assert.throws(()=>p.reserveUsernameChange(storage,now),/quota/);assert.equal(raw,null);fail=false;
 raw=JSON.stringify({month:'2026-12'});assert.equal(p.usernameChangeStatus(storage,now).allowed,false);assert.equal(p.usernameChangeStatus(storage,new Date(2027,0,1)).allowed,true);
 assert.equal(p.usernameChangeStatus({getItem(){throw Error('blocked')}},now).unavailable,true);
 console.log('PASS username policy: calendar month boundary, reservation before remote request, rollback, other-tab preservation, corrupt storage and clock rollback');
})().catch(error=>{console.error(error);process.exitCode=1});
