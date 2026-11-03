import {useSyncExternalStore} from 'react';

export const mobileViewport=typeof matchMedia==='function'?matchMedia('(max-width:699px)'):null;
const subscribe=listener=>{
  mobileViewport?.addEventListener('change',listener);
  return()=>mobileViewport?.removeEventListener('change',listener);
};
export const useMobileLayout=()=>useSyncExternalStore(subscribe,()=>mobileViewport?.matches||false,()=>false);
