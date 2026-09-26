import React, { useState, useRef } from 'react';
import ModalXemThongTin from '../pages/receptionist/components/ModalXemThongTin';
import ModalDoiMatKhau from '../pages/receptionist/components/ModalDoiMatKhau';

/**
 * Component menu dropdown người dùng — hover để hiện.
 * Props:
 *   user          – object tài khoản hiện tại
 *   onLogout      – callback đăng xuất
 *   displayName   – tên hiển thị trên header (ví dụ: "Lễ Tân", "BS. Nguyễn Văn A")
 *   displayRole   – vai trò / phòng ban hiển thị
 *   accentColor   – prefix màu: "primary" | "indigo" | "blue" | "emerald" v.v. (default = "primary")
 *   avatarIcon    – icon material hoặc chữ cái avatar (default: ký tự đầu username)
 */
const UserMenu = ({
  user,
  onLogout,
  displayName = 'Người dùng',
  displayRole = '',
  accentColor = 'primary',
  avatarIcon
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showXemThongTin, setShowXemThongTin] = useState(false);
  const [showDoiMatKhau, setShowDoiMatKhau] = useState(false);
  const timerRef = useRef(null);

  const clearCloseTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    timerRef.current = setTimeout(() => setShowMenu(false), 200);
  };

  const handleMouseEnter = () => {
    clearCloseTimer();
    setShowMenu(true);
  };

  const handleMouseLeave = () => {
    scheduleClose();
  };

  // Xác định letter avatar
  const letter = avatarIcon || (user?.username?.[0] || user?.hoTen?.[0] || 'U').toUpperCase();

  // Mapping accent colors
  const colors = {
    primary: {
      bg: 'bg-primary/20',
      text: 'text-primary',
      border: 'border-primary/20',
      hoverBg: 'hover:bg-primary/30',
      avatarBg: 'bg-primary/20',
      avatarText: 'text-primary',
      avatarBorder: 'border-primary/30'
    },
    indigo: {
      bg: 'bg-indigo-100',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      hoverBg: 'hover:bg-indigo-200',
      avatarBg: 'bg-indigo-600',
      avatarText: 'text-white',
      avatarBorder: ''
    },
    emerald: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      hoverBg: 'hover:bg-emerald-200',
      avatarBg: 'bg-emerald-600',
      avatarText: 'text-white',
      avatarBorder: ''
    }
  };
  const c = colors[accentColor] || colors.primary;

  return (
    <>
      <div
        className="relative flex items-center gap-3 border-l border-gray-200 pl-4 ml-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Thông tin người dùng */}
        <div className="text-right hidden sm:block">
          <p className="font-bold text-sm text-gray-800">{displayName}</p>
          {displayRole && (
            <p className={`${c.text} text-[10px] uppercase font-bold tracking-wider`}>
              {displayRole}
            </p>
          )}
        </div>

        {/* Avatar button */}
        <button
          className={`w-9 h-9 ${c.bg} rounded-xl flex items-center justify-center ${c.text} font-bold border ${c.border} ${c.hoverBg} transition-colors cursor-pointer`}
        >
          {letter}
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <div
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-40"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Header info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="font-bold text-sm text-gray-800 truncate">{displayName}</p>
              <p className="text-gray-500 text-xs truncate">{user?.email || '---'}</p>
            </div>

            {/* Xem thông tin */}
            <button
              onClick={() => { setShowMenu(false); setShowXemThongTin(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400 text-[20px]">person</span>
              Xem thông tin
            </button>

            {/* Đổi mật khẩu */}
            <button
              onClick={() => { setShowMenu(false); setShowDoiMatKhau(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <span className="material-symbols-outlined text-gray-400 text-[20px]">lock</span>
              Đổi mật khẩu
            </button>

            <div className="border-t border-gray-100 my-1"></div>

            {/* Đăng xuất */}
            <button
              onClick={() => { setShowMenu(false); onLogout?.(); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              Đăng xuất
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showXemThongTin && (
        <ModalXemThongTin user={user} onClose={() => setShowXemThongTin(false)} />
      )}
      {showDoiMatKhau && (
        <ModalDoiMatKhau user={user} onClose={() => setShowDoiMatKhau(false)} />
      )}
    </>
  );
};

export default UserMenu;