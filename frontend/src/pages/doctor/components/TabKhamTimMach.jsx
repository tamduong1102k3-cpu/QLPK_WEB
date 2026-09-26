import React, { useState } from 'react';
import { saveAndUpdateApi as saveAndUpdatePhieuKhamApi } from '../../../api/chiSoKhamTongHopApi';
import { useNotification } from '../../../components/NotificationContext';

const TabKhamTimMach = ({ examData, setExamData, isAssistant, maPhieuKham, user }) => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // --- VALIDATE ---
  const validate = () => {
    const newErrors = {};

    // Validate numeric lab values if entered
    const labFields = [
      { field: 'cholesterol', name: 'Cholesterol', min: 0, max: 20 },
      { field: 'hdlCholesterol', name: 'HDL-Cholesterol', min: 0, max: 10 },
      { field: 'ldlCholesterol', name: 'LDL-Cholesterol', min: 0, max: 15 },
      { field: 'triglyceride', name: 'Triglyceride', min: 0, max: 30 },
      { field: 'duongHuyet', name: 'Đường huyết', min: 0, max: 50 }
    ];

    labFields.forEach(({ field, name, min, max }) => {
      const val = examData[field];
      if (val !== '' && val !== null && val !== undefined) {
        const num = parseFloat(val);
        if (isNaN(num)) {
          newErrors[field] = `${name} phải là số`;
        } else if (num < min || num > max) {
          newErrors[field] = `${name} không hợp lệ (${min}-${max})`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getErrorBorder = (field) => {
    return errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300';
  };

  const renderError = (field) => {
    if (!errors[field]) return null;
    return <p className="mt-1 text-[10px] font-bold text-red-500 flex items-center gap-1">
      <span className="material-symbols-outlined text-[12px]">error</span>
      {errors[field]}
    </p>;
  };

  // --- HÀM LƯU ---
  const handleSaveClinicalExam = async () => {
    if (!maPhieuKham) return showError("Không tìm thấy mã phiếu!");
    
    if (!validate()) {
      showError('Vui lòng kiểm tra lại thông tin trước khi lưu!');
      return;
    }

    setLoading(true);
    const u = user || {};
    
    // Đảm bảo Payload đầy đủ thông tin
    const payload = {
      ...examData,
      maPhieuKham: maPhieuKham,
      maChuyenKhoa: u.maChuyenKhoa,
      maNhanVienNhap: u.maNhanVien || u.id
    };

    // Parse floats if they exist
    if (payload.cholesterol !== '') payload.cholesterol = parseFloat(payload.cholesterol) || null;
    if (payload.hdlCholesterol !== '') payload.hdlCholesterol = parseFloat(payload.hdlCholesterol) || null;
    if (payload.ldlCholesterol !== '') payload.ldlCholesterol = parseFloat(payload.ldlCholesterol) || null;
    if (payload.triglyceride !== '') payload.triglyceride = parseFloat(payload.triglyceride) || null;
    if (payload.duongHuyet !== '') payload.duongHuyet = parseFloat(payload.duongHuyet) || null;

    try {
      await saveAndUpdatePhieuKhamApi(payload);
      showSuccess(`✅ Đã lưu kết quả khám Tim Mạch thành công!`);
    } catch (error) {
      showError("❌ Lỗi: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
        <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600 text-3xl">cardiology</span>
          Khám Chuyên Khoa Tim Mạch {maPhieuKham && <span className="text-sm font-normal text-gray-400">(#{maPhieuKham})</span>}
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-slate-50 p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase">Xét Nghiệm Sinh Hóa (Máu)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-1">Cholesterol Toàn Phần</label>
                <div className="flex items-center">
                   <input type="number" step="0.01" value={examData.cholesterol || ''} onChange={(e) => setExamData({...examData, cholesterol: e.target.value})} className="w-full p-2 border border-gray-300 rounded-l-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                   <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-lg text-xs text-gray-500">mmol/L</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-1">Triglyceride</label>
                <div className="flex items-center">
                   <input type="number" step="0.01" value={examData.triglyceride || ''} onChange={(e) => setExamData({...examData, triglyceride: e.target.value})} className="w-full p-2 border border-gray-300 rounded-l-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                   <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-lg text-xs text-gray-500">mmol/L</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-1">HDL - Cholesterol</label>
                <div className="flex items-center">
                   <input type="number" step="0.01" value={examData.hdlCholesterol || ''} onChange={(e) => setExamData({...examData, hdlCholesterol: e.target.value})} className="w-full p-2 border border-gray-300 rounded-l-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                   <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-lg text-xs text-gray-500">mmol/L</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-1">LDL - Cholesterol</label>
                <div className="flex items-center">
                   <input type="number" step="0.01" value={examData.ldlCholesterol || ''} onChange={(e) => setExamData({...examData, ldlCholesterol: e.target.value})} className="w-full p-2 border border-gray-300 rounded-l-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                   <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-lg text-xs text-gray-500">mmol/L</span>
                </div>
              </div>
              <div className="md:col-span-2 mt-2">
                <label className="block text-xs font-black text-gray-500 uppercase mb-1">Đường Huyết (Glucose)</label>
                <div className="flex items-center w-1/2 pr-2">
                   <input type="number" step="0.01" value={examData.duongHuyet || ''} onChange={(e) => setExamData({...examData, duongHuyet: e.target.value})} className="w-full p-2 border border-gray-300 rounded-l-lg text-sm outline-none focus:ring-1 focus:ring-indigo-500" placeholder="0.00" />
                   <span className="bg-gray-100 border border-l-0 border-gray-300 p-2 rounded-r-lg text-xs text-gray-500">mmol/L</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase">Cận Lâm Sàng Tim Mạch</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 flex justify-between">
                  <span>Điện tâm đồ (ECG)</span>
                </label>
                <textarea value={examData.ecgKetQua || ''} onChange={(e) => setExamData({...examData, ecgKetQua: e.target.value})} className="w-full p-3 border border-indigo-200 rounded-xl min-h-[100px] text-sm bg-indigo-50/10 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Nhịp xoang bình thường, tần số..." />
              </div>
              <div>
                <label className="block text-xs font-black text-indigo-600 uppercase mb-2 flex justify-between">
                  <span>Siêu âm tim</span>
                </label>
                <textarea value={examData.sieuAmTim || ''} onChange={(e) => setExamData({...examData, sieuAmTim: e.target.value})} className="w-full p-3 border border-indigo-200 rounded-xl min-h-[100px] text-sm bg-indigo-50/10 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Kích thước các buồng tim, chức năng tâm thu thất trái (EF), van tim..." />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {!isAssistant && (
      <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end gap-4">
        <button 
          disabled={loading}
          onClick={handleSaveClinicalExam} 
          className={`px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2 ${loading ? 'opacity-50' : ''}`}
        >
          <span className="material-symbols-outlined">{loading ? 'sync' : 'how_to_reg'}</span>
          {loading ? 'ĐANG LƯU...' : 'XÁC NHẬN KẾT QUẢ KHÁM TIM MẠCH'}
        </button>
      </div>
      )}
    </div>
  );
};

export default TabKhamTimMach;
