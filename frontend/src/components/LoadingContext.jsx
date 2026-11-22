import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { loadingManager } from '../api/loadingManager';

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Đang xử lý...');
  const executingRef = useRef(false);

  // Subscribe to global loadingManager (used by fetchClient for auto-loading)
  useEffect(() => {
    const unsubscribe = loadingManager.subscribe((isLoading, msg) => {
      if (isLoading) {
        setLoading(true);
        setMessage(msg);
      } else {
        setLoading(false);
        setMessage('Đang xử lý...');
      }
    });
    return unsubscribe;
  }, []);

  /**
   * Wraps an async function with loading overlay + double-click protection.
   * While the function is executing, the overlay is shown and subsequent calls are ignored.
   *
   * @param {Function} asyncFn - The async function to wrap
   * @param {string} [loadingMessage='Đang xử lý...'] - Custom loading message
   * @returns {Function} Wrapped function
   *
   * Usage:
   *   const wrappedSave = withLoading(async () => {
   *     await api.save(data);
   *   }, 'Đang lưu...');
   */
  const withLoading = useCallback((asyncFn, loadingMessage = 'Đang xử lý...') => {
    return async (...args) => {
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
    };
  }, []);

  /**
   * Manually show loading overlay
   */
  const showLoading = useCallback((msg = 'Đang xử lý...') => {
    setMessage(msg);
    setLoading(true);
  }, []);

  /**
   * Manually hide loading overlay
   */
  const hideLoading = useCallback(() => {
    setLoading(false);
    setMessage('Đang xử lý...');
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading: loading, loadingMessage: message, withLoading, showLoading, hideLoading }}>
      {children}
      {/* Global Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          cursor: 'not-allowed'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            padding: '40px 48px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            minWidth: '220px'
          }}>
            <div className="loading-spinner-global" style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#4f46e5',
              borderRadius: '50%',
              animation: 'loading-spin-global 0.8s linear infinite'
            }} />
            <p style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#475569',
              margin: 0,
              textAlign: 'center'
            }}>{message}</p>
          </div>
          <style>{`
            @keyframes loading-spin-global {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </LoadingContext.Provider>
  );
}

/**
 * Hook to use global loading state and wrapper
 *
 * @returns {{ isLoading: boolean, loadingMessage: string, withLoading: Function, showLoading: Function, hideLoading: Function }}
 */
export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useGlobalLoading must be used within a LoadingProvider');
  }
  return context;
}

export default LoadingContext;