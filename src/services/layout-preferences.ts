export type Theme='light'|'dark';
export interface ThemePalette {accent:string;background:string;surface:string}
export interface ThemePreferences extends ThemePalette {opacity:number;blur:number;dim?:number}
export interface LayoutPreferences {version:number;palette:string;intensity:number;circularProgress:boolean;indicators:Record<string,boolean>;sections:Record<string,boolean>;light:ThemePreferences;dark:ThemePreferences&{dim:number}}
const KEY='plan12layout_v1';
export const PALETTES=Object.freeze([
 {id:'aged-white',name:'Branco envelhecido',season:'Essencial',light:{accent:'#557789',background:'#e7e5de',surface:'#f7f4ec'},dark:{accent:'#bac3c5',background:'#17191a',surface:'#272a2b'}},
 {id:'autumn-sand',name:'Areia',season:'Outono',light:{accent:'#856d57',background:'#e8e0d6',surface:'#f6eee4'},dark:{accent:'#c9af93',background:'#1b1816',surface:'#302924'}},
 {id:'autumn-peach',name:'Damasco',season:'Outono',light:{accent:'#966d62',background:'#ecdfd7',surface:'#f9eee7'},dark:{accent:'#d6aea1',background:'#1d1918',surface:'#322926'}},
 {id:'autumn-rose',name:'Rosa chá',season:'Outono',light:{accent:'#8d6e79',background:'#e9dfe2',surface:'#f7edf0'},dark:{accent:'#cbb0bb',background:'#1c181c',surface:'#302830'}},
 {id:'winter-mist',name:'Névoa',season:'Inverno',light:{accent:'#587888',background:'#dfe7e9',surface:'#eef4f5'},dark:{accent:'#a6c2ce',background:'#151a1d',surface:'#242e33'}},
 {id:'winter-lavender',name:'Lavanda',season:'Inverno',light:{accent:'#77718d',background:'#e3e1eb',surface:'#f1eff8'},dark:{accent:'#bfb8d5',background:'#19181f',surface:'#2c2936'}},
 {id:'winter-sage',name:'Sálvia',season:'Inverno',light:{accent:'#5c7c76',background:'#e0e7e2',surface:'#eff5ef'},dark:{accent:'#acc8bf',background:'#151c1a',surface:'#25312c'}},
]);
export const DEFAULT_LAYOUT:LayoutPreferences=Object.freeze({version:1,palette:'aged-white',intensity:3,circularProgress:true,indicators:Object.freeze({}),sections:Object.freeze({credit:true,carbon:true,calendar:true}),
  light:Object.freeze({accent:'#557789',background:'#e7e5de',surface:'#f7f4ec',opacity:66,blur:6}),
  dark:Object.freeze({accent:'#bac3c5',background:'#17191a',surface:'#272a2b',opacity:64,blur:16,dim:70}),
});
const copy=<T>(x:T):T=>JSON.parse(JSON.stringify(x));
const bounded=(x:number|undefined,lo:number,hi:number,fallback:number)=>Number.isFinite(x)?Math.max(lo,Math.min(hi,Math.round(x!))):fallback;
export function normalizeLayout(input?:Partial<LayoutPreferences>|null):LayoutPreferences{
  const next=copy(DEFAULT_LAYOUT);if(!input||input.version!==1)return next;
  const palette=PALETTES.find(x=>x.id===input.palette)||PALETTES[0];next.palette=palette.id;
  next.intensity=bounded(input.intensity,1,10,next.intensity);
  next.sections={credit:typeof input.sections?.credit==='boolean'?input.sections.credit:true,carbon:typeof input.sections?.carbon==='boolean'?input.sections.carbon:true,calendar:typeof input.sections?.calendar==='boolean'?input.sections.calendar:true};
  next.circularProgress=typeof input.circularProgress==='boolean'?input.circularProgress:true;
  if(input.indicators&&typeof input.indicators==='object'&&!Array.isArray(input.indicators))next.indicators=Object.fromEntries(Object.entries(input.indicators).filter(([key,value])=>key.length<=180&&typeof value==='boolean').slice(-256));
  for(const theme of ['light','dark'] as const){const source:Partial<ThemePreferences>=input[theme]||{};
    Object.assign(next[theme],palette[theme]);
    next[theme].opacity=bounded(source.opacity,40,95,next[theme].opacity);
    next[theme].blur=bounded(source.blur,0,28,next[theme].blur);
  }
  next.dark.dim=bounded(input.dark?.dim,0,100,next.dark.dim);
  return next;
}
const rgb=(value:string):number[]=>value.slice(1).match(/../g)!.map(x=>parseInt(x,16));
const toHex=(values:number[])=>'#'+values.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
export function mix(a:string,b:string,weight:number){const x=rgb(a),y=rgb(b);return toHex(x.map((v,i)=>v*(1-weight)+y[i]*weight));}
export function luminance(color:string){return rgb(color).map(v=>{const n=v/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);}
export function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
export function readableColor(color:string,background:string){
  if(contrast(color,background)>=4.5)return color;
  const target=contrast('#ffffff',background)>contrast('#000000',background)?'#ffffff':'#000000';
  for(let i=1;i<=100;i++){const result=mix(color,target,i/100);if(contrast(result,background)>=4.5)return result;}
  return target;
}
const rgba=(color:string,alpha:number)=>`rgb(${rgb(color).join(' ')} / ${alpha})`;
const bestText=(background:string)=>readableColor(contrast('#f5f5f7',background)>contrast('#1d1d1f',background)?'#f5f5f7':'#1d1d1f',background);
export function layoutTokens(layout:LayoutPreferences,theme:string){
  const dark=theme==='dark',p=normalizeLayout(layout)[dark?'dark':'light'],opacity=p.opacity/100;
  const panelOpacity=Math.max(.4,Math.min(.98,opacity+(dark?.12:-.04))),backdrop=mix(p.background,p.surface,panelOpacity);
  const dim=dark?p.dim!/100:0;
  const gentleText=(bg:string)=>readableColor(dark?'#dce1e5':bestText(bg),bg);
  const text=gentleText(p.background),cardText=gentleText(backdrop),formText=gentleText(p.surface);
  const accent=readableColor(p.accent,p.background),muted=readableColor(mix(text,p.background,.3),p.background);
  const fill=dark?mix(p.surface,'#ffffff',.062):'#ffffff';
  const controlText=bestText(mix(p.background,fill,opacity)),cardControlText=bestText(mix(backdrop,fill,opacity));
  return {'--bg':p.background,'--main':p.background,'--card':p.surface,'--elev':mix(p.surface,text,.04),'--lb':text,'--lb2':muted,'--text':text,'--muted':muted,
    '--layout-card-text':cardText,'--layout-card-muted':readableColor(mix(cardText,backdrop,.3),backdrop),'--layout-card-accent':readableColor(p.accent,backdrop),'--layout-card-control-text':cardControlText,'--layout-form-text':formText,
    '--tint':p.accent,'--tintT':accent,'--btn':mix(p.surface,p.accent,.22),'--on-accent':text,'--fill':mix(p.surface,text,.07),'--sel':mix(p.surface,p.accent,.18),
    '--sep':mix(p.surface,text,.18),'--border':mix(p.surface,text,.14),'--line':mix(p.surface,text,.18),'--soft':mix(p.surface,text,.05),'--edge':dark?'rgb(255 255 255 / .09)':'rgb(255 255 255 / .7)',
    '--pill-surface':p.surface,'--pill-border':mix(p.surface,text,.12),'--form-surface':p.surface,'--form-field':mix(p.surface,text,.05),'--form-border':mix(p.surface,text,.2),'--form-label':text,'--sheetbg':p.surface,
    '--chart-accent':readableColor(p.accent,backdrop),'--chart-grid':rgba(cardText,dark?.09:.1),'--chart-wash':rgba(p.accent,dark?.08:.1),'--chart-muted':mix(p.surface,p.accent,.32),'--rail':p.surface,'--glass':rgba(fill,opacity),'--chart-previous':mix(p.surface,p.accent,.4),'--layout-glow':rgba(p.accent,dark?.04:.12),
    '--greenT':readableColor(dark?'#30db5b':'#248a3d',backdrop),'--redT':readableColor(dark?'#ff6961':'#d70015',backdrop),
    '--lg-fg':controlText,'--lg-fg-muted':muted,'--lg-accent':accent,'--lg-fill':rgba(fill,opacity),'--lg-fill-pressed':rgba(fill,dark?Math.min(.98,opacity+.05):.92),
    '--lg-panel-fill':rgba(p.surface,panelOpacity),'--lg-navigation-fill':rgba(fill,dark?opacity:Math.max(.4,opacity-.18)),
    '--lg-menu-fill':rgba(mix(p.surface,text,.04),.96),'--lg-edge':dark?`rgb(255 255 255 / ${(.09-dim*.05).toFixed(3)})`:'rgb(0 0 0 / .06)',
    '--lg-glow':dark?`rgb(255 255 255 / ${(.16-dim*.13).toFixed(3)})`:'rgb(255 255 255 / .55)','--lg-rim-opacity':dark?String(.5-dim*.4):'1',
    '--lg-shadow':dark?'0 8px 28px rgb(0 0 0 / .38),0 1px 3px rgb(0 0 0 / .3)':'0 8px 28px rgb(0 0 0 / .08),0 1px 3px rgb(0 0 0 / .07)',
    '--lg-blur':p.blur+'px','--lg-panel-blur':p.blur+'px','--lg-track':dark?'rgb(120 120 128 / .44)':'rgb(120 120 128 / .26)',
    '--lg-segment-selection':dark?'rgb(255 255 255 / .14)':'rgb(0 0 0 / .08)',
  };
}
let current=copy(DEFAULT_LAYOUT),initialization:Promise<void>|undefined;
const listeners=new Set<()=>void>();
export const getLayout=()=>current;
export const subscribeLayout=(listener:()=>void)=>{listeners.add(listener);return ()=>listeners.delete(listener)};
function apply(){if(typeof document==='undefined')return;const theme=document.documentElement.dataset.theme==='dark'?'dark':'light';
  for(const [key,value]of Object.entries(layoutTokens(current,theme)))document.documentElement.style.setProperty(key,value);
  document.documentElement.dataset.layoutReady='true';
}
function fixedGlass(next:LayoutPreferences){
  return {...next,intensity:DEFAULT_LAYOUT.intensity,
    light:{...next.light,opacity:DEFAULT_LAYOUT.light.opacity,blur:DEFAULT_LAYOUT.light.blur},
    dark:{...next.dark,opacity:DEFAULT_LAYOUT.dark.opacity,blur:DEFAULT_LAYOUT.dark.blur,dim:DEFAULT_LAYOUT.dark.dim}};
}
function publish(next:LayoutPreferences){current=fixedGlass(normalizeLayout(next));apply();for(const listener of listeners)listener();}
export function initializeLayout(){
  return initialization??=(async()=>{try{await window.planAuth?.ready;const raw=window.planAuth?.storage?.getItem(KEY);if(raw)current=normalizeLayout(JSON.parse(raw));}catch{}
    publish(current);const observer=new MutationObserver(apply);observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    window.addEventListener('storage',event=>{if(event.key===window.planAuth?.key(KEY)){try{publish(event.newValue?JSON.parse(event.newValue):DEFAULT_LAYOUT);}catch{}}});
  })();
}
function isPreferenceRecord(value:unknown):value is Record<string,unknown>{return !!value&&typeof value==='object'&&!Array.isArray(value);}
function storedPreferences(next:LayoutPreferences,raw:string|null){
  let previous:unknown;try{previous=JSON.parse(raw||'null');}catch{}
  if(!isPreferenceRecord(previous)||previous.version!==1)return next;
  const saved:Record<string,unknown>={...previous,...next};
  if('intensity' in previous)saved.intensity=previous.intensity;
  for(const theme of ['light','dark'] as const){
    const source=previous[theme];
    if(!isPreferenceRecord(source))continue;
    const fields:Record<string,unknown>={...next[theme]};
    for(const field of ['opacity','blur','dim'])if(field in source)fields[field]=source[field];
    saved[theme]=fields;
  }
  return saved;
}
export function saveLayout(next:LayoutPreferences){const checked=normalizeLayout(next);const storage=window.planAuth?.storage;if(!storage)throw Error('Aguarde a abertura da sua conta.');storage.setItem(KEY,JSON.stringify(storedPreferences(checked,storage.getItem(KEY))));publish(checked);}
export function selectPalette(id:string){if(!PALETTES.some(p=>p.id===id))throw Error('Paleta inválida.');saveLayout({...copy(current),palette:id});}
export function resetLayout(theme:Theme){const next=copy(current);Object.assign(next[theme],copy(DEFAULT_LAYOUT[theme]));next.intensity=DEFAULT_LAYOUT.intensity;next.palette=DEFAULT_LAYOUT.palette;next.circularProgress=true;next.indicators={};saveLayout(next);}

export function setCircularProgress(enabled:boolean){if(typeof enabled!=='boolean')throw Error('Preferência inválida.');saveLayout({...copy(current),circularProgress:enabled});}
export function setIndicatorVisible(key:string,enabled:boolean){if(typeof key!=='string'||!key||key.length>180||typeof enabled!=='boolean')throw Error('Indicador inválido.');saveLayout({...copy(current),indicators:{...current.indicators,[key]:enabled}});}

export function setSectionEnabled(section:string,enabled:boolean){if(!['credit','carbon','calendar'].includes(section)||typeof enabled!=='boolean')throw Error('Aba inválida.');saveLayout({...copy(current),sections:{...current.sections,[section]:enabled}});if(typeof window.dispatchEvent==='function')window.dispatchEvent(new Event('plan-sections-change'));}
