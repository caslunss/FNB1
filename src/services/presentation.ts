import {Children,type ReactNode} from 'react';
/** Keep empty-state fallbacks while composing JSX instead of concatenating HTML. */
export function viewList(nodes:ReactNode[]):ReactNode {return viewGroup(...nodes);}
export function viewGroup(...nodes:ReactNode[]):ReactNode {
 const children=Children.toArray(nodes).filter(node=>node!=='');
 return children.length?children:null;
}
