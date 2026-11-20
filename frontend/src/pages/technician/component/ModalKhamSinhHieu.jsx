import React, { useState, useEffect } from 'react';
import { getByPhieuKhamApi, saveAndUpdateApi } from '../../../api/chiSoKhamTongHopApi';
import { useNotification } from '../../../components/NotificationContext';

const ModalKhamSinhHieu = ({ patient, user, onClose, onComplete }) => {
  const { showSuccess, showError } = useNotification();
  const [vitals, setVitals] = useState({
    nhietDo: '', nhipTim: '', huyetApThu: '', huyetApTruong: '',
    nhipTho: '', canNang: '', chieuCao: '', spo2: '', ghiChu: ''
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const loadVitals = async () => {
      setLoading(true);
      try {
        const maPhieuKham = patient.maPhieuKham;
        if (maPhieuKham) {
          const data = await getByPhieuKhamApi(maPhieuKham);
          if (data) {
            setVitals(prev => ({
              ...prev,
              nhietDo: data.nhietDo || '',
              nhipTim: data.nhipTim || '',
              huyetApThu: data.huyetApTamThu || '',
              huyetApTruong: data.huyetApTamTruong || '',
              nhipTho: data.nhipTho || '',
              canNang: data.canNang || '',
              chieuCao: data.chieuCao || '',
              spo2: data.spo2 || '',
              ghiChu: data.ghiChu || ''
            }));
          }
        }
      } catch (error) {
        console.error("Loi tai chi so sinh hieu:", error);
      } finally {
        setLoading(false);
      }
    };
    loadVitals();
  }, [patient.maPhieuKham]);

  // Validation: kiểm tra tất cả chỉ số sinh hiệu bắt buộc đã được nhập đầy đủ
  const validateVitalsRequired = () => {
    const errors = {};
    const requiredFields = [
      { key: 'nhietDo', label: 'Nhiệt độ' },
      { key: 'nhipTim', label: 'Nhịp tim' },
      { key: 'huyetApThu', label: 'HA tâm thu' },
      { key: 'huyetApTruong', label: 'HA tâm trương' },
      { key: 'nhipTho', label: 'Nhịp thở' },
      { key: 'spo2', label: 'SpO2' },
      { key: 'canNang', label: 'Cân nặng' },
      { key: 'chieuCao', label: 'Chiều cao' }
    ];

    let isValid = true;
    requiredFields.forEach(field => {
      const value = vitals[field.key];
      if (!value || value.toString().trim() === '') {
        errors[field.key] = `${field.label} không được để trống`;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSave = async () => {
    if (!patient?.maPhieuKham) {
      showError("Chưa có mã phiếu khám!");
      return;
    }

    // Kiểm tra tất cả chỉ số sinh hiệu bắt buộc phải được nhập đầy đủ
    if (!validateVitalsRequired()) {
      showError("⚠️ Vui lòng nhập đầy đủ tất cả chỉ số sinh hiệu trước khi tiếp tục!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        maPhieuKham: patient.maPhieuKham,
        maChuyenKhoa: user?.maChuyenKhoa,
        nhietDo: parseFloat(vitals.nhietDo),
        nhipTim: parseInt(vitals.nhipTim),
        nhipTho: parseInt(vitals.nhipTho),
        huyetApTamThu: parseInt(vitals.huyetApThu),
        huyetApTamTruong: parseInt(vitals.huyetApTruong),
        canNang: parseFloat(vitals.canNang),
        chieuCao: parseFloat(vitals.chieuCao),
        spo2: parseFloat(vitals.spo2),
        ghiChu: vitals.ghiChu || null,
        maNhanVienNhap: user?.maNhanVien || ''
      };

      await saveAndUpdateApi(payload);
      showSuccess("Đã lưu chỉ số sinh hiệu thành công!");
      
      if (onComplete) {
        onComplete(patient);
      }
    } catch (error) {
      showError("Lỗi: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="material-symbols-outlined text-[28px]">monitor_heart</span>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Khám Sinh Hiệu</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded border border-slate-200/60">
                  {patient.hoTen}
                </span>
                <span className="text-slate-400 text-xs font-medium">#{patient.maPhieuKham}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-colors ring-1 ring-transparent hover:ring-rose-100 group">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
          </button>
        </div>

        {/* Body - Form chi so sinh hieu */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              <span className="ml-3 text-slate-400 italic">Đang tải...</span>
            </div>
          ) : (
            <>
              <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-2 border-b border-slate-100 pb-4">
                <span className="material-symbols-outlined text-lg">monitor_heart</span>
                Chỉ số sinh hiệu
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                {/* Cot trai */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Nhiệt độ (°C) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" step="0.1" className={`w-32 p-2.5 border ${fieldErrors.nhietDo ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-right`} value={vitals.nhietDo} onChange={e => { setVitals({...vitals, nhietDo: e.target.value}); if (fieldErrors.nhietDo) setFieldErrors(prev => ({...prev, nhietDo: ''})); }} placeholder="36.5" />
                          {fieldErrors.nhietDo && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.nhietDo}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Huyết áp tâm thu (mmHg) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" className={`w-32 p-2.5 border ${fieldErrors.huyetApThu ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.huyetApThu} onChange={e => { setVitals({...vitals, huyetApThu: e.target.value}); if (fieldErrors.huyetApThu) setFieldErrors(prev => ({...prev, huyetApThu: ''})); }} placeholder="120" />
                          {fieldErrors.huyetApThu && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.huyetApThu}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Nhịp thở (lần/ph) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" className={`w-32 p-2.5 border ${fieldErrors.nhipTho ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.nhipTho} onChange={e => { setVitals({...vitals, nhipTho: e.target.value}); if (fieldErrors.nhipTho) setFieldErrors(prev => ({...prev, nhipTho: ''})); }} placeholder="16" />
                          {fieldErrors.nhipTho && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.nhipTho}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Chiều cao (cm) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" className={`w-32 p-2.5 border ${fieldErrors.chieuCao ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.chieuCao} onChange={e => { setVitals({...vitals, chieuCao: e.target.value}); if (fieldErrors.chieuCao) setFieldErrors(prev => ({...prev, chieuCao: ''})); }} placeholder="165" />
                          {fieldErrors.chieuCao && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.chieuCao}</span>}
                        </div>
                      </div>
                    </div>
                    {/* Cot phai */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Nhịp tim (lần/ph) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" className={`w-32 p-2.5 border ${fieldErrors.nhipTim ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.nhipTim} onChange={e => { setVitals({...vitals, nhipTim: e.target.value}); if (fieldErrors.nhipTim) setFieldErrors(prev => ({...prev, nhipTim: ''})); }} placeholder="80" />
                          {fieldErrors.nhipTim && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.nhipTim}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Huyết áp tâm trương (mmHg) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" className={`w-32 p-2.5 border ${fieldErrors.huyetApTruong ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.huyetApTruong} onChange={e => { setVitals({...vitals, huyetApTruong: e.target.value}); if (fieldErrors.huyetApTruong) setFieldErrors(prev => ({...prev, huyetApTruong: ''})); }} placeholder="80" />
                          {fieldErrors.huyetApTruong && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.huyetApTruong}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Cân nặng (kg) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" step="0.1" className={`w-32 p-2.5 border ${fieldErrors.canNang ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.canNang} onChange={e => { setVitals({...vitals, canNang: e.target.value}); if (fieldErrors.canNang) setFieldErrors(prev => ({...prev, canNang: ''})); }} placeholder="60" />
                          {fieldErrors.canNang && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.canNang}</span>}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">SpO2 (%) <span className="text-red-500">*</span></label>
                        <div className="flex flex-col items-end">
                          <input type="number" className={`w-32 p-2.5 border ${fieldErrors.spo2 ? 'border-red-400 bg-red-50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-right`} value={vitals.spo2} onChange={e => { setVitals({...vitals, spo2: e.target.value}); if (fieldErrors.spo2) setFieldErrors(prev => ({...prev, spo2: ''})); }} placeholder="98" />
                          {fieldErrors.spo2 && <span className="text-[10px] text-red-500 font-bold mt-1">{fieldErrors.spo2}</span>}
                        </div>
                      </div>
                    </div>
              </div>

              {/* Ghi chu */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-700 block mb-2">Ghi chú</label>
                <textarea className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-none" rows="2" value={vitals.ghiChu} onChange={e => setVitals({...vitals, ghiChu: e.target.value})} placeholder="Nhập ghi chú (nếu có)..." />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl transition-colors ring-1 ring-slate-200/60">
            HỦY BỎ
          </button>
          <button onClick={handleSave} disabled={saving || loading} className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transform active:scale-95 transition-all text-sm flex items-center gap-2">
            {saving ? (
              <><span className="material-symbols-outlined animate-spin">refresh</span> ĐANG LƯU...</>
            ) : (
              <><span className="material-symbols-outlined">check_circle</span> LƯU & TIẾP TỤC</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalKhamSinhHieu;