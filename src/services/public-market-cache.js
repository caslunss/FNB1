// Public market responses only. Never store sessions, bank data or tax records here.
export function createPublicReadCache({ttl = 60_000, maxEntries = 24, now = Date.now} = {}) {
  const values = new Map(), pending = new Map();
  return function read(key, load, {force = false, signal} = {}) {
    if (signal?.aborted) return Promise.reject(new DOMException('Consulta cancelada.', 'AbortError'));
    const cached = values.get(key);
    let promise;
    if (!force && cached && cached.until > now()) {
      values.delete(key); values.set(key, cached);
      promise = Promise.resolve(cached.value);
    } else {
      values.delete(key);
      promise = pending.get(key);
      if (!promise) {
        promise = Promise.resolve().then(load).then(value => {
          values.set(key, {value, until: now() + ttl});
          while (values.size > maxEntries) values.delete(values.keys().next().value);
          return value;
        }).finally(() => pending.delete(key));
        pending.set(key, promise);
      }
    }
    if (!signal) return promise;
    // Cancelling a subscriber must not cancel another page's shared request.
    return new Promise((resolve, reject) => {
      const abort = () => {cleanup(); reject(new DOMException('Consulta cancelada.', 'AbortError'));};
      const cleanup = () => signal.removeEventListener('abort', abort);
      signal.addEventListener('abort', abort, {once: true});
      promise.then(value => {cleanup(); resolve(value);}, error => {cleanup(); reject(error);});
    });
  };
}
const read = createPublicReadCache();
export function readMarketData(path, options) {
  if (!/^\/api\/(?:investments\?|market-economy$)/.test(path)) throw Error('Consulta fora do catálogo público.');
  return read(path, async () => {
    const response = await fetch(path, {signal: AbortSignal.timeout(15_000)});
    let body;
    try {body = await response.json();} catch {throw Error('Publique as funções de servidor para ativar a consulta.');}
    if (!response.ok) {
      const error = Error(body.error || 'Consulta indisponível.');
      error.status = response.status;
      error.retryAfter = Math.max(1, Number(body.retryAfter) || Number(response.headers.get('Retry-After')) || 60);
      throw error;
    }
    return body;
  }, options);
}
