import { useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { getAvailableClsResultsApi } from '../../../api/phieuKhamApi';
import { getByPhieuKhamApi as _getToaThuocByPhieuKhamApi, getDetailsApi as _getToaThuocDetailsApi } from '../../../api/toaThuocApi';
import { useNotification } from '../../../components/NotificationContext';
import Modal from '../../../components/Modal';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const TabLichSuKhamChiTiet = ({ examHistory, allMeds = [], user, onCopyPrescription }) => {
  const { showError } = useNotification();
  const [showAllSpecialty, setShowAllSpecialty] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const maChuyenKhoa = Number(user?.maChuyenKhoa);

  // Filter history: specialty filter + search + date range
  const filteredHistory = useMemo(() => {
    if (!examHistory || examHistory.length === 0) return [];
    
    let result = [...examHistory];
    
    // 1. Filter by specialty (default only show same specialty, toggle to show all)
    if (!showAllSpecialty) {
      result = result.filter(item => Number(item.maChuyenKhoa) === maChuyenKhoa);
    }
    
    // 2. Filter by search term (maPhieuKham, tenChuyenKhoa, tenDichVu, tenNhanVien, chanDoan, lyDoKham, khamLamSang)
    if (searchTerm && searchTerm.trim() !== '') {
      const kw = searchTerm.trim().toLowerCase();
      result = result.filter(item => {
        const searchable = [
          item.maPhieuKham?.toString(),
          item.tenChuyenKhoa,
          item.tenDichVu,
          item.tenNhanVien,
          item.chanDoan,
          item.chanDoanSoBo,
          item.lyDoKham,
          item.khamLamSang,
          item.benhSu
        ].filter(Boolean).join(' ').toLowerCase();
        return searchable.includes(kw);
      });
    }
    
    // 3. Filter by date range (fromDate -> toDate)
    if (fromDate || toDate) {
      result = result.filter(item => {
        if (!item.ngayKham) return true;
        const itemDate = new Date(item.ngayKham);
        itemDate.setHours(0, 0, 0, 0);
        
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          if (itemDate < from) return false;
        }
        
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          if (itemDate > to) return false;
        }
        
        return true;
      });
    }
    
    return result;
  }, [examHistory, showAllSpecialty, maChuyenKhoa, searchTerm, fromDate, toDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFromDate('');
    setToDate('');
    setCurrentPage(1);
  };

  // Phân trang + filter (filter qua showAllSpecialty đã có trong filteredHistory)
  const {
    paginatedData: paginatedHistory,
    totalItems: filteredCount,
    totalPages,
    currentPage,
    setCurrentPage,
    safeCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
    pageError,
  } = usePagination({
    data: filteredHistory,
    pageSize: 5,
    resetOnChange: false, // Không tự reset khi data đổi (toggle specialty tự setCurrentPage(1))
  });


  const handleViewDetail = async (historyItem) => {
    setSelectedHistoryItem(historyItem);
    setDetailLoading(true);
    setDetailData(null);
    try {
      // 1. Fetch CLS results
      let clsResults = [];
      try {
        clsResults = await getAvailableClsResultsApi(historyItem.maPhieuKham);
      } catch (err) {
        console.error("Lỗi lấy CLS lịch sử:", err);
      }

      // 2. Fetch Prescription details
      let meds = [];
      try {
        const toasList = await _getToaThuocByPhieuKhamApi(historyItem.maPhieuKham);
        if (toasList && toasList.length > 0) {
          for (const t of toasList) {
            const details = await _getToaThuocDetailsApi(t.maToaThuoc);
            if (details) {
              for (const d of details) {
                const catalogMed = allMeds.find(m => m.maThuoc === d.maThuoc);
                meds.push({
                  ...d,
                  tenThuoc: catalogMed?.tenThuoc || `Thuốc #${d.maThuoc}`,
                  hoatChat: catalogMed?.hoatChat || '',
                  donViTinh: catalogMed?.donViTinh || ''
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Lỗi lấy đơn thuốc lịch sử:", err);
      }

      setDetailData({
        clsResults: clsResults || [],
        meds: meds || []
      });
    } catch (error) {
      console.error("Lỗi tải chi tiết lịch sử:", error);
      showError("Không thể tải toàn bộ chi tiết lịch sử khám!");
    } finally {
      setDetailLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in min-h-[500px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-indigo-600">history</span>
          <h3 className="text-xl font-bold text-gray-800">Lịch sử khám bệnh</h3>
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold">
            {filteredHistory.length} phiếu
          </span>
        </div>
        <button
          onClick={() => { setCurrentPage(1); setShowAllSpecialty(!showAllSpecialty); }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 ${
            showAllSpecialty
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="material-symbols-outlined text-sm">
            {showAllSpecialty ? 'filter_alt' : 'filter_alt_off'}
          </span>
          {showAllSpecialty ? 'Lọc theo chuyên khoa' : 'Xem tất cả chuyên khoa'}
        </button>
      </div>

      {/* SEARCH + DATE RANGE FILTERS */}
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <span className="material-symbols-outlined text-sm absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Tìm kiếm: mã phiếu, chuyên khoa, bác sĩ, chẩn đoán, dịch vụ..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          </div>

          {/* From date */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* To date */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
            />
          </div>

          {/* Reset button */}
          {(searchTerm || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <span className="material-symbols-outlined text-4xl mb-2">folder_open</span>
          <p>Chưa có dữ liệu lịch sử khám cho bệnh nhân này</p>
          {!showAllSpecialty && examHistory.length > 0 && (
            <button
              onClick={() => setShowAllSpecialty(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all text-sm"
            >
              Xem tất cả chuyên khoa
            </button>
          )}
          {(searchTerm || fromDate || toDate) && (
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 font-bold rounded-xl transition-all text-sm"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          )}
        </div>
      ) : (
        <>
          {/* IN-LIST WARNING */}
          {pageError && (
            <div className="mb-4 px-4 py-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {pageError}
            </div>
          )}
          <div className="space-y-4">
            {paginatedHistory.map((h, idx) => (
              <div
                key={h.maPhieuKham || idx}
                className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all overflow-hidden"
              >
                <div className="p-5">
                  {/* Header row: Ngày khám + Chuyên khoa + Bác sĩ */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-indigo-500 text-base">calendar_today</span>
                        <span className="font-semibold text-gray-700">{formatDate(h.ngayKham)}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-amber-500 text-base">local_hospital</span>
                        <span className="font-medium text-gray-600">{h.tenChuyenKhoa || 'N/A'}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-teal-500 text-base">medical_services</span>
                        <span className="font-medium text-gray-600">DV: {h.tenDichVu || 'N/A'}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-emerald-500 text-base">stethoscope</span>
                        <span className="font-medium text-gray-600">BS. {h.tenNhanVien || 'N/A'}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                      #{h.maPhieuKham}
                    </span>
                  </div>

                  {/* Body: Chẩn đoán + Đơn thuốc + Xem chi tiết */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Chẩn đoán */}
                    <div className="md:col-span-4">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Chẩn đoán</span>
                      <p className="text-sm font-semibold text-emerald-800 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100 line-clamp-2">
                        {h.chanDoan || h.chanDoanSoBo || 'Đang cập nhật...'}
                      </p>
                    </div>

                    {/* Đơn thuốc */}
                    <div className="md:col-span-5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Đơn thuốc</span>
                      <div className="bg-blue-50 rounded-xl px-3 py-2 border border-blue-100 min-h-[36px]">
                        {h.soLuongThuoc > 0 || h.hasPrescription ? (
                          <p className="text-sm font-semibold text-blue-800">
                            <span className="material-symbols-outlined text-sm align-text-bottom">medication</span>{' '}
                            {h.soLuongThuoc || 'Đã kê'} loại thuốc
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 italic">Không kê thuốc</p>
                        )}
                      </div>
                    </div>

                    {/* Xem chi tiết */}
                    <div className="md:col-span-3 flex items-end justify-end">
                      <button
                        onClick={() => handleViewDetail(h)}
                        className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 text-sm w-full md:w-auto justify-center"
                      >
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION UI */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCount}
              label="phiếu"
              visiblePages={visiblePages}
              onPageChange={setCurrentPage}
              jumpPage={jumpPage}
              onJumpPage={handleJumpPage}
              onJumpBlur={handleJumpPageBlur}
              activeClass="bg-indigo-600 text-white shadow-md shadow-indigo-100"
              hoverClass="hover:bg-indigo-50 hover:text-indigo-600"
              ringClass="focus:ring-2 focus:ring-indigo-200"
            />
          )}
        </>
      )}

      {/* COMPREHENSIVE DETAIL MODAL */}
      {selectedHistoryItem && detailData && (
        <Modal isOpen={true} onClose={() => { setSelectedHistoryItem(null); setDetailData(null); }} maxWidth="900px" zIndex={9999} unstyled={true}>
          <div className="bg-white rounded-3xl max-w-4xl w-full mx-auto shadow-2xl border border-gray-100 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-indigo-950 px-6 py-4 flex items-center justify-between text-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl text-indigo-400">history_edu</span>
                <div>
                  <span className="font-bold text-base block">Chi tiết lịch sử phiên khám</span>
                  <span className="text-xs text-indigo-300 font-semibold">
                    #{selectedHistoryItem.maPhieuKham} — {formatDate(selectedHistoryItem.ngayKham)} — {selectedHistoryItem.tenChuyenKhoa} {selectedHistoryItem.tenDichVu ? ` — ${selectedHistoryItem.tenDichVu}` : ''} — BS. {selectedHistoryItem.tenNhanVien}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedHistoryItem(null); setDetailData(null); }}
                className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* SECTION 1: KHÁM LÂM SÀNG & SINH HIỆU */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="material-symbols-outlined text-sm text-indigo-600">clinical_notes</span>
                  1. Khám Lâm Sàng
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Lý do khám</span>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 font-medium">
                        {selectedHistoryItem.lyDoKham || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Khám lâm sàng</span>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                        {selectedHistoryItem.khamLamSang || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Chẩn đoán sơ bộ</span>
                      <p className="text-sm font-bold text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        {selectedHistoryItem.chanDoanSoBo || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Lời dặn bác sĩ</span>
                      <p className="text-sm text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-100 italic">
                        {selectedHistoryItem.loiDanBacSi || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: KẾT QUẢ CẬN LÂM SÀNG */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="material-symbols-outlined text-sm text-indigo-600">biotech</span>
                  2. Kết Quả Cận Lâm Sàng ({detailData.clsResults.length})
                </h4>
                {detailData.clsResults.length > 0 ? (
                  <div className="space-y-3">
                    {detailData.clsResults.map((cls, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200/60 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-50 pb-1">
                          <span className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-indigo-500 text-base">
                              {cls.loai === 'XET_NGHIEM' ? 'science' : 'radiology'}
                            </span>
                            {cls.tenDichVu}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                            cls.loai === 'XET_NGHIEM' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {cls.loai === 'XET_NGHIEM' ? 'Xét nghiệm' : 'CĐHA'}
                          </span>
                        </div>
                        {cls.noiDungKetQua && (
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block">Chi tiết kết quả:</span>
                            <p className="text-xs text-gray-600 bg-gray-50/50 p-2 rounded border border-gray-100 whitespace-pre-wrap">{cls.noiDungKetQua}</p>
                          </div>
                        )}
                        {cls.ketLuan && (
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 block">Kết luận:</span>
                            <p className="text-xs font-bold text-rose-600">{cls.ketLuan}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4 bg-white rounded-xl border border-gray-100">
                    Không chỉ định cận lâm sàng nào trong phiên khám này.
                  </p>
                )}
              </div>

              {/* SECTION 3: ĐƠN THUỐC ĐÃ KÊ */}
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-indigo-600">medication</span>
                    3. Đơn Thuốc Đã Kê ({detailData.meds.length} thuốc)
                  </h4>
                  {onCopyPrescription && detailData.meds.length > 0 && (
                    <button
                      onClick={() => onCopyPrescription(detailData.meds)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-200"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                      Sao chép toa này → Kê đơn
                    </button>
                  )}
                </div>
                {detailData.meds.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-xl border border-gray-200/60 shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="p-3 font-bold text-gray-500 uppercase">Tên thuốc / Hoạt chất</th>
                          <th className="p-3 font-bold text-gray-500 uppercase text-center">Sáng</th>
                          <th className="p-3 font-bold text-gray-500 uppercase text-center">Trưa</th>
                          <th className="p-3 font-bold text-gray-500 uppercase text-center">Chiều</th>
                          <th className="p-3 font-bold text-gray-500 uppercase text-center">Tối</th>
                          <th className="p-3 font-bold text-gray-500 uppercase text-center">Số Ngày</th>
                          <th className="p-3 font-bold text-gray-500 uppercase">Cách dùng / Hướng dẫn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {detailData.meds.map((med, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3">
                              <p className="font-bold text-gray-800">{med.tenThuoc}</p>
                              {med.hoatChat && <p className="text-[10px] text-gray-400 font-medium">HC: {med.hoatChat}</p>}
                            </td>
                            <td className="p-3 text-center font-bold text-gray-700">{med.sang || '-'}</td>
                            <td className="p-3 text-center font-bold text-gray-700">{med.trua || '-'}</td>
                            <td className="p-3 text-center font-bold text-gray-700">{med.chieu || '-'}</td>
                            <td className="p-3 text-center font-bold text-gray-700">{med.toi || '-'}</td>
                            <td className="p-3 text-center font-bold text-indigo-600">{med.soNgay} ngày</td>
                            <td className="p-3">
                              <p className="font-semibold text-gray-700">{med.cachDung}</p>
                              {med.lieuDung && <p className="text-[10px] text-gray-400">{med.lieuDung}</p>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-4 bg-white rounded-xl border border-gray-100">
                    Không kê thuốc trong phiên khám này.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
              <button
                onClick={() => { setSelectedHistoryItem(null); setDetailData(null); }}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-gray-200"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* DETAILED LOADER SPINNER */}
      {detailLoading && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-xs flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="bg-white p-6 rounded-2xl shadow-xl border flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-gray-600">Đang tải toàn bộ dữ liệu lịch sử phiên khám...</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TabLichSuKhamChiTiet;