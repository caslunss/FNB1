import {calendarKeys} from './calendar-keyboard';
import CalendarIcon from './CalendarIcon.tsx';
import {localDay} from '../services/dates.ts';
import React, {useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {GlassSurface, FinanceCalendarButton, FinanceGlassButton as Button,FinanceOptionBar} from './LiquidControls.tsx';

const iso = (year:number, month:number, day:number) => `${String(year).padStart(4, '0')}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;


// The real date input retains constraints, form submission and legacy DOM access.
export default function DatePicker(props:React.ComponentProps<'input'>) {
  const input = useRef<HTMLInputElement>(null!), dialog = useRef<HTMLDialogElement>(null!), trigger = useRef<HTMLButtonElement>(null!), title = useId();
  const [month, setMonth] = useState(() => new Date()), [selected, setSelected] = useState('');
  const [limits, setLimits] = useState({min: '', max: ''});
  const year = month.getFullYear(), index = month.getMonth();
  const days = new Date(year, index + 1, 0).getDate(), offset = new Date(year, index, 1).getDay();
  function open() {
    const field = input.current;
    if(dialog.current.open)return;
    if (field.matches(':disabled') || field.readOnly) return;
    let value = field.value || localDay();
    if (field.min && value < field.min) value = field.min;
    if (field.max && value > field.max) value = field.max;
    const [y, m, d] = value.split('-').map(Number);
    setMonth(new Date(y, m - 1, d)); setSelected(field.value);
    setLimits({min: field.min, max: field.max});
    dialog.current.showModal();requestAnimationFrame(()=>dialog.current.querySelector<HTMLElement>('[aria-pressed=true]:not(:disabled),.date-picker-grid button:not(:disabled)')?.focus());
  }
  function choose(value:string) {
    const field = input.current;
    if(field.matches(':disabled')||field.readOnly||field.min&&value<field.min||field.max&&value>field.max)return;
    // Use the platform setter so React detects changes on controlled inputs too.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(field, value);
    field.dispatchEvent(new Event('input', {bubbles: true}));
    field.dispatchEvent(new Event('change', {bubbles: true}));
    dialog.current.close();
  }
  const previous = iso(year, index, 1), next = iso(year, index, days);
  return <><span className="date-field"><GlassSurface as="span" className="lg-input__field te-text-field"><input {...props} type="date"
      onPointerDown={event=>{props.onPointerDown?.(event);if(!event.defaultPrevented)event.preventDefault()}}
      onClick={event=>{props.onClick?.(event);if(!event.defaultPrevented){event.preventDefault();open()}}}
      ref={node=>{input.current=node!;if(typeof props.ref==='function')props.ref(node);else if(props.ref)props.ref.current=node}}/></GlassSurface>
    <Button ref={trigger} type="button" className="date-picker-open ib" aria-label="Abrir calendário" aria-haspopup="dialog" disabled={props.disabled || props.readOnly} onClick={open}><CalendarIcon/></Button></span>
    {createPortal(<dialog ref={dialog} className="month-picker-dialog date-picker-dialog" aria-labelledby={title} onClose={() => trigger.current?.focus({preventScroll: true})} onClick={e => {if (e.target === dialog.current) dialog.current.close();}}>
      <header><h2 id={title}>Selecionar data</h2><Button type="button" className="ib" aria-label="Fechar calendário" onClick={() => dialog.current.close()}>×</Button></header>
      <FinanceOptionBar as="div" className="month-picker-year"><Button type="button" className="ib" aria-label="Mês anterior" disabled={!!limits.min && previous <= limits.min.slice(0, 7) + '-01'} onClick={() => setMonth(new Date(year, index - 1, 1))}>‹</Button><strong aria-live="polite">{month.toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}</strong><Button type="button" className="ib" aria-label="Próximo mês" disabled={!!limits.max && next >= limits.max} onClick={() => setMonth(new Date(year, index + 1, 1))}>›</Button></FinanceOptionBar>
      <div className="date-picker-grid" onKeyDown={event=>calendarKeys(event,7)} role="group" aria-label="Dias do mês">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(day => <span key={day} className="cal-weekday">{day}</span>)}
        {Array.from({length: offset}, (_, i) => <span key={`empty-${i}`} aria-hidden="true"/>)}
        {Array.from({length: days}, (_, i) => {const value = iso(year, index, i + 1); return <FinanceCalendarButton key={value} type="button" aria-label={new Date(year, index, i + 1).toLocaleDateString('pt-BR', {dateStyle: 'full'})} aria-pressed={value === selected} disabled={!!(limits.min && value < limits.min || limits.max && value > limits.max)} onClick={() => choose(value)}>{i + 1}</FinanceCalendarButton>;})}
      </div>
    </dialog>, document.body)}</>;
}
