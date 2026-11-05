/** Owns resources created by one workspace, including failed initializations. */
export class SessionScope {
  private cleanups: (() => void)[] = [];
  private timeouts = new Set<number>();
  private intervals = new Set<number>();
  private urls = new Set<string>();
  private controller = new AbortController();
  private closed = false;

  get disposed() {
    return this.closed;
  }
  get signal() {
    return this.controller.signal;
  }

  own(cleanup: () => void) {
    if (this.closed) cleanup();
    else this.cleanups.push(cleanup);
  }

  listen<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    listener: (event: WindowEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  listen<K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    listener: (event: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  listen<K extends keyof HTMLElementEventMap>(
    target: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  listen<K extends keyof MediaQueryListEventMap>(
    target: MediaQueryList | null,
    type: K,
    listener: (event: MediaQueryListEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): void;
  listen(
    target: EventTarget | null,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ): void;
  listen(
    target: EventTarget | null,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (this.closed || !target) return;
    target.addEventListener(type, listener, options);
    this.own(() => target.removeEventListener(type, listener, options));
  }

  timeout(callback: () => void, delay = 0): number {
    if (this.closed) return 0;
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      if (!this.closed) callback();
    }, delay);
    this.timeouts.add(id);
    return id;
  }

  cancelTimeout(id: number | undefined) {
    if (id === undefined) return;
    window.clearTimeout(id);
    this.timeouts.delete(id);
  }

  interval(callback: () => void, delay: number): number {
    if (this.closed) return 0;
    const id = window.setInterval(() => {
      if (!this.closed) callback();
    }, delay);
    this.intervals.add(id);
    return id;
  }

  microtask(callback: () => void) {
    queueMicrotask(() => {
      if (!this.closed) callback();
    });
  }

  objectURL(blob: Blob) {
    if (this.closed) throw Error('Sessão encerrada.');
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revokeURL(url: string) {
    URL.revokeObjectURL(url);
    this.urls.delete(url);
  }

  dispose() {
    if (this.closed) return;
    this.closed = true;
    this.controller.abort();
    for (const id of this.timeouts) window.clearTimeout(id);
    for (const id of this.intervals) window.clearInterval(id);
    this.timeouts.clear();
    this.intervals.clear();
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls.clear();
    for (const cleanup of this.cleanups.reverse()) {
      try {
        cleanup();
      } catch (error) {
        console.error('Falha ao encerrar recurso do workspace', error);
      }
    }
    this.cleanups = [];
  }
}
