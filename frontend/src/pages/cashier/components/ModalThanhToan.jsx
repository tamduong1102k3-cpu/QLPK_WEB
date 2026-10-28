import React from 'react';
import { createPortal } from 'react-dom';

const formatCurrency = (amount) => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const ModalThanhToan = ({
  show, onClose, currentInvoice, tongTien,
  processing,
  onSelectMethod
}) => {
  if (!show) return null;

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '480px', maxWidth: 'calc(100vw - 32px)', padding: '24px', flexShrink: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-800">Xác nhận thanh toán</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500">Hóa đơn</span>
            <span className="font-bold text-gray-800">#{currentInvoice?.maHoaDon?.toString().padStart(4, '0')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Số tiền phải thanh toán</span>
            <span className="text-xl font-black text-emerald-600">{formatCurrency(tongTien)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Chọn phương thức để thanh toán</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'tien_mat', label: 'Tiền mặt', icon: 'payments' },
              { value: 'vnpay', label: 'VNPay', icon: 'credit_card' },
            ].map((method) => (
              <button
                key={method.value}
                onClick={() => onSelectMethod(method.value)}
                disabled={processing}
                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 justify-center
                  border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:bg-emerald-50/30
                  ${processing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="material-symbols-outlined">{method.icon}</span>
                <span className="font-bold text-xs">{method.label}</span>
              </button>
            ))}
          </div>
          {processing && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-600 font-semibold">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Đang xử lý thanh toán...
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 text-gray-500 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            Hủy
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalThanhToan;