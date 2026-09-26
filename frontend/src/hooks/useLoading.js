import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook to manage loading state and prevent double-clicks.
 * Wraps an async function so that while it's executing, loading is true
 * and subsequent calls are blocked until the current execution finishes.
 *
 * @param {Function} asyncFn - The async function to wrap
 * @param {string} [loadingMessage='Đang xử lý...'] - Custom loading message
 * @returns {[Function, boolean, string, Function]} 
 *   [wrappedFn, loading, loadingMessage, setLoading]
 *
 * Usage:
 *   const [handleSubmit, loading] = useLoading(async (data) => {
 *     await api.save(data);
 *   });
 *
 *   // In JSX:
 *   <LoadingOverlay loading={loading} message="Đang lưu..." />
 *   <button onClick={handleSubmit} disabled={loading}>Lưu</button>
 */
export function useLoading(asyncFn, loadingMessage = 'Đang xử lý...') {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(loadingMessage);
  const executingRef = useRef(false);

  const wrappedFn = useCallback(async (...args) => {
    if (executingRef.current) return;
    executingRef.current = true;
    setLoading(true);
    setMessage(loadingMessage);
    try {
      return await asyncFn(...args);
    } finally {
      executingRef.current = false;
      setLoading(false);
    }
  }, [asyncFn, loadingMessage]);

  return [wrappedFn, loading, message, setLoading, setMessage];
}

/**
 * Wraps any async function with a loading guard.
 * Returns a wrapped version that ignores calls while a previous call is still running.
 *
 * @param {Function} asyncFn - The async function to protect
 * @returns {Function} Wrapped function with single-execution guard
 */
export function withLoadingGuard(asyncFn) {
  let executing = false;
  return async (...args) => {
    if (executing) return;
    executing = true;
    try {
      return await asyncFn(...args);
    } finally {
      executing = false;
    }
  };
}