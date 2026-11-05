const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const {APP_VERSION,APP_CHANNEL,APP_RELEASE_DATE,APP_VERSION_LABEL}=await import('../src/version.ts');
 const semver=/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
 assert.match(APP_VERSION,semver,'A versão deve ser SemVer válida');
 assert(['alpha','beta','rc','stable'].includes(APP_CHANNEL),'Canal conhecido');
 assert.equal(APP_CHANNEL,APP_VERSION.split('-')[1]?.split('.')[0]||'stable','Canal e pré-lançamento devem concordar');
 assert.match(APP_RELEASE_DATE,/^\d{4}-\d{2}-\d{2}$/);
 assert.equal(new Date(APP_RELEASE_DATE+'T00:00:00Z').toISOString().slice(0,10),APP_RELEASE_DATE,'Data de lançamento válida');
 assert.equal(APP_VERSION_LABEL,`Versão ${APP_VERSION}`);
 const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
 assert.equal(pkg.version,APP_VERSION,'package.json deve espelhar a fonte única');
 if(fs.existsSync('package-lock.json')){
  const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
  if(Object.hasOwn(lock,'version'))assert.equal(lock.version,APP_VERSION,'Versão raiz do lockfile');
  if(lock.packages&&Object.hasOwn(lock.packages,'')&&Object.hasOwn(lock.packages[''],'version'))assert.equal(lock.packages[''].version,APP_VERSION,'Versão do pacote raiz no lockfile');
 }
 const top=fs.readFileSync('CHANGELOG.md','utf8').match(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})$/m);
 assert(top,'O changelog deve ter uma entrada de lançamento');assert.equal(top[1],APP_VERSION,'Primeira entrada do changelog');assert.equal(top[2],APP_RELEASE_DATE);
 function markdown(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const file=path.join(dir,entry.name);return entry.isDirectory()?markdown(file):entry.isFile()&&entry.name.endsWith('.md')?[file]:[]})}
 const docs=['README.md',...markdown('docs')],line=`Versão do documento: ${APP_VERSION}`;
 for(const file of docs)assert.equal(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'').split(/\r?\n/)[0],line,'Versão documental em '+file);
 console.log('PASS versão: SemVer, canal, data, rótulo, package, raízes do lockfile, changelog e '+docs.length+' documentos consistentes');
})().catch(error=>{console.error(error);process.exitCode=1});
