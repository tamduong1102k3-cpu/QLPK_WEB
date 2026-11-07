import { getTodayApi as _getTodayAppointments } from '../../api/lichKhamApi';
import { getAllTodayApi as _getAllTodayRegistrations } from '../../api/dangKyKhamBenhApi';
import { getTodayApi as _getTodayDangKy } from '../../api/dangKyKhamBenhApi';
import { getTodayApi as _getTodayPhieuKham } from '../../api/phieuKhamApi';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import QuanLyBenhNhan from '../../pages/admin/components/QuanLyBenhNhan';
import TheThongKe from './components/TheThongKe';
import QuyTrinhTiepDon from './components/QuyTrinhTiepDon';
import DangKyBenhNhan from './components/DangKyBenhNhan';
import LichKham from './components/LichKham';
import NhomOSoLieu from '../doctor/components/NhomOSoLieu';

import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import QuanLyLichHen from '../../pages/admin/components/QuanLyLichHen';
import QuanLyHoaDon from '../../pages/admin/components/QuanLyHoaDon';
import QuanLyDichVu from '../../pages/admin/components/QuanLyDichVu';
import WebSocketAutoRefresh from '../../hooks/WebSocketAutoRefresh';



const BangDieuKhienLeTan = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = useRef(false);
  const [stats, setStats] = useState({
    LichHenHomNay: 0,
    waitingPatients: 0,
    completedToday: 0,
    todayRevenue: 0
  });
  const [todayRegistrations, setTodayRegistrations] = useState([]);
  const [todayRegistrationsLoading, setTodayRegistrationsLoading] = useState(true);
  const [todayRegistrationsError, setTodayRegistrationsError] = useState('');
  const [quickCheckInAppt, setQuickCheckInAppt] = useState(null);

  const fetchTodayRegistrations = useCallback(async () => {
    try {
      const registrations = await _getAllTodayRegistrations();
      if (registrations != null && !Array.isArray(registrations)) {
        throw new Error('API đăng ký khám bệnh trả về dữ liệu không đúng định dạng.');
      }
      setTodayRegistrations(Array.isArray(registrations) ? registrations : []);
      setTodayRegistrationsError('');
    } catch (error) {
      console.error('Error fetching today registrations:', error);
      setTodayRegistrationsError('Không thể tải danh sách đăng ký hôm nay.');
    } finally {
      setTodayRegistrationsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
      const appointments = await _getTodayAppointments(todayKey);
      if (appointments != null && !Array.isArray(appointments)) {
        throw new Error('API lịch khám trả về dữ liệu không đúng định dạng.');
      }
      const todayList = Array.isArray(appointments) ? appointments : [];
      setStats(current => ({ ...current, LichHenHomNay: todayList.length }));
    } catch (error) {
      console.error('Error fetching today appointments:', error);
    }

    try {
      const registrations = await _getTodayDangKy() || [];
      const waitingRegs = registrations.filter(r => r.trangThai === 'CHO_KHAM');
      const pks = await _getTodayPhieuKham() || [];
      const completed = pks.filter(p => p.trangThai === 'HOAN_THANH').length;

      setStats(current => ({
        ...current,
        waitingPatients: waitingRegs.length,
        completedToday: completed,
        todayRevenue: 0
      }));
    } catch (error) {
      console.error('Error fetching receptionist statistics:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    fetchTodayRegistrations();
    const interval = setInterval(fetchTodayRegistrations, 30000);
    return () => clearInterval(interval);
  }, [fetchTodayRegistrations]);

  const navItems = [
    { id: 'dashboard', label: 'Tổng Quan', icon: 'dashboard' },
    { id: 'checkin', label: 'Tiếp Đón', icon: 'person_add' },
    { id: 'patients', label: 'Thông Tin Bệnh Nhân', icon: 'patient_list' },
    { id: 'invoices', label: 'Thanh Toán', icon: 'payments' },
    { id: 'services', label: 'Bảng Giá Dịch Vụ', icon: 'medical_services' },
    { id: 'lichlamviec', label: 'Lịch Làm Việc', icon: 'calendar_month' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in space-y-6">
            <NhomOSoLieu user={user} />

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <LichKham
                user={user}
                onCheckIn={(appt) => {
                  setQuickCheckInAppt(appt);
                  setActiveTab('checkin');
                }}
              />
            </div>
          </div>
        );
      case 'checkin':
        return <QuyTrinhTiepDon
          onCancel={() => { setActiveTab('dashboard'); setQuickCheckInAppt(null); }}
          onSuccess={() => { setActiveTab('dashboard'); setQuickCheckInAppt(null); fetchStats(); }}
          waitingCount={stats.waitingPatients}
          presetPatient={quickCheckInAppt ? { maBenhNhan: quickCheckInAppt.maBenhNhan, hoTen: quickCheckInAppt.tenBenhNhan } : undefined}
          presetDepartment={quickCheckInAppt ? quickCheckInAppt.maChuyenKhoa : undefined}
          presetDoctor={quickCheckInAppt ? quickCheckInAppt.maNhanVien : undefined}
          appointmentId={quickCheckInAppt ? quickCheckInAppt.id : undefined}
          needsIdentityVerification={quickCheckInAppt
            ? (quickCheckInAppt.nguonTao || '').toUpperCase() === 'DAT_LICH_APP' && !quickCheckInAppt.daXacMinhDanhTinh
            : false}
        />;
      case 'patients':
        return <QuanLyBenhNhan allowViewDetail={false} title="Thông Tin Bệnh Nhân" />;
      case 'invoices':
        return <QuanLyHoaDon />;
      case 'services':
        return <QuanLyDichVu />;
      case 'lichlamviec':
        return <LichLamViecTab user={user} />;
      default:
        return <div>Chưa có nội dung cho tab này</div>;
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-body-md text-on-background overflow-hidden">
      <WebSocketAutoRefresh
        topics={['/topic/phieu-kham', '/topic/dang-ky-kham']}
        onMessage={(topic, data) => {
          fetchStats();
          fetchTodayRegistrations();
        }}
      />
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
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-400/50 active:bg-indigo-500/60 transition-colors z-30"
            title="Kéo để thay đổi kích thước sidebar"
          />
        )}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shadow-primary/30">
              <span className="material-symbols-outlined text-[20px]">local_hospital</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl text-primary tracking-tight">MedCore</span>}
          </div>
        </div>

        <nav className="shrink-0 py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id
                    ? 'bg-primary/10 text-primary font-bold translate-x-1'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {isSidebarOpen && <span className="text-left text-sm leading-5">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <section
          aria-label="Danh sách bệnh nhân đăng ký hôm nay"
          className="flex-1 min-h-0 overflow-hidden border-t border-gray-100 px-3 py-4"
        >
          {isSidebarOpen ? (
            <div className="flex h-full min-h-0 flex-col">
              <h2 className="mb-3 px-1 text-sm font-bold leading-5 text-gray-700">
                Danh sách bệnh nhân đăng ký hôm nay
              </h2>
              <div className="min-h-0 flex-1 overflow-y-scroll overscroll-contain">
                {todayRegistrationsLoading ? (
                  <p className="px-1 py-2 text-xs leading-5 text-gray-400">Đang tải danh sách...</p>
                ) : todayRegistrationsError ? (
                  <div className="px-1 py-2">
                    <p className="text-xs leading-5 text-red-500">{todayRegistrationsError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setTodayRegistrationsLoading(true);
                        fetchTodayRegistrations();
                      }}
                      className="mt-2 text-xs font-semibold text-primary hover:underline"
                    >
                      Thử tải lại
                    </button>
                  </div>
                ) : todayRegistrations.length === 0 ? (
                  <p className="px-1 py-2 text-xs leading-5 text-gray-400">
                    Hôm nay chưa có bệnh nhân đăng ký
                  </p>
                ) : (
                  <ol className="space-y-1">
                    {todayRegistrations.map((registration, index) => (
                      <li
                        key={registration.id || `${registration.maBenhNhan}-${index}`}
                        className="flex gap-2 rounded-lg px-1 py-2"
                        title={`${registration.hoTen || '—'} - ${registration.tenDichVu || '—'}`}
                      >
                        <span className="pt-0.5 text-xs font-medium text-gray-400">{index + 1}.</span>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-gray-700">
                            {registration.hoTen || '—'}
                          </p>
                          <p className="truncate text-[11px] text-gray-500">
                            {registration.tenDichVu || '—'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ) : (
            <div
              className="flex justify-center text-gray-500"
              title={`Danh sách bệnh nhân đăng ký hôm nay (${todayRegistrations.length})`}
              aria-label={`Danh sách bệnh nhân đăng ký hôm nay, ${todayRegistrations.length} bệnh nhân`}
            >
              <span className="material-symbols-outlined">format_list_numbered</span>
            </div>
          )}
        </section>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {navItems.find(i => i.id === activeTab)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
            </div>
            <UserMenu
              user={user}
              onLogout={onLogout}
              displayName={`Xin chào ${user?.username || ''}`}
              displayRole="Quầy tiếp đón"
              accentColor="primary"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] scroll-smooth">
          {renderContent()}
        </main>

      </div>
    </div>
  );
};




const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};



export default BangDieuKhienLeTan;