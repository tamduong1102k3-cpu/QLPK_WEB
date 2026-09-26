import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../../api/config';
import { getAllApi } from '../../api/hoaDonApi';
import { getTodayApi } from '../../api/phieuKhamApi';
import fetchClient from '../../api/fetchClient';
import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import ThanhToan from './components/ThanhToan';
import LichSuThanhToan from './components/LichSuThanhToan';
import useWebSocket from '../../hooks/useWebSocket';
import NotificationBell from '../../components/NotificationBell';
import { useNotification } from '../../components/NotificationContext';
import { getAccessToken } from '../../api/tokenStore';

const BangDieuKhienThuNgan = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('payment');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = useRef(false);
  const [stats, setStats] = useState({
    hoaDonHomNay: 0,
    choThanhToan: 0,
    daThanhToan: 0,
    doanhThuHomNay: 0,
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showSuccess, showError, bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, clearAllBell } = useNotification();
  const lastHandledRef = useRef({ maHoaDon: null, ts: 0 });
  const baseUrl = localStorage.getItem('apiBaseUrl') || API_BASE_URL.replace(/\/api$/, '');

  // Lấy maTaiKhoan của nhân viên (bảng tai_khoan) từ token
  const getMaTaiKhoanNhanVien = () => {
    const token = getAccessToken();
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.maTaiKhoan || payload.userId || null;
    } catch (e) {
      console.error('Error decoding token:', e);
      return null;
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const invoices = await getAllApi();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayInvoices = (invoices || []).filter(inv => {
        if (!inv.ngayThanhToan) return false;
        const invDate = new Date(inv.ngayThanhToan);
        return invDate >= today;
      });

      const choThanhToan = (invoices || []).filter(
        inv => inv.trangThai?.toLowerCase() === 'chua thanh toan'
      );
      const daThanhToan = todayInvoices.filter(
        inv => inv.trangThai?.toLowerCase() === 'da thanh toan'
      );
      const doanhThu = daThanhToan.reduce(
        (sum, inv) => sum + (Number(inv.tongTien) || 0),
        0
      );

      setStats({
        hoaDonHomNay: todayInvoices.length,
        choThanhToan: choThanhToan.length,
        daThanhToan: daThanhToan.length,
        doanhThuHomNay: doanhThu,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  // Fetch tất cả thông báo HOA_DON dành cho NHÂN VIÊN (chỉ của chính nhân viên đang đăng nhập)
  const fetchAllHoaDonNotifications = useCallback(async () => {
    try {
      const maTaiKhoan = getMaTaiKhoanNhanVien();
      const url = `${baseUrl}/api/thong-bao/reference-type/HOA_DON?loaiNguoiNhan=NHAN_VIEN${maTaiKhoan ? `&maTaiKhoan=${maTaiKhoan}` : ''}`;
      const response = await fetchClient(url);
      const result = await response.json();
      if (result?.success && Array.isArray(result.data)) {
        result.data.forEach(tb => {
          addBellNotification({
            id: tb.id,
            title: tb.tieuDe || 'Thông báo hóa đơn',
            message: tb.noiDung || '',
            type: 'success',
            createdAt: tb.createdAt ? new Date(tb.createdAt) : new Date(),
            read: tb.daDoc || false
          });
        });
      }
    } catch (error) {
      console.error('Error fetching HOA_DON notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Load tất cả thông báo HOA_DON khi component mount
  useEffect(() => {
    fetchAllHoaDonNotifications();
  }, [fetchAllHoaDonNotifications]);

  // Load lại thông báo HOA_DON mỗi khi có refresh trigger (có thanh toán mới)
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchAllHoaDonNotifications();
    }
  }, [refreshTrigger, fetchAllHoaDonNotifications]);

  // Sau khi thanh toán thành công: cập nhật thống kê + tải lại thông báo HOA_DON cho icon chuông
  const handlePaymentSuccess = useCallback(() => {
    fetchStats();
    fetchAllHoaDonNotifications();
  }, [fetchStats, fetchAllHoaDonNotifications]);

  // Đánh dấu TẤT CẢ thông báo của nhân viên (NHAN_VIEN) là đã đọc (da_doc = 1) trên backend
  // Duyệt từng thông báo chưa đọc theo id (id lấy trực tiếp từ DB) để cập nhật đúng bản ghi.
  // KHÔNG phụ thuộc maTaiKhoan từ JWT (hệ thống chưa đưa ma_tai_khoan vào token).
  const handleMarkAllBellAsRead = useCallback(async () => {
    // Cập nhật local state NGAY LẬP TỨC để badge biến mất (UX không bị kẹt)
    markAllBellAsRead();

    // Lấy danh sách id thông báo chưa đọc hiện có trong chuông để gọi API mark-read theo id
    const unreadIds = bellNotifications
      .filter(n => !n.read && n.id != null)
      .map(n => n.id);

    if (unreadIds.length === 0) return;

    try {
      // Gọi API đánh dấu đã đọc cho từng thông báo theo id (đảm bảo update da_doc = 1 đúng bản ghi)
      await Promise.all(unreadIds.map(id =>
        fetchClient(`${baseUrl}/api/thong-bao/${id}/mark-read`, { method: 'PUT', skipLoading: true })
      ));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      showError('Không thể cập nhật trạng thái đã đọc');
    }
  }, [baseUrl, markAllBellAsRead, bellNotifications, showError]);

  // Fetch thong_bao từ backend cho thu ngân
  // Gọi API thật từ bảng thong_bao, không dùng local notification
  const fetchPaymentNotifications = useCallback(async () => {
    try {
      const maTaiKhoanNhanVien = getMaTaiKhoanNhanVien();
      if (!maTaiKhoanNhanVien) return;

      // Gọi API lấy thông báo chưa đọc dành cho nhân viên (loaiNguoiNhan = "NHAN_VIEN")
      const response = await fetchClient(`${baseUrl}/api/thong-bao/${maTaiKhoanNhanVien}/NHAN_VIEN?chiChuaDoc=true`);
      const result = await response.json();

      if (result?.success && Array.isArray(result.data)) {
        result.data.forEach(tb => {
          addBellNotification({
            id: tb.id,
            title: tb.tieuDe,
            message: tb.noiDung,
            type: 'success',
            createdAt: tb.createdAt ? new Date(tb.createdAt) : new Date(),
            read: tb.daDoc || false
          });
        });
      }
    } catch (error) {
      console.error('Error fetching notification from API:', error);
    }
  }, []);

  // Lấy maTaiKhoan của nhân viên (bảng tai_khoan) từ token để subscribe WebSocket topic thông báo
  const [maTaiKhoanNhanVien, setMaTaiKhoanNhanVien] = useState(null);
  useEffect(() => {
    setMaTaiKhoanNhanVien(getMaTaiKhoanNhanVien());
  }, []);

  // Build danh sách topics WebSocket, bao gồm topic thông báo riêng cho thu ngân (theo maTaiKhoan nhân viên)
  const wsTopics = [
    '/topic/payment',
    '/topic/hoa-don',
    '/topic/phieu-kham',
    '/topic/dang-ky-kham',
    ...(maTaiKhoanNhanVien ? [`/topic/thong-bao/${maTaiKhoanNhanVien}`] : [])
  ];

  // WebSocket subscription for realtime payment notifications and invoice updates
  useWebSocket({
    topics: wsTopics,
    onMessage: (topic, data) => {
      if (topic === '/topic/payment') {
        const now = Date.now();
        // Dedup: bỏ qua nếu cùng maHoaDon trong vòng 2 giây
        if (
          lastHandledRef.current.maHoaDon === data.maHoaDon &&
          now - lastHandledRef.current.ts < 2000
        ) {
          return;
        }
        lastHandledRef.current = { maHoaDon: data.maHoaDon, ts: now };

        // Fetch thông báo thanh toán từ API thay vì hardcode
        fetchPaymentNotifications();
        fetchStats();
        setRefreshTrigger(prev => prev + 1);
      } else if (topic === '/topic/hoa-don' || topic === '/topic/phieu-kham' || topic === '/topic/dang-ky-kham') {
        fetchStats();
        setRefreshTrigger(prev => prev + 1);
      } else if (topic.startsWith('/topic/thong-bao/') && data && data.loaiNguoiNhan === 'NHAN_VIEN') {
        // Nhận thông báo realtime từ WebSocket - chỉ dành cho nhân viên (NHAN_VIEN)
        addBellNotification({
          id: data.id,
          title: data.tieuDe || 'Thông báo',
          message: data.noiDung || '',
          type: 'success',
          createdAt: new Date(),
          read: false
        });
      }
    }
  });

  const navItems = [
    { id: 'payment', label: 'Thanh Toán', icon: 'payments' },
    { id: 'history', label: 'Lịch Sử', icon: 'receipt_long' },
    { id: 'lichlamviec', label: 'Lịch Làm Việc', icon: 'calendar_month' },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-body-md text-on-background overflow-hidden">
      {/* Sidebar */}
      <aside
        style={{ width: isSidebarOpen ? sidebarWidth : 80 }}
        className="relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col shadow-sm z-20"
      >
        {/* Handle kéo dãn sidebar */}
        {isSidebarOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              isResizing.current = true;
              const startX = e.clientX;
              const startWidth = sidebarWidth;
              const onMouseMove = (ev) => {
                if (!isResizing.current) return;
                const newWidth = Math.min(Math.max(startWidth + (ev.clientX - startX), 200), 480);
                setSidebarWidth(newWidth);
              };
              const onMouseUp = () => {
                isResizing.current = false;
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
              };
              window.addEventListener('mousemove', onMouseMove);
              window.addEventListener('mouseup', onMouseUp);
            }}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-emerald-400/50 active:bg-emerald-500/60 transition-colors z-30"
            title="Kéo để thay đổi kích thước sidebar"
          />
        )}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <span className="material-symbols-outlined text-[20px]">
                account_balance
              </span>
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl text-emerald-600 tracking-tight">
                MedCore
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id
                      ? 'bg-emerald-50 text-emerald-700 font-bold translate-x-1 border border-emerald-200'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <span className="material-symbols-outlined">
                    {item.icon}
                  </span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {navItems.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              notifications={bellNotifications}
              onMarkAsRead={markBellAsRead}
              onMarkAllAsRead={handleMarkAllBellAsRead}
              onClearAll={clearAllBell}
            />
            <UserMenu
              user={user}
              onLogout={onLogout}
              displayName={`Xin chào ${user?.username || ''}`}
              displayRole="Thu ngân"
              accentColor="emerald"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] scroll-smooth">
          {activeTab === 'payment' && (
            <ThanhToan
              user={user}
              onPaymentSuccess={handlePaymentSuccess}
              refreshTrigger={refreshTrigger}
            />
          )}

          {activeTab === 'history' && (
            <LichSuThanhToan
              formatCurrency={formatCurrency}
            />
          )}

          {activeTab === 'lichlamviec' && (
            <LichLamViecTab user={user} />
          )}
        </main>
      </div>
    </div>
  );
};

export default BangDieuKhienThuNgan;