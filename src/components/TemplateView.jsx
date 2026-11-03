import Taxes from './Taxes.jsx';
import SwipeLedgerRow from './SwipeLedgerRow.jsx';
import GoalEditor from './GoalEditor.jsx';
import FileUpload from './FileUpload.jsx';
import CreditInvestments,{InvestmentArea} from './CreditInvestments.jsx';
import ProgressGauge from './ProgressGauge.jsx';
import NotificationPreferences from './NotificationPreferences.jsx';
import ProgressiveFields from './ProgressiveFields.jsx';
import ShareDebt from './ShareDebt.jsx';
import AccountDataControls from './AccountDataControls.jsx';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {GlassSurface,SettingsOption,GlassTextField,FinanceActionMenu,GlassActionEditor, ThemeSwitch, FinanceSegments,FinanceGlassButton as GlassButton,FinanceGlassCard as GlassCard} from './LiquidControls.jsx';
import LayoutSettings from './LayoutSettings.jsx';

// The existing, escaped finance templates become React elements. No eval,
// iframe, HTML injection into live pages, or second copy of the financial data.
const roots = new Map();
const booleanProps = new Set(['hidden','disabled','required','multiple','readOnly','autoFocus','open','controls','loop','muted','autoPlay','noValidate','formNoValidate']);
const names = {class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',autofocus:'autoFocus',maxlength:'maxLength',minlength:'minLength',autocomplete:'autoComplete',autocapitalize:'autoCapitalize',spellcheck:'spellCheck',inputmode:'inputMode',rowspan:'rowSpan',colspan:'colSpan',contenteditable:'contentEditable',referrerpolicy:'referrerPolicy',loading:'loading',srcdoc:'srcDoc',viewbox:'viewBox',preserveaspectratio:'preserveAspectRatio','stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap','stroke-linejoin':'strokeLinejoin','stroke-dasharray':'strokeDasharray','stroke-opacity':'strokeOpacity','fill-opacity':'fillOpacity','fill-rule':'fillRule','clip-rule':'clipRule','text-anchor':'textAnchor','dominant-baseline':'dominantBaseline','stop-color':'stopColor','stop-opacity':'stopOpacity'};

function progressiveParts(node){
 const sheet=node.localName==='div'&&node.classList.contains('grid')&&node.parentElement?.classList.contains('sheet');
 const form=node.localName==='form'&&(node.classList.contains('compact-form')||node.id==='carbonForm');
 if(!sheet&&!form)return null;
 const parts={basic:[],advanced:[],actions:[]},shopping=node.getAttribute('data-shopping-form')==='plan';
 const primary=sheet?['sd','sv','sc','incomeKind']:shopping?['name','priceCents','targetCents','url']:node.id==='receiptForm'?['receiptItems','receiptName','receiptTotal','receiptCategory']:node.id==='carbonForm'?['purchase','kg']:['friend','description','amount','code','name','query','price','people'];
 for(const child of node.children){
  if(child.hasAttribute('data-product-preview')||child.querySelector('[data-import-product]')){parts.basic.push(child);continue;}
  const control=child.matches('input,select,textarea')?child:child.querySelector('input:not([type=hidden]),select,textarea');
  if(control){const receiptReview=node.id==='receiptForm'&&(control.type==='checkbox'||control.id==='receiptItems');parts[receiptReview||primary.includes(sheet||node.id==='receiptForm'?control.id:control.name)?'basic':'advanced'].push(child);continue;}
  if(node.id==='receiptForm'&&child.classList.contains('foot')){parts.basic.push(child);continue;}
  if(child.matches('button,[role=alert],[role=status],[data-shopping-error]')||child.querySelector('button[type=submit],button.btn')||child.classList.contains('plan-actions'))parts.actions.push(child);
  else parts.advanced.push(child);
 }
 return parts.basic.length?parts:null;
}

function element(node, key) {
  if (!node)return null;
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || ['SCRIPT','STYLE'].includes(node.tagName)) return null;
  const tag = node.localName, props = {key};
  for (const attribute of node.attributes) {
    const name = attribute.name;
    const mapped = names[name] || (node.namespaceURI === 'http://www.w3.org/2000/svg' && !/^(aria|data)-/.test(name) ? name.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()) : name);
    if (/^on/i.test(name) || ['selected','checked','value','style'].includes(name)) continue;
    props[mapped] = booleanProps.has(mapped) ? true : attribute.value;
  }
  if (node.hasAttribute('style')) {
    props.style = {};
    for (const property of node.style) {
      const name = property.startsWith('--') ? property : property.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()).replace(/^webkit/, 'Webkit');
      props.style[name] = node.style.getPropertyValue(property);
    }
  }
  if (tag === 'input') {
    if (node.type !== 'file' && node.hasAttribute('value')) props.defaultValue = node.getAttribute('value');
    if (['checkbox','radio'].includes(node.type)) props.defaultChecked = node.hasAttribute('checked');
  } else if (tag === 'select') {
    const selected = [...node.querySelectorAll('option[selected]')].map(n=>n.getAttribute('value') ?? n.textContent);
    if (selected.length) props.defaultValue = node.multiple ? selected : selected[0];
  } else if (tag === 'textarea') {
    props.defaultValue = node.textContent;
  } else if (node.hasAttribute('value')) props.value = node.getAttribute('value');
  const progressive=progressiveParts(node);
  if(progressive)props.className=`${props.className||''} te-compact-form`;
  const children=progressive?<ProgressiveFields basic={progressive.basic.map((child,i)=>element(child,'b'+i))} advanced={progressive.advanced.map((child,i)=>element(child,'d'+i))} actions={progressive.actions.map((child,i)=>element(child,'a'+i))}/>:['input','img','br','hr','meta','link','area','base','col','embed','source','track','wbr','textarea'].includes(tag)?undefined:[...node.childNodes].map((child,i)=>element(child,i));
  if(tag==='div'&&node.classList.contains('ledger-row')){const record=node.querySelector('.ledger-detail');const {key:rowKey,...rowProps}=props;return <SwipeLedgerRow key={rowKey} {...rowProps} kind={record?.getAttribute('data-k')} id={record?.getAttribute('data-id')}>{children}</SwipeLedgerRow>;}
  if(node.hasAttribute('data-progress-gauge'))return <ProgressGauge key={key} value={Number(node.getAttribute('data-value'))} label={node.getAttribute('data-label')} status={node.getAttribute('data-status')} indicatorKey={node.getAttribute('data-indicator-key')} known={node.getAttribute('data-known')!=='false'} attention={node.getAttribute('data-attention')==='true'} limit={node.getAttribute('data-limit')==='true'}>{children}</ProgressGauge>;
  if(node.hasAttribute('data-settings-option'))return <SettingsOption key={key} label={node.getAttribute('data-settings-option')} id={node.id}>{children}</SettingsOption>;
  if(tag==='label'){
    const control=node.querySelector('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=color]):not([type=file]):not([type=range]),textarea,select');
    if(control&&control.parentElement===node){const {key:labelKey,...labelProps}=props;const others=[...node.childNodes].filter(child=>child!==control);return <label key={labelKey} {...labelProps} className={`${props.className||''} lg-input te-labeled-field`}><span className="lg-input__label">{others.map((child,i)=>element(child,i))}</span>{element(control,'field')}</label>;}
    if(node.hasAttribute('for'))props.className=`${props.className||''} lg-input__label te-field-label`;
  }
  if((tag==='input'&&!['hidden','checkbox','radio','color','file','range'].includes(node.type))||['textarea','select'].includes(tag))return <GlassTextField key={key}>{React.createElement(tag,props,children)}</GlassTextField>;
  if(tag==='details'&&(node.classList.contains('floating-action-editor')||node.classList.contains('split-create-floating'))){const summary=node.querySelector(':scope > summary');return <GlassActionEditor key={key} showLabel={node.classList.contains('plan-editor')||node.classList.contains('offer-search-editor')} label={summary?.textContent?.trim()||'Adicionar'} icon={element(summary?.querySelector('svg'), 'icon')} className={props.className} initialOpen={props.open}>{[...node.children].filter(child=>child!==summary).map((child,i)=>element(child,i))}</GlassActionEditor>;}
  if(node.hasAttribute('data-glass-actions'))return <FinanceActionMenu key={key} descriptor={{kind:node.getAttribute('data-glass-actions'),k:node.getAttribute('data-k'),id:node.getAttribute('data-id'),date:node.getAttribute('data-date')}} label={props['aria-label']} icon={children} className={props.className}/>;
  if(tag==='button'&&(node.getAttribute('data-a')==='menu'||(node.getAttribute('data-a')==='sheet'&&!node.hasAttribute('data-income-kind')&&!node.hasAttribute('data-id')&&!node.classList.contains('category-line')&&['launch','d','i','g','l'].includes(node.getAttribute('data-k')))||node.getAttribute('data-a')==='addmonth'))return <FinanceActionMenu key={key} descriptor={{kind:node.getAttribute('data-a')==='menu'?'context':'add',k:node.getAttribute('data-k'),id:node.getAttribute('data-id'),a:node.getAttribute('data-a'),date:node.getAttribute('data-date')}} label={props['aria-label']||node.textContent.trim()||'Adicionar'} icon={node.getAttribute('data-a')==='addmonth'?<span className="month-action-label">Adicionar mês {element(node.querySelector('svg'),'icon')}</span>:element(node.querySelector('svg'),'icon')||'+'} disabled={props.disabled} className={`${props.className||''}${node.getAttribute('data-a')==='addmonth'?' month-action':''}`}/>;
  if(tag==='button'&&node.classList.contains('profile-menu-item'))return React.createElement('button',props,children);
  if(tag==='button' && node.hasAttribute('data-theme-toggle')) return <ThemeSwitch key={key}/>;
  if(node.hasAttribute('data-share-debt'))return <ShareDebt key={key}/>;
  if(node.hasAttribute('data-goal-editor'))return <GoalEditor key={key}/>;
  if(tag==='input'&&node.type==='file'){const {key:uploadKey,...fileProps}=props;return <FileUpload {...fileProps} key={uploadKey}/>;}
  if(node.hasAttribute('data-taxes-hub'))return <Taxes key={key}/>;
  if(node.hasAttribute('data-investments-hub'))return <InvestmentArea key={key}/>;
  if(node.hasAttribute('data-credit-investments'))return <CreditInvestments key={key}/>;
  if(node.hasAttribute('data-notification-preferences'))return <NotificationPreferences key={key}/>;
  if(node.hasAttribute('data-account-data-controls'))return <AccountDataControls key={key}/>;
  if(node.hasAttribute('data-layout-settings')) return <LayoutSettings key={key}/>;
  if(node.classList.contains('segments')){
    const buttons=[...node.children].filter(n=>n.tagName==='BUTTON');
    const fields=['data-entry-filter','data-summary-mode','data-chart','data-profile-section'];
    if(buttons.length && buttons.every(n=>fields.some(field=>n.hasAttribute(field)))){
      const items=buttons.map(n=>{const kind=fields.find(field=>n.hasAttribute(field));return {kind,value:n.getAttribute(kind),label:n.textContent,selected:n.getAttribute('aria-pressed')==='true'};});
      return <FinanceSegments key={key} items={items} label={props['aria-label']||'Opções'} className={props.className}/>;
    }
  }
  // Keep tables, calendar cells, data rows and the official Google button intact.
  if(tag==='button' && (node.classList.contains('btn') || node.classList.contains('ib') || node.hasAttribute('data-t') || node.getAttribute('role')==='menuitem' || node.classList.contains('launch-option'))){
    return React.createElement(GlassButton,{...props,type:props.type ?? 'submit',variant:node.getAttribute('role')==='menuitem'?'clear':'glass',destructive:node.classList.contains('d') || ['del','idel','ddel','srem','stoprepeat'].includes(node.getAttribute('data-a')) || node.getAttribute('data-shop-action')==='delete-plan' || node.getAttribute('data-feature')==='split-delete',size:'md',intensity:3,shimmer:true,className:`${props.className||''} te-glass-button`},children);
  }
  const surface=['card','stage','identity-card','entry-summary','overview','info-block','debt-block','kpi','gt','saved-product','split-block'].some(name=>node.classList.contains(name));
  if(surface){
    const nested=!!node.parentElement?.closest('.card,.stage,.identity-card,.entry-summary,.overview');
    if(node.classList.contains('card')&&!['form','details'].includes(tag))return React.createElement(GlassCard,{...props,padding:node.classList.contains('debt-min')?'16px':'var(--pill-padding,24px)',radius:'var(--pill-radius,28px)',className:`${props.className||''} te-glass-surface${nested?' te-glass-nested':''}`},children);
    return React.createElement(GlassSurface,{...props,as:tag,className:`${props.className||''}${nested?' te-glass-nested':''}`},children);
  }
  return React.createElement(tag, props, children);
}

export function TemplateView({markup}) {
  const doc = new DOMParser().parseFromString(markup, 'text/html');
  return [...doc.body.childNodes].map((node,i)=>element(node,i));
}

export function renderHTML(target, markup) {
  if (!target) return;
  for (const [node, entry] of roots) {
    if (node !== target && (target.contains(node) || !node.isConnected)) {
      entry.root.unmount(); roots.delete(node);
    }
  }
  let entry = roots.get(target);
  if (!entry) {entry = {root:createRoot(target), revision:0}; roots.set(target,entry);}
  // Controllers read/focus the resulting fields immediately after a command.
  // A new revision resets uncontrolled forms just as the original screen did.
  flushSync(()=>entry.root.render(<TemplateView key={++entry.revision} markup={String(markup || '')}/>));
}
