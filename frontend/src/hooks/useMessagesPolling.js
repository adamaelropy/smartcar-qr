import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMessages } from '../services/api';

/**
 * Reusable polling hook for messages.
 * Single-interval hook — consumers should share via context to avoid duplicate polling.
 * Handles cleanup, abort on unmount, and visibility-aware polling.
 */
export function useMessagesPolling(token, isAuthenticated, intervalMs = 5000) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);
  const intervalRef = useRef(null);

  const fetchAndUpdate = useCallback(async (showLoading = false) => {
    if (!isAuthenticated || !token) {
      setThreads([]);
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    // Abort previous request if still pending
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const { ok, data } = await fetchMessages(token, { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (ok && Array.isArray(data?.messages)) {
        setThreads(data.messages);
      } else {
        // keep existing threads on error; do not wipe
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
      // network error — keep previous data
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    // initial load outside effect callback is intentional polling setup
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAndUpdate(true);
    intervalRef.current = window.setInterval(() => {
      if (document.visibilityState === 'visible') fetchAndUpdate(false);
    }, intervalMs);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetchAndUpdate, intervalMs]);

  const refresh = useCallback(() => fetchAndUpdate(false), [fetchAndUpdate]);

  return { threads, setThreads, loading, refresh };
}
