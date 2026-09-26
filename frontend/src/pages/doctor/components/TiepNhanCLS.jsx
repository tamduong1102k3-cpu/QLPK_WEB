import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { createTiepNhanClsApi } from '../../../api/tiepNhanClsApi';
import { confirmClsServiceApi } from '../../../api/phieuKhamApi';
import { toast } from 'react-toastify';

const initials = (name) =>
  String(name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

const TiepNhanCLS = ({ pendingConfirmationList = [], user, onConfirmSuccess }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedConfirmItem, setSelectedConfirmItem] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [tiepNhanData, setTiepNhanData] = useState({ lyDoDen: '', thongTinSangLoc: '', ghiChu: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenConfirmModal = (item) => {
    setSelectedConfirmItem(item);
    setTiepNhanData({ lyDoDen: '', thongTinSangLoc: '', ghiChu: '' });
    setShowConfirmModal(true);
  };

  const handleCloseModal = () => {
    setShowConfirmModal(false);
    setSelectedConfirmItem(null);
  };

  const handleSaveConfirmService = async () => {
    if (!selectedConfirmItem?.maPhieuKham) return;
    if (!tiepNhanData.lyDoDen || tiepNhanData.lyDoDen.trim() === '') {
      toast.warning('Vui lòng nhập lý do đến!');
      return;
    }
    if (!tiepNhanData.thongTinSangLoc || tiepNhanData.thongTinSangLoc.trim() === '') {
      toast.warning('Vui lòng nhập thông tin sàng lọc!');
      return;
    }
    setConfirmingId(selectedConfirmItem.maPhieuKham);
    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      await createTiepNhanClsApi({
        maPhieuKham: selectedConfirmItem.maPhieuKham,
        lyDoDen: tiepNhanData.lyDoDen.trim(),
        thongTinSangLoc: tiepNhanData.thongTinSangLoc.trim(),
        ghiChu: tiepNhanData.ghiChu ? tiepNhanData.ghiChu.trim() : ''
      });
      await confirmClsServiceApi(selectedConfirmItem.maPhieuKham, user?.maNhanVien);
      toast.success('Tiếp nhận bệnh nhân và tạo phiếu chỉ định thành công!');
      if (onConfirmSuccess) onConfirmSuccess();
    } catch (e) {
      console.error('Lỗi khi tiếp nhận dịch vụ:', e);
      toast.error(e.message || 'Lỗi khi tiếp nhận dịch vụ.');
    } finally {
      setConfirmingId(null);
      setSelectedConfirmItem(null);
      setSubmitting(false);
    }
  };

  /* ── Empty state ── */
  if (pendingConfirmationList.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center"
        style={{ background: '#e5eeff', border: '2px dashed #adc7ff' }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: '#d3e4fe' }}>
          <span className="material-symbols-outlined text-4xl" style={{ color: '#005bbf' }}>fact_check</span>
        </div>
        <h3 className="text-lg font-bold" style={{ color: '#0b1c30' }}>Không có bệnh nhân chờ xác nhận</h3>
        <p className="text-sm mt-2" style={{ color: '#414754' }}>
          Tất cả bệnh nhân CLS đã được xác nhận hoặc chưa có bệnh nhân mới.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5 pb-4"
        style={{ borderBottom: '1px solid #c1c6d6' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #1a73e8, #005bbf)' }}>
            <span className="material-symbols-outlined text-white text-xl">fact_check</span>
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: '#0b1c30' }}>Xác nhận dịch vụ CLS</h3>
            <p className="text-xs mt-0.5" style={{ color: '#727785' }}>Danh sách bệnh nhân chờ tiếp nhận</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-white px-4 py-2 rounded-xl shadow-md"
          style={{ background: '#005bbf' }}>
          <span className="material-symbols-outlined text-base">people</span>
          <span className="text-lg font-black">{pendingConfirmationList.length}</span>
          <span className="text-xs font-semibold">BN</span>
        </div>
      </div>

      {/* ── Patient list ── */}
      <div className="space-y-3">
        {pendingConfirmationList.map((item) => {
          const isConfirming = confirmingId === item.maPhieuKham;
          return (
            <div key={item.maPhieuKham}
              className="flex items-center justify-between rounded-2xl px-5 py-4 transition-all"
              style={{
                background: '#eff4ff',
                border: '1px solid #d3e4fe',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#dbeafe';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#eff4ff';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'none';
              }}>
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-full text-white text-xs font-bold flex items-center justify-center shadow-md flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #1a73e8, #005bbf)' }}>
                  {initials(item.hoTen)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-sm font-bold truncate max-w-[200px]" style={{ color: '#0b1c30' }}>{item.hoTen}</h4>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                      style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#f59e0b' }} />
                      Chờ xác nhận
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-md"
                      style={{ background: '#d3e4fe', color: '#414754' }}>#{item.maPhieuKham}</span>
                    {item.tenDichVu && (
                      <span className="inline-flex items-center gap-1 font-semibold" style={{ color: '#005bbf' }}>
                        <span className="material-symbols-outlined text-[15px]">science</span>
                        {item.tenDichVu}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => handleOpenConfirmModal(item)} disabled={isConfirming}
                className="flex-shrink-0 ml-4 px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg, #1a73e8, #005bbf)' }}>
                {isConfirming ? (
                  <><span className="material-symbols-outlined text-sm animate-spin">refresh</span> ĐANG XỬ LÝ</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">check_circle</span> XÁC NHẬN</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Modal ── */}
      {/* Modal - Đã được mở rộng gần full màn hình */}
{/* Modal - Layout Dọc, Kích thước Lớn */}
{showConfirmModal && selectedConfirmItem && createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
    style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}
    onClick={handleCloseModal}>
    
    {/* Chiều rộng max-w-5xl để cân đối khi xếp dọc, vẫn đảm bảo form to */}
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[94vh] overflow-y-auto border border-gray-100 flex flex-col"
      onClick={(e) => e.stopPropagation()}>
      
      {/* Header */}
      <div className="p-8 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-xl font-bold flex items-center justify-center shadow-lg">
            {initials(selectedConfirmItem.hoTen)}
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">{selectedConfirmItem.hoTen}</h3>
            <p className="text-sm text-gray-400 mt-1 font-semibold">Mã phiếu khám: #{selectedConfirmItem.maPhieuKham}</p>
          </div>
        </div>
      </div>

      {/* Body - Xếp dọc toàn bộ với space-y-6 */}
      <div className="p-10 space-y-6">
        
        {/* Trường 1 */}
        <div className="w-full">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">
            Lý do đến khám <span className="text-red-500">*</span>
          </label>
          <input type="text"
            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-medium text-gray-700 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all"
            placeholder="Nhập lý do bệnh nhân đến khám..."
            value={tiepNhanData.lyDoDen}
            onChange={(e) => setTiepNhanData(prev => ({ ...prev, lyDoDen: e.target.value }))} />
        </div>

        {/* Trường 2 - Đã bỏ chia cột, xếp dọc hoàn toàn */}
        <div className="w-full">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">
            Thông tin sàng lọc <span className="text-red-500">*</span>
          </label>
          <textarea rows={4}
            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium text-gray-700 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all resize-none"
            placeholder="VD: Không tiền sử bệnh tim, không cấy ghép kim loại..."
            value={tiepNhanData.thongTinSangLoc}
            onChange={(e) => setTiepNhanData(prev => ({ ...prev, thongTinSangLoc: e.target.value }))} />
        </div>

        {/* Trường 3 */}
        <div className="w-full">
          <label className="text-xs font-black text-gray-500 uppercase tracking-widest block mb-3">
            Ghi chú <span className="text-[10px] font-normal text-gray-400 normal-case italic">(không bắt buộc)</span>
          </label>
          <textarea rows={3}
            className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-base font-medium text-gray-700 outline-none focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-50 transition-all resize-none"
            placeholder="Nhập lưu ý hoặc hướng dẫn đặc biệt cho kỹ thuật viên..."
            value={tiepNhanData.ghiChu}
            onChange={(e) => setTiepNhanData(prev => ({ ...prev, ghiChu: e.target.value }))} />
        </div>
      </div>

      {/* Footer */}
      <div className="p-8 border-t border-gray-100 bg-gray-50/30 flex items-center justify-end gap-4">
        <button onClick={handleCloseModal}
          className="px-8 py-4 bg-white hover:bg-gray-100 text-gray-500 font-bold text-sm rounded-2xl border border-gray-200 transition-all active:scale-95">
          HỦY BỎ
        </button>
        <button onClick={handleSaveConfirmService} disabled={submitting}
          className="px-12 py-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl shadow-sky-200 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3">
          {submitting ? (
            <><span className="material-symbols-outlined animate-spin">refresh</span> ĐANG LƯU...</>
          ) : (
            <><span className="material-symbols-outlined">check_circle</span> HOÀN TẤT TIẾP NHẬN</>
          )}
        </button>
      </div>
    </div>
  </div>,
  document.body
)}
    </div>
  );
};

export default TiepNhanCLS;