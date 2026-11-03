import React,{useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {GlassSurface,GlassTextField,FinanceGlassButton as GlassButton} from './LiquidControls.jsx';

const EMPTY={type:'',category:'',from:'',to:'',min:'',max:''};
const LABELS={i:'Entrada',g:'Gasto',d:'Dívida',k:'Compra'};
function SearchIcon(){return <svg className="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>}
export default function ToolbarSearch(){
  const dialog=useRef(null),trigger=useRef(null),input=useRef(null);
  const [active,setActive]=useState(false),[query,setQuery]=useState(''),[filters,setFilters]=useState(EMPTY),[filtersOpen,setFiltersOpen]=useState(false),[result,setResult]=useState({rows:[],total:0}),[error,setError]=useState('');
  const filtered=Object.values(filters).some(Boolean),hasSearch=!!query.trim()||filtered;
  function open(){setQuery('');setFilters(EMPTY);setFiltersOpen(false);setError('');setResult({rows:[],total:0});setActive(true);dialog.current.showModal();input.current?.focus();}
  function search(){try{const values={...filters,query};for(const k of ['min','max']){if(values[k]==='')delete values[k];else values[k]=Math.round(Number(values[k])*100);}if(values.min>values.max||values.from&&values.to&&values.from>values.to)throw Error('Revise os intervalos.');setResult(hasSearch?(window.planSearchRecords?.(values)||{rows:[],total:0}):{rows:[],total:0});setError('');}catch(err){setError(err.message);setResult({rows:[],total:0});}}
  useEffect(()=>{if(!active)return;const timer=setTimeout(search,140);return()=>clearTimeout(timer)},[active,query,filters]);
  useEffect(()=>{const onKey=e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!document.querySelector('#scrim:not([hidden]),dialog[open]')){e.preventDefault();open();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
  useEffect(()=>{const show=()=>open();addEventListener('plan-mobile-search',show);return()=>removeEventListener('plan-mobile-search',show)},[]);
  function change(e){setFilters(previous=>({...previous,[e.target.name]:e.target.value}));}
  return <><GlassSurface as="div" className="task-search"><GlassButton ref={trigger} className="ib" type="button" aria-label="Pesquisar" onClick={open}><SearchIcon/></GlassButton></GlassSurface>{createPortal(<dialog ref={dialog} className="search-pill-dialog" aria-label="Pesquisar" onClose={()=>{setActive(false);trigger.current?.focus()}} onClick={e=>{if(e.target===dialog.current)dialog.current.close()}}>
    <div className="search-pill-center">
      <form className="search-pill-row" onSubmit={e=>{e.preventDefault();search()}}>
        <GlassTextField className="search-pill-input"><button className="search-submit-icon" type="submit" aria-label="Buscar"><SearchIcon/></button><input ref={input} name="query" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Pesquisar" aria-label="Pesquisar registros" autoComplete="off"/></GlassTextField>
        <GlassButton className="search-filter-toggle" type="button" aria-label="Filtros" aria-expanded={filtersOpen} aria-controls="searchFilterPanel" onClick={()=>setFiltersOpen(!filtersOpen)}><svg className="i" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="19" cy="12" r="1.7"/></svg>{filtered&&<span className="search-filter-dot"/>}</GlassButton>
        <GlassButton className="search-close-toggle ib" type="button" aria-label="Fechar pesquisa" onClick={()=>dialog.current.close()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></GlassButton>
      </form>
      {(filtersOpen||hasSearch||error)&&<div className="search-pill-popover">
        {filtersOpen&&<section id="searchFilterPanel" aria-label="Filtros de pesquisa"><div className="row search-filter-heading"><h2>Filtros</h2><GlassButton type="button" disabled={!filtered} onClick={()=>setFilters(EMPTY)}>Limpar</GlassButton></div><div className="search-filters">
          <label>Tipo<GlassTextField><select name="type" value={filters.type} onChange={change}><option value="">Todos</option>{Object.entries(LABELS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></GlassTextField></label>
          <label>Categoria<GlassTextField><select name="category" value={filters.category} onChange={change}><option value="">Todas</option>{['Gastos Essenciais','Gastos Variáveis','Gastos Fixos','Gastos Supérfluos','Investimentos'].map(x=><option key={x}>{x}</option>)}</select></GlassTextField></label>
          <label>De<GlassTextField><input name="from" type="date" value={filters.from} onChange={change}/></GlassTextField></label><label>Até<GlassTextField><input name="to" type="date" value={filters.to} onChange={change}/></GlassTextField></label>
          <label>Mínimo (R$)<GlassTextField><input name="min" type="number" min="0" step=".01" value={filters.min} onChange={change}/></GlassTextField></label><label>Máximo (R$)<GlassTextField><input name="max" type="number" min="0" step=".01" value={filters.max} onChange={change}/></GlassTextField></label>
        </div></section>}
        {error?<p className="bad" role="alert">{error}</p>:hasSearch&&<><p className="foot" role="status">{result.total} resultado(s){result.total>100?' · 100 mais recentes':''}</p><div className="search-results">{result.rows.map(row=><button className="search-result" key={row.type+row.id} type="button" onClick={()=>{dialog.current.close();requestAnimationFrame(()=>window.planOpenSearchResult(row))}}><span>{row.name}<small>{LABELS[row.type]} · {row.category} · {row.date||'Sem data'}</small></span><b>{(row.cents/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</b></button>)}</div></>}
      </div>}
    </div>
  </dialog>,document.body)}</>;
}
