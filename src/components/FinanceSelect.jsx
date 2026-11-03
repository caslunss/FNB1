import React, {Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState} from 'react';
import {FinanceFieldButton as Button} from './LiquidControls.jsx';

const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');

// Native validation, grouped options and older browsers keep the styled system picker.
export default function FinanceSelect(props) {
  const {label, nativeControl, ...nativeProps} = props;
  const children = Children.toArray(props.children);
  const supported = typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;
  if (!supported || (props.required && !nativeControl) || props.multiple || props.size || children.some(child => !isValidElement(child) || child.type !== 'option')) {
    return <select {...nativeProps} aria-label={label || props['aria-label']}/>;
  }
  return <CustomSelect {...props}/>;
}

function CustomSelect({label, nativeControl = false, value, defaultValue, onChange, children, name, disabled = false, id, ...props}) {
  const uid = useId(), listId = `${uid}-list`;
  const options = Children.toArray(children).map(child => ({
    value: String(child.props.value ?? child.props.children),
    label: Children.toArray(child.props.children).join(''),
    disabled: !!child.props.disabled,
  }));
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => String(defaultValue ?? options.find(option => !option.disabled)?.value ?? ''));
  const selected = String(controlled ? value : internal);
  const selectedIndex = options.findIndex(option => option.value === selected);
  const [open, setOpen] = useState(false), [active, setActive] = useState(-1);
  const native = useRef(null), trigger = useRef(null), list = useRef(null);
  const search = useRef({text: '', at: 0}), resetFrame = useRef(null);
  useEffect(() => () => {if (resetFrame.current !== null) cancelAnimationFrame(resetFrame.current);}, []);
  const enabled = options.map((option, index) => option.disabled ? -1 : index).filter(index => index >= 0);

  useLayoutEffect(() => {
    if (nativeControl || label || props['aria-label'] || props['aria-labelledby']) return;
    const enclosing = trigger.current?.closest('label');
    if (!enclosing) return;
    const copy = enclosing.cloneNode(true);
    copy.querySelectorAll('.te-text-field, .finance-select').forEach(node => node.remove());
    const text = copy.textContent.trim();
    if (text) trigger.current.setAttribute('aria-label', text);
  }, [nativeControl, label, props['aria-label'], props['aria-labelledby']]);

  function close() {setOpen(false); search.current.text = '';}
  function show(index) {
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
  function choose(index) {
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
    element.showPopover();
    return () => {if (element.matches(':popover-open')) element.hidePopover();};
  }, [open, options.length]);
  useEffect(() => {
    if (!open) return;
    const outside = event => {if (!trigger.current?.contains(event.target) && !list.current?.contains(event.target)) close();};
    const scroll = event => {if (!list.current?.contains(event.target)) close();};
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
      close();
      // The browser resets a select after the reset event; retain the React-controlled value.
      if (resetFrame.current !== null) cancelAnimationFrame(resetFrame.current);
      resetFrame.current = requestAnimationFrame(() => {resetFrame.current = null; if (native.current?.isConnected) native.current.value = next;});
    };
    form?.addEventListener('reset', reset);
    return () => form?.removeEventListener('reset', reset);
  }, [controlled, value, defaultValue, children]);
  useEffect(() => {if (disabled) close();}, [disabled]);

  function keyDown(event) {
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
      const next = key === 'Home' ? enabled[0] : key === 'End' ? enabled.at(-1) :
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

  return <span className="finance-select">
    <select {...props} ref={element => {native.current = element; if (nativeControl) trigger.current = element;}} id={nativeControl ? id : undefined} name={name}
      value={nativeControl ? undefined : selected} defaultValue={nativeControl ? defaultValue : undefined} disabled={disabled}
      hidden={!nativeControl} aria-hidden={nativeControl ? undefined : true} tabIndex={nativeControl ? props.tabIndex : -1}
      role={nativeControl ? 'combobox' : undefined} aria-haspopup={nativeControl ? 'listbox' : undefined}
      aria-expanded={nativeControl ? open : undefined} aria-controls={nativeControl ? listId : undefined}
      aria-activedescendant={nativeControl && open && active >= 0 ? `${uid}-${active}` : undefined}
      onMouseDown={nativeControl ? event => event.preventDefault() : undefined}
      onClick={nativeControl ? event => {event.preventDefault(); trigger.current.focus({preventScroll: true}); open ? close() : show();} : undefined}
      onKeyDown={nativeControl ? keyDown : undefined} onBlur={nativeControl ? close : undefined}
      onChange={event => {if (!controlled) setInternal(event.target.value); onChange?.(event);}}>{children}</select>
    {!nativeControl && <Button id={id} ref={trigger} className="finance-select-trigger" type="button" role="combobox"
      disabled={disabled} aria-labelledby={props['aria-labelledby']} aria-label={label || props['aria-label']} aria-haspopup="listbox"
      aria-expanded={open} aria-controls={listId} aria-activedescendant={open && active >= 0 ? `${uid}-${active}` : undefined}
      onKeyDown={keyDown} onBlur={close} onClick={() => open ? close() : show()}>
      <span className="finance-select-value">{options[selectedIndex]?.label || 'Selecionar'}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>
    </Button>}
    <div ref={list} id={listId} popover="manual" role="listbox" aria-label={label || props['aria-label']} className="finance-select-list">
      {options.map((option, index) => <div key={option.value} id={`${uid}-${index}`} role="option"
        aria-selected={option.value === selected} aria-disabled={option.disabled || undefined}
        data-index={index} className={`finance-select-option${index === active ? ' is-active' : ''}`}
        onPointerDown={event => event.preventDefault()} onClick={() => choose(index)}>
        <span>{option.label}</span>{option.value === selected && <span aria-hidden="true">✓</span>}
      </div>)}
    </div>
  </span>;
}
