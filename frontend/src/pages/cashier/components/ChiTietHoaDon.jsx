import React from 'react';
import InHoaDon from './InHoaDon';

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const statusBadge = (status) => {
  const map = {
    'chua thanh toan': { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Chưa thanh toán' },
    'da thanh toan': { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Đã thanh toán' },
    'dang_cho_thanh_toan': { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Đang chờ thanh toán' },
    'huy': { bg: 'bg-red-50', text: 'text-red-700', label: 'Đã hủy' },
  };
  const key = (status || '').toLowerCase();
  return map[key] || { bg: 'bg-gray-50', text: 'text-gray-600', label: status || '—' };
};

const ChiTietHoaDon = ({ invoice, selectedPatient, invoiceDetails, onPay }) => {
  return (
    <>
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-gray-700 text-sm">
            Hóa Đơn #{invoice.maHoaDon?.toString().padStart(4, '0')}
          </h4>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${statusBadge(invoice.trangThai).bg} ${statusBadge(invoice.trangThai).text}`}>
            {statusBadge(invoice.trangThai).label}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[9px] font-semibold text-gray-400 uppercase">Mã PK</p>
            <p className="font-bold text-gray-800">PK#{invoice.maPhieuKham?.toString().padStart(4, '0')}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[9px] font-semibold text-gray-400 uppercase">Phương thức</p>
            <p className="font-bold text-gray-800 text-xs truncate">
              {invoice.phuongThucThanhToan === 'tien_mat' ? '💵 Tiền mặt' : '—'}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
            <p className="text-[9px] font-semibold text-emerald-500 uppercase">Tổng tiền</p>
            <p className="font-bold text-emerald-600 text-lg">{formatCurrency(invoice.tongTien)}</p>
          </div>
        </div>
        {invoice.maGiaoDich && (
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 mt-3">
            <p className="text-[9px] font-semibold text-slate-400 uppercase">Mã giao dịch</p>
            <p className="font-mono text-slate-700 text-sm font-bold mt-0.5">{invoice.maGiaoDich}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden flex-1">
        <div className="p-4 border-b border-gray-100">
          <h4 className="font-bold text-gray-700 text-sm">Chi tiết hóa đơn</h4>
        </div>
        {invoiceDetails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <span className="material-symbols-outlined text-3xl mb-2">receipt_long</span>
            <p className="text-sm">Không có chi tiết</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3 font-semibold">Nội dung</th>
                  <th className="py-2.5 px-3 font-semibold">Loại</th>
                  <th className="py-2.5 px-3 font-semibold text-right">SL</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Đơn giá</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoiceDetails.map((item) => {
                  const lBadge = item.loaiMuc === 'DICH_VU'
                    ? { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Dịch vụ' }
                    : { bg: 'bg-green-50', text: 'text-green-700', label: 'Thuốc' };
                  return (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="py-2.5 px-3 text-sm text-gray-700">{item.noiDung}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${lBadge.bg} ${lBadge.text}`}>{lBadge.label}</span>
                      </td>
                      <td className="py-2.5 px-3 text-sm text-gray-600 text-right whitespace-nowrap">{item.soLuong}</td>
                      <td className="py-2.5 px-3 text-sm text-gray-600 text-right whitespace-nowrap">{formatCurrency(item.donGia)}</td>
                      <td className="py-2.5 px-3 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">{formatCurrency(item.thanhTien)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan="4" className="py-2.5 px-3 text-sm font-bold text-gray-700 text-right whitespace-nowrap">Tổng cộng:</td>
                  <td className="py-2.5 px-3 font-bold text-emerald-600 text-right whitespace-nowrap">{formatCurrency(invoice.tongTien)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-400">Tổng thanh toán</p>
              <p className="text-2xl font-black text-emerald-600">{formatCurrency(invoice.tongTien)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <InHoaDon invoice={invoice} patient={selectedPatient} invoiceDetails={invoiceDetails} />
              <button
                onClick={onPay}
                className="px-6 sm:px-8 py-3 sm:py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 flex-1 sm:flex-none justify-center"
              >
                <span className="material-symbols-outlined">payments</span>
                Thanh toán
              </button>
            </div>
          </div>
      </div>
    </>
  );
};

export default ChiTietHoaDon;
