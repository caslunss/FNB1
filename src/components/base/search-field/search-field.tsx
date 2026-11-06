import {useRef,useState} from 'react';
import type {ReactNode,Ref} from 'react';
import {SearchField as AriaSearchField,Input,Label,Text} from 'react-aria-components';
import type {SearchFieldProps as AriaSearchFieldProps} from 'react-aria-components';
import {RiSearchLine,RiCloseLine,RiLoader4Line} from '@remixicon/react';

export interface SearchFieldProps extends Omit<AriaSearchFieldProps,'className'|'children'> {
  label?:ReactNode;
  hint?:ReactNode;
  placeholder?:string;
  isLoading?:boolean;
  clearLabel?:string;
  className?:string;
  inputRef?:Ref<HTMLInputElement>;
}

/** BoardUI SearchField adapted to the application's tokens and motion system. */
export function SearchField({label,hint,placeholder,isLoading=false,clearLabel='Limpar pesquisa',className='',inputRef,value:controlledValue,defaultValue='',onChange,onClear,...props}:SearchFieldProps){
  const localRef=useRef<HTMLInputElement>(null);
  const [uncontrolledValue,setUncontrolledValue]=useState(defaultValue);
  const value=controlledValue??uncontrolledValue;
  function change(next:string){setUncontrolledValue(next);onChange?.(next);}
  function clear(){change('');onClear?.();localRef.current?.focus();}
  return <AriaSearchField {...props} value={value} onChange={change} onClear={onClear} aria-label={props['aria-label']??(!label?placeholder:undefined)} className={`group flex w-full min-w-0 flex-col items-start gap-1 ${className}`}>
    {({isEmpty,isDisabled,isInvalid})=><>
      {label&&<Label className="text-sm font-medium text-[var(--layout-form-text)]">{label}{props.isRequired&&<span aria-hidden="true"> *</span>}</Label>}
      <div className={`flex w-full min-w-0 items-center gap-2 rounded-full border bg-[var(--form-field)] px-3 text-[var(--layout-form-text)] shadow-sm focus-within:border-[var(--tint)] focus-within:ring-2 focus-within:ring-[var(--chart-wash)] ${isInvalid?'border-[var(--redT)]':'border-[var(--form-border)]'} ${isDisabled?'opacity-50':''}`}>
        <span aria-hidden="true" className="relative size-5 shrink-0 text-[var(--lb2)]">
          <RiSearchLine className={`absolute inset-0 size-5 transition-[opacity,scale] duration-[var(--motion-fast)] ease-[var(--motion-ease)] motion-reduce:transition-none ${isLoading?'scale-75 opacity-0':'opacity-100'}`}/>
          {isLoading&&<RiLoader4Line className="absolute inset-0 size-5 motion-safe:animate-spin" style={{animationDuration:'var(--motion-calm)'}}/>}
        </span>
        <Input ref={node=>{localRef.current=node;if(typeof inputRef==='function')inputRef(node);else if(inputRef)inputRef.current=node}} name="query" placeholder={placeholder} autoComplete="off" aria-busy={isLoading||undefined} className="board-search-input min-h-11 w-full min-w-0 flex-1 border-0 bg-transparent text-base text-[var(--layout-form-text)] outline-none placeholder:text-[var(--lb2)] sm:min-h-9 sm:text-sm [&::-webkit-search-cancel-button]:hidden"/>
        <button type="button" aria-label={clearLabel} aria-hidden={isEmpty||undefined} tabIndex={-1} disabled={isDisabled||isEmpty} onMouseDown={event=>event.preventDefault()} onClick={clear} className={`board-search-clear grid size-8 shrink-0 place-items-center rounded-full border-0 bg-[var(--soft)] text-[var(--lb2)] transition-[opacity,scale] duration-[var(--motion-fast)] ease-[var(--motion-ease)] motion-reduce:transition-none ${isEmpty||isDisabled?'pointer-events-none scale-50 opacity-0':'scale-100 opacity-100'}`}><RiCloseLine aria-hidden="true" className="size-4"/></button>
      </div>
      {hint&&<Text slot="description" className="text-xs text-[var(--lb2)]">{hint}</Text>}
      {isLoading&&<span role="status" className="sr-only">Pesquisando…</span>}
    </>}
  </AriaSearchField>;
}
