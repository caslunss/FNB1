interface DisposableSession {
  dispose(): void;
}

/** Shares startup across React effect replays; disposes after the last consumer. */
export function createSessionLease<T extends DisposableSession | undefined>(
  start: () => Promise<T>,
) {
  type Entry = { users: number; ready: Promise<T> };
  let current: Entry | undefined;
  let retirement: Promise<void> = Promise.resolve();
  return {
    acquire() {
      if (!current) current = { users: 0, ready: retirement.then(start) };
      const entry = current;
      entry.users++;
      let released = false;
      return {
        ready: entry.ready,
        release() {
          if (released) return;
          released = true;
          entry.users--;
          queueMicrotask(() => {
            if (entry.users !== 0 || current !== entry) return;
            current = undefined;
            retirement = entry.ready
              .then((session) => {
                session?.dispose();
              })
              .catch(() => {});
          });
        },
      };
    },
  };
}
