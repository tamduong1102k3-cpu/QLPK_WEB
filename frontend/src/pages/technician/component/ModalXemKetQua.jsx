import React, { useState, useEffect } from 'react';
import { getCdhaResultApi } from '../../../api/phieuChiDinhApi';
import { formatDateTime, formatDateOfBirth, calculateAge } from './TienIchKyThuatVien';
import formatGender from '../../../utils/formatGender';

const ModalXemKetQua = ({ viewingResult, user, isImaging, onClose }) => {
  const [cdhaResultData, setCdhaResultData] = useState(null);
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  useEffect(() => {
    if (isImaging && viewingResult?.id) {
      getCdhaResultApi(viewingResult.id)
        .then(data => { if (data) setCdhaResultData(data); })
        .catch(err => console.error("Lỗi khi tải kết quả CĐHA:", err));
    }
  }, [viewingResult, isImaging]);

  const handlePrintReport = () => { window.print(); };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 transition-all duration-300 overflow-y-auto">
      {/* CSS In ấn giữ nguyên */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #clinical-print-area, #clinical-print-area * { visibility: visible !important; }
          #clinical-print-area {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; background: white !important; padding: 30px !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
      
      <div className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200/50">
        
        {/* Modal Header */}
        <div className="p-6 sm:p-8 bg-white border-b border-slate-100 flex items-center justify-between no-print z-10 shadow-sm relative">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30">
              <span className="material-symbols-outlined text-[28px]">assignment_turned_in</span>
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Hồ Sơ Y Khoa</h3>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Bản ghi kết quả cận lâm sàng</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-colors ring-1 ring-transparent hover:ring-rose-100 group no-print">
            <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">close</span>
          </button>
        </div>

        {/* Báo cáo chi tiết (Vùng in) */}
        <div className="flex-1 p-8 sm:p-10 overflow-y-auto bg-slate-50/50 relative" id="clinical-print-area">
          {/* Logo Watermark (Visual Only, Non-Print) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none no-print">
            <span className="material-symbols-outlined text-[300px]">medical_services</span>
          </div>

          <div className="relative z-10 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-slate-200/60 print:shadow-none print:border-none print:p-0">
            {/* Clinic Header */}
            <div className="flex justify-between items-start border-b-2 border-indigo-900/80 pb-6 print:border-black">
              <div className="space-y-1.5">
                <h2 className="text-lg font-black text-indigo-900 tracking-tight print:text-black">HỆ THỐNG PHÒNG KHÁM QUỐC TẾ MEDCORE</h2>
                <p className="text-xs font-medium text-slate-500 flex items-center gap-2 print:text-black">
                   <span className="material-symbols-outlined text-[14px]">call</span> 1900-2244 
                   <span className="text-slate-300">|</span> 
                   <span className="material-symbols-outlined text-[14px]">language</span> medcore.clinic.vn
                </p>
              </div>
              <div className="text-right">
                <div className="border border-indigo-900/30 bg-indigo-50/50 text-indigo-900 px-4 py-1.5 rounded-lg font-black text-sm tracking-widest print:border-black print:bg-transparent print:text-black">
                  MÃ BN: {String(viewingResult.maBenhNhan || '').padStart(4, '0')}
                </div>
              </div>
            </div>

            <div className="text-center my-8">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-wide print:text-black">
                {isImaging ? 'PHIẾU KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH' : 'PHIẾU KẾT QUẢ XÉT NGHIỆM'}
              </h1>
            </div>

            {/* Thông tin BN */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-slate-50/80 p-6 rounded-2xl border border-slate-200/50 text-sm mb-8 print:bg-transparent print:border-black print:p-4">
              <div className="space-y-1"><span className="text-slate-400 font-bold block text-[10px] uppercase tracking-widest print:text-black">Họ và tên bệnh nhân</span><span className="font-black text-slate-800 text-base print:text-black">{viewingResult.hoTen}</span></div>
              <div className="space-y-1"><span className="text-slate-400 font-bold block text-[10px] uppercase tracking-widest print:text-black">Giới tính / Ngày sinh</span><span className="font-bold text-slate-700 print:text-black">{formatGender(viewingResult.gioiTinh)} • {formatDateOfBirth(viewingResult.ngaySinh)} ({calculateAge(viewingResult.ngaySinh)})</span></div>
              <div className="space-y-1"><span className="text-slate-400 font-bold block text-[10px] uppercase tracking-widest print:text-black">Dịch vụ chỉ định</span><span className="font-black text-indigo-700 print:text-black">{viewingResult.tenDichVu}</span></div>
              <div className="space-y-1"><span className="text-slate-400 font-bold block text-[10px] uppercase tracking-widest print:text-black">Thời gian chỉ định</span><span className="font-bold text-slate-700 print:text-black">{formatDateTime(viewingResult.ngayChiDinh)}</span></div>
            </div>

            {/* Kết quả chữ */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 print:border-black print:text-black">Kết Quả Chi Tiết</h3>
              <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-inner font-mono text-sm whitespace-pre-wrap leading-relaxed text-slate-700 print:border-none print:shadow-none print:p-0 print:text-black">
                {viewingResult.ketQua}
              </div>
            </div>

            {/* Hình ảnh (Nếu có) */}
            {isImaging && cdhaResultData && (cdhaResultData.duongDanAnh1 || cdhaResultData.duongDanAnh2) && (
              <div className="space-y-4 mt-8 print:break-inside-avoid">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 no-print">Hình Ảnh Cận Lâm Sàng</h3>
                <div className="grid grid-cols-2 gap-6">
                  {cdhaResultData.duongDanAnh1 && (
                    <div className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm print:border-none print:shadow-none">
                       <img src={cdhaResultData.duongDanAnh1} alt="Result 1" className="w-full h-56 object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105 print:h-auto" onClick={() => setActiveLightboxImage(cdhaResultData.duongDanAnh1)} />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none no-print"><span className="material-symbols-outlined text-white text-3xl">zoom_in</span></div>
                    </div>
                  )}
                  {cdhaResultData.duongDanAnh2 && (
                    <div className="group relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm print:border-none print:shadow-none">
                       <img src={cdhaResultData.duongDanAnh2} alt="Result 2" className="w-full h-56 object-cover cursor-zoom-in transition-transform duration-500 group-hover:scale-105 print:h-auto" onClick={() => setActiveLightboxImage(cdhaResultData.duongDanAnh2)} />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none no-print"><span className="material-symbols-outlined text-white text-3xl">zoom_in</span></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chữ ký */}
            <div className="grid grid-cols-2 gap-6 mt-12 pt-8 border-t-2 border-slate-100 text-sm print:border-black print:break-inside-avoid">
              <div className="text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest print:text-black">Bác sĩ chỉ định</p>
                <div className="h-24"></div>
                <p className="font-bold text-slate-800 print:text-black">Khoa điều trị lâm sàng</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest print:text-black">Kỹ thuật viên thực hiện</p>
                <div className="h-20 flex items-end justify-center">
                   <span className="font-serif italic text-2xl text-indigo-700 bg-indigo-50/50 px-6 py-2 rounded-xl border border-indigo-100/50 print:bg-transparent print:border-none print:text-black">{user?.hoTen}</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest print:text-black">Đã ký điện tử</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-between no-print z-10">
          <div className="flex items-center gap-2 text-slate-400">
             <span className="material-symbols-outlined text-lg">verified_user</span>
             <span className="text-[11px] font-bold uppercase tracking-widest">Hệ thống MedCore Lab</span>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-sm rounded-xl transition-colors ring-1 ring-slate-200/60">ĐÓNG</button>
            <button onClick={handlePrintReport} className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/30 transform active:scale-95 transition-all text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">print</span> IN KẾT QUẢ
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox ảnh phóng to */}
      {activeLightboxImage && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[9999] p-4 sm:p-8 animate-in fade-in duration-300" onClick={() => setActiveLightboxImage(null)}>
          <img src={activeLightboxImage} alt="Zoom" className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300" />
          <button className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors" onClick={() => setActiveLightboxImage(null)}>
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ModalXemKetQua;
