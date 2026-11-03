import {exitSurface} from './session-motion.js';
let pending;
window.planLoginTransition=()=>{
 if(pending)return pending;
 try{sessionStorage.setItem('plan12-login-entry',String(Date.now()))}catch{}
 pending=exitSurface(document.querySelector('.login-shell'),{login:true}).finished;
 return pending;
};
