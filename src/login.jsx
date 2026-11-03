import MotionProvider from './components/motion/MotionProvider.tsx';
import React from 'react';
import './styles/root.css';
import {createRoot} from 'react-dom/client';
import './styles/login-base.css';
import '/public/assets/pastel.css';
import '/public/assets/login-design.css';
import '/public/assets/page-motion.css';
import '@zakisheriff/liquid-glass/styles.css';
import './styles/liquid-glass.css';
import './styles/layout-settings.css';
import './styles/login-fullscreen.css';
import './styles/mobile.css';
import './services/auth.js';
import Login from './components/Login.jsx';

createRoot(document.getElementById('root')).render(<MotionProvider><Login/></MotionProvider>);
if(import.meta.hot) import.meta.hot.accept(()=>location.reload());
