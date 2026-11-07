import React from 'react';
import {createRoot} from 'react-dom/client';
import BalanceForecast from '../src/components/BalanceForecast';
import {finance,publishFinance} from '../src/services/finance-runtime';
import type {ForecastSource} from '../src/services/forecast-settings';
import {auth} from '../src/services/auth';
import {initializeLayout} from '../src/services/layout-preferences';
import '../src/styles/app-entry.css';
declare global{interface Window{forecastFixture:(source:ForecastSource)=>void}}
let source:ForecastSource={today:'2026-11-06',transactions:[],cards:[]};
window.planAuth=auth;
finance.forecast={getState:()=>source};
window.forecastFixture=next=>{source=next;publishFinance()};
await initializeLayout();
const root=document.getElementById('qa');if(!root)throw Error('QA root missing');
createRoot(root).render(<div className="workspace-frame"><main className="workspace-main wrap"><div id="app" className="layout-o"><BalanceForecast/></div></main></div>);
