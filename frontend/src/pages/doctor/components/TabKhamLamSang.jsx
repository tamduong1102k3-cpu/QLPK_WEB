import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getByPhieuKhamApi as getClinicalExamByPhieuKhamApi, saveWithVitalsApi } from '../../../api/khamLamSangApi';
import { getByPhieuKhamApi as getVitalsByPhieuKhamApi } from '../../../api/chiSoKhamTongHopApi';
import { getAvailableClsResultsApi } from '../../../api/phieuKhamApi';
import { getDetailClsResultApi } from '../../../api/ketQuaClsApi';
import { useNotification } from '../../../components/NotificationContext';

const TabKhamLamSang = forwardRef(({ selectedPatient, user }, ref) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [examData, setExamData] = useState({
    lyDoKham: '',
    tienSuBanThan: '',
    benhSu: '',
    chanDoanSoBo: '',
    loiDanBacSi: '',
    ketQuaKhamCanLamSang: '',
    khamLamSang: ''
  });

  const [vitals, setVitals] = useState({
    nhietDo: '',
    nhipTim: '',
    huyetApThu: '',
    huyetApTruong: '',
    nhipTho: '',
    canNang: '',
    chieuCao: '',
    spo2: '',
    ghiChu: '',
    tinhTrangRang: '',
    sauRang: '',
    caoRang: '',
    viemNuou: '',
    khopCan: '',
    niemMacMieng: '',
    doLungLay: '',
    phuHinhCu: '',
    benhLyKhacRhm: ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("saved"); // editing | saving | saved | error
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  // CLS selection integration state
  const [availableCls, setAvailableCls] = useState([]);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [selectedCdhaId, setSelectedCdhaId] = useState('');

  // Load initial data when patient changes
  useEffect(() => {
    if (selectedPatient?.maPhieuKham) {
      setHasChanges(false);
      setSaveStatus("saved");
      setErrors({});
      setSelectedLabId('');
      setSelectedCdhaId('');

      // 1. Fetch clinical exam data
      getClinicalExamByPhieuKhamApi(selectedPatient.maPhieuKham)
        .then(data => {
          if (data) {
            setExamData({
              lyDoKham: data.lyDoKham || selectedPatient.ghiChu || '',
              tienSuBanThan: data.tienSuBanThan || selectedPatient.tienSuBenh || '',
              benhSu: data.benhSu || '',
              chanDoanSoBo: data.chanDoanSoBo || '',
              loiDanBacSi: data.loiDanBacSi || '',
              ketQuaKhamCanLamSang: data.ketQuaKhamCanLamSang || '',
              khamLamSang: data.khamLamSang || ''
            });
          } else {
            setExamData({
              lyDoKham: selectedPatient.ghiChu || '',
              tienSuBanThan: selectedPatient.tienSuBenh || '',
              benhSu: '',
              chanDoanSoBo: '',
              loiDanBacSi: '',
              ketQuaKhamCanLamSang: '',
              khamLamSang: ''
            });
          }
        })
        .catch(e => console.error("Lỗi tải khám lâm sàng:", e));

      // 2. Fetch vitals data
      getVitalsByPhieuKhamApi(selectedPatient.maPhieuKham)
        .then(data => {
          if (data) {
            const loadedVitals = {
              nhietDo: data.nhietDo ?? '',
              nhipTim: data.nhipTim ?? '',
              huyetApThu: data.huyetApTamThu ?? '',
              huyetApTruong: data.huyetApTamTruong ?? '',
              nhipTho: data.nhipTho ?? '',
              canNang: data.canNang ?? '',
              chieuCao: data.chieuCao ?? '',
              spo2: data.spo2 ?? '',
              ghiChu: data.ghiChu ?? '',
              tinhTrangRang: data.tinhTrangRang || '',
              sauRang: data.sauRang || '',
              caoRang: data.caoRang || '',
              viemNuou: data.viemNuou || '',
              khopCan: data.khopCan || '',
              niemMacMieng: data.niemMacMieng || '',
              doLungLay: data.doLungLay || '',
              phuHinhCu: data.phuHinhCu || '',
              benhLyKhacRhm: data.benhLyKhacRhm || ''
            };
            setVitals(loadedVitals);
            // Nếu tất cả chỉ số sinh hiệu chính đều rỗng, đặt trạng thái là "chưa lưu"
            if (!loadedVitals.nhietDo && !loadedVitals.nhipTim && !loadedVitals.huyetApThu && !loadedVitals.huyetApTruong &&
                !loadedVitals.nhipTho && !loadedVitals.spo2 && !loadedVitals.canNang && !loadedVitals.chieuCao) {
              setSaveStatus("editing");
              setHasChanges(true);
            }
          } else {
            setVitals({
              nhietDo: '',
              nhipTim: '',
              huyetApThu: '',
              huyetApTruong: '',
              nhipTho: '',
              canNang: '',
              chieuCao: '',
              spo2: '',
              ghiChu: '',
              tinhTrangRang: '',
              sauRang: '',
              caoRang: '',
              viemNuou: '',
              khopCan: '',
              niemMacMieng: '',
              doLungLay: '',
              phuHinhCu: '',
              benhLyKhacRhm: ''
            });
            // Không có dữ liệu từ server -> cần nhập mới
            setSaveStatus("editing");
            setHasChanges(true);
          }
        })
        .catch(e => console.error("Lỗi tải sinh hiệu:", e));

      // 3. Fetch available CLS results
      getAvailableClsResultsApi(selectedPatient.maPhieuKham)
        .then(data => {
          if (data) setAvailableCls(data);
        })
        .catch(err => console.error("Lỗi tải danh sách dịch vụ CLS:", err));
    }
  }, [selectedPatient]);

  // Validate form fields (basic - used for normal save)
  const validateForm = (latestExamData = examData, latestVitals = vitals) => {
    const newErrors = {};

    // Required: Lý do khám
    if (!latestExamData.lyDoKham || !latestExamData.lyDoKham.trim()) {
      newErrors.lyDoKham = 'Vui lòng nhập lý do khám';
    }

    // Required: Chẩn đoán sơ bộ
    if (!latestExamData.chanDoanSoBo || !latestExamData.chanDoanSoBo.trim()) {
      newErrors.chanDoanSoBo = 'Vui lòng nhập chẩn đoán sơ bộ';
    }

    // Validate vitals numeric fields if not empty (vitals are entered by assistant, not by doctor)
    if (latestVitals.nhietDo !== '' && isNaN(parseFloat(latestVitals.nhietDo))) {
      newErrors.nhietDo = 'Nhiệt độ phải là số';
    }
    if (latestVitals.nhipTim !== '' && (isNaN(parseInt(latestVitals.nhipTim)) || parseInt(latestVitals.nhipTim) < 0 || parseInt(latestVitals.nhipTim) > 300)) {
      newErrors.nhipTim = 'Nhịp tim không hợp lệ (0-300)';
    }
    if (latestVitals.huyetApThu !== '' && (isNaN(parseInt(latestVitals.huyetApThu)) || parseInt(latestVitals.huyetApThu) < 30 || parseInt(latestVitals.huyetApThu) > 300)) {
      newErrors.huyetApThu = 'HA tâm thu không hợp lệ (30-300)';
    }
    if (latestVitals.huyetApTruong !== '' && (isNaN(parseInt(latestVitals.huyetApTruong)) || parseInt(latestVitals.huyetApTruong) < 20 || parseInt(latestVitals.huyetApTruong) > 200)) {
      newErrors.huyetApTruong = 'HA tâm trương không hợp lệ (20-200)';
    }
    if (latestVitals.nhipTho !== '' && (isNaN(parseInt(latestVitals.nhipTho)) || parseInt(latestVitals.nhipTho) < 0 || parseInt(latestVitals.nhipTho) > 100)) {
      newErrors.nhipTho = 'Nhịp thở không hợp lệ (0-100)';
    }
    if (latestVitals.spo2 !== '' && (isNaN(parseFloat(latestVitals.spo2)) || parseFloat(latestVitals.spo2) < 0 || parseFloat(latestVitals.spo2) > 100)) {
      newErrors.spo2 = 'SpO2 không hợp lệ (0-100)';
    }
    if (latestVitals.canNang !== '' && (isNaN(parseFloat(latestVitals.canNang)) || parseFloat(latestVitals.canNang) <= 0 || parseFloat(latestVitals.canNang) > 500)) {
      newErrors.canNang = 'Cân nặng không hợp lệ (0-500)';
    }
    if (latestVitals.chieuCao !== '' && (isNaN(parseFloat(latestVitals.chieuCao)) || parseFloat(latestVitals.chieuCao) <= 0 || parseFloat(latestVitals.chieuCao) > 250)) {
      newErrors.chieuCao = 'Chiều cao không hợp lệ (0-250)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Strict validation for finishing exam - requires ALL clinical exam fields
  const validateAllFieldsForFinish = (latestExamData = examData) => {
    const newErrors = {};

    // Required: Lý do khám
    if (!latestExamData.lyDoKham || !latestExamData.lyDoKham.trim()) {
      newErrors.lyDoKham = 'Vui lòng nhập lý do khám';
    }

    // Required: Chẩn đoán sơ bộ
    if (!latestExamData.chanDoanSoBo || !latestExamData.chanDoanSoBo.trim()) {
      newErrors.chanDoanSoBo = 'Vui lòng nhập chẩn đoán sơ bộ';
    }

    // Required: Tiền sử bản thân (không được để trống)
    if (!latestExamData.tienSuBanThan || !latestExamData.tienSuBanThan.trim()) {
      newErrors.tienSuBanThan = 'Vui lòng nhập tiền sử bản thân';
    }

    // Required: Bệnh sử (không được để trống)
    if (!latestExamData.benhSu || !latestExamData.benhSu.trim()) {
      newErrors.benhSu = 'Vui lòng nhập bệnh sử';
    }

    // Required: Khám lâm sàng (không được để trống)
    if (!latestExamData.khamLamSang || !latestExamData.khamLamSang.trim()) {
      newErrors.khamLamSang = 'Vui lòng nhập kết quả khám lâm sàng';
    }

    // Required: Lời dặn bác sĩ (không được để trống)
    if (!latestExamData.loiDanBacSi || !latestExamData.loiDanBacSi.trim()) {
      newErrors.loiDanBacSi = 'Vui lòng nhập lời dặn bác sĩ';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field, value) => {
    const newExamData = { ...examData, [field]: value };
    setExamData(newExamData);
    setHasChanges(true);
    setSaveStatus("editing");
    // Clear error for this field if valid
    if (errors[field] && value.trim()) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleVitalChange = (field, value) => {
    const newVitals = { ...vitals, [field]: value };
    setVitals(newVitals);
    setHasChanges(true);
    setSaveStatus("editing");
    // Clear error for this field on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const autoSave = async (latestExamData = examData, latestVitals = vitals, force = false) => {
    // Validate before save
    if (!validateForm(latestExamData, latestVitals) && !force) {
      showError('Vui lòng kiểm tra lại thông tin trước khi lưu!');
      return false;
    }

    try {
      setIsSaving(true);
      setSaveStatus("saving");
      setErrors({});

      // Check if vitals have been filled (by assistant) - if not, don't save vitals portion
      const vitalsHaveData = latestVitals.nhietDo && latestVitals.nhipTim && latestVitals.huyetApThu && 
                              latestVitals.huyetApTruong && latestVitals.nhipTho && latestVitals.spo2 && 
                              latestVitals.canNang && latestVitals.chieuCao;

      const payload = {
        khamLamSang: {
          ...latestExamData,
          maPhieuKham: selectedPatient.maPhieuKham,
          maBacSi: user?.maNhanVien
        },
        chiSoKhamTongHop: vitalsHaveData ? {
          maPhieuKham: selectedPatient.maPhieuKham,
          nhietDo: parseFloat(latestVitals.nhietDo),
          nhipTim: parseInt(latestVitals.nhipTim),
          nhipTho: parseInt(latestVitals.nhipTho),
          huyetApTamThu: parseInt(latestVitals.huyetApThu),
          huyetApTamTruong: parseInt(latestVitals.huyetApTruong),
          canNang: parseFloat(latestVitals.canNang),
          chieuCao: parseFloat(latestVitals.chieuCao),
          spo2: parseFloat(latestVitals.spo2),
          maNhanVienNhap: user?.maNhanVien,
          tinhTrangRang: latestVitals.tinhTrangRang || null,
          sauRang: latestVitals.sauRang || null,
          caoRang: latestVitals.caoRang || null,
          viemNuou: latestVitals.viemNuou || null,
          khopCan: latestVitals.khopCan || null,
          niemMacMieng: latestVitals.niemMacMieng || null,
          doLungLay: latestVitals.doLungLay || null,
          phuHinhCu: latestVitals.phuHinhCu || null,
          benhLyKhacRhm: latestVitals.benhLyKhacRhm || null,
          ghiChu: latestVitals.ghiChu || null
        } : {
          maPhieuKham: selectedPatient.maPhieuKham,
          nhietDo: latestVitals.nhietDo === '' ? null : parseFloat(latestVitals.nhietDo),
          nhipTim: latestVitals.nhipTim === '' ? null : parseInt(latestVitals.nhipTim),
          nhipTho: latestVitals.nhipTho === '' ? null : parseInt(latestVitals.nhipTho),
          huyetApTamThu: latestVitals.huyetApThu === '' ? null : parseInt(latestVitals.huyetApThu),
          huyetApTamTruong: latestVitals.huyetApTruong === '' ? null : parseInt(latestVitals.huyetApTruong),
          canNang: latestVitals.canNang === '' ? null : parseFloat(latestVitals.canNang),
          chieuCao: latestVitals.chieuCao === '' ? null : parseFloat(latestVitals.chieuCao),
          spo2: latestVitals.spo2 === '' ? null : parseFloat(latestVitals.spo2),
          maNhanVienNhap: user?.maNhanVien,
          tinhTrangRang: latestVitals.tinhTrangRang || null,
          sauRang: latestVitals.sauRang || null,
          caoRang: latestVitals.caoRang || null,
          viemNuou: latestVitals.viemNuou || null,
          khopCan: latestVitals.khopCan || null,
          niemMacMieng: latestVitals.niemMacMieng || null,
          doLungLay: latestVitals.doLungLay || null,
          phuHinhCu: latestVitals.phuHinhCu || null,
          benhLyKhacRhm: latestVitals.benhLyKhacRhm || null,
          ghiChu: latestVitals.ghiChu || null
        }
      };

      await saveWithVitalsApi(payload);

      setHasChanges(false);
      setSaveStatus("saved");
      return true;
    } catch (error) {
      console.error("Lỗi auto save khám lâm sàng & sinh hiệu:", error);
      setSaveStatus("error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Expose autoSave capability to parent container
  useImperativeHandle(ref, () => ({
    triggerAutoSave: async () => {
      return await autoSave(examData, vitals, true);
    },
    // Strict save for finishing exam - validates ALL fields before saving
    triggerFinishAutoSave: async () => {
      // First validate all fields strictly
      if (!validateAllFieldsForFinish(examData)) {
        showError('Không thể kết thúc khám vì thông tin khám lâm sàng chưa đầy đủ! Vui lòng nhập đầy đủ: Lý do khám, Tiền sử bản thân, Bệnh sử, Khám lâm sàng, Chẩn đoán sơ bộ, Lời dặn bác sĩ.');
        return false;
      }
      // Then auto-save with force=true
      return await autoSave(examData, vitals, true);
    }
  }));

  const handleClsSelect = async (chiDinhId, loai) => {
    if (!chiDinhId) return;

    if (loai === 'XET_NGHIEM') {
      setSelectedLabId(chiDinhId);
    } else {
      setSelectedCdhaId(chiDinhId);
    }

    try {
      const detail = await getDetailClsResultApi(chiDinhId);
      if (detail) {
        // Check for duplicates
        const servicePattern = `[${detail.loaiDichVu === 'XET_NGHIEM' ? 'XÉT NGHIỆM' : 'CĐHA'}] ${detail.tenDichVu}`;
        if (examData.ketQuaKhamCanLamSang.includes(servicePattern)) {
          showWarning(`Kết quả dịch vụ "${detail.tenDichVu}" đã được chọn trước đó!`);
          if (loai === 'XET_NGHIEM') setSelectedLabId('');
          else setSelectedCdhaId('');
          return;
        }

        // Format and append output
        const formatted = `[${detail.loaiDichVu === 'XET_NGHIEM' ? 'XÉT NGHIỆM' : 'CĐHA'}] ${detail.tenDichVu}\n\n${detail.noiDungKetQua}\n\nKết luận:\n${detail.ketLuan || 'Chưa có kết luận'}\n\n--------------------\n`;

        // Store referenced ID in localStorage for TabKetQuaCLS highlights
        const refKey = `ref-cls-${selectedPatient.maPhieuKham}`;
        const refIds = JSON.parse(localStorage.getItem(refKey) || "[]");
        if (!refIds.includes(chiDinhId)) {
          refIds.push(chiDinhId);
          localStorage.setItem(refKey, JSON.stringify(refIds));
        }

        const currentText = examData.ketQuaKhamCanLamSang ? examData.ketQuaKhamCanLamSang + "\n" : "";
        const newExamData = {
          ...examData,
          ketQuaKhamCanLamSang: currentText + formatted
        };
        
        setExamData(newExamData);
        setHasChanges(true);
        setSaveStatus("editing");

        // Save immediately to DB
        await autoSave(newExamData, vitals, true);
      }
    } catch (error) {
      console.error("Lỗi lấy chi tiết kết quả CLS:", error);
      showError("Không thể tải chi tiết kết quả cận lâm sàng!");
    } finally {
      // Reset dropdowns to permit repeated selects of other elements
      if (loai === 'XET_NGHIEM') setSelectedLabId('');
      else setSelectedCdhaId('');
    }
  };

  const renderStatus = () => {
    switch (saveStatus) {
      case 'editing':
        return <span className="flex items-center gap-1.5 text-xs text-amber-500 font-bold bg-amber-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>⚪ Chưa lưu</span>;
      case 'saving':
        return <span className="flex items-center gap-1.5 text-xs text-indigo-500 font-bold bg-indigo-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>🔄 Đang lưu...</span>;
      case 'saved':
        return <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold bg-emerald-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>✅ Đã lưu</span>;
      case 'error':
        return <span className="flex items-center gap-1.5 text-xs text-red-500 font-bold bg-red-50 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>❌ Lưu thất bại</span>;
      default:
        return null;
    }
  };

  const labs = availableCls.filter(item => item.loai === 'XET_NGHIEM');
  const cdhas = availableCls.filter(item => item.loai === 'CDHA');

  const getErrorBorder = (field) => {
    return errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300';
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return <p className="mt-1 text-[11px] font-bold text-red-500 flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">error</span>
      {errors[field]}
    </p>;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in relative">
      <div className="flex items-center justify-between mb-6 border-b border-gray-50 pb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">assignment</span>
          Khám Lâm Sàng
        </h3>
        <div className="flex items-center gap-2">
          {Object.keys(errors).length > 0 && (
            <span className="text-xs text-red-500 font-bold bg-red-50 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">error</span>
              {Object.keys(errors).length} lỗi
            </span>
          )}
          {renderStatus()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            Lý do khám <span className="text-red-500">*</span>
          </label>
          <textarea
            value={examData.lyDoKham}
            onChange={(e) => handleFieldChange('lyDoKham', e.target.value)}
            className={`w-full p-4 border ${getErrorBorder('lyDoKham')} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] transition-all text-sm shadow-sm`}
            placeholder="Triệu chứng khiến bệnh nhân đi khám..."
          />
          {renderError('lyDoKham')}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Tiền sử bản thân</label>
            <textarea
              value={examData.tienSuBanThan}
              onChange={(e) => handleFieldChange('tienSuBanThan', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] transition-all text-sm shadow-sm"
              placeholder="Các bệnh lý đã mắc, dị ứng..."
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Bệnh sử</label>
            <textarea
              value={examData.benhSu}
              onChange={(e) => handleFieldChange('benhSu', e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] transition-all text-sm shadow-sm"
              placeholder="Quá trình diễn biến bệnh..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Khám lâm sàng</label>
          <textarea
            value={examData.khamLamSang}
            onChange={(e) => handleFieldChange('khamLamSang', e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] transition-all text-sm shadow-sm"
            placeholder="Ghi nhận khi thăm khám trực tiếp..."
          />
        </div>

        <div className="bg-sky-50/30 p-6 rounded-2xl border border-sky-100 space-y-6">
          <h4 className="font-bold text-sky-800 text-sm uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-sky-600 text-lg">vital_signs</span>
            Chỉ Số Sinh Hiệu
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nhiệt độ (°C)</label>
              <input type="number" step="0.1" value={vitals.nhietDo} onChange={(e) => handleVitalChange('nhietDo', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('nhietDo')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="36.5" />
              {renderError('nhietDo')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nhịp tim (l/p)</label>
              <input type="number" value={vitals.nhipTim} onChange={(e) => handleVitalChange('nhipTim', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('nhipTim')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="80" />
              {renderError('nhipTim')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Nhịp thở (l/p)</label>
              <input type="number" value={vitals.nhipTho} onChange={(e) => handleVitalChange('nhipTho', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('nhipTho')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="18" />
              {renderError('nhipTho')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">SpO2 (%)</label>
              <input type="number" step="0.1" value={vitals.spo2} onChange={(e) => handleVitalChange('spo2', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('spo2')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="98" />
              {renderError('spo2')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">HA tâm thu (mmHg)</label>
              <input type="number" value={vitals.huyetApThu} onChange={(e) => handleVitalChange('huyetApThu', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('huyetApThu')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="120" />
              {renderError('huyetApThu')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">HA tâm trương (mmHg)</label>
              <input type="number" value={vitals.huyetApTruong} onChange={(e) => handleVitalChange('huyetApTruong', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('huyetApTruong')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="80" />
              {renderError('huyetApTruong')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Cân nặng (kg)</label>
              <input type="number" step="0.1" value={vitals.canNang} onChange={(e) => handleVitalChange('canNang', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('canNang')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="65" />
              {renderError('canNang')}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Chiều cao (cm)</label>
              <input type="number" step="0.1" value={vitals.chieuCao} onChange={(e) => handleVitalChange('chieuCao', e.target.value)} 
                className={`w-full p-2 border ${getErrorBorder('chieuCao')} rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500`} placeholder="170" />
              {renderError('chieuCao')}
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-[10px] font-black text-gray-500 uppercase mb-1">Ghi chú</label>
            <textarea
              value={vitals.ghiChu}
              onChange={(e) => handleVitalChange('ghiChu', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
              placeholder="Ghi chú thêm về chỉ số sinh hiệu..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Kết quả cận lâm sàng</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-indigo-900 w-32">- Xét nghiệm:</span>
                <select
                  value={selectedLabId}
                  className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  onChange={(e) => handleClsSelect(e.target.value, 'XET_NGHIEM')}
                >
                  <option value="">-- Chọn KQ Xét Nghiệm ({labs.length}) --</option>
                  {labs.map(item => (
                    <option key={item.id} value={item.id}>{item.tenDichVu}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-indigo-900 w-32">- CĐ Hình ảnh:</span>
                <select
                  value={selectedCdhaId}
                  className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  onChange={(e) => handleClsSelect(e.target.value, 'CDHA')}
                >
                  <option value="">-- Chọn KQ CĐHA ({cdhas.length}) --</option>
                  {cdhas.map(item => (
                    <option key={item.id} value={item.id}>{item.tenDichVu}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <textarea
                value={examData.ketQuaKhamCanLamSang}
                onChange={(e) => handleFieldChange('ketQuaKhamCanLamSang', e.target.value)}
                className="w-full p-4 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px] transition-all text-sm bg-white shadow-sm"
                placeholder="Chi tiết kết quả cận lâm sàng..."
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
            Chẩn đoán sơ bộ / Xác định <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={examData.chanDoanSoBo}
            onChange={(e) => handleFieldChange('chanDoanSoBo', e.target.value)}
            className={`w-full p-4 border ${getErrorBorder('chanDoanSoBo')} rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-indigo-700 shadow-sm`}
            placeholder="Tên bệnh chẩn đoán..."
          />
          {renderError('chanDoanSoBo')}
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Lời dặn bác sĩ</label>
          <textarea
            value={examData.loiDanBacSi}
            onChange={(e) => handleFieldChange('loiDanBacSi', e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] transition-all text-sm shadow-sm"
            placeholder="Chế độ ăn uống, sinh hoạt, hẹn tái khám..."
          />
        </div>
      </div>
    </div>
  );
});

export default TabKhamLamSang;