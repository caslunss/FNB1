/** Type predicates keep the existing native validation semantics. */
export const isSafeInteger=(value:unknown):value is number=>Number.isSafeInteger(value);
export const isInteger=(value:unknown):value is number=>Number.isInteger(value);
export const isObject=<T>(value:T):value is T & object=>!!value&&typeof value==='object'&&!Array.isArray(value);
export const includesValue=<T>(values:readonly T[],value:unknown):value is T=>values.includes(value as T);
