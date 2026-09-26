import React, { useState, useEffect, useCallback } from 'react';
import { getByPhieuKhamApi, saveAndUpdateApi } from '../api/chiSoKhamTongHopApi';
import { updateToWaitingForDoctorApi } from '../api/phieuKhamApi';
import { useNotification } from './NotificationContext';
import VitalSignsForm from './VitalSignsForm';
import ConfirmDialog from './ConfirmDialog';
import { validateVitals } from '../utils/vitalsValidation';

/**
 * Layout dùng chung cho mọi trợ lý chuyên khoa.
 * 
 * Props:
 * - selectedPatient: object - thông tin bệnh nhân đang được chọn
 * - user: object - thông tin user trợ lý
 * - onSaved: function - callback khi hoàn tất quy trình
 * - onBack: function - callback khi bấm quay lại
 * - initialTab: string - tab khởi tạo ('vitals' | 'specialty')
 * - specialtyForm: ReactNode - component form khám chuyên khoa
 * - specialtyLabel: string - nhãn tab chuyên khoa (VD: 'Khám Tai Mũi Họng')
 * - vitalsFields: object - dữ liệu vitals (state), nếu cần parent quản lý
 * - setVitalsFields: function - setter cho vitals (nếu cần)
 * - examData: object - dữ liệu khám chuyên khoa
 * - setExamData: function - setter cho examData
 * - payloadExtras: function - trả về các field bổ sung cho payload hoàn tất (VD: parse float...)
 * - validateExamData: function - nhận examData, trả về null nếu hợp lệ hoặc mảng các lỗi (optional)
 */
const AssistantLayout = ({
  selectedPatient,
  user,
  onSaved,
  onBack,
  initialTab = 'vitals',
  specialtyForm,
  specialtyLabel = 'Khám Chuyên Khoa',
  vitalsFields,
  setVitalsFields,
  examData,
  setExamData,
  confirmMessage = 'Xác nhận hoàn tất quy trình trợ lý và chuyển hồ sơ cho Bác sĩ?',
  payloadExtras = () => ({}),
  validateExamData,
}) => {
  const [examSubTab, setExamSubTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const { showSuccess, showError } = useNotification();
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary', icon: '' });

  useEffect(() => { setExamSubTab(initialTab); }, [initialTab]);

  const vitalsRef = React.useRef(null);

  const handleSaveCurrentTab = useCallback(async (silent = true) => {
    if (!selectedPatient?.maPhieuKham) return true;
    setSaveStatus('saving');
    try {
      if (examSubTab === 'vitals' && vitalsRef.current) {
        const success = await vitalsRef.current.handleSave(silent);
        if (!success) { setSaveStatus('unsaved'); return false; }
      }
      if (examSubTab !== 'vitals' && examData) {
        const payload = {
          maPhieuKham: selectedPatient.maPhieuKham,
          maChuyenKhoa: user?.maChuyenKhoa,
          ...examData,
          maNhanVienNhap: user?.maNhanVien || user?.id
        };
        await saveAndUpdateApi(payload);
      }
      setSaveStatus('saved');
      return true;
    } catch (e) {
      console.error("Auto-save lỗi:", e);
      setSaveStatus('unsaved');
      return false;
    }
  }, [selectedPatient?.maPhieuKham, examSubTab, examData, user]);

  const handleTabChange = async (tabId) => {
    await handleSaveCurrentTab();
    setExamSubTab(tabId);
  };

  const buildFinalPayload = () => {
    const payload = {
      maPhieuKham: selectedPatient.maPhieuKham,
      maChuyenKhoa: user?.maChuyenKhoa,
      nhietDo: vitalsFields?.nhietDo === '' ? null : parseFloat(vitalsFields?.nhietDo),
      nhipTim: vitalsFields?.nhipTim === '' ? null : parseInt(vitalsFields?.nhipTim),
      nhipTho: vitalsFields?.nhipTho === '' ? null : parseInt(vitalsFields?.nhipTho),
      huyetApTamThu: vitalsFields?.huyetApThu === '' ? null : parseInt(vitalsFields?.huyetApThu),
      huyetApTamTruong: vitalsFields?.huyetApTruong === '' ? null : parseInt(vitalsFields?.huyetApTruong),
      canNang: vitalsFields?.canNang === '' ? null : parseFloat(vitalsFields?.canNang),
      chieuCao: vitalsFields?.chieuCao === '' ? null : parseFloat(vitalsFields?.chieuCao),
      spo2: vitalsFields?.spo2 === '' ? null : parseFloat(vitalsFields?.spo2),
      vongDau: vitalsFields?.vongDau === '' ? null : parseFloat(vitalsFields?.vongDau),
      ghiChu: vitalsFields?.ghiChu || null,
      ...examData,
      ...payloadExtras(),
      maNhanVienNhap: user?.maNhanVien || user?.id
    };
    return payload;
  };

  const handleFinishAssistant = async () => {
    if (!selectedPatient?.maPhieuKham) return;

    // 1. Validate vital signs if vitalsFields is provided
    if (vitalsFields) {
      const vitalsErrors = validateVitals(vitalsFields);
      if (vitalsErrors && vitalsErrors.length > 0) {
        showError('⚠️ THIẾU CHỈ SỐ SINH HIỆU:\n' + vitalsErrors.join('\n'));
        // Switch to vitals tab so user can see the form
        setExamSubTab('vitals');
        return;
      }
    }

    // 2. Validate specialty exam data if validation function is provided
    // Always validate, regardless of which tab the user is currently on
    if (validateExamData && examData) {
      const validationErrors = validateExamData(examData);
      if (validationErrors && validationErrors.length > 0) {
        showError('⚠️ THIẾU THÔNG TIN CHUYÊN KHOA:\n' + validationErrors.join('. '));
        // Switch to specialty tab so user can see the form
        setExamSubTab('specialty');
        return;
      }
    }

    setSaveStatus('saving');

    // Save current tab first
    if (examSubTab === 'vitals' && vitalsRef.current) {
      const success = await vitalsRef.current.handleSave();
      if (!success) { setSaveStatus('unsaved'); return; }
    }
    // Also save specialty tab data if we are on vitals tab
    if (examSubTab === 'vitals' && examData) {
      const specialtyPayload = {
        maPhieuKham: selectedPatient.maPhieuKham,
        maChuyenKhoa: user?.maChuyenKhoa,
        ...examData,
        maNhanVienNhap: user?.maNhanVien || user?.id
      };
      await saveAndUpdateApi(specialtyPayload);
    } else if (examSubTab !== 'vitals' && examData) {
      const payload = {
        maPhieuKham: selectedPatient.maPhieuKham,
        maChuyenKhoa: user?.maChuyenKhoa,
        ...examData,
        maNhanVienNhap: user?.maNhanVien || user?.id
      };
      await saveAndUpdateApi(payload);
    }
    setConfirmState({
      isOpen: true,
      title: 'Xác nhận hoàn tất',
      message: confirmMessage,
      type: 'primary',
      icon: 'check_circle',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const finalPayload = buildFinalPayload();
          await saveAndUpdateApi(finalPayload);
          await updateToWaitingForDoctorApi(selectedPatient.maPhieuKham);
          showSuccess("✅ Đã hoàn tất quy trình trợ lý.");
          setSaveStatus('saved');
          onSaved();
        } catch (e) {
          showError("❌ Lỗi hoàn tất quy trình: " + e.message);
          setSaveStatus('unsaved');
        } finally { setLoading(false); }
      }
    });
  };

  const renderSaveStatus = () => {
    if (saveStatus === 'saving') {
      return <span className="flex items-center gap-1 text-xs text-amber-600"><span className="material-symbols-outlined text-sm animate-spin">sync</span>Đang lưu...</span>;
    }
    if (saveStatus === 'saved') {
      return <span className="flex items-center gap-1 text-xs text-emerald-600"><span className="material-symbols-outlined text-sm">check_circle</span>Đã lưu</span>;
    }
    return <span className="flex items-center gap-1 text-xs text-red-500"><span className="material-symbols-outlined text-sm">error_outline</span>Chưa lưu</span>;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex-shrink-0 flex items-center gap-1 px-6 pt-3 pb-0">
        {[
          { id: 'vitals', label: 'Sinh Hiệu' },
          { id: 'specialty', label: specialtyLabel }
        ].map(t => (
          <button key={t.id} onClick={() => handleTabChange(t.id)}
            className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${
              examSubTab === t.id
                ? 'text-indigo-600 border-indigo-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="flex-1" />
        {renderSaveStatus()}
        {onBack && (
          <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-gray-700 hover:border-gray-300 transition-all ml-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            QUAY LẠI
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 pt-4 pb-4">
        {examSubTab === 'vitals' && (
          <VitalSignsForm
            ref={vitalsRef}
            phieuKhamId={selectedPatient.maPhieuKham}
            assistantId={user?.maNhanVien || user?.id}
            maChuyenKhoa={user?.maChuyenKhoa}
            initialGhiChu={selectedPatient?.ghiChu}
            showSaveOnly
            vitalsFields={vitalsFields}
            setVitalsFields={setVitalsFields}
          />
        )}
        {examSubTab !== 'vitals' && specialtyForm}
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-6 py-3 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
        <button disabled={loading} onClick={handleFinishAssistant}
          className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 flex items-center gap-2 shadow-lg transition-all text-sm"
        >
          <span className="material-symbols-outlined text-xl">check_circle</span>
          XÁC NHẬN HOÀN TẤT
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

export default AssistantLayout;