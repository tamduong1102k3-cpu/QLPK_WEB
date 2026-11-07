import { useState, useRef, useEffect, useCallback } from 'react';
import QuanLyBenhNhan from '../../pages/admin/components/QuanLyBenhNhan';
import LichSuChuyenKhoa from '../../components/LichSuChuyenKhoa';
import BangDieuKhienChanDoan from './components/BangDieuKhienChanDoan';
import HangDoiKham from './components/HangDoiKham';
import ManHinhKhamBenh from './components/ManHinhKhamBenh';
import TabHenTaiKham from './components/TabHenTaiKham';
import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import WebSocketAutoRefresh from '../../hooks/WebSocketAutoRefresh';
import NotificationBell from '../../components/NotificationBell';
import { useNotification } from '../../components/NotificationContext';
import useWebSocket from '../../hooks/useWebSocket';
import fetchClient from '../../api/fetchClient';
import { getAccessToken, decodeTokenPayload } from '../../api/tokenStore';
import { API_BASE_URL } from '../../api/config';

const BangDieuKhienBacSi = ({ onLogout, user }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { bellNotifications, addBellNotification, markBellAsRead, markAllBellAsRead, deleteBellNotification, clearAllBell } = useNotification();
  const [maTaiKhoanBS, setMaTaiKhoanBS] = useState(null);
  const [maNhanVienBS, setMaNhanVienBS] = useState(null);
  const thongBaoLoadedRef = useRef(false);

  // Decode JWT lấy maTaiKhoan + maNhanVien BS (maNhanVien = ma_bac_si)
  useEffect(() => {
    const payload = decodeTokenPayload(getAccessToken());
    setMaTaiKhoanBS(payload?.maTaiKhoan || null);
    const maNv = payload?.maNhanVien ?? user?.maNhanVien ?? null;
    setMaNhanVienBS(typeof maNv === 'number' ? maNv : Number(maNv) || null);
  }, [user?.maNhanVien]);

  // Fetch thông báo LICH_KHAM dành cho BS từ 2 nguồn:
  //  bảng thong_bao (TB đã tạo cho NV) — ưu tiên fetch theo maNhanVien (ma_bac_si);
  // bảng lich_kham theo ma_bac_si — fallback khi app chỉ tạo TB cho BN

  const fetchThongBaoBS = useCallback(async () => {
    const daCoMaLich = new Set();
    const query = maNhanVienBS
      ? `maNhanVien=${maNhanVienBS}`
      : (maTaiKhoanBS ? `maTaiKhoan=${maTaiKhoanBS}` : '');
    // Nguồn 1: bảng thong_bao
    if (query) {
      try {
        const res = await fetchClient(
          `${API_BASE_URL}/thong-bao/reference-type/LICH_KHAM?loaiNguoiNhan=NHAN_VIEN&${query}`,
          { skipLoading: true }
        );
        if (res.ok) {
          const result = await res.json();
          const list = result?.data ?? result ?? [];
          (Array.isArray(list) ? list : []).forEach(tb => {
            if (tb.id == null) return;
            if (tb.referenceId != null) daCoMaLich.add(String(tb.referenceId));
            addBellNotification({
              id: tb.id,
              title: tb.tieuDe || 'Thông báo lịch khám',
              message: tb.noiDung || '',
              type: 'info',
              createdAt: tb.createdAt ? new Date(tb.createdAt) : new Date(),
              read: tb.daDoc || false,
            });
          });
        }
      } catch (e) { console.error('fetchThongBaoBS:', e); }
    }
    // Nguồn 2: bảng lich_kham theo ma_bac_si (chỉ lịch còn hiệu lực)
    if (maNhanVienBS) {
      try {
        const res = await fetchClient(
          `${API_BASE_URL}/lich-kham/bac-si/${maNhanVienBS}`,
          { skipLoading: true }
        );
        if (!res.ok) return;
        const list = await res.json();
        const fmtDate = (d) => {
          if (!d) return '';
          const p = String(d).split('-');
          return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : String(d);
        };
        (Array.isArray(list) ? list : [])
          .filter(lk => lk && lk.trangThai !== 'HUY' && lk.trangThai !== 'QUA_HEN' && lk.trangThai !== 'HOAN')
          .filter(lk => !daCoMaLich.has(String(lk.id)))
          .forEach(lk => {
            const ngay = fmtDate(lk.ngayKham);
            const ca = lk.tenCa || (lk.maCa != null ? `Ca ${lk.maCa}` : 'ca khám');
            const gio = (lk.gioBatDau && lk.gioKetThuc)
              ? ` (${String(lk.gioBatDau).substring(0, 5)} - ${String(lk.gioKetThuc).substring(0, 5)})`
              : '';
            addBellNotification({
              id: `lk-${lk.id}`,
              title: 'Lịch khám mới từ App',
              message: `Bạn có ca khám ${ca}${gio} vào ngày ${ngay}. Mã lịch: ${lk.id}.`,
              type: 'info',
              createdAt: lk.ngayTao ? new Date(lk.ngayTao) : new Date(),
              read: false,
            });
          });
      } catch (e) { console.error('fetchLichKhamBS:', e); }
    }
  }, [maNhanVienBS, maTaiKhoanBS, addBellNotification]);

  useEffect(() => {
    if (!thongBaoLoadedRef.current && (maNhanVienBS || maTaiKhoanBS)) {
      thongBaoLoadedRef.current = true;
      fetchThongBaoBS();
    }
  }, [maNhanVienBS, maTaiKhoanBS, fetchThongBaoBS]);

  // Đánh dấu TẤT CẢ đã đọc: gọi BE mark-all-read rồi mới update local
  const handleMarkAllBellAsRead = useCallback(async () => {
    if (maTaiKhoanBS) {
      try {
        await fetchClient(
          `${API_BASE_URL}/thong-bao/${maTaiKhoanBS}/NHAN_VIEN/mark-all-read`,
          { method: 'PUT', skipLoading: true }
        );
      } catch (e) { console.error('handleMarkAllBellAsRead BS:', e); }
    }
    markAllBellAsRead();
  }, [maTaiKhoanBS, markAllBellAsRead]);

  // WebSocket realtime: topic thong-bao riêng của BS
  useWebSocket({
    topics: maTaiKhoanBS ? [`/topic/thong-bao/${maTaiKhoanBS}`] : [],
    onMessage: (topic, data) => {
      if (topic.startsWith('/topic/thong-bao/') && data) {
        if (data.id == null) return;
        addBellNotification({
          id: data.id,
          title: data.tieuDe || 'Thông báo lịch khám',
          message: data.noiDung || '',
          type: 'info',
          createdAt: new Date(),
          read: false,
        });
      }
    },
  });

  const maCK = Number(user?.maChuyenKhoa);
  const tenCK = (user?.tenChuyenKhoa || '').toLowerCase();
  const vaiTro = (user?.vaiTro || '').toUpperCase();


  const isXetNghiemDoc = maCK === 7 || vaiTro.includes('XET_NGHIEM') || tenCK.includes('xét nghiệm');
  const isCdhaDoc = maCK === 12 || vaiTro.includes('CDHA') || vaiTro.includes('CHAN_DOAN_HINH_ANH') || tenCK.includes('chẩn đoán') || tenCK.includes('hình ảnh');
  const isLabDoctor = isXetNghiemDoc || isCdhaDoc;

  const [activeTab, setActiveTab] = useState(isLabDoctor ? 'examination' : 'dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = useRef(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleSelectPatient = (patient, readOnly = false) => {
    setSelectedPatient(patient);
    setIsReadOnly(readOnly);
    setActiveTab('examination');
  };

  // Bác sĩ chẩn đoán/xét nghiệm: chỉ có tab Duyệt Kết Quả, Hồ Sơ BN, Lịch Sử
  // Bác sĩ khám bệnh: giữ nguyên các tab cũ
  const navItems = isLabDoctor
    ? [
        {
          id: 'examination',
          label: isXetNghiemDoc ? 'Duyệt Xét Nghiệm' : 'Duyệt CĐHA',
          icon: isXetNghiemDoc ? 'science' : 'image'
        },
        {
          id: 'history',
          label: 'Lịch Sử Khám',
          icon: 'history'
        },
        {
          id: 'patients',
          label: 'Hồ Sơ Bệnh Nhân',
          icon: 'person_search'
        },
        {
          id: 'lichlamviec',
          label: 'Lịch Làm Việc',
          icon: 'calendar_month'
        }
      ]
    : [
        {
          id: 'dashboard',
          label: 'Hàng Đợi',
          icon: 'format_list_numbered'
        }, 
        {
          id: 'examination',
          label: 'Khám Bệnh',
          icon: 'medical_services'
        }, 
        {
          id: 'appointments',
          label: 'Lịch Hẹn',
          icon: 'calendar_month'
        }, 
        {
          id: 'history',
          label: 'Lịch Sử Khám',
          icon: 'history'
        }, 
        {
          id: 'patients',
          label: 'Hồ Sơ Bệnh Nhân',
          icon: 'person_search'
        },
        {
          id: 'lichlamviec',
          label: 'Lịch Làm Việc',
          icon: 'calendar_month'
        }
      ];


  const renderContent = () => {
    return (
      <>
        {!isLabDoctor && (
          <div style={{ display: activeTab === 'dashboard' ? 'flex' : 'none' }} className="flex-1 flex-col min-h-0">
            <HangDoiKham 
              user={user} 
              handleSelectPatient={handleSelectPatient} 
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}
        {activeTab === 'examination' && (
          <>
            {isLabDoctor ? (
              <BangDieuKhienChanDoan 
                user={user} 
              />
            ) : selectedPatient ? (
              <ManHinhKhamBenh 
                selectedPatient={selectedPatient} 
                setSelectedPatient={setSelectedPatient} 
                user={user} 
                readOnly={isReadOnly}
                onBackToQueue={() => {
                  setSelectedPatient(null);
                  setIsReadOnly(false);
                  setActiveTab('dashboard');
                }} 
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-300">
                  <span className="material-symbols-outlined text-5xl">person_search</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa chọn bệnh nhân</h3>
                <p className="text-gray-500 mb-6">Vui lòng chọn bệnh nhân từ hàng đợi để bắt đầu khám</p>
                <button onClick={() => setActiveTab('dashboard')} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all">
                  ĐẾN HÀNG ĐỢI
                </button>
              </div>
            )}
          </>
        )}
        {activeTab === 'appointments' && !isLabDoctor && <TabHenTaiKham user={user} />}
        {activeTab === 'history' && <LichSuChuyenKhoa user={user} onReview={(item) => { setSelectedPatient(item); setIsReadOnly(true); setActiveTab('examination'); }} />}
        {activeTab === 'patients' && <QuanLyBenhNhan />}
        {activeTab === 'lichlamviec' && <LichLamViecTab user={user} />}
        
      </>
    );
  };

  return (
    <div className="flex h-screen bg-[#f8f9fa] font-body-md text-on-background overflow-hidden">
      <WebSocketAutoRefresh
        topics={['/topic/phieu-kham', '/topic/dang-ky-kham', '/topic/cls']}
        onMessage={() => {
          setRefreshTrigger(prev => prev + 1);
        }}
      />
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
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <span className="material-symbols-outlined text-[20px]">medical_information</span>
            </div>
            {isSidebarOpen && <span className="font-bold text-xl text-indigo-600 tracking-tight">MedCore</span>}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map(item => (
              <li key={item.id}>
                <button 
                  onClick={() => setActiveTab(item.id)} 
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600 font-bold translate-x-1 shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {isSidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 relative z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Bác sĩ</span>
              <span className="text-gray-300">/</span>
              <h1 className="text-lg font-bold text-gray-800">{navItems.find(i => i.id === activeTab)?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell
              notifications={bellNotifications}
              onMarkAsRead={markBellAsRead}
              onMarkAllAsRead={() => handleMarkAllBellAsRead()}
              onClearAll={() => clearAllBell(maTaiKhoanBS, 'NHAN_VIEN')}
              onDelete={deleteBellNotification}
            />
            <UserMenu
              user={user}
              onLogout={onLogout}
              displayName={`Xin chào ${user?.username || ''}`}
              displayRole={user?.tenChuyenKhoa || 'Khoa Nội'}
              accentColor="indigo"
            />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa] flex flex-col h-full">{renderContent()}</main>
      </div>
    </div>
  );
};

export default BangDieuKhienBacSi;