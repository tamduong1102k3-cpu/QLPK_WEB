import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { techConfirmClsApi } from '../../../api/phieuKhamApi';
import { toast } from 'react-toastify';

const ModalNhapTiepNhanCls = ({ patient, user, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    lyDoDen: '',
    thongTinSangLoc: '',
    ghiChu: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const initials = (name) =>
    String(name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const handleSubmit = async () => {
    if (!formData.lyDoDen || formData.lyDoDen.trim() === '') {
      toast.warning('Vui lòng nhập lý do đến!');
      return;
    }
    if (!formData.thongTinSangLoc || formData.thongTinSangLoc.trim() === '') {
      toast.warning('Vui lòng nhập thông tin sàng lọc!');
      return;
    }
    setSubmitting(true);
    try {
      await techConfirmClsApi(
        patient.maPhieuKham,
        user?.maNhanVien,
        {
          lyDoDen: formData.lyDoDen.trim(),
          thongTinSangLoc: formData.thongTinSangLoc.trim(),
          ghiChu: formData.ghiChu ? formData.ghiChu.trim() : ''
        }
      );
      toast.success('Tiếp nhận CLS và tạo phiếu chỉ định thành công!');
      if (onSuccess) onSuccess(patient);
    } catch (e) {
      console.error('Lỗi khi tiếp nhận CLS:', e);
      toast.error(e.message || 'Lỗi khi tiếp nhận CLS.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-lg">
              {initials(patient.hoTen)}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{patient.hoTen}</h3>
              <p className="text-sm text-gray-400 mt-1 font-semibold">Mã phiếu khám: #{patient.maPhieuKham}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-10 space-y-6">
          {/* Lý do đến */}
          <div className="w-full">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">
              Lý do đến khám <span className="text-red-500">*</span>
            </label>
            <input type="text"
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-medium text-gray-700 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
              placeholder="Nhập lý do bệnh nhân đến khám..."
              value={formData.lyDoDen}
              onChange={(e) => setFormData(prev => ({ ...prev, lyDoDen: e.target.value }))} />
          </div>

          {/* Thông tin sàng lọc */}
          <div className="w-full">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">
              Thông tin sàng lọc <span className="text-red-500">*</span>
            </label>
            <textarea rows={4}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium text-gray-700 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all resize-none"
              placeholder="VD: Không tiền sử bệnh tim, không cấy ghép kim loại..."
              value={formData.thongTinSangLoc}
              onChange={(e) => setFormData(prev => ({ ...prev, thongTinSangLoc: e.target.value }))} />
          </div>

          {/* Ghi chú */}
          <div className="w-full">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">
              Ghi chú <span className="text-[10px] font-normal text-gray-400 normal-case italic">(không bắt buộc)</span>
            </label>
            <textarea rows={3}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium text-gray-700 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all resize-none"
              placeholder="Nhập lưu ý hoặc hướng dẫn đặc biệt cho kỹ thuật viên..."
              value={formData.ghiChu}
              onChange={(e) => setFormData(prev => ({ ...prev, ghiChu: e.target.value }))} />
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-4">
          <button onClick={onClose}
            className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-500 font-bold text-sm rounded-2xl border border-gray-200 transition-all active:scale-95">
            HỦY BỎ
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="px-12 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-sky-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3">
            {submitting ? (
              <><span className="material-symbols-outlined animate-spin">refresh</span> ĐANG XỬ LÝ...</>
            ) : (
              <><span className="material-symbols-outlined">check_circle</span> HOÀN TẤT TIẾP NHẬN CLS</>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ModalNhapTiepNhanCls;