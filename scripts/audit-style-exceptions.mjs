import fs from 'node:fs';
import crypto from 'node:crypto';
import postcss from 'postcss';
const output='docs/style-exceptions.json';
function reason(selector,property,conditions){
 if(/prefers-reduced-motion|forced-colors/.test(conditions))return 'Acessibilidade: prevalência sobre efeitos e estilos da biblioteca neste modo.';
 if(/focus|disabled|aria-disabled/.test(selector))return 'Estado de interação: preservar o foco do tema, o estado desabilitado e a leitura do controle.';
 if(/tabbar|navigation|nav-icon|bottom/.test(selector))return 'Navegação: manter a geometria, a composição de vidro e os estados mobile/desktop existentes.';
 if(/dialog|overlay|scrim|sheet|popover|menu/.test(selector))return 'Sobreposição: preservar a superfície, o recorte e o posicionamento sobre controles e gráficos.';
 if(/reflect|refract|clone|shimmer|rim|before|after/.test(selector))return 'Composição do vidro: impedir reflexos duplicados, recortes ou heranças incompatíveis da biblioteca.';
 if(/input|select|textarea|button|btn|lg-|field|calendar|month/.test(selector))return 'Controle universal: prevalência do sistema atual sobre regras básicas e estilos internos da biblioteca.';
 if(/font|text|line-height|color/.test(property))return 'Identidade visual: preservar tipografia, legibilidade e tokens de tema já vigentes.';
 if(conditions.includes('@media'))return 'Responsividade: manter a disposição existente no breakpoint correspondente.';
 return 'Composição da página: compatibilidade de cascata da superfície/layout vigente; preservada pela comparação visual.';
}
const entries=[];
for(const name of fs.readdirSync('src/styles').filter(name=>name.endsWith('.css')).sort()){
 const file='src/styles/'+name;
 postcss.parse(fs.readFileSync(file,'utf8'),{from:file}).walkDecls(declaration=>{
  if(!declaration.important)return;
  let node=declaration.parent,selector='',parents=[];
  while(node){if(node.type==='rule'&&!selector)selector=node.selector;if(node.type==='atrule')parents.unshift('@'+node.name+' '+node.params);node=node.parent;}
  const conditions=parents.join(' > ');
  entries.push({file,line:declaration.source.start.line,selector,conditions,property:declaration.prop,value:declaration.value,reason:reason(selector,declaration.prop,conditions)});
 });
}
const inventory={count:entries.length,policy:'Exceções de prioridade explícitas do design vigente. Alterações exigem revisão da cascata e comparação visual; não há autorização para crescer este inventário silenciosamente.',sha256:crypto.createHash('sha256').update(JSON.stringify(entries)).digest('hex'),entries};
const serialized=JSON.stringify(inventory,null,2)+'\n';
if(process.argv.includes('--write')){fs.writeFileSync(output,serialized);console.log('Inventário salvo:',entries.length,'exceções.');}
else {if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==serialized){console.error('Inventário de exceções mudou. Revise a cascata e execute --write após validar o design.');process.exitCode=1;}else console.log('PASS exceções CSS:',entries.length,'declarações revisáveis, sem crescimento ou mudança silenciosa.');}
