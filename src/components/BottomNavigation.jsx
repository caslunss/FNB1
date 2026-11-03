import React, {useEffect, useState} from 'react';
import {GlassSurface} from './LiquidControls.jsx';

// Keep the existing finance navigation host: its routes and active state stay intact.
export default function BottomNavigation() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mobile = matchMedia('(max-width: 699px)');
    let previous = Math.max(0, window.scrollY), distance = 0, direction = 0;
    let frame = 0, idle;
    const reset = () => {setCompact(false); distance = 0;};
    const update = () => {
      frame = 0;
      const current = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - innerHeight));
      const delta = current - previous;
      previous = current;
      if (!mobile.matches || current < 24) {reset(); return;}
      if (!delta) return;
      const nextDirection = Math.sign(delta);
      distance = nextDirection === direction ? distance + Math.abs(delta) : Math.abs(delta);
      direction = nextDirection;
      // Accumulate real travel so trackpad noise cannot flicker the bar.
      if (distance >= 10) setCompact(direction > 0);
      clearTimeout(idle);
      idle = setTimeout(reset, 650);
    };
    const scroll = () => {if (!frame) frame = requestAnimationFrame(update);};
    window.addEventListener('scroll', scroll, {passive: true});
    mobile.addEventListener('change', reset);
    return () => {
      window.removeEventListener('scroll', scroll);
      mobile.removeEventListener('change', reset);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
  }, []);
  return <div className="navigation-actions" data-compact={compact} onFocusCapture={() => setCompact(false)}>
    <GlassSurface as="nav" className="tabbar glass" id="tabs" aria-label="Seções"/>
  </div>;
}
