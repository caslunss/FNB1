const assert=require('node:assert/strict'),vm=require('node:vm');
(async()=>{
 const {readSocialPages,readUsernameBatches}=await import('../src/services/social-pagination.ts');
 const signal=new AbortController().signal;
 const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
 const friends=Array.from({length:250},(_,n)=>({id:id(n+1),created_at:'2026-11-01T12:00:00+00:00',sender:'me',recipient:'friend-'+n,status:'accepted'}));
 let pages=0;
 const sorted=[...friends].reverse();
 const rows=await readSocialPages(cursor=>{pages++;return Promise.resolve({data:sorted.filter(row=>!cursor||row.id<cursor.id).slice(0,100),error:null})},signal);
 assert.equal(rows.length,250);assert.equal(pages,3);assert.deepEqual(rows,sorted);
 await assert.rejects(readSocialPages(()=>Promise.resolve({data:sorted.slice(0,100),error:null}),signal),/inconsistente/);
 await assert.rejects(readSocialPages(()=>Promise.resolve({data:null,error:Error('offline')}),signal),/offline/);
 const stopped=new AbortController();let calls=0;
 await assert.rejects(readSocialPages(()=>{calls++;stopped.abort();return Promise.resolve({data:sorted.slice(0,100),error:null})},stopped.signal));assert.equal(calls,1);
 const batches=[];const names=await readUsernameBatches([...friends.map(row=>row.id),friends[0].id],batch=>{batches.push(batch.length);return Promise.resolve({data:batch.map(user_id=>({user_id,username:'name-'+user_id})),error:null})},signal);
 assert.deepEqual(batches,[100,100,50]);assert.equal(Object.keys(names).length,250);

 // Exercise the live controller delegate without editing existing VM fixtures.
 const source=require('./controller-source.cjs');
 const start=source.indexOf('async function refreshSocial('),text=source.slice(start,source.indexOf('\n',start));
 let fail=false;const shares=friends.slice(0,125).map(row=>({...row,cents:100,description:'Divisão',expense_date:'2026-11-01'}));
 const client={from(table){let limit=100,cursor,stable=false;const query={select(){return query},order(column){if(column==='id')stable=true;return query},limit(n){limit=n;return query},abortSignal(){return query},or(value){cursor=value.match(/id\.lt\.([a-f0-9-]+)/i)?.[1];return query},then(resolve,reject){let data=table==='app_friends'?friends:shares;data=stable?[...data].reverse():data;if(cursor)data=data.filter(row=>row.id<cursor);const error=fail&&cursor?Error('second page failed'):null;return Promise.resolve({data:data.slice(0,limit),error}).then(resolve,reject)}};return query}};
 const oldFriends=[{id:'old-friend'}],oldShares=[{id:'old-share'}];
 const context={window:{planAuth:{client}},scope:{disposed:false,signal},socialUser:()=> 'me',social:{friends:oldFriends,shares:oldShares,busy:false},readSocialPages,refreshUsernames:async()=>{},renderNotifications(){}};
 vm.createContext(context);vm.runInContext(text,context);
 await context.refreshSocial(false);assert.equal(context.social.friends.length,250);assert.equal(context.social.shares.length,125);assert.equal(new Set(context.social.friends.map(row=>row.id)).size,250);
 context.social.friends=oldFriends;context.social.shares=oldShares;fail=true;
 await context.refreshSocial(false);assert.equal(context.social.friends,oldFriends);assert.equal(context.social.shares,oldShares);assert.match(context.social.error,/atualizar/);assert.equal(context.social.busy,false);
 console.log('PASS social pagination: 250 friends, 125 shares, tied timestamps, stable cursor, duplicate-page failure, username batches, cancellation and no partial replacement');
})().catch(error=>{console.error(error);process.exitCode=1});
