import {createPortal} from 'react-dom';
import React, {Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {FinanceFieldButton as Button} from './LiquidControls.tsx';

type SelectProps=React.ComponentProps<'select'>&{label?:string;nativeControl?:boolean};
const normalize = (text:string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

// Single-choice controls use site UI; the select remains the form/data contract.
export default function FinanceSelect(props:SelectProps) {
  const {label, nativeControl, ...nativeProps} = props;
  const children = Children.toArray(props.children);
  if (props.multiple || props.size || children.some(child => !isValidElement(child) || child.type !== 'option')) {
    return <select {...nativeProps} aria-label={label || props['aria-label']}/>;
  }
  return <CustomSelect {...props}/>;
}

function CustomSelect({label, nativeControl = false, value, defaultValue, onChange, children, name, disabled = false, id, ...props}:SelectProps) {
  const supported = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
  const [validation,setValidation] = useState('');
  const uid = useId(), listId = `${uid}-list`;
  const options = Children.toArray(children).filter((child):child is React.ReactElement<React.ComponentProps<'option'>>=>isValidElement(child)&&child.type==='option').map(child => ({
    value: String(child.props.value ?? child.props.children),
    label: Children.toArray(child.props.children).join(''),
    disabled: !!child.props.disabled,
  }));
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => String(defaultValue ?? options.find(option => !option.disabled)?.value ?? ''));
  const selected = String(controlled ? value : internal);
  const selectedIndex = options.findIndex(option => option.value === selected);
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const native = useRef<HTMLSelectElement>(null!), trigger = useRef<HTMLButtonElement>(null!), list = useRef<HTMLDivElement>(null!);
  const search = useRef({text: '', at: 0}), resetFrame = useRef<number|null>(null);
  useLayoutEffect(()=>{
    if(!nativeControl)return;
    const element=native.current,descriptor=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value')!;
    Object.defineProperty(element,'value',{configurable:true,get(){return descriptor.get!.call(this)},set(next){descriptor.set!.call(this,next);setInternal(descriptor.get!.call(this))}});
    return()=>{Reflect.deleteProperty(element,'value')};
  },[nativeControl]);
  useEffect(() => () => {if (resetFrame.current !== null) cancelAnimationFrame(resetFrame.current);}, []);
  const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);

  useLayoutEffect(() => {
    if (label || props['aria-label'] || props['aria-labelledby']) return;
    const enclosing = trigger.current?.closest('label') || native.current?.labels?.[0];
    if (!enclosing) return;
    const copy = enclosing.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('.te-text-field, .finance-select').forEach(node => node.remove());
    const text = (copy.textContent||'').trim();
    if (text) trigger.current.setAttribute('aria-label', text);
  }, [nativeControl, label, props['aria-label'], props['aria-labelledby']]);

  function close() {setOpen(false); search.current.text = '';}
  function show(index?:number) {
    if (nativeControl && index === undefined) {
      const actual = native.current.value;
      setInternal(actual);
      index = options.findIndex(option => option.value === actual);
    }
    if (index === undefined) index = selectedIndex;
    if (disabled || !enabled.length) return;
    setActive(enabled.includes(index) ? index : enabled[0]);
    setOpen(true);
  }
  function choose(index:number) {
    const option = options[index];
    if (!option || option.disabled) return;
    if (resetFrame.current !== null) {cancelAnimationFrame(resetFrame.current); resetFrame.current = null;}
    native.current.value = option.value;
    native.current.dispatchEvent(new Event('change', {bubbles: true}));
    close();
  }
  useLayoutEffect(() => {
    if (!open) return;
    const element = list.current, rect = trigger.current.getBoundingClientRect();
    const gutter = 12, height = 264;
    const below = innerHeight - rect.bottom - gutter - 8, above = rect.top - gutter - 8;
    const upwards = below < height && above > below;
    const available = Math.max(44, upwards ? above : below);
    Object.assign(element.style, {
      width: `${Math.min(rect.width, innerWidth - gutter * 2)}px`,
      left: `${Math.max(gutter, Math.min(rect.left, innerWidth - rect.width - gutter))}px`,
      top: upwards ? 'auto' : `${rect.bottom + 8}px`,
      bottom: upwards ? `${innerHeight - rect.top + 8}px` : 'auto',
      maxHeight: `${Math.min(height, available)}px`,
    });
    if(supported)element.showPopover();
    return () => {if (supported && element.matches(':popover-open')) element.hidePopover();};
  }, [open, options.length]);
  useEffect(() => {
    if (!open) return;
    const outside = (event:PointerEvent) => {if (!trigger.current?.contains(event.target as Node) && !list.current?.contains(event.target as Node)) close();};
    const scroll = (event:Event) => {if (!list.current?.contains(event.target as Node)) close();};
    document.addEventListener('pointerdown', outside);
    document.addEventListener('scroll', scroll, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('scroll', scroll, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);
  useEffect(() => {
    const form = native.current?.form;
    const reset = () => {
      const next = String(controlled ? value : defaultValue ?? options.find(option => !option.disabled)?.value ?? '');
      if (!controlled) setInternal(next);
      close();setValidation('');
      // The browser resets a select after the reset event; retain the React-controlled value.
      if (resetFrame.current !== null) cancelAnimationFrame(resetFrame.current);
      resetFrame.current = requestAnimationFrame(() => {resetFrame.current = null; if (native.current?.isConnected) native.current.value = next;});
    };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [controlled, value, defaultValue, children]);
  useEffect(() => {if (disabled) close();}, [disabled]);

  function keyDown(event:React.KeyboardEvent<HTMLButtonElement>) {
    const key = event.key;
    if (key === 'Tab') {close(); return;}
    if (key === 'Escape' && open) {event.preventDefault(); event.stopPropagation(); close(); return;}
    if (['Enter', ' '].includes(key)) {
      event.preventDefault();
      if (open) choose(active); else show();
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
      event.preventDefault();
      if (!enabled.length) return;
      const next = key === 'Home' ? enabled[0] : key === 'End' ? enabled.at(-1)! :
        enabled[Math.max(0, Math.min(enabled.length - 1, enabled.indexOf(open ? active : selectedIndex) + (key === 'ArrowDown' ? 1 : -1)))];
      show(next); return;
    }
    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      const now = performance.now(), previous = search.current;
      const text = now - previous.at > 700 ? key : previous.text + key;
      search.current = {text, at: now};
      const index = options.findIndex(option => !option.disabled && normalize(option.label).startsWith(normalize(text)));
      if (index >= 0) show(index);
    }
  }
  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({block: 'nearest'});
  }, [open, active]);

  const popup = <div ref={list} id={listId} popover={supported?'manual':undefined} role="listbox" aria-label={label || props['aria-label']} className="finance-select-list" hidden={!supported&&!open}>
      {options.map((option, index) => <div key={option.value} id={`${uid}-${index}`} role="option"
        aria-selected={option.value === selected} aria-disabled={option.disabled || undefined}
        data-index={index} className={`finance-select-option${index === active ? ' is-active' : ''}`}
        onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>{option.value === selected && <span aria-hidden="true">✓</span>}
      </div>)}
    </div>;
  return <span className="finance-select">
    <select {...props} className={`${props.className||''} finance-select-native`} ref={native} id={nativeControl ? id : undefined} name={name}
      value={nativeControl ? undefined : selected} defaultValue={nativeControl ? defaultValue : undefined} disabled={disabled}
      aria-hidden="true" tabIndex={-1}
      onFocus={()=>trigger.current?.focus({preventScroll:true})}
      onClick={event=>{event.preventDefault();trigger.current?.focus();show()}}
      onInvalid={event=>{event.preventDefault();setValidation(event.currentTarget.validationMessage||'Selecione uma opção.');trigger.current?.focus();props.onInvalid?.(event)}}
      onChange={event => {if (!controlled) setInternal(event.target.value);if(event.target.validity.valid)setValidation('');onChange?.(event);}}>{children}</select>
    <Button id={nativeControl ? undefined : id} ref={trigger} className="finance-select-trigger" type="button" role="combobox"
      disabled={disabled} aria-labelledby={props['aria-labelledby']} aria-label={label || props['aria-label']} aria-haspopup="listbox"
      aria-required={props.required||undefined} aria-invalid={validation?true:undefined} aria-describedby={validation?`${uid}-error`:props['aria-describedby']}
      aria-expanded={open} aria-controls={listId} aria-activedescendant={open && active >= 0 ? `${uid}-${active}` : undefined}
      onKeyDown={keyDown} onBlur={close} onClick={() => open ? close() : show()}>
      <span className="finance-select-value">{options[selectedIndex]?.label || 'Selecionar'}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
    </Button>
    {supported?popup:createPortal(popup,native.current?.closest('dialog')||document.body)}
    {validation&&<span id={`${uid}-error`} role="alert" className="finance-select-error">{validation}</span>}
  </span>;
}
