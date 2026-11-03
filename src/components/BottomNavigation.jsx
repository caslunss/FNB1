import React from 'react';
import {GlassSurface} from './LiquidControls.jsx';

// Stable geometry: only the selected icon animates; routes retain the same host.
export default function BottomNavigation() {
  return <div className="navigation-actions">
    <GlassSurface as="nav" className="tabbar glass" id="tabs" aria-label="Seções"/>
  </div>;
}
