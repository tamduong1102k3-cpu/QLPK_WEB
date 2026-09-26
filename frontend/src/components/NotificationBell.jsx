import React, { useState, useEffect, useRef } from 'react';

const NotificationBell = ({ notifications = [], onMarkAsRead, onMarkAllAsRead, onClearAll }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getIconClass = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600';
      case 'warning':
        return 'bg-amber-50 text-amber-600';
      case 'error':
        return 'bg-rose-50 text-rose-600';
      default:
        return 'bg-blue-50 text-blue-600';
    }
  };

  const getIconName = (type) => {
    switch (type) {
      case 'success':
        return 'check_circle';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all duration-200 relative flex items-center justify-center ${
          isOpen
            ? 'bg-emerald-50 text-emerald-600'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
      >
        <span className="material-symbols-outlined text-[26px]">notifications</span>
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 bg-white rounded-3xl shadow-xl border border-slate-100/80 py-2 z-50 animate-fade-in origin-top-right overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Thông báo</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Bạn có {unreadCount} thông báo chưa đọc
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  onMarkAllAsRead?.();
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Đọc tất cả
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                  <span className="material-symbols-outlined text-[32px]">notifications_off</span>
                </div>
                <p className="text-sm font-semibold text-slate-500">Không có thông báo nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  Các thông báo mới về thanh toán sẽ xuất hiện tại đây.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) {
                      onMarkAsRead?.(notif.id);
                    }
                  }}
                  className={`px-5 py-4 flex gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer relative ${
                    !notif.read ? 'bg-emerald-50/10' : ''
                  }`}
                >
                  {/* Status Indicator Bar */}
                  {!notif.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getIconClass(notif.type)}`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {getIconName(notif.type)}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug truncate ${!notif.read ? 'font-bold text-slate-800' : 'text-slate-600'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${!notif.read ? 'text-slate-600 font-medium' : 'text-slate-500'}`}>
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/50 flex justify-center">
              <button
                onClick={() => {
                  onClearAll?.();
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
                Xóa tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
