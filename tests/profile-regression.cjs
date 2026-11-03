const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=require('./project-source.cjs');
const ctx={URL,PROFILE:{name:'Fallback'},window:{planAuth:{user:null,guestName:()=> 'Visitante'}}};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('function profileIdentity(){'),source.indexOf('function vYou(){'))+'\nthis.identity=profileIdentity;this.avatar=avatarMarkup;',ctx);
ctx.esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
assert.equal(ctx.identity().name,'Visitante');assert.equal(ctx.identity().email,'');
ctx.window.planAuth.user={email:'teste@example.com',user_metadata:{full_name:'Nome <teste>',avatar_url:'https://lh3.googleusercontent.com/a/photo'}};
assert.equal(ctx.identity().name,'Nome <teste>');assert.equal(ctx.identity().email,'teste@example.com');assert.equal(ctx.identity().photo,'https://lh3.googleusercontent.com/a/photo');
assert.ok(ctx.avatar(ctx.identity()).includes('Nome &lt;teste&gt;'));assert.ok(!ctx.avatar(ctx.identity()).includes('<teste>'));
for(const url of ['javascript:alert(1)','https://googleusercontent.com.evil.example/a','http://lh3.googleusercontent.com/a']){ctx.window.planAuth.user.user_metadata.avatar_url=url;assert.equal(ctx.identity().photo,'');}
ctx.window.planAuth.user.user_metadata={name:'Nome alternativo',picture:'https://lh3.googleusercontent.com/photo'};
assert.equal(ctx.identity().name,'Nome alternativo');assert.ok(ctx.identity().photo);
console.log('PASS perfil: identidade Google, visitante, foto, fallback e escape HTML.');
