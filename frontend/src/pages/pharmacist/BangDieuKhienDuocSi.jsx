import React, { useState, useEffect, useCallback } from 'react';
import { getPaidInvoicesWithThuocAndStatusApi } from '../../api/hoaDonApi';
import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import NotificationBell from '../../components/NotificationBell';
import useWebSocket from '../../hooks/useWebSocket';
import { useNotification } from '../../components/NotificationContext';
import DanhSachBenhNhanDuocSi from './components/DanhSachBenhNhanDuocSi';
import ChiTietThuocDuocSi from './components/ChiTietThuocDuocSi';
import LichSuDaCapThuoc from './components/LichSuDaCapThuoc';
import QuanLyNhaThuoc from '../../pages/admin/components/QuanLyNhaThuoc';

const BangDieuKhienDuocSi = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('patients');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = React.useRef(false);
  const [patients, setPatients] = useState([]);
  const { bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, clearAllBell } = useNotification();
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayPatients: 0,
  });

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPaidInvoicesWithThuocAndStatusApi();
      if (Array.isArray(data)) {
        setPatients(data);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayPatients = data.filter(p => {
          if (!p.ngayThanhToan) return false;
          const date = new Date(p.ngayThanhToan);
          return date >= today;
        });
        setStats({
          totalPatients: data.length,
          todayPatients: todayPatients.length,
        });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const interval = setInterval(fetchPatients, 30000);
    return () => clearInterval(interval);
  }, [fetchPatients]);

  // WebSocket for real-time updates
  useWebSocket({
    topics: ['/topic/toa-thuoc', '/topic/hoa-don', '/topic/phieu-kham', '/topic/kho-alert'],
    onMessage: (topic, data) => {
      if (['/topic/toa-thuoc', '/topic/hoa-don', '/topic/phieu-kham'].includes(topic)) {
        fetchPatients();
      } else if (topic === '/topic/kho-alert' && data?.action === 'HET_HANG_KHI_CAP') {
        // Show notification when medicine is out of stock during dispensing
        addBellNotification({
          id: Date.now() + Math.random(),
          title: '🚫 Thuốc hết hàng!',
          message: `${data.tenThuoc || `#${data.maThuoc}`} đã hết hàng trong kho khi cấp thuốc.`,
          type: 'error',
          createdAt: new Date(),
          read: false
        });
      }
    }
  });

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
  };

  const handleHistoryReview = (patient) => {
    setSelectedPatient(patient);
    setActiveTab('patients');
  };

  const handleBack = () => {
    setSelectedPatient(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const navItems = [
    { id: 'patients', label: 'Danh Sách Bệnh Nhân', icon: 'group' },
    { id: 'history', label: 'Lịch Sử Đã Cấp', icon: 'history' },
    { id: 'pharmacy', label: 'Quản Lý Thuốc', icon: 'medication' },
    { id: 'lichlamviec', label: 'Lịch Làm Việc', icon: 'calendar_month' },
  ];

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
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-amber-400/50 active:bg-amber-500/60 transition-colors z-30"
            title="Kéo để thay đổi kích thước sidebar"
          />
        )}
        
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-amber-600/30">
              <span className="material-symbols-outlined text-[20px]">
                medication
              </span>
            </div>
            {isSidebarOpen && (
              <span className="font-bold text-xl text-amber-600 tracking-tight">
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
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedPatient(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    activeTab === item.id
                      ? 'bg-amber-50 text-amber-700 font-bold translate-x-1 border border-amber-200'
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
              {selectedPatient
                ? `Bệnh nhân: ${selectedPatient.hoTen}`
                : navItems.find((i) => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              notifications={bellNotifications}
              onMarkAsRead={markBellAsRead}
              onMarkAllAsRead={markAllBellAsRead}
              onClearAll={clearAllBell}
            />
            <UserMenu
              user={user}
              onLogout={onLogout}
              displayName={`Xin chào ${user?.username || ''}`}
              displayRole="Dược sĩ"
              accentColor="amber"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] scroll-smooth">
          {loading && (
            <div className="flex justify-center items-center py-10">
              <div className="flex items-center gap-3 text-gray-500">
                <span className="material-symbols-outlined animate-spin">refresh</span>
                <span className="text-sm font-medium">Đang tải dữ liệu...</span>
              </div>
            </div>
          )}

          {!loading && activeTab === 'patients' && !selectedPatient && (
            <DanhSachBenhNhanDuocSi
              patients={patients}
              onSelectPatient={handlePatientSelect}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
            />
          )}

          {!loading && activeTab === 'patients' && selectedPatient && (
            <ChiTietThuocDuocSi
              patient={selectedPatient}
              onBack={handleBack}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
            />
          )}

          {!loading && activeTab === 'history' && (
            <LichSuDaCapThuoc
              onReview={handleHistoryReview}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
            />
          )}

          {activeTab === 'pharmacy' && (
            <QuanLyNhaThuoc isPharmacist={true} />
          )}

          {activeTab === 'lichlamviec' && (
            <LichLamViecTab user={user} />
          )}
        </main>
      </div>
    </div>
  );
};

export default BangDieuKhienDuocSi;