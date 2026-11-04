import React, {useLayoutEffect, useRef} from 'react';

/** Keep editing sheets inside the visible area, including the iOS keyboard. */
export default function EntrySheet({children, ...props}) {
  const sheet = useRef(null);
  useLayoutEffect(() => {
    const scrim = sheet.current.parentElement, viewport = window.visualViewport;
    let frame;
    const measure = () => {
      scrim.style.setProperty('--sheet-viewport-height', `${viewport?.height ?? innerHeight}px`);
      scrim.style.setProperty('--sheet-viewport-top', `${viewport?.offsetTop ?? 0}px`);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      scrim.style.removeProperty('--sheet-viewport-height');
      scrim.style.removeProperty('--sheet-viewport-top');
    };
  }, []);
  return <div {...props} ref={sheet}>{children}</div>;
}
