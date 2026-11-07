// VM regressions execute the current TypeScript implementation, with JSX lowered
// by the same Oxc compiler used by Vite. No copied financial implementation.
const fs=require('node:fs'),vm=require('node:vm');
const {stripTypeScriptTypes}=require('node:module');
const {parseSync,transformSync}=require('rolldown/experimental');
const {jsx,jsxs,Fragment}=require('react/jsx-runtime');
const {renderToStaticMarkup}=require('react-dom/server');
function readExecutableSource(file){
 let source=fs.readFileSync(file,'utf8');
 if(file.endsWith('.tsx')){
  const {program,errors}=parseSync(file,source);if(errors.length)throw Error(errors[0].message);
  const edits=[];
  function visit(node){
   if(!node||typeof node!=='object')return;
   if(['JSXElement','JSXFragment'].includes(node.type)){
    const transformed=transformSync('fixture.tsx','const compiled='+source.slice(node.start,node.end)+';',{jsx:{runtime:'automatic'}});
    if(transformed.errors.length)throw Error(transformed.errors[0].message);
    const expression=parseSync('fixture.js',transformed.code).program.body.filter(node=>node.type==='VariableDeclaration').flatMap(node=>node.declarations).find(node=>node.id.name==='compiled').init;
    edits.push({start:node.start,end:node.end,text:transformed.code.slice(expression.start,expression.end)});return;
   }
   for(const value of Object.values(node)){if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==='object')visit(value)}
  }
  visit(program);
  for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
 }
 return stripTypeScriptTypes(source,{mode:'strip',disableExperimentalWarning:true}).replace(/(\w) +\./g,'$1.').replace(/\b(let|const|var) (\w+) +(?==)/g,'$1 $2');
}
const guards=require('../src/services/type-guards.ts'),errors=require('../src/services/errors.ts'),presentation=require('../src/services/presentation.ts');
function createContext(values={}){const defaults={...require('../src/services/friends-ledger.ts'),...require('../src/services/forecast-settings.ts'),...require('../src/services/recurrence-decisions.ts'),...require('../src/services/retired-feature-compatibility.ts'),...require('../src/services/profile-appearance.ts'),_jsx:jsx,_jsxs:jsxs,_Fragment:Fragment,_reactJsxRuntime:{jsx,jsxs,Fragment},requestFinancePublish(){},...guards,...errors,...presentation,
 // Lexical financial tests do not own a DOM session. Browser and lifecycle tests
 // exercise the real SessionScope, including disposal and asynchronous startup.
 scope:{objectURL:blob=>URL.createObjectURL(blob),revokeURL:url=>URL.revokeObjectURL(url),disposed:false,signal:new AbortController().signal,own(){},listen(target,...args){target?.addEventListener?.(...args)},timeout(...args){return values.setTimeout?.(...args)},cancelTimeout(id){values.clearTimeout?.(id)},interval(...args){return values.setInterval?.(...args)},microtask(fn){values.queueMicrotask?.(fn)}}};for(const [key,value]of Object.entries(defaults))if(!(key in values))values[key]=value;return vm.createContext(values)}
function renderFixture(content){return typeof content==='string'?content:renderToStaticMarkup(content)}
module.exports={readExecutableSource,createContext,renderFixture};
