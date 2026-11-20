import React, { useEffect } from 'react';

const Notification = ({
  message,
  show,
  onClose,
  onConfirm,
  onCancel,
  type = 'success',
  duration = 3000,
}) => {
  const isConfirm = type === 'confirm';

  useEffect(() => {
    if (show && !isConfirm) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration, isConfirm]);

  if (!show) return null;

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
    confirm: '⚠',
  };

  const classes = {
    success: 'toast-notification success',
    error: 'toast-notification error',
    info: 'toast-notification info',
    warning: 'toast-notification warning',
    confirm: 'toast-notification confirm',
  };

  return (
    <div className={classes[type] || classes.success}>
      <div className="toast-icon">{icons[type] || icons.success}</div>
      <div className="toast-content">{message}</div>
      {isConfirm ? (
        <div className="toast-actions">
          <button
            className="toast-btn toast-btn-confirm"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
          >
            Đồng ý
          </button>
          <button
            className="toast-btn toast-btn-cancel"
            onClick={() => {
              onCancel?.();
              onClose();
            }}
          >
            Hủy
          </button>
        </div>
      ) : (
        <button className="toast-close" onClick={onClose}>&times;</button>
      )}
    </div>
  );
};

export default Notification;