import * as statisticsApi from '../../api/statisticsApi';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import UserMenu from '../../components/UserMenu';
import NotificationBell from '../../components/NotificationBell';
import { useNotification } from '../../components/NotificationContext';
import useWebSocket from '../../hooks/useWebSocket';
import { getKhoCanhBaoApi } from '../../api/khoThuocApi';
import fetchClient from '../../api/fetchClient';
import { getAccessToken, decodeTokenPayload } from '../../api/tokenStore';
import { API_BASE_URL } from '../../api/config';
import QuanLyNhanVien from './components/QuanLyNhanVien';
import QuanLyTaiKhoan from './components/QuanLyTaiKhoan';
import QuanLyNhaThuoc from './components/QuanLyNhaThuoc';
import QuanLyCaLamViec from './components/QuanLyCaLamViec';
import QuanLyThongKe from './components/QuanLyThongKe';
import QuanLyPhong from './components/QuanLyPhong';
import QuanLyDichVu from './components/QuanLyDichVu';
import QuanLyBenhNhan from './components/QuanLyBenhNhan';
import QuanLyChuyenKhoa from './components/QuanLyChuyenKhoa';
const BangDieuKhienAdmin = ({
  onLogout,
  user
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = React.useRef(false);
  const [sapHet, setSapHet] = useState([]);
  const [sapHetLoading, setSapHetLoading] = useState(true);
  const [summary, setSummary] = useState({
    tongBenhNhan: 0,
    lichKhamHomNay: 0,
    doanhThuThang: 0,
    luotKhamTuan: 0,
    topDichVu: []
  });

  const { bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, clearAllBell } = useNotification();
  const thongBaoLoadedRef = useRef(false);

  // Lấy maTaiKhoan admin từ JWT (claim maTaiKhoan cho NHAN_VIEN/QUAN_TRI_VIEN)
  const getMaTaiKhoanAdmin = () => {
    const payload = decodeTokenPayload(getAccessToken());
    return payload?.maTaiKhoan || null;
  };

  // Fetch thông báo persistent từ bảng thong_bao (do scheduler tạo)
  const fetchThongBaoAdmin = useCallback(async () => {
    const ma = getMaTaiKhoanAdmin();
    if (!ma) return;
    try {
      const res = await fetchClient(
        `${API_BASE_URL}/thong-bao/${ma}/QUAN_TRI_VIEN`,
        { skipLoading: true }
      );
      if (!res.ok) return;
      const result = await res.json();
      const list = result?.data ?? result ?? [];
      (Array.isArray(list) ? list : []).forEach(tb => {
        if (tb.id == null) return;
        addBellNotification({
          id: tb.id,
          title: tb.tieuDe || 'Thông báo',
          message: tb.noiDung || '',
          type: 'warning',
          createdAt: tb.createdAt ? new Date(tb.createdAt) : new Date(),
          read: tb.daDoc || false,
        });
      });
    } catch (e) { console.error('fetchThongBaoAdmin:', e); }
  }, [addBellNotification]);

  // Đánh dấu TẤT CẢ đã đọc: gọi BE mark-all-read rồi mới update local
  const handleMarkAllBellAsRead = useCallback(async () => {
    const ma = getMaTaiKhoanAdmin();
    if (ma) {
      try {
        await fetchClient(
          `${API_BASE_URL}/thong-bao/${ma}/QUAN_TRI_VIEN/mark-all-read`,
          { method: 'PUT', skipLoading: true }
        );
      } catch (e) { console.error('handleMarkAllBellAsRead:', e); }
    }
    markAllBellAsRead();
  }, [markAllBellAsRead]);

  // Lấy maTaiKhoan admin để subscribe topic thông báo riêng
  const [maTaiKhoanAdmin, setMaTaiKhoanAdmin] = useState(null);
  useEffect(() => {
    setMaTaiKhoanAdmin(getMaTaiKhoanAdmin());
  }, []);

  // (Bỏ bell synthetic: chuông admin đọc từ bảng thong_bao do scheduler tạo)

  // WebSocket subscription: topic kho chung (giữ bảng số liệu) + topic thong-bao riêng (persistent)
  const wsTopics = useRef(['/topic/kho-alert']).current;
  if (maTaiKhoanAdmin && !wsTopics.includes(`/topic/thong-bao/${maTaiKhoanAdmin}`)) {
    wsTopics.push(`/topic/thong-bao/${maTaiKhoanAdmin}`);
  }
  useWebSocket({
    topics: wsTopics,
    onMessage: (topic, data) => {
      // Thông báo persistent từ scheduler → id DB thật
      if (topic.startsWith('/topic/thong-bao/') && data) {
        if (data.id == null) return;
        addBellNotification({
          id: data.id,
          title: data.tieuDe || 'Thông báo',
          message: data.noiDung || '',
          type: 'warning',
          createdAt: new Date(),
          read: false,
        });
        return;
      }
      // Topic kho-alert: không tạo bell synthetic nữa (chuông đọc từ DB)
    },
  });

  useEffect(() => {
    // Fetch cảnh báo thuốc cho BẢNG dashboard (giữ nguyên), KHÔNG tạo bell synthetic
    getKhoCanhBaoApi().then(data => {
      setSapHet((data || []).filter(item => Number(item.soLuongTon) < 20));
      setSapHetLoading(false);
    }).catch(() => setSapHetLoading(false));

    // Fetch thông báo persistent từ DB cho chuông
    if (!thongBaoLoadedRef.current) {
      thongBaoLoadedRef.current = true;
      fetchThongBaoAdmin();
    }

    // Fetch dashboard summary
    statisticsApi.getDashboardSummaryApi().then(data => {
      if (data) {
        setSummary({
          tongBenhNhan: data.tongBenhNhan ?? 0,
          lichKhamHomNay: data.lichKhamHomNay ?? 0,
          doanhThuThang: data.doanhThuThang ?? 0,
          luotKhamTuan: data.luotKhamTuan ?? 0,
          topDichVu: data.topDichVu ?? []
        });
      }
    }).catch(err => console.error("Error fetching dashboard summary:", err));
  }, [fetchThongBaoAdmin]);

  // Dữ liệu cho Dashboard
  const stats = [{
    title: 'Tổng Bệnh Nhân',
    value: summary.tongBenhNhan.toLocaleString(),
    icon: 'groups',
    color: 'bg-blue-500',
    trend: ''
  }, {
    title: 'Lịch Hẹn Hôm Nay',
    value: summary.lichKhamHomNay.toLocaleString(),
    icon: 'event',
    color: 'bg-green-500',
    trend: ''
  }, {
    title: 'Doanh Thu (Tháng)',
    value: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(summary.doanhThuThang),
    icon: 'payments',
    color: 'bg-orange-500',
    trend: ''
  }];
  const navItems = [{
    id: 'dashboard',
    label: 'Tổng Quan',
    icon: 'dashboard'
  }, {
    id: 'patients',
    label: 'Bệnh Nhân',
    icon: 'person_search'
  }, {
    id: 'employees',
    label: 'Nhân Viên',
    icon: 'badge'
  }, {
    id: 'pharmacy',
    label: 'Kho Thuốc',
    icon: 'medication'
  }, {
    id: 'shifts',
    label: 'Ca Làm Việc',
    icon: 'calendar_month'
  }, {
    id: 'rooms',
    label: 'Phòng Chức Năng',
    icon: 'meeting_room'
  }, {
    id: 'services',
    label: 'Dịch Vụ',
    icon: 'medical_services'
  }, {
    id: 'statistics',
    label: 'Thống Kê',
    icon: 'bar_chart'
  }, {
    id: 'accounts',
    label: 'Tài Khoản',
    icon: 'manage_accounts'
  }, {
    id: 'specialties',
    label: 'Chuyên Khoa',
    icon: 'local_hospital'
  }];
  return <div className="flex h-screen bg-[#f3f4f6] font-body-md text-on-background overflow-hidden">
      
      {/* Sidebar */}
      <aside 
        style={{ width: isSidebarOpen ? sidebarWidth : 80 }}
        className="relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20"
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
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400/50 active:bg-blue-500/60 transition-colors z-30"
            title="Kéo để thay đổi kích thước sidebar"
          />
        )}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl text-primary font-headline-md">MedCore</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map(item => <li key={item.id}>
                <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary-container/10 text-primary font-semibold' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              </li>)}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:text-gray-900 focus:outline-none p-1 rounded-md hover:bg-gray-100">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-800 capitalize">
              {navItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
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
              user={user || { username: 'admin', email: 'admin@medcore.com', hoTen: 'Admin User' }}
              onLogout={onLogout}
              displayName={user?.username ? `Xin chào ${user.username}` : 'Admin User'}
              displayRole={user?.email || 'admin@medcore.com'}
              accentColor="primary"
            />
          </div>
        </header>

        {/* Dashboard Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
          
          {activeTab === 'dashboard' ? <div className="animate-fade-in space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat, index) => <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white ${stat.color}`}>
                      <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                      <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                        <span className={`text-xs font-semibold mb-1 ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-gray-500'}`}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  </div>)}
              </div>

                {/* Top Dịch Vụ & Luợt Khám Tuần */}
                <div className="space-y-6">
                    {/* Luợt khám tuần */}
                    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-md p-6 text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-primary-container font-medium">Lượt Khám Tuần Này</span>
                        <span className="material-symbols-outlined opacity-50">analytics</span>
                      </div>
                      <div className="flex items-end gap-3">
                        <h3 className="text-4xl font-bold">{summary.luotKhamTuan}</h3>
                        <span className="text-sm mb-1 opacity-80">lượt khám</span>
                      </div>
                      <p className="text-xs mt-4 opacity-70 italic">* Tính trong 7 ngày gần nhất bao gồm cả hôm nay</p>
                    </div>

                    {/* Top Dịch Vụ */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h2 className="text-lg font-bold text-gray-800 mb-4">Top Dịch Vụ Sử Dụng</h2>
                      <div className="space-y-4">
                        {summary.topDichVu.length === 0 ? <p className="text-sm text-gray-400 italic text-center py-4">Chưa có dữ liệu dịch vụ</p> : summary.topDichVu.map((item, idx) => {
                    let name = item[0];
                    let count = item[1];
                    const maxCount = summary.topDichVu[0][1];
                    const percent = count / maxCount * 100;
                    return <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 font-medium truncate max-w-[200px]">{name}</span>
                                  <span className="text-gray-500 font-bold">{count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-500 rounded-full" style={{
                          width: `${percent}%`
                        }}></div>
                                </div>
                              </div>;
                  })}
                      </div>
                    </div>
                </div>

              {/* ─n Thuốc Sắp Hết Widget (full width) ─────────────── */}
              <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="material-symbols-outlined text-orange-500 text-xl">medication_liquid</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">⚠ Thuốc Sắp Hết Trong Kho</h2>
                      <p className="text-xs text-gray-400">Dưới 20 đơn vị tồn kho</p>
                    </div>
                  </div>
                  {!sapHetLoading && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full">
                      {sapHet.length} loại thuốc
                    </span>}
                </div>

                {sapHetLoading ? <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span className="text-sm">Đang tải...</span>
                  </div> : sapHet.length === 0 ? <div className="flex items-center justify-center py-8 gap-2 text-green-500">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-sm font-medium">Tất cả thuốc còn đủ hàng!</span>
                  </div> : <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                          <th className="pb-2 font-medium">#</th>
                          <th className="pb-2 font-medium">Tên Thuốc</th>
                          <th className="pb-2 font-medium">Đơn Vị</th>
                          <th className="pb-2 font-medium text-center">Tồn Kho</th>
                          <th className="pb-2 font-medium">Hạn Sử Dụng</th>
                          <th className="pb-2 font-medium text-center">Mức Độ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sapHet.map((item, idx) => {
                    const sl = item.soLuongTon;
                    const level = sl === 0 ? 'Hết hàng' : sl <= 5 ? 'Nguy hiểm' : sl <= 10 ? 'Cảnh báo' : 'Thấp';
                    const levelStyle = sl === 0 ? 'bg-red-100 text-red-700' : sl <= 5 ? 'bg-red-50 text-red-600' : sl <= 10 ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700';
                    const rowBg = sl === 0 ? 'bg-red-50/50' : sl <= 5 ? '' : '';
                    return <tr key={item.idKho} className={`border-b border-gray-100 last:border-0 hover:bg-orange-50/30 ${rowBg}`}>
                              <td className="py-2.5 text-xs text-gray-400">{idx + 1}</td>
                              <td className="py-2.5">
                                <span className="text-sm font-semibold text-gray-800">{item.tenThuoc}</span>
                              </td>
                              <td className="py-2.5 text-sm text-gray-500">{item.donViTinh || '—'}</td>
                              <td className="py-2.5 text-center">
                                <span className={`text-sm font-bold ${sl === 0 ? 'text-red-600' : sl <= 5 ? 'text-red-500' : sl <= 10 ? 'text-orange-500' : 'text-yellow-600'}`}>{sl}</span>
                              </td>
                              <td className="py-2.5 text-sm text-gray-500">
                                {item.hanSuDung ? new Date(item.hanSuDung).toLocaleDateString('vi-VN') : '—'}
                              </td>
                              <td className="py-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${levelStyle}`}>
                                  {level}
                                </span>
                              </td>
                            </tr>;
                  })}
                      </tbody>
                    </table>
                  </div>}
              </div>
      </div> : activeTab === 'patients' ? <QuanLyBenhNhan title="Thông Tin Bệnh Nhân" /> : activeTab === 'employees' ? <QuanLyNhanVien /> : activeTab === 'accounts' ? <QuanLyTaiKhoan /> : activeTab === 'pharmacy' ? <QuanLyNhaThuoc /> : activeTab === 'shifts' ? <QuanLyCaLamViec /> : activeTab === 'statistics' ? <QuanLyThongKe /> : activeTab === 'rooms' ? <QuanLyPhong /> : activeTab === 'services' ? <QuanLyDichVu /> : activeTab === 'specialties' ? <QuanLyChuyenKhoa /> :
        // Placeholder for other tabs
        <div className="flex flex-col items-center justify-center h-full text-gray-400 animate-fade-in">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">
                {navItems.find(i => i.id === activeTab)?.icon}
              </span>
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Chức năng Đang phát triển</h2>
              <p>Màn hình quản lý {navItems.find(i => i.id === activeTab)?.label} sẽ được cập nhật sau.</p>
            </div>}

        </main>
      </div>
    </div>;
};
export default BangDieuKhienAdmin;
