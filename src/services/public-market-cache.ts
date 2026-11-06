// Public market responses only. Never store sessions, bank data or tax records here.
export function createPublicReadCache({ttl = 60_000, maxEntries = 24, now = Date.now} = {}) {
  const values = new Map<string,{value:unknown;until:number}>(), pending = new Map<string,Promise<unknown>>();
  return function read<T>(key:string, load:()=>PromiseLike<T>|T, {force = false, signal}:{force?:boolean;signal?:AbortSignal} = {}):Promise<T> {
    if (signal?.aborted) return Promise.reject(new DOMException('Consulta cancelada.', 'AbortError'));
    const cached = values.get(key);
    let promise:Promise<T>;
    if (!force && cached && cached.until > now()) {
      values.delete(key); values.set(key, cached);
      promise = Promise.resolve(cached.value as T);
    } else {
      values.delete(key);
      promise = pending.get(key) as Promise<T>;
      if (!promise) {
        promise = Promise.resolve().then(load).then(value => {
          values.set(key, {value, until: now() + ttl});
          while (values.size > maxEntries) values.delete(values.keys().next().value!);
          return value;
        }).finally(() => pending.delete(key));
        pending.set(key, promise);
      }
    }
    if (!signal) return promise;
    // Cancelling a subscriber must not cancel another page's shared request.
    return new Promise<T>((resolve, reject) => {
      const abort = () => {cleanup(); reject(new DOMException('Consulta cancelada.', 'AbortError'));};
      const cleanup = () => signal.removeEventListener('abort', abort);
      signal.addEventListener('abort', abort, {once: true});
      promise.then(value => {cleanup(); resolve(value);}, error => {cleanup(); reject(error);});
    });
  };
}
