import React, { useState, useEffect, useRef } from 'react';
import { getByPhieuKhamApi, saveAndUpdateApi } from '../../api/chiSoKhamTongHopApi';
import { updateToWaitingForDoctorApi } from '../../api/phieuKhamApi';
import { useNotification } from '../../components/NotificationContext';
import VitalSignsFormComponent from '../../components/VitalSignsForm';
import ConfirmDialog from '../../components/ConfirmDialog';

const TroLyTongQuatForm = ({ selectedPatient, user, onSaved, onBack }) => {
  const { showSuccess, showError } = useNotification();
  const vitalsRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary', icon: '' });

  // Khi xem lại ca khám đã hoàn thành (HOAN_THANH) hoặc đang chờ bác sĩ (CHO_BAC_SI),
  // chỉ LƯU THÔNG TIN, KHÔNG thay đổi trạng thái.
  const isReviewing = selectedPatient?.trangThai === 'HOAN_THANH' || selectedPatient?.trangThai === 'CHO_BAC_SI';

  const handleFinishAssistant = async () => {
    if (!selectedPatient?.maPhieuKham) return;
    if (vitalsRef.current) {
      const success = await vitalsRef.current.handleSave();
      if (!success) return;
    }
    setConfirmState({
      isOpen: true,
      title: isReviewing ? 'Xác nhận lưu thông tin' : 'Xác nhận hoàn tất',
      message: isReviewing
        ? 'Bạn đang xem lại ca khám đã hoàn thành. Chỉ lưu thông tin, không thay đổi trạng thái. Xác nhận?'
        : 'Xác nhận hoàn tất quy trình trợ lý và chuyển hồ sơ cho Bác sĩ?',
      type: 'primary',
      icon: isReviewing ? 'save' : 'check_circle',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          if (!isReviewing) {
            await updateToWaitingForDoctorApi(selectedPatient.maPhieuKham);
            showSuccess("✅ Đã hoàn tất quy trình trợ lý.");
          } else {
            showSuccess("✅ Đã lưu thông tin. Trạng thái ca khám được giữ nguyên.");
          }
          onSaved();
        } catch (e) {
          showError("❌ Lỗi: " + e.message);
        } finally { setLoading(false); }
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header với nút quay lại */}
      <div className="flex-shrink-0 flex items-center gap-1 px-6 pt-3 pb-0">
        <span className="px-4 py-2 text-sm font-bold text-indigo-600 border-b-2 border-indigo-600">
          Sinh Hiệu
        </span>
        <div className="flex-1" />
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 transition-all ml-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            QUAY LẠI
          </button>
        )}
      </div>

      {/* Nội dung */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-4 pb-4">
        <VitalSignsFormComponent ref={vitalsRef} phieuKhamId={selectedPatient.maPhieuKham} assistantId={user?.maNhanVien || user?.id} maChuyenKhoa={user?.maChuyenKhoa} initialGhiChu={selectedPatient?.ghiChu} showSaveOnly />
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
        <button disabled={loading} onClick={handleFinishAssistant}
          className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">{isReviewing ? 'save' : 'check_circle'}</span>
          {isReviewing ? 'LƯU THÔNG TIN' : 'XÁC NHẬN HOÀN TẤT'}
        </button>
      </div>

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
export default TroLyTongQuatForm;