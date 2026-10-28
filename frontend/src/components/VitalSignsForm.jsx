import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { getByPhieuKhamApi, saveAndUpdateApi } from '../api/chiSoKhamTongHopApi';
import { validateVitals } from '../utils/vitalsValidation';
import { useNotification } from './NotificationContext';

const VitalSignsForm = forwardRef(({
  phieuKhamId,
  assistantId,
  maChuyenKhoa,
  initialGhiChu = '',
  showSaveOnly = false,
  vitalsFields,
  setVitalsFields
}, ref) => {
  const { showSuccess, showError } = useNotification();
  const [internalVitals, setInternalVitals] = useState({
    nhietDo: '', nhipTim: '', huyetApThu: '', huyetApTruong: '',
    nhipTho: '', canNang: '', chieuCao: '', spo2: '', vongDau: '', ghiChu: initialGhiChu
  });

  const vitals = vitalsFields || internalVitals;
  const setVitals = setVitalsFields || setInternalVitals;
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (phieuKhamId) {
      getByPhieuKhamApi(phieuKhamId).then(data => {
        if (data) {
          setVitals(prev => ({
            ...prev,
            nhietDo: data.nhietDo ?? '',
            nhipTim: data.nhipTim ?? '',
            huyetApThu: data.huyetApTamThu ?? '',
            huyetApTruong: data.huyetApTamTruong ?? '',
            nhipTho: data.nhipTho ?? '',
            canNang: data.canNang ?? '',
            chieuCao: data.chieuCao ?? '',
            spo2: data.spo2 ?? '',
            vongDau: data.vongDau ?? ''
          }));
        }
      });
    }
  }, [phieuKhamId]);

  const handleSave = async (showMsg = true) => {
    const errors = validateVitals(vitals);
    if (errors.length > 0) {
      const errorMap = {};
      errors.forEach(err => {
        const field = err.split(':')[0].trim();
        if (field === 'Nhiệt độ') errorMap.nhietDo = err;
        else if (field === 'Nhịp tim') errorMap.nhipTim = err;
        else if (field === 'HA tâm thu') errorMap.huyetApThu = err;
        else if (field === 'HA tâm trương') errorMap.huyetApTruong = err;
        else if (field === 'Nhịp thở') errorMap.nhipTho = err;
        else if (field === 'SpO2') errorMap.spo2 = err;
        else if (field === 'Cân nặng') errorMap.canNang = err;
        else if (field === 'Chiều cao') errorMap.chieuCao = err;
        else if (field === 'Vòng đầu') errorMap.vongDau = err;
      });
      setFieldErrors(errorMap);
      showError(errors.join('\n'));
      return false;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const payload = {
        maPhieuKham: phieuKhamId,
        maChuyenKhoa: maChuyenKhoa,
        nhietDo: parseFloat(vitals.nhietDo) || null,
        nhipTim: parseInt(vitals.nhipTim) || null,
        nhipTho: parseInt(vitals.nhipTho) || null,
        huyetApTamThu: parseInt(vitals.huyetApThu) || null,
        huyetApTamTruong: parseInt(vitals.huyetApTruong) || null,
        canNang: parseFloat(vitals.canNang) || null,
        chieuCao: parseFloat(vitals.chieuCao) || null,
        spo2: parseFloat(vitals.spo2) || null,
        vongDau: vitals.vongDau === '' ? null : parseFloat(vitals.vongDau),
        ghiChu: vitals.ghiChu || null,
        maNhanVienNhap: assistantId
      };
      await saveAndUpdateApi(payload);
      if (showMsg) showSuccess('✅ Đã lưu chỉ số sinh hiệu thành công.');
      return true;
    } catch (e) {
      showError('❌ Lỗi lưu sinh hiệu: ' + e.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({ handleSave }));

  const setField = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getFieldClass = (field) => {
    return fieldErrors[field]
      ? 'w-full px-3 py-2 bg-red-50 border border-red-400 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none'
      : 'w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none';
  };

  const renderFieldError = (field) => {
    if (!fieldErrors[field]) return null;
    return <p className="text-[10px] font-bold text-red-500 mt-0.5">{fieldErrors[field]}</p>;
  };

  const renderRow = (label, field, step) => (
    <div key={field}>
      <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
      <input type="number" step={step} className={getFieldClass(field)}
        value={vitals[field]} onChange={e => setField(field, e.target.value)} />
      {renderFieldError(field)}
    </div>
  );

  return (
    <div className={showSaveOnly ? '' : 'bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-fade-in'}>
      {!showSaveOnly && (
        <h3 className="text-xl font-bold text-indigo-700 uppercase border-b pb-4 mb-6">Thông tin chỉ số sinh hiệu</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        {renderRow("Nhiệt độ (°C)", "nhietDo", "0.1")}
        {renderRow("Nhịp tim (lần/phút)", "nhipTim")}
        {renderRow("Huyết áp thu (mmHg)", "huyetApThu")}
        {renderRow("Huyết áp trương (mmHg)", "huyetApTruong")}
        {renderRow("Nhịp thở (lần/phút)", "nhipTho")}
        {renderRow("Chỉ số SpO2 (%)", "spo2")}
        {renderRow("Cân nặng (kg)", "canNang", "0.1")}
        {renderRow("Chiều cao (cm)", "chieuCao")}
      </div>
      <div className="mt-6">
        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Ghi chú / Triệu chứng lâm sàng</label>
        <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          placeholder="Nhập ghi chú hoặc triệu chứng bệnh nhân mô tả..." value={vitals.ghiChu}
          onChange={e => setField('ghiChu', e.target.value)} />
      </div>
      {!showSaveOnly && (
        <div className="flex justify-end mt-6">
          <button disabled={loading} onClick={() => handleSave()}
            className="px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined">save</span>
            LƯU CHỈ SỐ SINH HIỆU
          </button>
        </div>
      )}
    </div>
  );
});

VitalSignsForm.displayName = 'VitalSignsForm';
export default VitalSignsForm;