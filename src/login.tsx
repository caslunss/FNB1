import MotionProvider from './components/motion/MotionProvider.tsx';
import React from 'react';
import './styles/login-entry.css';
import {createRoot} from 'react-dom/client';
import './services/auth.ts';
import Login from './components/Login.tsx';

createRoot(document.getElementById('root')!).render(<MotionProvider><Login/></MotionProvider>);
if(import.meta.hot) import.meta.hot.accept(()=>location.reload());
