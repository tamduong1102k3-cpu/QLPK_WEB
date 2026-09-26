import React, { useState } from 'react';
import { getByPhieuKhamApi, saveAndUpdateApi } from '../../../api/chiSoKhamTongHopApi';
import { useNotification } from '../../../components/NotificationContext';

const TabKhamTMH = ({ examData, setExamData, maPhieuKham, isAssistant, user }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // NOTE: Data is loaded by the parent component (TroLyTMHForm / ManHinhKhamBenh).
  // This component is a "controlled" form bound to parent's `examData` and `setExamData`.

  const validate = () => {
    const newErrors = {};
    // At least one field should be filled for TMH exam
    const fields = ['tinhTrangMui', 'tinhTrangHong', 'soiTaiMuiHong', 'ongTai', 'mangNhiPhai', 'mangNhiTrai', 'vachNgan', 'cuonMui', 'kheMui', 'amidan', 'thanhQuan', 'thinhLucTaiTrai', 'thinhLucTaiPhai'];
    const hasAny = fields.some(f => examData[f] && examData[f].trim());
    if (!hasAny) {
      newErrors.general = 'Vui lòng nhập ít nhất một thông tin khám TMH';
    }
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
    
    // Combine only TMH fields
    const payload = {
      maPhieuKham: maPhieuKham,
      maChuyenKhoa: u.maChuyenKhoa,
      maNhanVienNhap: u.maNhanVien || u.id,
      tinhTrangMui: examData.tinhTrangMui || null,
      tinhTrangHong: examData.tinhTrangHong || null,
      soiTaiMuiHong: examData.soiTaiMuiHong || null,
      ongTai: examData.ongTai || null,
      mangNhiPhai: examData.mangNhiPhai || null,
      mangNhiTrai: examData.mangNhiTrai || null,
      vachNgan: examData.vachNgan || null,
      cuonMui: examData.cuonMui || null,
      kheMui: examData.kheMui || null,
      amidan: examData.amidan || null,
      thanhQuan: examData.thanhQuan || null,
      thinhLucTaiTrai: examData.thinhLucTaiTrai || null,
      thinhLucTaiPhai: examData.thinhLucTaiPhai || null,
      ghiChu: examData.ghiChu || null
    };

    try {
      await saveAndUpdateApi(payload);
      showSuccess(`✅ Đã lưu kết quả khám TMH thành công!`);
      setErrors({});
    } catch (error) {
      showError("❌ Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (field, val) => {
    setExamData(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in space-y-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-3xl">hearing</span>
          Khám Chuyên Khoa Tai Mũi Họng {maPhieuKham && <span className="text-sm font-normal text-gray-400">(#{maPhieuKham})</span>}
        </h3>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Tình trạng mũi</label>
            <input 
              type="text" 
              value={examData.tinhTrangMui || ''} 
              onChange={e => setField('tinhTrangMui', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Thông thoáng, sưng nề..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Tình trạng họng</label>
            <input 
              type="text" 
              value={examData.tinhTrangHong || ''} 
              onChange={e => setField('tinhTrangHong', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Họng sạch, đỏ nhẹ..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Thính lực Tai Trái</label>
            <input 
              type="text" 
              value={examData.thinhLucTaiTrai || ''} 
              onChange={e => setField('thinhLucTaiTrai', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Bình thường, giảm nhẹ..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Thính lực Tai Phải</label>
            <input 
              type="text" 
              value={examData.thinhLucTaiPhai || ''} 
              onChange={e => setField('thinhLucTaiPhai', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Bình thường, giảm nhẹ..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Màng nhĩ trái</label>
            <input 
              type="text" 
              value={examData.mangNhiTrai || ''} 
              onChange={e => setField('mangNhiTrai', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Sáng, lõm, thủng..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Màng nhĩ phải</label>
            <input 
              type="text" 
              value={examData.mangNhiPhai || ''} 
              onChange={e => setField('mangNhiPhai', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Sáng, lõm, thủng..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Vách ngăn</label>
            <input 
              type="text" 
              value={examData.vachNgan || ''} 
              onChange={e => setField('vachNgan', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Thẳng, vẹo trái/phải..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Cuốn mũi</label>
            <input 
              type="text" 
              value={examData.cuonMui || ''} 
              onChange={e => setField('cuonMui', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Bình thường, quá phát..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Khe mũi</label>
            <input 
              type="text" 
              value={examData.kheMui || ''} 
              onChange={e => setField('kheMui', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Sạch, có mủ/dịch..." 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Amidan</label>
            <input 
              type="text" 
              value={examData.amidan || ''} 
              onChange={e => setField('amidan', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
              placeholder="Bình thường, quá phát độ 1/2/3..." 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Nội soi Tai Mũi Họng (Kết luận)</label>
            <textarea 
              value={examData.soiTaiMuiHong || ''} 
              onChange={e => setField('soiTaiMuiHong', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ghi nhận hình ảnh nội soi..."
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Ống tai</label>
            <textarea 
              value={examData.ongTai || ''} 
              onChange={e => setField('ongTai', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Ống tai sạch, không viêm, có ráy tai..."
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-500 uppercase mb-2">Thanh quản</label>
            <textarea 
              value={examData.thanhQuan || ''} 
              onChange={e => setField('thanhQuan', e.target.value)} 
              className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Dây thanh khép kín, di động tốt..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-6 pt-6 border-t border-gray-100">
        <div>
          <label className="block text-xs font-black text-gray-500 uppercase mb-2">Ghi chú chung</label>
          <textarea 
            value={examData.ghiChu || ''} 
            onChange={e => setField('ghiChu', e.target.value)} 
            className="w-full p-3 border border-gray-300 rounded-xl text-sm min-h-[80px] focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Ghi nhận thêm..."
          />
        </div>
      </div>

      {!isAssistant && (
      <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-4">
        <button 
          disabled={loading}
          onClick={handleSave} 
          className={`px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
        >
          <span className="material-symbols-outlined">{loading ? 'sync' : 'how_to_reg'}</span>
          {loading ? 'ĐANG LƯU...' : 'KÝ XÁC NHẬN KẾT QUẢ KHÁM TMH'}
        </button>
      </div>
      )}
    </div>
  );
};

export default TabKhamTMH;