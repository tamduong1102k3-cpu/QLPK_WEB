import React, { useState } from 'react';
import { saveAndUpdateApi } from '../../../api/chiSoKhamTongHopApi';
import { useNotification } from '../../../components/NotificationContext';

const TabKhamNhi = ({ examData, setExamData, isAssistant, maPhieuKham, user }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const setField = (field, val) => {
    setExamData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};
    const requiredFields = [
      { field: 'tinhTrangDinhDuong', label: 'Tình trạng dinh dưỡng' },
      { field: 'tamLyHanhVi', label: 'Tâm lý hành vi' },
    ];
    requiredFields.forEach(({ field, label }) => {
      if (!examData[field] || !examData[field].toString().trim()) {
        newErrors[field] = `Vui lòng nhập ${label.toLowerCase()}`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!maPhieuKham) return showError("Không tìm thấy mã phiếu!");
    
    if (!validate()) {
      showError('Vui lòng kiểm tra lại thông tin trước khi lưu!');
      return;
    }

    setLoading(true);
    const u = user || {};

    const payload = {
      maPhieuKham: maPhieuKham,
      maChuyenKhoa: u.maChuyenKhoa,
      maNhanVienNhap: u.maNhanVien || u.id,
      tinhTrangDinhDuong: examData.tinhTrangDinhDuong || null,
      tamLyHanhVi: examData.tamLyHanhVi || null,
      khamTaiMuiHongNhi: examData.khamTaiMuiHongNhi || null,
      khamHoHapNhi: examData.khamHoHapNhi || null,
      khamDaNiemMacNhi: examData.khamDaNiemMacNhi || null,
      khamDuNiemMacNhi: examData.khamDuNiemMacNhi || null,
      coQuanKhacNhi: examData.coQuanKhacNhi || null,
      ghiChu: examData.ghiChu || null
    };

    try {
      await saveAndUpdateApi(payload);
      showSuccess(`✅ Đã lưu kết quả khám Nhi khoa thành công!`);
    } catch (error) {
      showError("❌ Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in space-y-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-3xl">child_care</span>
          Khám Chuyên Khoa Nhi Khoa {maPhieuKham && <span className="text-sm font-normal text-gray-400">(#{maPhieuKham})</span>}
        </h3>
      </div>

      {/* ===== TÌNH TRẠNG DINH DƯỠNG & TÂM LÝ ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">
            Tình trạng dinh dưỡng <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={examData.tinhTrangDinhDuong || ''} 
            onChange={e => setField('tinhTrangDinhDuong', e.target.value)} 
            className={`w-full p-3 border ${errors.tinhTrangDinhDuong ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none`} 
            placeholder="Bình thường, còi cọc, suy dinh dưỡng..." 
          />
          {errors.tinhTrangDinhDuong && <p className="mt-1 text-[11px] font-bold text-red-500">{errors.tinhTrangDinhDuong}</p>}
        </div>
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">
            Tâm lý hành vi <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            value={examData.tamLyHanhVi || ''} 
            onChange={e => setField('tamLyHanhVi', e.target.value)} 
            className={`w-full p-3 border ${errors.tamLyHanhVi ? 'border-red-400 bg-red-50' : 'border-gray-300'} rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none`} 
            placeholder="Bình thường, tăng động, chậm phát triển..." 
          />
          {errors.tamLyHanhVi && <p className="mt-1 text-[11px] font-bold text-red-500">{errors.tamLyHanhVi}</p>}
        </div>
      </div>

      {/* ===== KHÁM CHUYÊN KHOA NHI ===== */}
      <div className="bg-sky-50/30 p-6 rounded-2xl border border-sky-100 space-y-6">
        <h4 className="font-bold text-sky-800 text-sm uppercase flex items-center gap-2">
          <span className="material-symbols-outlined text-sky-600 text-lg">stethoscope</span>
          Khám Lâm Sàng Chuyên Khoa Nhi
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Khám Tai - Mũi - Họng</label>
            <textarea 
              value={examData.khamTaiMuiHongNhi || ''} 
              onChange={e => setField('khamTaiMuiHongNhi', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Tai: thông thoáng, không viêm&#10;Mũi: sạch, không dịch&#10;Họng: niêm mạc hồng, không đỏ..."
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Khám Hô Hấp</label>
            <textarea 
              value={examData.khamHoHapNhi || ''} 
              onChange={e => setField('khamHoHapNhi', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Phổi: rõ, không ran&#10;Nhịp thở đều..."
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Khám Da - Niêm Mạc</label>
            <textarea 
              value={examData.khamDaNiemMacNhi || ''} 
              onChange={e => setField('khamDaNiemMacNhi', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Da: hồng hào, không phát ban&#10;Niêm mạc: hồng, ẩm..."
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Khám Dưới Niêm Mạc</label>
            <textarea 
              value={examData.khamDuNiemMacNhi || ''} 
              onChange={e => setField('khamDuNiemMacNhi', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Không xuất huyết dưới da, không phù niêm mạc..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Cơ Quan Khác</label>
          <textarea 
            value={examData.coQuanKhacNhi || ''} 
            onChange={e => setField('coQuanKhacNhi', e.target.value)} 
            className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Cơ xương khớp, thần kinh, tiêu hóa, tiết niệu..."
          />
        </div>
      </div>

      {/* ===== GHI CHÚ ===== */}
      <div>
        <label className="block text-xs font-black text-gray-500 uppercase mb-2">Ghi chú chung</label>
        <textarea 
          value={examData.ghiChu || ''} 
          onChange={e => setField('ghiChu', e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Ghi nhận thêm về tình trạng bệnh nhi..."
        />
      </div>

      {/* ===== BUTTON LƯU ===== */}
      {!isAssistant && (
      <div className="pt-6 border-t border-gray-100 flex justify-end gap-4">
        <button 
          disabled={loading}
          onClick={handleSave} 
          className={`px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
        >
          <span className="material-symbols-outlined">{loading ? 'sync' : 'how_to_reg'}</span>
          {loading ? 'ĐANG LƯU...' : 'KÝ XÁC NHẬN KẾT QUẢ KHÁM NHI'}
        </button>
      </div>
      )}
    </div>
  );
};

export default TabKhamNhi;