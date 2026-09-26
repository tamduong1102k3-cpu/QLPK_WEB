import { useState, useEffect, useCallback, useRef } from 'react';
import NhomOSoLieu from './NhomOSoLieu';
import { getTodayApi } from '../../../api/dangKyKhamBenhApi';
import { getTodayResultsApi as getTodayResultsXetNghiemApi } from '../../../api/ketQuaXetNghiemApi';
import { getTodayResultsApi as getTodayResultsCdhaApi } from '../../../api/ketQuaCdhaApi';
import { getPendingTestsApi, getCompletedTestsTodayApi } from '../../../api/phieuChiDinhApi';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const HangDoiKham = ({ user, handleSelectPatient, refreshTrigger }) => {
  const [patients, setPatients] = useState({
    waiting: [],
    completed: [],
    waitingCls: []
  });
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('waiting'); // 'waiting' | 'waitingCls' | 'completed'
  const debounceTimerRef = useRef(null);

  // Mã chuyên khoa: 1: Nội, 3: Nhi, 4: TMH, 5: RHM, 7: XN, 11: Tim mạch, 12: CĐHA
  const isXetNghiemDoc = Number(user?.maChuyenKhoa) === 7;
  const isCdhaDoc = Number(user?.maChuyenKhoa) === 12;
  const isRhmDoc = Number(user?.maChuyenKhoa) === 5;
  const isLabDoctor = isXetNghiemDoc || isCdhaDoc;

  const fetchQueue = useCallback(async (keyword = '') => {
    try {
      setLoadingQueue(true);
      let data = null;
      if (isLabDoctor) {
        const params = { maChuyenKhoa: user?.maChuyenKhoa };
        const [pendingRes, completedRes] = await Promise.allSettled([
          getPendingTestsApi(params),
          getCompletedTestsTodayApi(params)
        ]);
        const pending = pendingRes.status === 'fulfilled' ? (pendingRes.value || []) : [];
        const completed = completedRes.status === 'fulfilled' ? (completedRes.value || []) : [];
        setPatients({
          waiting: completed, // completed = DA_THUC_HIEN -> cần bác sĩ duyệt
          completed: pending,  // pending = CHUA_THUC_HIEN -> chưa có kết quả
          waitingCls: []
        });
        return;
      } else if (isXetNghiemDoc) {
        data = await getTodayResultsXetNghiemApi();
      } else if (isCdhaDoc) {
        data = await getTodayResultsCdhaApi();
      } else {
        data = await getTodayApi(keyword);
      }

      if (data) {
        let waiting = [];
        let completed = [];
        let waitingCls = [];
        if (isXetNghiemDoc || isCdhaDoc) {
          waiting = data.filter(r => r.trangThai === 'CHO_DUYET');
          completed = data.filter(r => r.trangThai === 'DA_DUYET' || r.trangThai === 'HOAN_THANH' || r.trangThai === 'CHO_BAC_SI');
        } else {
          if (user?.maChuyenKhoa) {
            data = data.filter(r => Number(r.maChuyenKhoa) === Number(user.maChuyenKhoa));
          }
          waiting = data.filter(r => r.trangThai === 'CHO_BAC_SI' || r.trangThai === 'DA_KHAM_LAM_SANG' || (isRhmDoc && r.trangThai === 'DANG_KHAM'));
          waitingCls = data.filter(r => r.trangThai === 'CHO_CLS');
          completed = data.filter(r => r.trangThai === 'HOAN_THANH');
        }
        setPatients({
          waiting,
          completed,
          waitingCls
        });
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoadingQueue(false);
    }
  }, [user, isXetNghiemDoc, isCdhaDoc, isRhmDoc, isLabDoctor]);

  useEffect(() => {
    fetchQueue(appliedSearch); // eslint-disable-line react-hooks/set-state-in-effect
    const interval = setInterval(() => fetchQueue(appliedSearch), 30000);
    return () => clearInterval(interval);
  }, [fetchQueue, appliedSearch, refreshTrigger]);

  // Debounce search: chờ 400ms sau khi user ngừng gõ mới gọi API
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setAppliedSearch(value);
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setAppliedSearch('');
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  // Danh sách hiển thị theo tab
  const allDisplayed = activeTab === 'waiting' ? patients.waiting : activeTab === 'waitingCls' ? patients.waitingCls : patients.completed;

  // Phân trang dùng chung (search đã xử lý server-side qua appliedSearch)
  const {
    paginatedData: displayedPatients,
    filteredData: allFiltered,
    totalItems: displayedCount,
    totalPages,
    currentPage,
    setCurrentPage,
    safeCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
    pageError,
    resetPage,
  } = usePagination({
    data: allDisplayed,
    pageSize: 8,
    resetOnChange: false, // Tab change sẽ tự gọi resetPage
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getTabLabel = () => {
    if (isLabDoctor) {
      return { waiting: 'Chờ duyệt KQ', waitingCls: 'Chờ CLS', completed: 'Chờ thực hiện' };
    }
    return { waiting: 'Chờ khám', waitingCls: 'Chờ CLS', completed: 'Đã khám' };
  };
  const tabLabels = getTabLabel();

  const getStatusBadge = () => {
    if (activeTab === 'waiting') {
      return { label: 'CHỜ KHÁM', bg: 'bg-amber-100', text: 'text-amber-700' };
    } else if (activeTab === 'waitingCls') {
      return { label: 'CHỜ CLS', bg: 'bg-purple-100', text: 'text-purple-700' };
    } else {
      return { label: 'HOÀN THÀNH', bg: 'bg-green-100', text: 'text-green-700' };
    }
  };

  const getActionButton = () => {
    if (activeTab === 'waiting') {
      return { label: 'Khám', bg: 'bg-indigo-600 hover:bg-indigo-700' };
    } else if (activeTab === 'waitingCls') {
      return { label: 'Xem', bg: 'bg-purple-600 hover:bg-purple-700' };
    } else {
      return { label: 'Xem', bg: 'bg-green-600 hover:bg-green-700' };
    }
  };

  const statusBadge = getStatusBadge();
  const actionButton = getActionButton();

  return (
    <div className="animate-fade-in space-y-6 flex flex-col h-full">
      <NhomOSoLieu user={user} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-600">person_search</span>
              {isLabDoctor ? 'Quản lý bệnh nhân' : 'Danh Sách Bệnh Nhân'}
            </h3>
            <button onClick={() => fetchQueue(appliedSearch)} className="p-2 hover:bg-white rounded-xl transition-all text-gray-400 hover:text-indigo-600 shadow-sm border border-transparent hover:border-gray-200">
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>

          {/* Tabs: Chờ khám | Chờ CLS | Đã khám */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => handleTabChange('waiting')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'waiting'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
              {tabLabels.waiting}
              {patients.waiting.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'waiting' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  {patients.waiting.length}
                </span>
              )}
            </button>
            {!isLabDoctor && (
              <button
                onClick={() => handleTabChange('waitingCls')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'waitingCls'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">biotech</span>
                {tabLabels.waitingCls}
                {patients.waitingCls.length > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === 'waitingCls' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {patients.waitingCls.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => handleTabChange('completed')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'completed'
                  ? 'bg-green-600 text-white shadow-md shadow-green-200'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {tabLabels.completed}
              {patients.completed.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600'
                }`}>
                  {patients.completed.length}
                </span>
              )}
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên, CCCD, mã phiếu khám, chuyên khoa..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button onClick={handleClearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* IN-LIST WARNING */}
        {pageError && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2 flex-shrink-0">
            <span className="material-symbols-outlined text-sm">error</span>
            {pageError}
          </div>
        )}

        <div className="overflow-x-auto flex-1 min-h-0">
          <table className="w-full text-left">
            <thead className="bg-white text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">STT</th>
                <th className="px-6 py-4">Bệnh nhân</th>
                <th className="px-6 py-4">Mã</th>
                <th className="px-6 py-4">CCCD</th>
                <th className="px-6 py-4">Dịch vụ</th>
                <th className="px-6 py-4">Ghi chú</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingQueue ? (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-gray-400">Đang tải...</td>
                </tr>
              ) : allDisplayed.length === 0 ? (
                <tr className="h-full">
                  <td colSpan="8" className="text-center py-10 text-gray-400">
                    {appliedSearch
                      ? `Không tìm thấy bệnh nhân với từ khóa "${appliedSearch}"`
                      : activeTab === 'waiting'
                        ? 'Không có bệnh nhân đang chờ'
                        : activeTab === 'waitingCls'
                          ? 'Không có bệnh nhân chờ CLS'
                          : 'Không có bệnh nhân đã khám hôm nay'}
                  </td>
                </tr>
              ) : (
                displayedPatients.map((p, idx) => (
                  <tr key={p.id || p.maPhieuKham || idx} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-800">{p.hoTen || p.tenBenhNhan || 'Bệnh nhân'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">#{p.maPhieuKham || p.maBenhNhan || p.maChiTiet || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.cccd || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.tenChuyenKhoa || p.tenDichVu || p.dichVu || p.phong || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-[150px] truncate" title={p.ghiChu || ''}>{p.ghiChu || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${statusBadge.bg} ${statusBadge.text}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSelectPatient(p, activeTab === 'completed')}
                        className={`px-3 py-1.5 text-white text-xs font-bold rounded-lg transition-all ${actionButton.bg}`}
                      >
                        {actionButton.label}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION UI */}
        {!loadingQueue && allDisplayed.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={allDisplayed.length}
              label="bệnh nhân"
              visiblePages={visiblePages}
              onPageChange={setCurrentPage}
              jumpPage={jumpPage}
              onJumpPage={handleJumpPage}
              onJumpBlur={handleJumpPageBlur}
              activeClass="bg-indigo-600 text-white shadow-md shadow-indigo-100"
              hoverClass="hover:bg-indigo-50 hover:text-indigo-600"
              ringClass="focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HangDoiKham;