const assert=require('node:assert/strict');
(async()=>{
 const {SessionScope}=await import('../src/finance/session/scope.ts');
 const {createSessionLease}=await import('../src/finance/session/lease.ts');
 const originalWindow=global.window;
 let id=0;const timeouts=new Map(),intervals=new Map();
 global.window={setTimeout:fn=>{timeouts.set(++id,fn);return id},clearTimeout:id=>timeouts.delete(id),setInterval:fn=>{intervals.set(++id,fn);return id},clearInterval:id=>intervals.delete(id)};
 try{
  const target=new EventTarget(),scope=new SessionScope(),order=[];let calls=0;
  scope.listen(target,'update',()=>calls++);target.dispatchEvent(new Event('update'));assert.equal(calls,1);
  const cancelled=scope.timeout(()=>calls++);scope.cancelTimeout(cancelled);assert.equal(timeouts.size,0);
  scope.timeout(()=>calls++);scope.interval(()=>calls++);scope.microtask(()=>calls++);
  scope.own(()=>order.push('first'));scope.own(()=>order.push('last'));
  scope.dispose();scope.dispose();await Promise.resolve();
  assert.equal(scope.signal.aborted,true);assert.equal(timeouts.size,0);assert.equal(intervals.size,0);
  target.dispatchEvent(new Event('update'));assert.equal(calls,1);assert.deepEqual(order,['last','first']);
  scope.listen(target,'update',()=>calls++);scope.timeout(()=>calls++);scope.interval(()=>calls++);scope.own(()=>order.push('late'));
  assert.equal(timeouts.size+intervals.size,0);assert.equal(order.at(-1),'late');

  let starts=0,stops=0;
  const leases=createSessionLease(async()=>{starts++;return{dispose(){stops++}}});
  const first=leases.acquire();first.release();const replay=leases.acquire();
  assert.equal(first.ready,replay.ready,'React effect replay must share startup');await replay.ready;assert.equal(starts,1);assert.equal(stops,0);
  replay.release();replay.release();await new Promise(resolve=>queueMicrotask(()=>queueMicrotask(resolve)));assert.equal(stops,1);
  const next=leases.acquire();await next.ready;assert.equal(starts,2);next.release();await new Promise(resolve=>queueMicrotask(()=>queueMicrotask(resolve)));assert.equal(stops,2);

  let finish,sequence=[];
  const pending=createSessionLease(()=>new Promise(resolve=>{finish=()=>resolve({dispose(){sequence.push('dispose')}});sequence.push('start')}));
  const abandoned=pending.acquire();await Promise.resolve();abandoned.release();await Promise.resolve();
  const replacement=pending.acquire();assert.deepEqual(sequence,['start'],'a replacement waits for pending retirement');
  finish();await abandoned.ready;await Promise.resolve();await Promise.resolve();
  // New startup runs only after the abandoned one has been disposed.
  assert.equal(sequence[1],'dispose');await Promise.resolve();assert.equal(sequence[2],'start');finish();await replacement.ready;replacement.release();

  let failures=0;
  const failed=createSessionLease(async()=>{failures++;throw Error('startup failed')});
  const rejected=failed.acquire();await assert.rejects(rejected.ready,/startup failed/);rejected.release();await Promise.resolve();
  const retry=failed.acquire();await assert.rejects(retry.ready,/startup failed/);retry.release();assert.equal(failures,2);
  console.log('PASS workspace lifecycle: event/timer cleanup, abort, idempotence, effect replay, serialized pending restart and failure retry');
 }finally{global.window=originalWindow}
})().catch(error=>{console.error(error);process.exitCode=1});
