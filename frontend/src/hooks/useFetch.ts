import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Query = Record<string, string | number | boolean | undefined | null>;

// Loads `path` (re-fetching when path/query change) with refresh support.
export function useFetch<T>(path: string | null, query?: Query) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [refreshing, setRefreshing] = useState(false);
  const key = path ? path + JSON.stringify(query ?? {}) : null;
  const latest = useRef(key);
  latest.current = key;

  const load = useCallback(
    async (mode: 'initial' | 'refresh' | 'silent' = 'initial') => {
      if (!path) return;
      const k = key;
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      try {
        const d = await api<T>(path, { query });
        if (latest.current === k) {
          setData(d);
          setError(null);
        }
      } catch (e: any) {
        if (latest.current === k) setError(e.message);
      } finally {
        if (latest.current === k) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  useEffect(() => {
    load('initial');
  }, [load]);

  const refresh = useCallback(() => load('refresh'), [load]);
  const reload = useCallback(() => load('silent'), [load]);

  return { data, error, loading, refreshing, setData, refresh, reload };
}
