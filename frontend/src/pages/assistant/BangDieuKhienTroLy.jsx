import { getTodayApi as _getTodayDangKy, updateStatusApi as _updateDangKyStatus } from '../../api/dangKyKhamBenhApi';
import { API_BASE_URL } from '../../api/config';
import { getCurrentRoomApi as _getCurrentRoomApi } from '../../api/shiftApi';
import { updateToWaitingForDoctorApi } from '../../api/phieuKhamApi';
// ĐẢM BẢO IMPORT apiClient
import { apiClient } from "../../api/apiClient"; 
import { useNotification } from '../../components/NotificationContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import React, { useState, useEffect, useCallback } from 'react';
import { sqlLikeMatch } from '../../utils/searchUtils';
import VitalSignsFormComponent from '../../components/VitalSignsForm';
import QuanLyBenhNhan from '../../pages/admin/components/QuanLyBenhNhan';
import TroLyRHMForm from './TroLyRHMForm';
import formatGender from '../../utils/formatGender';
import TroLyTMHForm from './TroLyTMHForm';
import TroLyTimMachForm from './TroLyTimMachForm';
import TroLyNhiForm from './TroLyNhiForm';
import TroLyTongQuatForm from './TroLyTongQuatForm';
import BangDanhSachCongViec from '../technician/component/BangDanhSachCongViec';
import NhomOSoLieu from '../doctor/components/NhomOSoLieu';
import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import WebSocketAutoRefresh from '../../hooks/WebSocketAutoRefresh';

// KHAI BÁO API_BASE
const API_BASE = `${API_BASE_URL}`;

const BangDieuKhienTroLy = ({ onLogout, user }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [sidebarWidth, setSidebarWidth] = useState(256); // w-64 is 256px
  const isResizing = React.useRef(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState({ pending: [], completed: [], absent: [] });
  const [loadingQueue, setLoadingQueue] = useState(true);
  const isInitialLoad = React.useRef(true);
  const [queueTab, setQueueTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ waitingToday: 0, processedToday: 0, absentToday: 0 });
  const [currentRoom, setCurrentRoom] = useState("Đang tải...");
  const { showSuccess, showError } = useNotification();
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary', icon: '' });

  const isRhmAssistant = Number(user?.maChuyenKhoa) === 5;
  const isTmhAssistant = Number(user?.maChuyenKhoa) === 4;
  const isCardiologyAssistant = Number(user?.maChuyenKhoa) === 11;
  const isNhiAssistant = Number(user?.maChuyenKhoa) === 3;
  const isSpecialtyAssistant = isRhmAssistant || isTmhAssistant || isCardiologyAssistant || isNhiAssistant;
  const isImagingOrLabAssistant = Number(user?.maChuyenKhoa) === 6 || Number(user?.maChuyenKhoa) === 7; // Assuming 6 for Imaging and 7 for Lab
  
  const [initialFormTab, setInitialFormTab] = useState('vitals');

  const fetchStats = useCallback(async (showLoading) => {
    const shouldShowLoading = showLoading === true || isInitialLoad.current;
    if (shouldShowLoading) setLoadingQueue(true);
    isInitialLoad.current = false;
    try {
      const data = await _getTodayDangKy();
      if (data) {
        let filteredData = data;
        if (user?.maChuyenKhoa) {
          filteredData = data.filter(r => Number(r.maChuyenKhoa) === Number(user.maChuyenKhoa));
        }
      const choKhamOrDangKham = filteredData.filter(r => r.trangThai === 'CHO_KHAM' || r.trangThai === 'DANG_KHAM');
      const absentList = filteredData.filter(r => r.trangThai === 'VANG_MAT');
      const completedList = filteredData.filter(r => r.trangThai === 'CHO_BAC_SI');
      // Gộp bệnh nhân VANG_MAT vào danh sách pending để không bị mất khỏi danh sách
      const pending = [...choKhamOrDangKham, ...absentList];
      
      setPatients({ pending, completed: completedList, absent: absentList });
        setStats({ waitingToday: pending.length, processedToday: completedList.length, absentToday: absentList.length });
      }
      if (user?.maNhanVien) {
        const roomData = await _getCurrentRoomApi(user.maNhanVien);
        setCurrentRoom(roomData?.tenPhong || "Chưa có lịch trực");
      }
    } catch (error) { console.error(error); } finally { if (shouldShowLoading) setLoadingQueue(false); }
  }, [user]);

  useEffect(() => {
    fetchStats(true);
    const interval = setInterval(() => fetchStats(false), 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleSelectPatient = async (patient) => {
    if (patient.trangThai !== 'CHO_KHAM') { 
      setSelectedPatient(patient); 
      setActiveTab('dashboard');
      return; 
    }

    setConfirmState({
      isOpen: true,
      title: 'Xác nhận tiếp nhận',
      message: `Tiếp nhận bệnh nhân "${patient.hoTen}"?`,
      type: 'primary',
      icon: 'assignment_ind',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          const maNV = user?.maNhanVien || '';
          const res = await apiClient(`${API_BASE}/phieu-kham/accept-patient/${patient.id}?assistantId=${maNV}`, { 
            method: 'POST' 
          });

          if (res.ok) {
            const data = await res.json();
            await fetchStats();
            setSelectedPatient({ 
              ...patient, 
              trangThai: 'DANG_KHAM', 
              maPhieuKham: data.phieuKhamId 
            });
            showSuccess(`Đã tiếp nhận bệnh nhân "${patient.hoTen}"`);
            setActiveTab('dashboard');
          }
        } catch (error) { 
          showError("Lỗi tiếp nhận: " + error.message); 
        }
      }
    });
  };

  const handleOpenVitals = (patient) => {
    setInitialFormTab('vitals');
    handleSelectPatient(patient);
  };

  const handleOpenResult = (patient) => {
    setInitialFormTab('info');
    handleSelectPatient(patient);
  };

  const handleMarkAbsent = (patient) => {
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận vắng mặt',
      message: `Bạn có muốn đánh vắng bệnh nhân "${patient.hoTen}"?`,
      type: 'warning',
      icon: 'person_off',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          await _updateDangKyStatus(patient.id, { trangThai: 'VANG_MAT' });
          showSuccess(`Đã đánh dấu vắng mặt "${patient.hoTen}"`);
          fetchStats();
        } catch (e) {
          showError("Lỗi: " + e.message);
        }
      }
    });
  };

  const handleMarkPresent = (patient) => {
    // Hiển thị dialog xác nhận tiếp nhận, khi xác nhận thì update VANG_MAT -> DANG_KHAM
    // và mở form sinh hiệu giống như nút KHÁM BỆNH bình thường
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận tiếp nhận',
      message: `Tiếp nhận bệnh nhân "${patient.hoTen}"?`,
      type: 'primary',
      icon: 'assignment_ind',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          await _updateDangKyStatus(patient.id, { trangThai: 'DANG_KHAM' });
          await fetchStats();
          // Mở form sinh hiệu giống như quy trình khám bệnh bình thường
          handleSelectPatient(patient);
        } catch (e) {
          showError("Lỗi: " + e.message);
        }
      }
    });
  };

  const navItems = [
    { id: 'dashboard', label: 'Bàn Làm Việc', icon: 'desk' },
    { id: 'patients', label: 'Thông Tin Bệnh Nhân', icon: 'person_search' },
    { id: 'lichlamviec', label: 'Lịch Làm Việc', icon: 'calendar_month' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="animate-fade-in space-y-6">
            <NhomOSoLieu user={user} />

            {!selectedPatient ? (
              /* Tất cả trợ lý (kể cả tổng quát) đều dùng BangDanhSachCongViec */
              <BangDanhSachCongViec
                title="Bệnh nhân chờ Khám"
                list={{
                  data: patients[queueTab]?.filter(p => sqlLikeMatch(p.hoTen, searchQuery)) || [],
                  pendingCount: patients.pending.length,
                  completedCount: patients.completed.length,
                  absentCount: patients.absent.length
                }}
                worklistTab={queueTab}
                setWorklistTab={setQueueTab}
                onOpenVitals={handleOpenVitals}
                onOpenResult={handleOpenResult}
                onMarkAbsent={handleMarkAbsent}
                onMarkPresent={handleMarkPresent}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isRefreshing={loadingQueue}
        onManualRefresh={() => fetchStats(true)}
                loading={loadingQueue}
              />
            ) : (
              /* Khi đã chọn bệnh nhân - hiển thị form tương ứng */
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-scale-up w-full flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 pt-5 pb-0 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-lg font-black text-gray-800">{selectedPatient.hoTen}</h2>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                        <span>#{selectedPatient.maBenhNhan}</span>
                        <span>•</span>
                        <span>{formatGender(selectedPatient.gioiTinh)}</span>
                        <span>•</span>
                        <span>{new Date(selectedPatient.ngaySinh).toLocaleDateString("vi-VN")}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPatient(null)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-lg transition-all">
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  {isRhmAssistant ? (
                    <TroLyRHMForm selectedPatient={selectedPatient} user={user} onSaved={() => { setSelectedPatient(null); fetchStats(); }} initialTab={initialFormTab} onBack={() => setSelectedPatient(null)} />
                  ) : isTmhAssistant ? (
                    <TroLyTMHForm selectedPatient={selectedPatient} user={user} onSaved={() => { setSelectedPatient(null); fetchStats(); }} initialTab={initialFormTab} onBack={() => setSelectedPatient(null)} />
                  ) : isCardiologyAssistant ? (
                    <TroLyTimMachForm selectedPatient={selectedPatient} user={user} onSaved={() => { setSelectedPatient(null); fetchStats(); }} initialTab={initialFormTab} onBack={() => setSelectedPatient(null)} />
                  ) : isNhiAssistant ? (
                    <TroLyNhiForm selectedPatient={selectedPatient} user={user} onSaved={() => { setSelectedPatient(null); fetchStats(); }} initialTab={initialFormTab} onBack={() => setSelectedPatient(null)} />
                  ) : (
                    <TroLyTongQuatForm selectedPatient={selectedPatient} user={user} onSaved={() => { setSelectedPatient(null); fetchStats(); }} initialTab={initialFormTab} onBack={() => setSelectedPatient(null)} />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      case 'patients': return <QuanLyBenhNhan allowViewDetail={false} title="Thông Tin Bệnh Nhân" />;
      case 'lichlamviec': return <LichLamViecTab user={user} />;
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f4f6] font-body-md overflow-hidden text-gray-900">
      <WebSocketAutoRefresh
        topics={['/topic/phieu-kham', '/topic/dang-ky-kham']}
        onMessage={(topic, data) => {
          fetchStats();
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
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map(item => (
              <li key={item.id}>
                <button onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${activeTab === item.id ? 'bg-indigo-50 text-indigo-600 font-bold translate-x-1' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
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
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition-colors"><span className="material-symbols-outlined">menu</span></button>
            <h1 className="text-xl font-bold text-gray-800">{navItems.find(i => i.id === activeTab)?.label}</h1>
          </div>
          <UserMenu
            user={user}
            onLogout={onLogout}
            displayName={`Xin chào ${user?.username || ''}`}
            displayRole={user?.tenChuyenKhoa || ''}
            accentColor="indigo"
          />
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-[#f8f9fa]">
          {renderContent()}
          <ConfirmDialog
            isOpen={confirmState.isOpen}
            title={confirmState.title}
            message={confirmState.message}
            type={confirmState.type}
            icon={confirmState.icon}
            onConfirm={confirmState.onConfirm}
            onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
          />
        </main>
      </div>
    </div>
  );
};

// CÁC COMPONENT PHỤ (TheThongKe, PatientQueue, VitalSignsForm)
const TheThongKe = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 hover:shadow-lg transition-all group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${color} shadow-lg group-hover:scale-110 transition-transform`}><span className="material-symbols-outlined text-3xl">{icon}</span></div>
      <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p><h3 className="text-2xl font-black text-gray-800">{value}</h3></div>
    </div>
);

const PatientQueue = ({ list, loading, onSelectPatient, selectedId, isAbsentQueue }) => {
    if (loading && list.length === 0) return <div className="text-center py-4 text-gray-400 italic text-sm">Đang tải...</div>;
    if (list.length === 0) return (<div className="text-center py-12 flex flex-col items-center gap-3"><span className="material-symbols-outlined text-4xl text-gray-200">{isAbsentQueue ? 'person_check' : 'group_off'}</span><p className="text-gray-400 text-sm italic">{isAbsentQueue ? 'Không có bệnh nhân vắng mặt' : 'Không có bệnh nhân đang chờ'}</p></div>);
    return list.map(p => (
      <div key={p.id} className="relative group">
        <button onClick={() => onSelectPatient(p)} className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${selectedId === p.maBenhNhan ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedId === p.maBenhNhan ? 'bg-white/20' : (isAbsentQueue ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600')}`}>{p.soThuTu}</div>
            <div className="min-w-0"><p className="font-bold text-sm truncate">{p.hoTen}</p><p className={`text-[10px] truncate ${selectedId === p.maBenhNhan ? 'text-indigo-100' : 'text-gray-500'}`}>#{p.maBenhNhan} • {p.tenChuyenKhoa}{p.tenPhong ? ` • ${p.tenPhong}` : ''}</p></div>
          </div>
          {!isAbsentQueue && <span className="material-symbols-outlined text-lg opacity-50">chevron_right</span>}
        </button>
      </div>
    ));
};

const VitalSignsForm = ({ phieuKhamId, registrationId, assistantId, initialGhiChu, onSaved }) => {
  const vitalsRef = React.useRef(null);
  const { showSuccess, showError } = useNotification();
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary', icon: '' });

  return (
    <div className="space-y-8 animate-fade-in">
      <h3 className="text-xl font-bold text-indigo-700 text-center uppercase border-b pb-4">Thông tin chỉ số sinh hiệu</h3>
      <VitalSignsFormComponent ref={vitalsRef} phieuKhamId={phieuKhamId} assistantId={assistantId} initialGhiChu={initialGhiChu || ''} showSaveOnly />
      <div className="flex gap-4 pt-6">
        <button onClick={async () => {
          if (vitalsRef.current) {
            const success = await vitalsRef.current.handleSave();
            if (success) {
              await updateToWaitingForDoctorApi(phieuKhamId);
              showSuccess("✅ Đã hoàn tất đo sinh hiệu và chuyển Bác sĩ khám.");
              onSaved();
            }
          }
        }} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all">XÁC NHẬN & CHUYỂN BÁC SĨ</button>
        <button onClick={() => setConfirmState({
          isOpen: true,
          title: 'Xác nhận vắng mặt',
          message: 'Bệnh nhân vắng mặt?',
          type: 'warning',
          icon: 'person_off',
          onConfirm: async () => {
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            await _updateDangKyStatus(registrationId, {trangThai: 'VANG_MAT'});
            onSaved();
          }
        })} className="px-10 py-4 bg-red-50 text-red-600 font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all">VẮNG MẶT</button>
      </div>
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
        icon={confirmState.icon}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default BangDieuKhienTroLy;