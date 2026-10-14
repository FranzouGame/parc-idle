/** Mini émetteur typé. */
export interface Bus<M> {
  on<K extends keyof M>(ev: K, cb: (payload: M[K]) => void): () => void;
  emit<K extends keyof M>(ev: K, payload: M[K]): void;
}

export function createBus<M>(): Bus<M> {
  const subs = new Map<keyof M, Set<(p: any) => void>>();
  return {
    on(ev, cb) {
      let s = subs.get(ev);
      if (!s) subs.set(ev, (s = new Set()));
      s.add(cb);
      return () => { s!.delete(cb); };
    },
    emit(ev, payload) {
      const s = subs.get(ev);
      if (!s) return;
      for (const cb of [...s]) {
        try { cb(payload); } catch (e) { console.error(e); }
      }
    },
  };
}
