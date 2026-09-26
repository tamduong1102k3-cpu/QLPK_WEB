import React, { useState, useEffect, useMemo } from 'react';
import { submitTestResultApi, getXetNhiemResultApi } from '../../../api/phieuChiDinhApi';
import { getLabForm } from './labForms/labServiceForms';
import { getTemplateForService, generateTextFromTemplate, buildTemplateFromIndicators } from './TienIchKyThuatVien';
import { toast } from 'react-toastify';

// Form nhập kết quả XÉT NGHIỆM
// - Thiết kế form riêng cho từng dịch vụ: lấy cấu hình form theo mã dịch vụ từ labForms/*
// - Khám mã dịch vụ nào → nạp form dịch vụ đó (select/number/radio theo từng loại xét nghiệm)
const ModalNhapKetQuaXetNghiem = ({ test, user, servicesList = [], onClose, onSuccess }) => {
  // Lấy cấu hình form riêng theo mã dịch vụ
  const labForm = useMemo(() => getLabForm(test?.maDichVu), [test?.maDichVu]);

  // Lấy tên dịch vụ từ form config (ưu tiên), fallback từ test/servicesList
  const tenDichVu = useMemo(() => {
    if (labForm?.tenDichVu) return labForm.tenDichVu;
    if (test?.tenDichVu) return test.tenDichVu;
    const sv = servicesList.find(s => Number(s.maDichVu) === Number(test?.maDichVu));
    return sv?.tenDichVu || 'Xét nghiệm';
  }, [labForm, test, servicesList]);

  // Xây dựng template render từ cấu hình form của dịch vụ, fallback về template tĩnh
  const selectedTemplate = useMemo(() => {
    if (labForm?.fields?.length) {
      return buildTemplateFromIndicators(labForm.fields, labForm.tenDichVu || tenDichVu);
    }
    return getTemplateForService(tenDichVu, false);
  }, [labForm, tenDichVu]);

  const [useTemplate, setUseTemplate] = useState(true);
  const [templateValues, setTemplateValues] = useState({});
  const [testResultText, setTestResultText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedOldResult, setHasLoadedOldResult] = useState(false);
  // Ghi chú / lý do bác sĩ từ chối (hiển thị cảnh báo cho KTV)
  const [lyDoTuChoi, setLyDoTuChoi] = useState('');

  // Tải lại kết quả đã nhập trước đó + ghi chú từ bác sĩ khi mở form
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getXetNhiemResultApi(test.id);
        if (data && active) {
          // Có kết quả cũ hoặc lý do từ chối → hiển thị, KHÔNG ghi đè bằng default
          if (data.ketQua) {
            setTestResultText(data.ketQua);
            setHasLoadedOldResult(true);
          }
          if (data.ghiChuThem) setLyDoTuChoi(data.ghiChuThem);
        }
      } catch (e) { /* chưa có kết quả nào */ }
    })();
    return () => { active = false; };
  }, [test.id]);

  // Chỉ sinh biên bản mặc định khi chưa có dữ liệu cũ nào
  useEffect(() => {
    if (selectedTemplate && !hasLoadedOldResult && !testResultText) {
      const initialValues = {};
      selectedTemplate.fields.forEach(f => initialValues[f.key] = f.defaultValue || '');
      setTemplateValues(initialValues);
      setTestResultText(generateTextFromTemplate(selectedTemplate, initialValues, tenDichVu));
    }
  }, [selectedTemplate, tenDichVu, hasLoadedOldResult, testResultText]);

  const handleTemplateValueChange = (key, value) => {
    const updated = { ...templateValues, [key]: value };
    setTemplateValues(updated);
    if (selectedTemplate) {
      setTestResultText(generateTextFromTemplate(selectedTemplate, updated, tenDichVu));
    }
  };

  const handleSave = async () => {
    if (!testResultText.trim()) {
      toast.error('Vui lòng nhập nội dung kết quả xét nghiệm.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        id: test.id,
        maPhieuKham: test.maPhieuKham,
        tenDichVu,
        ketQua: testResultText,
        maNhanVienThucHien: user?.maNhanVien,
        useTemplate,
        templateKey: selectedTemplate ? selectedTemplate.key : null,
        templateValues: useTemplate ? templateValues : null,
        // Gửi thêm danh sách chỉ số + giá trị nhập để backend lưu chi tiết
        chiTietKetQua: useTemplate && selectedTemplate ? selectedTemplate.fields.map(f => ({
          maChiSo: f.maChiTiet || f.maChiSo || null,
          tenChiSo: f.label,
          donVi: f.unit || null,
          giaTriBinhThuong: f.giaTriBinhThuong || null,
          giaTriNhap: templateValues[f.key] || ''
        })) : null
      };
      const res = await submitTestResultApi(payload);
      if (res) {
        toast.success('Đã lưu kết quả xét nghiệm thành công!');
        onSuccess();
      } else {
        toast.error('Lỗi khi lưu kết quả vào hệ thống.');
      }
    } catch (error) {
      console.error('Lỗi khi lưu kết quả xét nghiệm:', error);
      toast.error('Không thể kết nối đến máy chủ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-6xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">
        {/* Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-sm relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="material-symbols-outlined text-[28px]">science</span>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Kết Quả Xét Nghiệm</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded border border-slate-200/60">CHỈ ĐỊNH #{test.id}</span>
                <span className="text-slate-400 text-xs font-medium">{test.hoTen}</span>
                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase tracking-wider rounded border border-cyan-200/60">{tenDichVu}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-colors ring-1 ring-transparent hover:ring-rose-100 group">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-white">
          {/* Toggle template */}
          {selectedTemplate && (
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">tune</span>
                </div>
                <span className="text-sm font-bold text-slate-700">Sử dụng form chuẩn theo dịch vụ</span>
                {labForm?.fields?.length > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded">{labForm.fields.length} chỉ số</span>
                )}
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
              </label>
            </div>
          )}

          {/* Form các chỉ số theo dịch vụ */}
          {useTemplate && selectedTemplate && (
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                {selectedTemplate.title}
                {labForm?.fields?.length > 0 && <span className="ml-2 normal-case text-emerald-600 font-bold">(form thiết kế riêng theo dịch vụ)</span>}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedTemplate.fields.map(f => (
                  <div key={f.key} className={`bg-white p-4 rounded-xl border border-slate-200/60 focus-within:ring-2 focus-within:ring-cyan-100 ${f.type === 'textarea' ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">{f.label}</label>
                    {f.giaTriBinhThuong && (
                      <p className="text-[9px] text-amber-600 font-medium mb-2 leading-relaxed">
                        Bình thường: {f.giaTriBinhThuong}
                      </p>
                    )}
                    {f.type === 'select' ? (
                      <select
                        value={templateValues[f.key] || ''}
                        onChange={e => handleTemplateValueChange(f.key, e.target.value)}
                        className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-cyan-400 rounded-lg p-3 text-sm font-bold text-slate-800 outline-none transition-all"
                      >
                        <option value="">-- Chọn --</option>
                        {(f.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : f.type === 'radio' ? (
                      <div className="flex flex-wrap gap-2">
                        {(f.options || []).map(opt => (
                          <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold cursor-pointer transition-all ${templateValues[f.key] === opt ? 'bg-white ring-2 ring-cyan-400 border-cyan-300 text-cyan-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'}`}>
                            <input
                              type="radio"
                              name={`radio_${f.key}`}
                              value={opt}
                              checked={templateValues[f.key] === opt}
                              onChange={() => handleTemplateValueChange(f.key, opt)}
                              className="accent-cyan-500"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-cyan-400 rounded-lg p-3 text-sm font-medium text-slate-700 outline-none transition-all resize-y min-h-[80px]"
                        placeholder="Nhập kết quả..."
                        value={templateValues[f.key] || ''}
                        onChange={e => handleTemplateValueChange(f.key, e.target.value)}
                      />
                    ) : (
                      <div className="relative flex items-center">
                        <input
                          className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-cyan-400 rounded-lg p-3 text-sm font-bold text-slate-800 outline-none transition-all"
                          type={f.type === 'number' ? 'text' : (f.type || 'text')}
                          inputMode={f.type === 'number' ? 'decimal' : 'text'}
                          placeholder={f.type === 'number' ? '0.0' : 'Nhập...'}
                          value={templateValues[f.key] || ''}
                          onChange={e => handleTemplateValueChange(f.key, e.target.value)}
                        />
                        {f.unit && <span className="absolute right-3 text-xs font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">{f.unit}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cảnh báo: kết quả bị bác sĩ từ chối (yêu cầu làm lại) */}
          {lyDoTuChoi && (
            <div className="mx-6 mt-5 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5">feedback</span>
              <div>
                <p className="text-xs font-black text-red-700 uppercase tracking-wide mb-1">Kết quả đã bị bác sĩ từ chối — yêu cầu làm lại</p>
                <p className="text-sm font-medium text-red-700 whitespace-pre-wrap leading-relaxed">{lyDoTuChoi}</p>
              </div>
            </div>
          )}

          {/* Biên bản kết quả */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col bg-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-slate-400">description</span>
              <h4 className="font-bold text-base text-slate-700">Biên bản kết quả</h4>
            </div>
            <textarea
              className="flex-1 w-full bg-white border border-slate-200 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10 rounded-2xl p-6 sm:p-8 text-base font-mono outline-none transition-all leading-relaxed text-slate-700 resize-none shadow-sm min-h-[220px]"
              placeholder="Nhập nội dung kết quả xét nghiệm tại đây..."
              value={testResultText}
              onChange={e => setTestResultText(e.target.value)}
            />
            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 mt-0.5 text-sm">info</span>
              <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                <strong className="font-bold text-amber-900">Lưu ý quan trọng:</strong>
                Văn bản trên sẽ được lưu trực tiếp vào hồ sơ y tế điện tử và gửi cho bác sĩ phê duyệt.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl transition-colors ring-1 ring-slate-200/60">HỦY BỎ</button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transform active:scale-95 transition-all text-sm flex items-center gap-2">
            {isSubmitting ? <><span className="material-symbols-outlined animate-spin">refresh</span> ĐANG LƯU...</> : <><span className="material-symbols-outlined">save</span> LƯU HỒ SƠ</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalNhapKetQuaXetNghiem;