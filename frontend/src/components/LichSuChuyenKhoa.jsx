import { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { getSpecialtyHistoryApi, getAvailableClsResultsApi } from '../api/phieuKhamApi';
import { getByPhieuKhamApi as _getToaThuocByPhieuKhamApi, getDetailsApi as _getToaThuocDetailsApi } from '../api/toaThuocApi';
import { getByPhieuKhamApi } from '../api/khamLamSangApi';
import { useNotification } from '../components/NotificationContext';
import Modal from './Modal';
import usePagination from '../hooks/usePagination';
import Pagination from './Pagination';

const PAGE_SIZE = 8;

const LichSuChuyenKhoa = ({ user }) => {
  const { showError } = useNotification();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const maChuyenKhoa = user?.maChuyenKhoa;

  const fetchHistory = useCallback(async () => {
    if (!maChuyenKhoa) return;
    try {
      setLoading(true);
      const data = await getSpecialtyHistoryApi(maChuyenKhoa);
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching specialty history:", error);
    } finally {
      setLoading(false);
    }
  }, [maChuyenKhoa]);

  useEffect(() => {
    fetchHistory(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchHistory]);

  const {
    paginatedData: paginatedHistory,
    filteredData: filteredHistory,
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
    data: history,
    pageSize: PAGE_SIZE,
    searchKeys: ['hoTen', 'maPhieuKham', 'chanDoan'],
    searchTerm,
  });

  const handleViewDetail = async (historyItem) => {
    setSelectedHistoryItem(historyItem);
    setDetailLoading(true);
    setDetailData(null);
    try {
      // 0. Fetch KhamLamSang details by maPhieuKham
      try {
        const khamLamSangData = await getByPhieuKhamApi(historyItem.maPhieuKham);
        if (khamLamSangData) {
          historyItem = {
            ...historyItem,
            lyDoKham: khamLamSangData.lyDoKham || historyItem.lyDoKham,
            khamLamSang: khamLamSangData.khamLamSang || historyItem.khamLamSang,
            chanDoanSoBo: khamLamSangData.chanDoanSoBo || historyItem.chanDoanSoBo,
            loiDanBacSi: khamLamSangData.loiDanBacSi || historyItem.loiDanBacSi,
          };
          setSelectedHistoryItem(historyItem);
        }
      } catch (err) {
        console.error("Lỗi lấy khám lâm sàng lịch sử:", err);
      }

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
                meds.push({
                  ...d,
                  tenThuoc: d.tenThuoc || `Thuốc #${d.maThuoc}`,
                  hoatChat: d.hoatChat || '',
                  donViTinh: d.donViTinh || ''
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

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600">history_edu</span>
            Lịch sử khám chuyên khoa (Tất cả các ngày)
          </h3>
          <p className="text-xs text-slate-400 font-medium">Chuyên khoa: {user?.tenChuyenKhoa || 'Mọi chuyên khoa'}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm bệnh nhân, mã phiếu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-56 transition-all placeholder:font-normal placeholder:text-slate-400"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>

          <button
            onClick={fetchHistory}
            disabled={loading}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>
        </div>
      </div>

      {/* IN-LIST WARNING */}
      {pageError && (
        <div className="px-6 py-3 bg-rose-50 border-b border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {pageError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Mã Phiếu</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Bệnh Nhân</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Ngày Khám</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Bác Sĩ</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Dịch Vụ</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Chẩn Đoán</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : filteredHistory.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">
                  Không tìm thấy lịch sử khám nào.
                </td>
              </tr>
            ) : (
              paginatedHistory.map(item => (
                <tr key={item.maPhieuKham} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-6 py-4 font-bold text-xs text-indigo-600">
                    #{item.maPhieuKham}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {item.hoTen ? item.hoTen.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.hoTen}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Mã BN: #{item.maBenhNhan}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {item.ngayKham ? new Date(item.ngayKham).toLocaleDateString('vi-VN') : '--'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-medium">{item.tenNhanVien || '--'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{item.tenDichVu || '--'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate">{item.chanDoan || '--'}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetail(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-600 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION UI */}
      {!loading && filteredHistory.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100">
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
        </div>
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
                    #{selectedHistoryItem.maPhieuKham} — {selectedHistoryItem.tenChuyenKhoa} {selectedHistoryItem.tenDichVu ? ` — ${selectedHistoryItem.tenDichVu}` : ''} — BS. {selectedHistoryItem.tenNhanVien}
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
                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-200 pb-2">
                  <span className="material-symbols-outlined text-sm text-indigo-600">medication</span>
                  3. Đơn Thuốc Đã Kê ({detailData.meds.length} thuốc)
                </h4>
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

export default LichSuChuyenKhoa;