import React, { useState, useEffect } from 'react';
import { uploadToCloudinary } from '../../../api/cloudinaryApi';
import { submitTestResultApi, getCdhaResultApi } from '../../../api/phieuChiDinhApi';
import { getTemplateForService, generateTextFromTemplate, getValueStatus, formatDateOfBirth } from './TienIchKyThuatVien';
import { toast } from 'react-toastify';

const ModalNhapKetQua = ({ test, user, isImaging, onClose, onSuccess }) => {
  const [testResultText, setTestResultText] = useState('');
  const [useTemplate, setUseTemplate] = useState(true);
  const [templateValues, setTemplateValues] = useState({});
  const [duongDanAnh1, setDuongDanAnh1] = useState('');
  const [duongDanAnh2, setDuongDanAnh2] = useState('');
  const [isUploading, setIsUploading] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State quản lý ảnh phóng to
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const selectedTemplate = getTemplateForService(test.tenDichVu, isImaging);

  useEffect(() => {
    let initialValues = {};
    if (selectedTemplate) {
      selectedTemplate.fields.forEach(f => initialValues[f.key] = f.defaultValue || '');
      setTemplateValues(initialValues);
      setTestResultText(generateTextFromTemplate(selectedTemplate, initialValues, test.tenDichVu));
    }

    if (isImaging) {
      getCdhaResultApi(test.id).then(data => {
        if (data) {
          if (data.duongDanAnh1) setDuongDanAnh1(data.duongDanAnh1);
          if (data.duongDanAnh2) setDuongDanAnh2(data.duongDanAnh2);
          
          if (selectedTemplate && selectedTemplate.key === 'CDHA_GENERIC') {
            const vals = {
              mo_ta: data.moTaHinhAnh || initialValues.mo_ta || ''
            };
            setTemplateValues(vals);
            setTestResultText(generateTextFromTemplate(selectedTemplate, vals, test.tenDichVu));
          }
        }
      });
    }
  }, [test.id, isImaging, test.tenDichVu]);

  const handleTemplateValueChange = (key, value) => {
    const updated = { ...templateValues, [key]: value };
    setTemplateValues(updated);
    setTestResultText(generateTextFromTemplate(selectedTemplate, updated, test.tenDichVu));
  };

  const handleImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(idx);
    try {
      const url = await uploadToCloudinary(file);
      if (idx === 1) setDuongDanAnh1(url); else setDuongDanAnh2(url);
    } finally { setIsUploading(null); }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        id: test.id, 
        maPhieuKham: test.maPhieuKham, 
        tenDichVu: test.tenDichVu,
        ketQua: testResultText, 
        maNhanVienThucHien: user?.maNhanVien,
        duongDanAnh1, 
        duongDanAnh2, 
        useTemplate, 
        templateKey: selectedTemplate ? selectedTemplate.key : null,
        templateValues: useTemplate ? templateValues : null
      };
      
      const res = await submitTestResultApi(payload);
      
      if (res) {
        toast.success("Đã lưu kết quả cận lâm sàng thành công!");
        onSuccess(); 
      } else {
        toast.error("Lỗi khi lưu kết quả vào hệ thống.");
      }
    } catch (error) {
      console.error("Lỗi khi lưu kết quả:", error);
      toast.error("Không thể kết nối đến máy chủ.");
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 transition-all duration-300">
      <div className="bg-white rounded-[2rem] w-full max-w-7xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">

        <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between z-10 shadow-sm relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="material-symbols-outlined text-[28px]">{isImaging ? 'image' : 'science'}</span>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">{isImaging ? 'Kết Quả Chẩn Đoán Hình Ảnh' : 'Kết Quả Xét Nghiệm'}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider rounded border border-slate-200/60">CHỈ ĐỊNH #{test.id}</span>
                <span className="text-slate-400 text-xs font-medium">{test.hoTen}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-colors ring-1 ring-transparent hover:ring-rose-100 group">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col bg-white">
          {/* Form template - thu gọn phía trên */}
          {selectedTemplate && (
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-sm">tune</span>
                </div>
                <span className="text-sm font-bold text-slate-700">Sử dụng form chuẩn</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={useTemplate} onChange={e => setUseTemplate(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          )}

          {useTemplate && selectedTemplate && (
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{selectedTemplate.title}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedTemplate.fields.map(f => (
                  <div key={f.key} className={`bg-white p-4 rounded-xl border border-slate-200/60 focus-within:ring-2 focus-within:ring-indigo-100 ${f.type === 'textarea' ? 'sm:col-span-2 lg:col-span-4' : ''}`}>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-2">{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-400 rounded-lg p-3 text-sm font-medium text-slate-700 outline-none transition-all resize-y min-h-[80px]" placeholder="Nhập kết quả..." value={templateValues[f.key] || ''} onChange={e => handleTemplateValueChange(f.key, e.target.value)} />
                    ) : (
                      <div className="relative flex items-center">
                        <input className="w-full bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-400 rounded-lg p-3 text-sm font-bold text-slate-800 outline-none transition-all" type="text" placeholder="0.0" value={templateValues[f.key] || ''} onChange={e => handleTemplateValueChange(f.key, e.target.value)} />
                        {f.unit && <span className="absolute right-3 text-xs font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded">{f.unit}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isImaging && (
            <div className="p-4 sm:p-6 border-b border-slate-100 bg-slate-50/30">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Hình ảnh đính kèm</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2].map(idx => {
                  const imgUrl = idx === 1 ? duongDanAnh1 : duongDanAnh2;
                  return (
                    <div key={idx} className="relative group rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center h-24 sm:h-28 overflow-hidden">
                      {imgUrl ? (
                        <>
                          <img src={imgUrl} alt={`Uploaded ${idx}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxUrl(imgUrl); }} className="w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all">
                              <span className="material-symbols-outlined text-lg">zoom_in</span>
                            </button>
                            <div className="relative w-8 h-8 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all">
                              <span className="material-symbols-outlined text-lg">swap_horiz</span>
                              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, idx)} disabled={isUploading !== null} />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-slate-400 group-hover:text-indigo-500 transition-colors text-2xl mb-1">add_photo_alternate</span>
                          <span className="text-[10px] font-bold text-slate-500 group-hover:text-indigo-600 uppercase tracking-wider">Tải ảnh</span>
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => handleImageUpload(e, idx)} disabled={isUploading !== null} />
                        </>
                      )}
                      {isUploading === idx && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                          <span className="material-symbols-outlined animate-spin text-indigo-500 text-2xl">refresh</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Biên bản y khoa - dọc từ trên xuống như trang giấy */}
          <div className="flex-1 p-6 sm:p-8 lg:p-10 flex flex-col bg-white">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-slate-400">description</span>
              <h4 className="font-bold text-base text-slate-700">Biên bản y khoa</h4>
            </div>
            <textarea className="flex-1 w-full bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl p-6 sm:p-8 lg:p-10 text-base font-mono outline-none transition-all leading-relaxed text-slate-700 resize-none shadow-sm min-h-[350px]" placeholder="Nhập nội dung biên bản y khoa tại đây..." value={testResultText} onChange={e => setTestResultText(e.target.value)} />

            <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 mt-0.5 text-sm">info</span>
              <p className="text-[10px] font-medium text-amber-800 leading-relaxed">
                <strong className="font-bold text-amber-900">Lưu ý quan trọng:</strong>
                Văn bản trên sẽ được lưu trực tiếp vào hồ sơ y tế điện tử của bệnh nhân.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-4">
          <button onClick={onClose} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl transition-colors ring-1 ring-slate-200/60">HỦY BỎ</button>
          <button onClick={handleSave} disabled={isSubmitting} className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transform active:scale-95 transition-all text-sm flex items-center gap-2">
            {isSubmitting ? <><span className="material-symbols-outlined animate-spin">refresh</span> ĐANG LƯU...</> : <><span className="material-symbols-outlined">save</span> LƯU HỒ SƠ</>}
          </button>
        </div>
      </div>

      {/* LIGHTBOX COMPONENT - Xem ảnh phóng to */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setLightboxUrl(null)}
        >
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-4xl">close</span>
          </button>
          <div className="max-w-5xl max-h-[85vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300 border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalNhapKetQua;