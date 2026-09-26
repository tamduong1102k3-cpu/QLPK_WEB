import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPendingTestsApi, getCompletedTestsTodayApi } from '../../api/phieuChiDinhApi';
import { getTodayApi as getTodayDangKyApi, updateStatusApi } from '../../api/dangKyKhamBenhApi';
import { acceptClsPatientApi, updateToWaitingForDoctorApi } from '../../api/phieuKhamApi';
import { getByPhieuKhamApi } from '../../api/chiSoKhamTongHopApi';
import { getAllApi as getAllServicesApi } from '../../api/dichVuApi';
import { removeVietnameseTones } from './component/TienIchKyThuatVien';
import BangDanhSachCongViec from './component/BangDanhSachCongViec';
import ModalNhapKetQua from './component/ModalNhapKetQua';
import ModalNhapKetQuaXetNghiem from './component/ModalNhapKetQuaXetNghiem';
import ModalXemKetQua from './component/ModalXemKetQua';
import ModalKhamSinhHieu from './component/ModalKhamSinhHieu';
import ModalNhapTiepNhanCls from './component/ModalNhapTiepNhanCls';

import QuanLyBenhNhan from '../../pages/admin/components/QuanLyBenhNhan';
import UserMenu from '../../components/UserMenu';
import LichLamViecTab from '../../components/LichLamViecTab';
import WebSocketAutoRefresh from '../../hooks/WebSocketAutoRefresh';
import LichSuChuyenKhoa from '../../components/LichSuChuyenKhoa';
import { useNotification } from '../../components/NotificationContext';
import ConfirmDialog from '../../components/ConfirmDialog';

const BangDieuKhienKyThuatVien = ({ onLogout, user }) => {
  const { showWarning } = useNotification();
  const isImaging = user?.vaiTro?.includes('CHAN_DOAN_HINH_ANH') || user?.vaiTro?.includes('CDHA');
  const deptName = isImaging ? 'Chẩn Đoán Hình Ảnh' : 'Xét Nghiệm';
  const [activeTab, setActiveTab] = useState('worklist');
  const [worklistTab, setWorklistTab] = useState('pending');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1280);
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = React.useRef(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [viewingResult, setViewingResult] = useState(null);
  // Vitals states
  const [vitalsPatient, setVitalsPatient] = useState(null);
  // Modal tiếp nhận CLS
  const [tiepNhanClsPatient, setTiepNhanClsPatient] = useState(null);
  // Map lưu trạng thái sinh hiệu {maPhieuKham: true/false}
  const [vitalsMap, setVitalsMap] = useState({});
  // Map lưu dữ liệu sinh hiệu {maPhieuKham: data}
  const [vitalsDataMap, setVitalsDataMap] = useState({});
  // Danh sách toàn bộ dịch vụ để tra cứu loại dịch vụ
  const [servicesList, setServicesList] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { }, type: 'primary', icon: '' });
  // Sidebar width state và ref để kéo dãn
  const [sidebarWidth, setSidebarWidth] = useState(288); // 288px = w-72
  const isResizing = useRef(false);

  // Fetch danh sách và kiểm tra sinh hiệu cho từng bệnh nhân
  const fetchWorklist = useCallback(async (showIndicator) => {
    const shouldShowLoading = showIndicator === true || isInitialLoad.current;
    if (shouldShowLoading) setLoading(true);
    isInitialLoad.current = false;
    try {
      const maChuyenKhoa = user?.maChuyenKhoa || '';
      const [pending, completed, registrations] = await Promise.all([
        getPendingTestsApi({ maChuyenKhoa }),
        getCompletedTestsTodayApi({ maChuyenKhoa }),
        getTodayDangKyApi()
      ]);

      // Tạo map maBenhNhan -> id dang_ky_kham_benh
      const regByPatient = {};
      (registrations || []).forEach(r => {
        if (r.maBenhNhan) regByPatient[r.maBenhNhan] = r.id;
      });

      // Gộp bệnh nhân VANG_MAT vào danh sách pending
      const pendingItems = (pending || []).map(p => ({
        ...p,
        registrationId: regByPatient[p.maBenhNhan] || null
      }));
      const vangMatPatients = (registrations || []).filter(r =>
        r.trangThai === 'VANG_MAT'
      ).map(r => ({
        ...r,
        registrationId: r.id
      }));
      setPendingTests([...pendingItems, ...vangMatPatients]);
      setCompletedTests(completed || []);

      // Lọc đăng ký mới (CHO_KHAM, chưa có maPhieuKham) theo chuyên khoa của KTV
      // Và các đăng ký đang trong tiến trình tiếp nhận (DANG_KHAM, đã có maPhieuKham nhưng chưa được tạo phiếu chỉ định thực hiện)
      const newRegistrations = (registrations || []).filter(r =>
        Number(r.maChuyenKhoa) === Number(maChuyenKhoa) &&
        (
          (r.trangThai === 'CHO_KHAM' && !r.maPhieuKham) ||
          (r.trangThai === 'DANG_KHAM' && r.maPhieuKham && !pendingItems.some(p => p.maPhieuKham === r.maPhieuKham))
        )
      );
      setPendingRegistrations(newRegistrations);

      // Kiểm tra sinh hiệu cho tất cả bệnh nhân đang chờ và các đăng ký đã tiếp nhận
      const allItems = [...(pending || []), ...(completed || []), ...(registrations || [])];
      const maPhieuKhams = [...new Set(allItems.map(i => i.maPhieuKham).filter(Boolean))];

      const newVitalsMap = {};
      const newVitalsDataMap = {};

      await Promise.all(maPhieuKhams.map(async (maPK) => {
        try {
          const data = await getByPhieuKhamApi(maPK);
          if (data && data.id) {
            newVitalsMap[maPK] = true;
            newVitalsDataMap[maPK] = data;
          } else {
            newVitalsMap[maPK] = false;
          }
        } catch (error) {
          newVitalsMap[maPK] = false;
        }
      }));

      setVitalsMap(prev => ({ ...prev, ...newVitalsMap }));
      setVitalsDataMap(prev => ({ ...prev, ...newVitalsDataMap }));
    } finally { if (shouldShowLoading) setLoading(false); }
  }, [user]);

  useEffect(() => {
    fetchWorklist(true);
    const interval = setInterval(() => fetchWorklist(false), 30000);
    return () => clearInterval(interval);
  }, [fetchWorklist]);

  // Tải danh mục dịch vụ khi component mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await getAllServicesApi();
        setServicesList(services || []);
      } catch (error) {
        console.error("Lỗi khi tải danh mục dịch vụ:", error);
      }
    };
    fetchServices();
  }, []);

  // Kiểm tra mã dịch vụ có phải là CLS hay không
  const isDirectClsService = (maDichVu) => {
    if (!maDichVu) return false;
    const service = servicesList.find(s => Number(s.maDichVu) === Number(maDichVu));
    if (!service) return false;
    const loai = service.loaiDichVu;
    return loai === 'CLS_XET_NGHIEM' || loai === 'CLS_CHAN_DOAN_HINH_ANH';
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchWorklist(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const filterList = list => {
    const q = removeVietnameseTones(searchQuery.toLowerCase());
    return list.filter(item =>
      removeVietnameseTones(item.hoTen || '').toLowerCase().includes(q) ||
      (item.maPhieuKham || '').toString().includes(q)
    );
  };

  // Mở modal nhập kết quả chuyên môn
  const handleOpenResult = (item) => {
    setSelectedTest(item);
  };

  // Mở modal khám sinh hiệu (cả thêm mới và sửa)
  const handleOpenVitals = (item) => {
    // Kiểm tra nếu bệnh nhân chưa có sinh hiệu thì hiển thị thông báo
    if (!vitalsMap[item.maPhieuKham]) {
      showWarning(`⚠️ Bệnh nhân ${item.hoTen} chưa có chỉ số sinh hiệu. Vui lòng nhập sinh hiệu trước khi nhập kết quả chuyên môn.`);
    }
    setVitalsPatient(item);
  };

  // Sau khi lưu sinh hiệu xong, mở modal tiếp nhận CLS để KTV nhập lý do đến, sàng lọc, ghi chú
  const handleVitalsComplete = async (item) => {
    setVitalsPatient(null);
    // Cập nhật trạng thái sinh hiệu
    setVitalsMap(prev => ({ ...prev, [item.maPhieuKham]: true }));

    // Sau khi đo sinh hiệu xong, mở modal tiếp nhận CLS cho KTV nhập thông tin
    setTiepNhanClsPatient(item);
  };

  // Khi KTV hoàn tất tiếp nhận CLS
  const handleTiepNhanClsComplete = async (item) => {
    setTiepNhanClsPatient(null);
    fetchWorklist();
  };

  // Đóng modal tiếp nhận CLS (không lưu) - cập nhật lại danh sách để không mất bệnh nhân
  const handleTiepNhanClsClose = () => {
    setTiepNhanClsPatient(null);
    fetchWorklist();
  };

  // Đóng modal sinh hiệu (không lưu)
  const handleVitalsClose = () => {
    setVitalsPatient(null);
  };

  // Helper: lấy đúng id đăng ký khám bệnh
  // Ưu tiên registrationId (gán từ fetchWorklist), fallback item.id,
  // nhưng với items từ pendingTests (chi_tiet_chi_dinh), item.id là sai -> cần lookup lại
  const getRegistrationId = (item) => {
    if (item.registrationId) return item.registrationId;
    // Nếu không có registrationId, tra cứu từ lại từ registrations (đã được lưu)
    // Dùng item.maBenhNhan để lookup
    if (item.maBenhNhan) {
      const reg = pendingRegistrations.find(r =>
        Number(r.maBenhNhan) === Number(item.maBenhNhan)
      );
      if (reg) return reg.id;
      // Cũng kiểm tra trong vangMatPatients (đã gộp vào pendingTests)
      const vangMat = pendingTests.find(p =>
        Number(p.maBenhNhan) === Number(item.maBenhNhan) && p.registrationId
      );
      if (vangMat) return vangMat.registrationId;
    }
    return item.id;
  };

  const handleMarkAbsent = (item) => {
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận vắng mặt',
      message: `Bạn có muốn đánh vắng bệnh nhân "${item.hoTen}"?`,
      type: 'warning',
      icon: 'person_off',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          const regId = getRegistrationId(item);
          await updateStatusApi(regId, { trangThai: 'VANG_MAT' });
          await fetchWorklist();
        } catch (error) {
          showWarning('Lỗi: ' + error.message);
        }
      }
    });
  };

  const handleMarkPresent = (item) => {
    // Hiển thị dialog xác nhận tiếp nhận, khi xác nhận thì update VANG_MAT -> DANG_KHAM
    // và mở form sinh hiệu giống như nút KHÁM BỆNH bình thường
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận tiếp nhận',
      message: `Tiếp nhận bệnh nhân "${item.hoTen}"?`,
      type: 'primary',
      icon: 'assignment_ind',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        try {
          const regId = getRegistrationId(item);
          await updateStatusApi(regId, { trangThai: 'DANG_KHAM' });
          await fetchWorklist();
          // Mở form sinh hiệu giống như quy trình khám bệnh bình thường
          if (item.hasVitals) {
            handleOpenResult(item);
          } else {
            handleOpenVitals(item);
          }
        } catch (error) {
          showWarning('Lỗi: ' + error.message);
        }
      }
    });
  };

  // KTV nhấn KHÁM - gộp: tạo Phiếu khám (nếu chưa có) + mở đo sinh hiệu / tiếp nhận CLS
  const handleAcceptPatient = async (registration) => {
    try {
      const techId = user?.maNhanVien || '';
      let acceptedPatient = { ...registration };

      // Nếu chưa có phiếu khám thì mới gọi API tiếp nhận để tạo mới
      if (!registration.maPhieuKham) {
        const result = await acceptClsPatientApi(registration.id, techId);
        acceptedPatient.maPhieuKham = result.phieuKhamId;
        acceptedPatient.trangThai = 'DANG_KHAM';
        acceptedPatient.isDirectAcceptance = true; // Đánh dấu là tiếp nhận trực tiếp từ lễ tân
      }

      // Kiểm tra sinh hiệu của bệnh nhân
      const hasVitals = vitalsMap[acceptedPatient.maPhieuKham];
      if (hasVitals) {
        // Nếu đã có sinh hiệu, mở trực tiếp form tiếp nhận CLS
        setTiepNhanClsPatient(acceptedPatient);
      } else {
        // Nếu chưa có sinh hiệu, mở form đo sinh hiệu
        setVitalsPatient(acceptedPatient);
      }
      fetchWorklist();
    } catch (error) {
      showWarning('Lỗi: ' + error.message);
    }
  };

  // Enrich items with vitals status
  const enrichItems = (items) => {
    return items.map(item => ({
      ...item,
      hasVitals: vitalsMap[item.maPhieuKham] || false,
      vitalsData: vitalsDataMap[item.maPhieuKham] || null
    }));
  };

  return (
    <div className="flex h-screen bg-slate-50 font-body-md overflow-hidden text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      <WebSocketAutoRefresh
        topics={['/topic/phieu-kham', '/topic/cls', '/topic/dang-ky-kham']}
        onMessage={(topic, data) => {
          fetchWorklist(false);
        }}
      />
      <aside style={{ width: isSidebarOpen ? sidebarWidth : 80 }} className={`bg-white/80 backdrop-blur-xl border-r border-slate-200/60 transition-[width] duration-150 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 relative shrink-0`}>
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
        <div className="h-20 flex items-center justify-center border-b border-slate-100 px-6">
          <div className={`flex items-center gap-3 w-full ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">{isImaging ? 'image' : 'science'}</span>
            </div>
            {isSidebarOpen && <span className="font-black text-2xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-purple-700 tracking-tight">MedCore</span>}
          </div>
        </div>
        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-2">
            {[
              { id: 'worklist', label: deptName, icon: isImaging ? 'image' : 'science' },
              { id: 'history', label: 'Lịch Sử Khoa', icon: 'history' },
              { id: 'patients', label: 'Thông Tin Bệnh Nhân', icon: 'person_search' },
              { id: 'lichlamviec', label: 'Lịch Làm Việc', icon: 'calendar_month' }
            ].map(i => (
              <li key={i.id}>
                <button onClick={() => setActiveTab(i.id)} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200" style={{ backgroundColor: activeTab === i.id ? '#eef2ff' : 'transparent', color: activeTab === i.id ? '#4338ca' : '#64748b' }}>
                  <span className={`material-symbols-outlined ${activeTab === i.id ? 'text-indigo-600' : ''}`}>{i.icon}</span>
                  {isSidebarOpen && <span className="text-[15px]">{i.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-8 relative z-50 shadow-sm">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-500 p-2.5 hover:bg-slate-100 rounded-xl transition-colors ring-1 ring-transparent hover:ring-slate-200">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              {activeTab === 'worklist' ? `Phòng ${deptName}` : 'Thông Tin Bệnh Nhân'}
            </h1>
          </div>
          <div className="flex items-center gap-6 border-l border-slate-200 pl-6">
            <UserMenu
              user={user}
              onLogout={onLogout}
              displayName={`Xin chào ${user?.username || ''}`}
              displayRole={`KTV ${isImaging ? 'Chẩn Đoán Hình Ảnh' : 'Xét Nghiệm'}`}
              accentColor="indigo"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50 scroll-smooth">
          {activeTab === 'lichlamviec' ? <LichLamViecTab user={user} /> : activeTab === 'patients' ? <QuanLyBenhNhan title="Thông Tin Bệnh Nhân" /> : activeTab === 'history' ? (
            <LichSuChuyenKhoa user={user} onReview={(item) => setViewingResult({
              ...item,
              id: item.maPhieuKham,
              tenDichVu: item.tenChuyenKhoa || deptName,
              ngayChiDinh: item.ngayKham,
              ketQua: item.chanDoan || 'Đã khám hoàn thành'
            })} />
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2 2xl:gap-6">
                <TheThongKe title="Chờ tiếp nhận" value={pendingRegistrations.length} icon="person_add" color="from-sky-400 to-blue-500" shadowColor="shadow-blue-500/20" />
                <TheThongKe title="Chờ thực hiện" value={pendingTests.length} icon="pending_actions" color="from-amber-400 to-orange-500" shadowColor="shadow-orange-500/20" />
                <TheThongKe title="Đã hoàn thành" value={completedTests.length} icon="task_alt" color="from-emerald-400 to-teal-500" shadowColor="shadow-teal-500/20" />
                <TheThongKe title="Tổng" value={pendingTests.length + completedTests.length} icon="assignment" color="from-indigo-400 to-purple-500" shadowColor="shadow-indigo-500/20" />
              </div>

              <BangDanhSachCongViec
                list={{
                  data: enrichItems(filterList(
                    worklistTab === 'reception' ? pendingRegistrations :
                      worklistTab === 'pending' ? pendingTests :
                        completedTests
                  )),
                  pendingCount: pendingTests.length,
                  completedCount: completedTests.length,
                  receptionCount: pendingRegistrations.length
                }}
                worklistTab={worklistTab} setWorklistTab={setWorklistTab}
                isImaging={isImaging} loading={loading} isRefreshing={isRefreshing}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                onOpenResult={handleOpenResult} onOpenView={setViewingResult}
                onOpenVitals={handleOpenVitals}
                onEditResult={handleOpenResult}
                onManualRefresh={handleManualRefresh}
                onMarkAbsent={handleMarkAbsent}
                onMarkPresent={handleMarkPresent}
                onAcceptPatient={handleAcceptPatient}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modal nhập kết quả chuyên môn - XÉT NGHIỆM dùng ModalNhapKetQuaXetNghiem, CĐHA dùng ModalNhapKetQua */}
      {selectedTest && !isImaging && <ModalNhapKetQuaXetNghiem test={selectedTest} user={user} servicesList={servicesList} onClose={() => setSelectedTest(null)} onSuccess={() => { setSelectedTest(null); fetchWorklist(); }} />}
      {selectedTest && isImaging && <ModalNhapKetQua test={selectedTest} user={user} isImaging={isImaging} onClose={() => setSelectedTest(null)} onSuccess={() => { setSelectedTest(null); fetchWorklist(); }} />}

      {/* Modal xem kết quả */}
      {viewingResult && <ModalXemKetQua viewingResult={viewingResult} user={user} isImaging={isImaging} onClose={() => setViewingResult(null)} />}

      {/* Modal khám sinh hiệu */}
      {vitalsPatient && (
        <ModalKhamSinhHieu
          patient={vitalsPatient}
          user={user}
          onClose={handleVitalsClose}
          onComplete={handleVitalsComplete}
        />
      )}

      {/* Modal tiếp nhận CLS - KTV nhập lý do đến, sàng lọc, ghi chú */}
      {tiepNhanClsPatient && (
        <ModalNhapTiepNhanCls
          patient={tiepNhanClsPatient}
          user={user}
          onClose={handleTiepNhanClsClose}
          onSuccess={handleTiepNhanClsComplete}
        />
      )}

      {/* Confirm Dialog */}
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

const TheThongKe = ({ title, value, icon, color, shadowColor }) => (
  <div className="bg-white rounded-lg 2xl:rounded-3xl shadow-sm border border-slate-100 px-3 py-2 2xl:p-6 flex items-center gap-2 2xl:gap-5 group">
    <div className={`w-8 h-8 2xl:w-16 2xl:h-16 rounded-lg 2xl:rounded-2xl flex items-center justify-center text-white bg-gradient-to-br ${color} shadow-sm 2xl:shadow-lg ${shadowColor} flex-shrink-0`}>
      <span className="material-symbols-outlined text-[18px] 2xl:text-[32px]">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-[9px] 2xl:text-xs font-bold text-slate-400 uppercase tracking-wide 2xl:tracking-widest truncate leading-none 2xl:leading-normal mb-1 2xl:mb-1.5">{title}</p>
      <h3 className="text-lg 2xl:text-3xl font-black text-slate-800 leading-none">{value}</h3>
    </div>
  </div>
);

export default BangDieuKhienKyThuatVien;