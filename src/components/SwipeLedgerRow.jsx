import React, {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {FinanceGlassButton as Button} from './LiquidControls.jsx';
import {useMobileLayout} from '../services/mobile-layout.js';

const REVEAL_WIDTH = 112;
export default function SwipeLedgerRow({children, kind, id, ...props}) {
  const mobile = useMobileLayout();
  const root = useRef(null), start = useRef(null), timer = useRef(null);
  const held = useRef(false), dialog = useRef(null), opener = useRef(null);
  const titleId = useId();
  const [offset, setOffset] = useState(0), [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (mobile && confirming && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [mobile, confirming]);
  const readonly = !!window.planIsMonthClosed?.();
  if (!mobile || readonly) return <div {...props}>{children}</div>;

  function reset() {setOpen(false); setOffset(0);}
  function context() {reset(); root.current?.querySelector('.te-action-menu .lg-menu-anchor>button')?.click();}
  function down(event) {
    if (event.button !== 0 || event.clientX < 24 || event.target.closest('button,a,input,select,textarea,[role=button]')) return;
    start.current = {x: event.clientX, y: event.clientY, base: open ? -REVEAL_WIDTH : 0};
    held.current = false;
    timer.current = setTimeout(() => {start.current = null; context(); held.current = true;}, 500);
  }
  function move(event) {
    const point = start.current;
    if (!point) return;
    const dx = event.clientX - point.x, dy = event.clientY - point.y;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) clearTimeout(timer.current);
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {start.current = null; reset(); return;}
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      event.currentTarget.setPointerCapture(event.pointerId);
      setOffset(Math.max(-REVEAL_WIDTH, Math.min(0, point.base + dx)));
    }
  }
  function up(event) {
    clearTimeout(timer.current);
    const point = start.current;
    start.current = null;
    if (!point) return;
    const dx = event.clientX - point.x;
    if (Math.abs(dx) > 12) held.current = true;
    const next = point.base + dx < -REVEAL_WIDTH / 2;
    setOpen(next); setOffset(next ? -REVEAL_WIDTH : 0);
  }
  return <div ref={root} className={`mobile-ledger-row ${open ? 'is-revealed' : ''}`}
    onPointerDown={down} onPointerMove={move} onPointerUp={up}
    onPointerCancel={() => {clearTimeout(timer.current); start.current = null; reset();}}
    onContextMenu={event => {event.preventDefault(); context();}}
    onClickCapture={event => {
      if (event.target.closest('dialog')) return;
      if (held.current) {event.preventDefault(); event.stopPropagation(); held.current = false;}
      else if (open && !event.target.closest('.mobile-swipe-actions')) {reset(); event.preventDefault(); event.stopPropagation();}
    }}>
    <div className="mobile-swipe-actions" inert={!open} aria-hidden={!open}>
      <Button aria-label="Editar lançamento" onClick={() => {reset(); window.planMobile?.rowAction('edit', kind, id);}}>Editar</Button>
      <Button destructive aria-label="Apagar lançamento" onClick={event => {opener.current = event.currentTarget; setConfirming(true);}}>Apagar</Button>
    </div>
    <div {...props} className={`${props.className || ''} mobile-ledger-content`} style={{...props.style, transform: `translateX(${offset}px)`}}>{children}</div>
    {confirming && createPortal(<dialog ref={dialog} className="mobile-confirm-sheet" aria-labelledby={titleId}
      onClose={() => {setConfirming(false); if (opener.current?.isConnected) opener.current.focus();}}
      onClick={event => {if (event.target === dialog.current) dialog.current.close();}}>
      <h2 id={titleId}>Apagar lançamento?</h2>
      <p>O lançamento será removido dos seus dados. Para recuperar, será necessário importar um backup.</p>
      <div className="mobile-confirm-actions">
        <Button onClick={() => dialog.current.close()}>Cancelar</Button>
        <Button destructive onClick={() => {dialog.current.close(); reset(); window.planMobile?.rowAction('delete', kind, id);}}>Apagar</Button>
      </div>
    </dialog>, document.body)}
  </div>;
}
