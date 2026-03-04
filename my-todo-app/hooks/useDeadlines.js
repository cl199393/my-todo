import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/config';

const CACHE_KEY = 'deadlines_cache';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export default function useDeadlines() {
  const [deadlines, setDeadlines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const loadCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) {
        const { data, timestamp } = JSON.parse(raw);
        setDeadlines(data);
        setLastFetched(timestamp);
        return { data, timestamp };
      }
    } catch {}
    return null;
  }, []);

  const fetchDeadlines = useCallback(async (forceTriggerSync = false) => {
    setLoading(true);
    setError(null);
    try {
      if (forceTriggerSync) {
        // Pull-to-refresh triggers a backend sync first
        await fetch(`${BACKEND_URL}/sync`, { method: 'POST' }).catch(() => {});
      }

      const resp = await fetch(`${BACKEND_URL}/deadlines?days=30`);
      if (!resp.ok) throw new Error(`Server error: ${resp.status}`);
      const data = await resp.json();
      const timestamp = Date.now();
      setDeadlines(data);
      setLastFetched(timestamp);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp }));
    } catch (err) {
      setError(err.message);
      // Fall back to cache on network error
      await loadCache();
    } finally {
      setLoading(false);
    }
  }, [loadCache]);

  // Auto-refresh every 5 minutes in foreground
  useEffect(() => {
    loadCache().then(cached => {
      const age = cached ? Date.now() - cached.timestamp : Infinity;
      if (age > CACHE_TTL_MS) {
        fetchDeadlines();
      }
    });

    const interval = setInterval(() => fetchDeadlines(), CACHE_TTL_MS);
    return () => clearInterval(interval);
  }, [fetchDeadlines, loadCache]);

  const dismiss = useCallback(async (id) => {
    try {
      await fetch(`${BACKEND_URL}/deadlines/${encodeURIComponent(id)}/dismiss`, {
        method: 'POST',
      });
      setDeadlines(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { deadlines, loading, error, refresh: () => fetchDeadlines(true), dismiss };
}
