import React, { useState, useEffect, useCallback } from 'react';
import { getPaidInvoicesApi, getChiTietApi } from '../../../api/hoaDonApi';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const formatCurrencyLocal = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const LichSuThanhToan = ({ formatCurrency }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNgay, setFilterNgay] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPaidInvoicesApi();
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching payment history:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleReview = async (item) => {
    setSelectedInvoice(item);
    setDetailLoading(true);
    try {
      const details = await getChiTietApi(item.maHoaDon);
      setInvoiceDetails(details || []);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      setInvoiceDetails([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Lọc theo ngày - dùng useCallback để reference ổn định giữa các render,
  // tránh bị reset trang về 1 mỗi lần re-render (vì filters trong usePagination
  // là dependency của useEffect reset page)
  const invoiceFilters = useCallback((item) => {
    if (filterNgay === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (!item.ngayThanhToan) return false;
      const date = new Date(item.ngayThanhToan);
      if (date < today) return false;
    }
    return true;
  }, [filterNgay]);

  const {
    paginatedData: pagedHistory,
    totalItems: pagedTotalItems,
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
    searchKeys: ['hoTen', 'maBenhNhan', 'maHoaDon'],
    searchTerm,
    filters: invoiceFilters,
  });

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

  // Chỉ tính doanh thu từ các hóa đơn ĐÃ THANH TOÁN
  const isPaid = (item) => {
    const st = (item.trangThai || '').toLowerCase();
    return st === 'da thanh toan' || st === 'da_thanh_toan';
  };

  const tongTienHomNay = history.filter(item => {
    if (!isPaid(item)) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!item.ngayThanhToan) return false;
    const date = new Date(item.ngayThanhToan);
    return date >= today;
  }).reduce((sum, item) => sum + (Number(item.tongTien) || 0), 0);

  const tongTienTatCa = history.filter(isPaid).reduce((sum, item) => sum + (Number(item.tongTien) || 0), 0);

  const fmt = formatCurrency || formatCurrencyLocal;

  // Hàm render badge trạng thái hóa đơn
  const renderTrangThai = (trangThai) => {
    const st = (trangThai || '').toLowerCase();
    if (st === 'da thanh toan' || st === 'da_thanh_toan') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Đã thanh toán
        </span>
      );
    }
    if (st === 'dang_cho_thanh_toan' || st === 'cho thanh toan' || st === 'dang cho thanh toan') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
          <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
          Chờ thanh toán
        </span>
      );
    }
    // Mặc định: chưa thanh toán / các trạng thái khác
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200">
        <span className="material-symbols-outlined text-[14px]">cancel</span>
        {st === 'chua thanh toan' || st === 'chua_thanh_toan' ? 'Chưa thanh toán' : (trangThai || 'Không xác định')}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
              Lịch sử thanh toán (Tất cả các ngày)
            </h3>
            <p className="text-xs text-slate-400 font-medium">Danh sách tất cả hóa đơn</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setFilterNgay('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filterNgay === 'all'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilterNgay('today')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filterNgay === 'today'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Hôm nay
              </button>
            </div>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm kiếm hóa đơn, bệnh nhân..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none w-56 transition-all placeholder:font-normal placeholder:text-slate-400"
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

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 border-b border-slate-100 bg-gradient-to-r from-emerald-50/30 to-transparent">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tổng hóa đơn</p>
            <p className="text-2xl font-black text-slate-800">{history.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Doanh thu hôm nay</p>
            <p className="text-2xl font-black text-emerald-600">{fmt(tongTienHomNay)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tổng doanh thu</p>
            <p className="text-2xl font-black text-slate-800">{fmt(tongTienTatCa)}</p>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Mã HĐ</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Bệnh Nhân</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Ngày Thanh Toán</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider">Số Điện Thoại</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-right">Tổng Tiền</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 tracking-wider text-center">Thao Tác</th>
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
              ) : pagedHistory.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy hóa đơn nào.
                  </td>
                </tr>
              ) : (
                pagedHistory.map(item => (
                  <tr key={item.maHoaDon} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="px-6 py-4 font-bold text-xs text-emerald-600">
                      #{item.maHoaDon}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                          {item.hoTen ? item.hoTen.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{item.hoTen}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Mã BN: #{item.maBenhNhan}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {formatDateTime(item.ngayThanhToan)}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                      {item.soDienThoai || <span className="text-slate-300 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderTrangThai(item.trangThai)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700 text-right">
                      {fmt(item.tongTien)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleReview(item)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
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
        {!loading && pagedTotalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagedTotalItems}
            label="hóa đơn"
            visiblePages={visiblePages}
            onPageChange={setCurrentPage}
            jumpPage={jumpPage}
            onJumpPage={handleJumpPage}
            onJumpBlur={handleJumpPageBlur}
            activeClass="bg-emerald-600 text-white shadow-md shadow-emerald-100"
            hoverClass="hover:bg-emerald-50 hover:text-emerald-600"
            ringClass="focus:ring-2 focus:ring-emerald-200"
          />
        )}
      </div>

      {/* Modal chi tiết hóa đơn */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <span className="material-symbols-outlined text-emerald-600">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Chi tiết hóa đơn #{selectedInvoice.maHoaDon}</h3>
                  <p className="text-xs text-slate-400 font-medium">{selectedInvoice.hoTen} - Mã BN: #{selectedInvoice.maBenhNhan}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedInvoice(null); setInvoiceDetails([]); }}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Thông tin hóa đơn */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Mã HĐ</p>
                  <p className="font-bold text-slate-800">#{selectedInvoice.maHoaDon}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Mã BN</p>
                  <p className="font-bold text-slate-800">#{selectedInvoice.maBenhNhan}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Ngày thanh toán</p>
                  <p className="font-bold text-slate-800 text-xs">{formatDateTime(selectedInvoice.ngayThanhToan)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Phương thức</p>
                  <p className="font-bold text-slate-800 text-xs capitalize">
                    {selectedInvoice.phuongThucThanhToan === 'tien_mat' ? '💵 Tiền mặt' :
                     selectedInvoice.phuongThucThanhToan === 'chuyen_khoan' ? '🏦 Chuyển khoản' :
                     selectedInvoice.phuongThucThanhToan === 'vnpay' ? '💳 VNPay' :
                     selectedInvoice.phuongThucThanhToan && selectedInvoice.phuongThucThanhToan !== 'chua_xac_dinh' ? selectedInvoice.phuongThucThanhToan : '—'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Mã Phiếu Khám</p>
                  <p className="font-bold text-slate-800">#{selectedInvoice.maPhieuKham}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase">Tổng tiền</p>
                  <p className="font-bold text-emerald-600">{fmt(selectedInvoice.tongTien)}</p>
                </div>
              </div>

              {/* Bảng chi tiết */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-bold text-sm text-slate-700">Chi tiết các khoản</h4>
                </div>
                {detailLoading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Đang tải chi tiết...
                  </div>
                ) : invoiceDetails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <span className="material-symbols-outlined text-3xl mb-2">receipt_long</span>
                    <p className="text-sm">Không có chi tiết</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 font-semibold">Nội dung</th>
                          <th className="py-3 px-4 font-semibold">Loại</th>
                          <th className="py-3 px-4 font-semibold text-right">SL</th>
                          <th className="py-3 px-4 font-semibold text-right">Đơn giá</th>
                          <th className="py-3 px-4 font-semibold text-right">Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceDetails.map((item) => {
                          const lBadge = item.loaiMuc === 'DICH_VU'
                            ? { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Dịch vụ' }
                            : { bg: 'bg-green-50', text: 'text-green-700', label: 'Thuốc' };
                          return (
                            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="py-3 px-4 text-sm text-slate-700">{item.noiDung}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${lBadge.bg} ${lBadge.text}`}>{lBadge.label}</span>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600 text-right">{item.soLuong}</td>
                              <td className="py-3 px-4 text-sm text-slate-600 text-right">{fmt(item.donGia)}</td>
                              <td className="py-3 px-4 text-sm font-bold text-emerald-600 text-right">{fmt(item.thanhTien)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50">
                          <td colSpan="4" className="py-3 px-4 text-sm font-bold text-slate-700 text-right">Tổng cộng:</td>
                          <td className="py-3 px-4 font-bold text-emerald-600 text-right">{fmt(selectedInvoice.tongTien)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => { setSelectedInvoice(null); setInvoiceDetails([]); }}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LichSuThanhToan;