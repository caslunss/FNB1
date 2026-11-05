import MotionProvider from './components/motion/MotionProvider.tsx';
import './styles/app-entry.css';
import {createRoot} from 'react-dom/client';
import './services/auth.ts';
import './services/finance-sync.ts';
import './services/page-motion.ts';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(<MotionProvider><App/></MotionProvider>);
if(import.meta.hot) import.meta.hot.accept(()=>location.reload());
