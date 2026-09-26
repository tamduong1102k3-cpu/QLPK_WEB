import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from './Notification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [bellNotifications, setBellNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message) => {
    addNotification(message, 'success');
  }, [addNotification]);

  const showError = useCallback((message) => {
    addNotification(message, 'error');
  }, [addNotification]);

  const showInfo = useCallback((message) => {
    addNotification(message, 'info');
  }, [addNotification]);

  const showWarning = useCallback((message) => {
    addNotification(message, 'warning');
  }, [addNotification]);

  // ── Toast xác nhận (có nút Đồng ý / Hủy) ──
  const [confirmNotification, setConfirmNotification] = useState(null);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    setConfirmNotification({ message, onConfirm, onCancel });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmNotification(null);
  }, []);

  // ── Thông báo chuông (NotificationBell) ──
  const addBellNotification = useCallback((notif) => {
    setBellNotifications(prev => {
      // Tránh trùng lặp theo id
      if (prev.some(n => n.id === notif.id)) return prev;
      return [{ ...notif, read: notif.read ?? false, createdAt: notif.createdAt ?? new Date() }, ...prev];
    });
  }, []);

  const markBellAsRead = useCallback((id) => {
    setBellNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllBellAsRead = useCallback(() => {
    setBellNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAllBell = useCallback(() => {
    setBellNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{
      showSuccess, showError, showInfo, showWarning, showConfirm,
      bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, clearAllBell,
    }}>
      {children}
      <div className="notification-container">
        {notifications.map(n => (
          <Notification
            key={n.id}
            message={n.message}
            type={n.type}
            show={true}
            onClose={() => removeNotification(n.id)}
            duration={n.duration}
          />
        ))}
      </div>
      {confirmNotification && (
        <div className="confirm-overlay">
          <div className="confirm-container">
            <Notification
              message={confirmNotification.message}
              type="confirm"
              show={true}
              onConfirm={confirmNotification.onConfirm}
              onCancel={confirmNotification.onCancel}
              onClose={closeConfirm}
              duration={0}
            />
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;