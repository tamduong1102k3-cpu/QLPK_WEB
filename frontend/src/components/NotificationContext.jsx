import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import Notification from './Notification';
import fetchClient from '../api/fetchClient';
import { getAccessToken, decodeTokenPayload } from '../api/tokenStore';
import { API_BASE_URL } from '../api/config';

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
  // Ref mirror để clearAllBell rollback khi BE lỗi
  const bellNotificationsRef = useRef([]);
  useEffect(() => {
    bellNotificationsRef.current = bellNotifications;
  }, [bellNotifications]);

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
    // Gọi BE đánh dấu đã đọc theo id (không chặn UI)
    fetchClient(`${API_BASE_URL}/thong-bao/${id}/mark-read`, {
      method: 'PUT',
      skipLoading: true,
    }).catch((e) => console.error('markBellAsRead:', e));
    setBellNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllBellAsRead = useCallback(async (maTaiKhoanOverride, loaiOverride) => {
    // Gọi BE mark-all-read theo role của token hiện tại (QUAN_TRI_VIEN hoặc NHAN_VIEN)
    // Cho phép dashboard truyền maTaiKhoan/loai tường minh để khỏi đoán role.
    try {
      let ma = maTaiKhoanOverride ?? null;
      let loai = loaiOverride ?? null;
      if (ma == null || loai == null) {
        const payload = decodeTokenPayload(getAccessToken());
        ma = ma ?? payload?.maTaiKhoan ?? payload?.maTaiKhoanBn ?? null;
        const role = payload?.role || '';
        loai = loai ?? (role === 'QUAN_TRI_VIEN' ? 'QUAN_TRI_VIEN'
          : (role === 'BENH_NHAN' ? 'BENH_NHAN' : 'NHAN_VIEN'));
      }
      if (ma && loai) {
        await fetchClient(
          `${API_BASE_URL}/thong-bao/${ma}/${loai}/mark-all-read`,
          { method: 'PUT', skipLoading: true }
        );
      }
    } catch (e) { console.error('markAllBellAsRead:', e); }
    setBellNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteBellNotification = useCallback((id) => {
    // Xóa 1 thông báo trên BE rồi mới xóa local (rollback nếu lỗi)
    setBellNotifications(prev => prev.filter(n => n.id !== id));
    fetchClient(`${API_BASE_URL}/thong-bao/${id}`, {
      method: 'DELETE',
      skipLoading: true,
    }).catch((e) => console.error('deleteBellNotification:', e));
  }, []);

  const clearAllBell = useCallback(async (maTaiKhoanOverride, loaiOverride) => {
    // Xóa TẤT CẢ trên BE theo (maTaiKhoan, loai) rồi mới xóa local
    const prev = bellNotificationsRef.current;
    setBellNotifications([]);
    try {
      let ma = maTaiKhoanOverride ?? null;
      let loai = loaiOverride ?? null;
      if (ma == null || loai == null) {
        const payload = decodeTokenPayload(getAccessToken());
        ma = ma ?? payload?.maTaiKhoan ?? payload?.maTaiKhoanBn ?? null;
        const role = payload?.role || '';
        loai = loai ?? (role === 'QUAN_TRI_VIEN' ? 'QUAN_TRI_VIEN'
          : (role === 'BENH_NHAN' ? 'BENH_NHAN' : 'NHAN_VIEN'));
      }
      if (ma && loai) {
        await fetchClient(
          `${API_BASE_URL}/thong-bao/${ma}/${loai}/all`,
          { method: 'DELETE', skipLoading: true }
        );
      }
    } catch (e) {
      console.error('clearAllBell:', e);
      // Rollback: khôi phục list cũ để user không mất dữ liệu oan
      setBellNotifications(prev);
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      showSuccess, showError, showInfo, showWarning, showConfirm,
      bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead,
      deleteBellNotification, clearAllBell,
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