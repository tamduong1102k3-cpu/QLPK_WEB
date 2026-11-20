/**
 * Global loading manager - cho phép fetchClient tự động bật/tắt loading overlay
 * mà không cần import React context.
 * 
 * Sử dụng pattern observer đơn giản.
 */

let listeners = [];
let loadingCount = 0;
let currentMessage = 'Đang xử lý...';

export const loadingManager = {
  /**
   * Subscribe to loading state changes
   * @param {Function} listener - callback(isLoading, message)
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  },

  /**
   * Show loading overlay
   * @param {string} [message='Đang xử lý...']
   */
  show(message = 'Đang xử lý...') {
    loadingCount++;
    if (loadingCount === 1) {
      currentMessage = message;
      listeners.forEach(l => l(true, currentMessage));
    }
  },

  /**
   * Hide loading overlay
   */
  hide() {
    if (loadingCount > 0) {
      loadingCount--;
      if (loadingCount === 0) {
        listeners.forEach(l => l(false, ''));
      }
    }
  },

  /**
   * Force reset loading state (use with caution)
   */
  reset() {
    loadingCount = 0;
    listeners.forEach(l => l(false, ''));
  },

  /**
   * Get current loading state
   */
  getState() {
    return { isLoading: loadingCount > 0, message: currentMessage };
  }
};

export default loadingManager;