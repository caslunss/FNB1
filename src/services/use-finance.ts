import {useSyncExternalStore,useCallback} from 'react';
import {getFinanceSnapshot,subscribeFinance} from './finance-runtime.ts';
export function useFinanceSnapshot<K extends Parameters<typeof getFinanceSnapshot>[0]>(key:K){
 const read=useCallback(()=>getFinanceSnapshot(key),[key]);
 return useSyncExternalStore(subscribeFinance,read);
}
