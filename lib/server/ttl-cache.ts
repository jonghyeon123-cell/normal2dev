import "server-only";

/** 개수와 유효 시간이 정해진 간단한 메모리 캐시. 서버 인스턴스마다 따로 유지된다. */
export function createTtlCache<V>(maxEntries: number, ttlMs: number) {
  const store = new Map<string, { value: V; expiresAt: number }>();

  return {
    get(key: string): V | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: string, value: V) {
      store.delete(key);
      if (store.size >= maxEntries) store.delete(store.keys().next().value!);
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}
