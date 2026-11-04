import {useSyncExternalStore} from 'react';

export const mobileViewport=typeof matchMedia==='function'?matchMedia('(max-width:699px)'):null;
const subscribe=(listener:()=>void)=>{
  mobileViewport?.addEventListener('change',listener);
  return()=>mobileViewport?.removeEventListener('change',listener);
};
export const useMobileLayout=()=>useSyncExternalStore(subscribe,()=>mobileViewport?.matches||false,()=>false);

// Navigation has a tablet breakpoint independent of the page/form layout.
export const bottomNavigationViewport=typeof matchMedia==='function'?matchMedia('(max-width:1024px)'):null;
const subscribeBottomNavigation=(listener:()=>void)=>{
 bottomNavigationViewport?.addEventListener('change',listener);
 return()=>bottomNavigationViewport?.removeEventListener('change',listener);
};
export const useBottomNavigationLayout=()=>useSyncExternalStore(subscribeBottomNavigation,()=>bottomNavigationViewport?.matches||false,()=>false);
