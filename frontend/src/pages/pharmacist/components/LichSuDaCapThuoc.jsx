import React, { useState, useEffect, useCallback } from 'react';
import { getPaidInvoicesDaCapThuocApi } from '../../../api/hoaDonApi';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const LichSuDaCapThuoc = ({ onReview, formatCurrency, formatDateTime }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    paginatedData: filteredHistory,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
  } = usePagination({
    data: history,
    pageSize: 8,
    searchKeys: ['hoTen', 'maBenhNhan', 'maPhieuKham'],
    searchTerm,
    // Hook tự reset về trang 1 khi search đổi, không cần useEffect riêng
  });

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPaidInvoicesDaCapThuocApi();
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching pharmacist history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">history</span>
            Lịch sử đã cấp thuốc (Tất cả các ngày)
          </h3>
          <p className="text-xs text-slate-400 font-medium">Danh sách toa thuốc đã được xác nhận cấp phát</p>
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
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none w-56 transition-all placeholder:font-normal placeholder:text-slate-400"
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

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/30 border-b border-slate-100">
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Mã BN</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Bệnh Nhân</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Hóa Đơn</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Ngày Cấp Thuốc</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Trạng Thái</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Tổng Tiền</th>
              <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy lịch sử cấp thuốc.
                  </td>
                </tr>
              ) : (
              filteredHistory.map(item => (
                <tr key={item.maHoaDon} className="hover:bg-amber-50/20 transition-colors group">
                  <td className="px-6 py-4 font-bold text-xs text-amber-600">
                    #{item.maBenhNhan}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                        {item.hoTen ? item.hoTen.charAt(0).toUpperCase() : '?'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.hoTen}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Mã PK: #{item.maPhieuKham}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-600">
                    #{item.maHoaDon}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    {formatDateTime(item.ngayCapThuoc)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-[14px]">check_circle</span>
                      Đã cấp thuốc
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-700">
                    {formatCurrency(item.tongTien)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onReview(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-amber-600 hover:text-white text-slate-600 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Xem lại
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          label="phiếu"
          visiblePages={visiblePages}
          onPageChange={setCurrentPage}
          jumpPage={jumpPage}
          onJumpPage={handleJumpPage}
          onJumpBlur={handleJumpPageBlur}
          activeClass="bg-amber-600 text-white shadow-md shadow-amber-100"
          hoverClass="hover:bg-amber-50 hover:text-amber-600"
          ringClass="focus:ring-2 focus:ring-amber-200"
        />
      )}
    </div>
  );
};

export default LichSuDaCapThuoc;