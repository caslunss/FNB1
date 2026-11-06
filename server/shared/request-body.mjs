export class BodySizeError extends Error {
  constructor() {
    super('Request body exceeds its transport limit.');
    this.name = 'BodySizeError';
  }
}

/** Bounded UTF-8 decoding, including split multibyte sequences and a leading BOM. */
export async function readLimitedBody(request, maxBytes) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0)
    throw new RangeError('Invalid request body limit.');
  request.signal.throwIfAborted();
  if (request.bodyUsed) throw new TypeError('Request body was already consumed.');
  if (!request.body) return '';
  const reader = request.body.getReader(), decoder = new TextDecoder();
  let bytes = 0, text = '';
  const cancel = () => { void reader.cancel(request.signal.reason).catch(() => {}); };
  request.signal.addEventListener('abort', cancel, {once: true});
  try {
    request.signal.throwIfAborted();
    for (;;) {
      const {done, value} = await reader.read();
      request.signal.throwIfAborted();
      if (done) return text + decoder.decode();
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        cancel();
        throw new BodySizeError();
      }
      text += decoder.decode(value, {stream: true});
    }
  } finally {
    request.signal.removeEventListener('abort', cancel);
    reader.releaseLock();
  }
}
