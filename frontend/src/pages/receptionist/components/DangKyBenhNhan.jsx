import { createApi, searchApi, updateApi } from '../../../api/benhNhanApi';
import React, { useState, useRef, useEffect } from 'react';

const DangKyBenhNhan = ({
  onCancel,
  onSuccess,
  editPatient = null
}) => {
  const [formData, setFormData] = useState({
    hoTen: '',
    ngaySinh: '',
    ngaySinhDisplay: '',
    gioiTinh: true,
    soDienThoai: '',
    cccd: '',
    email: '',
    diaChi: '',
    nhomMau: '',
    diUngThuoc: '',
    nguoiGiamHo: '',
    soDienThoaiNguoiGiamHo: '',
    ngheNghiep: '',
    tienSuBenh: '',
    ghiChu: ''
  });
  const [errors, setErrors] = useState({});
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (editPatient) {
      setFormData({
        hoTen: editPatient.hoTen || '',
        ngaySinh: editPatient.ngaySinh || '',
        ngaySinhDisplay: editPatient.ngaySinh ? (() => {
          const d = new Date(editPatient.ngaySinh);
          return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        })() : '',
        gioiTinh: editPatient.gioiTinh !== false, // Default to true if not strictly false
        soDienThoai: editPatient.soDienThoai || '',
        cccd: editPatient.cccd || '',
        email: editPatient.email || '',
        diaChi: editPatient.diaChi || '',
        nhomMau: editPatient.nhomMau || '',
        diUngThuoc: editPatient.diUngThuoc || '',
        nguoiGiamHo: editPatient.nguoiGiamHo || '',
        soDienThoaiNguoiGiamHo: editPatient.soDienThoaiNguoiGiamHo || '',
        ngheNghiep: editPatient.ngheNghiep || '',
        tienSuBenh: editPatient.tienSuBenh || '',
        ghiChu: editPatient.ghiChu || ''
      });
    }
  }, [editPatient]);

  // Format DD/MM/YYYY khi gõ
  const formatDateDisplay = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    let result = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) result += '/';
      result += digits[i];
    }
    return result;
  };

  // Parse DD/MM/YYYY -> YYYY-MM-DD
  const parseDisplayToDate = (display) => {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return '';
    return `${match[3]}-${match[2]}-${match[1]}`;
  };

  // Kiểm tra ngày hợp lệ
  const isValidDate = (display) => {
    const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;
    const d = parseInt(match[1], 10);
    const m = parseInt(match[2], 10) - 1;
    const y = parseInt(match[3], 10);
    const date = new Date(y, m, d);
    return date.getFullYear() === y && date.getMonth() === m && date.getDate() === d;
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.hoTen.trim()) newErrors.hoTen = 'Họ tên không được để trống';
    
    // Validate ngày sinh
    const ngaySinhDisplay = formData.ngaySinhDisplay || '';
    if (!ngaySinhDisplay) {
      newErrors.ngaySinh = 'Vui lòng nhập ngày sinh';
    } else if (!isValidDate(ngaySinhDisplay)) {
      newErrors.ngaySinh = 'Ngày sinh không hợp lệ';
    } else {
      // Kiểm tra không được là ngày tương lai
      const match = ngaySinhDisplay.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10) - 1;
      const y = parseInt(match[3], 10);
      const dob = new Date(y, m, d);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dob > today) {
        newErrors.ngaySinh = 'Ngày sinh không thể ở tương lai';
      }
    }
    
    // Validate SĐT: bỏ spaces trước khi test
    const phoneDigits = formData.soDienThoai.replace(/\s/g, '');
    const phoneRegex = /^[0-9]{10}$/;
    if (!formData.soDienThoai) {
      newErrors.soDienThoai = 'Số điện thoại là bắt buộc';
    } else if (!phoneRegex.test(phoneDigits)) {
      newErrors.soDienThoai = 'Số điện thoại phải có đúng 10 chữ số';
    }
    if (formData.cccd && !/^[0-9]{12}$/.test(formData.cccd)) {
      newErrors.cccd = 'CCCD phải có đúng 12 chữ số';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }
    if (!formData.tienSuBenh.trim()) {
      newErrors.tienSuBenh = 'Tiền sử bệnh không được để trống';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const formatPhone = (val) => {
    return val.replace(/\D/g, '').slice(0, 10);
  };

  const handleChange = e => {
    const {
      name,
      value,
      type,
      checked
    } = e.target;
    let newValue = type === 'checkbox' ? checked : value;
    
    // Tự động viết hoa chữ cái đầu mỗi từ cho Họ tên
    if (name === 'hoTen') {
      newValue = newValue
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase());
    }
    
    // Định dạng số điện thoại
    if (name === 'soDienThoai' || name === 'soDienThoaiNguoiGiamHo') {
      newValue = formatPhone(newValue);
    }
    
    // Giới hạn CCCD 12 số
    if (name === 'cccd') {
      newValue = newValue.replace(/\D/g, '').slice(0, 12);
    }
    
    // Xử lý input ngày sinh
    if (name === 'ngaySinhDisplay') {
      const formatted = formatDateDisplay(value);
      setFormData(prev => ({
        ...prev,
        ngaySinhDisplay: formatted,
        ngaySinh: parseDisplayToDate(formatted)
      }));
      if (errors.ngaySinh) {
        setErrors(prev => ({ ...prev, ngaySinh: null }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    // Xóa lỗi của trường đang nhập
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Xử lý khi chọn từ native datepicker
  const handleDatePickerChange = (e) => {
    const val = e.target.value; // YYYY-MM-DD
    if (!val) return;
    const [y, m, d] = val.split('-');
    const display = `${d}/${m}/${y}`;
    setFormData(prev => ({
      ...prev,
      ngaySinhDisplay: display,
      ngaySinh: val
    }));
    if (errors.ngaySinh) {
      setErrors(prev => ({ ...prev, ngaySinh: null }));
    }
  };

  // Lấy max date hôm nay cho native datepicker
  const todayStr = new Date().toISOString().split('T')[0];
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;
    try {
      let data;
      if (editPatient) {
        data = await updateApi(editPatient.maBenhNhan, formData);
      } else {
        data = await createApi(formData);
      }
      onSuccess(data);
    } catch (error) {
      alert(`Lỗi ${editPatient ? 'cập nhật' : 'đăng ký'}: ${error.message}`);
    }
  };
  return <div className="bg-white rounded-3xl">
      <div className="p-8 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800">{editPatient ? 'Cập nhật Thông tin Bệnh nhân' : 'Đăng ký Hồ sơ mới'}</h2>
          <p className="text-sm text-gray-400 font-medium">Vui lòng nhập chính xác thông tin để tránh sai sót</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-100 rounded-xl transition-colors hover:text-gray-500">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 bg-primary rounded-full"></div>
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.15em]">Thông tin cá nhân</h3>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Họ và Tên *</label>
              <input name="hoTen" value={formData.hoTen} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border-2 ${errors.hoTen ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300`} placeholder="VD: NGUYEN VAN A" />
              {errors.hoTen && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.hoTen}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Ngày Sinh *</label>
                <div className="relative">
                  <input
                    name="ngaySinhDisplay"
                    type="text"
                    value={formData.ngaySinhDisplay}
                    onChange={handleChange}
                    placeholder="DD/MM/YYYY"
                    maxLength={10}
                    className={`w-full px-5 py-3.5 bg-white border-2 ${errors.ngaySinh ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold text-gray-700 pr-12`}
                  />
                  <input
                    ref={dateInputRef}
                    type="date"
                    max={todayStr}
                    onChange={handleDatePickerChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <span
                    onClick={() => dateInputRef.current?.showPicker?.()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary cursor-pointer"
                  >
                    <span className="material-symbols-outlined">calendar_month</span>
                  </span>
                </div>
                {errors.ngaySinh && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.ngaySinh}</p>}
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Giới Tính</label>
                <select name="gioiTinh" value={formData.gioiTinh} onChange={e => setFormData({
                ...formData,
                gioiTinh: e.target.value === 'true'
              })} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:border-primary outline-none transition-all font-bold text-gray-700">
                  <option value="true">Nam</option>
                  <option value="false">Nữ</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">CCCD / CMND</label>
              <input name="cccd" value={formData.cccd} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border-2 ${errors.cccd ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300`} placeholder="001200012345" />
              {errors.cccd && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.cccd}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Số Điện Thoại *</label>
              <input name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border-2 ${errors.soDienThoai ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold text-primary placeholder:text-gray-300`} placeholder="0987 654 321" />
              {errors.soDienThoai && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.soDienThoai}</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1 h-5 bg-primary rounded-full"></div>
              <h3 className="text-sm font-black text-primary uppercase tracking-[0.15em]">Thông tin bổ sung</h3>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} className={`w-full px-5 py-3.5 bg-white border-2 ${errors.email ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300`} placeholder="benhnhan@example.com" />
              {errors.email && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Địa Chỉ</label>
              <input name="diaChi" value={formData.diaChi} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300" placeholder="TP. Hồ Chí Minh..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nhóm Máu</label>
                  <input name="nhomMau" value={formData.nhomMau} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300" placeholder="O+" />
               </div>
               <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Nghề nghiệp</label>
                  <input name="ngheNghiep" value={formData.ngheNghiep} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300" placeholder="Tự do..." />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Người giám hộ</label>
                <input name="nguoiGiamHo" value={formData.nguoiGiamHo} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300" placeholder="Tên người giám hộ" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">SĐT người giám hộ</label>
                <input name="soDienThoaiNguoiGiamHo" value={formData.soDienThoaiNguoiGiamHo} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300" placeholder="09xxxxxxxx" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tiền sử bệnh *</label>
              <textarea
                name="tienSuBenh"
                value={formData.tienSuBenh}
                onChange={handleChange}
                rows="3"
                className={`w-full px-5 py-3.5 bg-white border-2 ${errors.tienSuBenh ? 'border-red-400' : 'border-gray-200'} rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold placeholder:text-gray-300 resize-none`}
                placeholder="Tiểu đường, cao huyết áp, chưa phát hiện bệnh nền..."
              />
              {errors.tienSuBenh && <p className="text-red-500 text-[10px] mt-1 font-bold italic">{errors.tienSuBenh}</p>}
            </div>
            <div className={formData.diUngThuoc ? 'p-3 -mx-3 bg-red-50 rounded-2xl border border-red-200' : ''}>
              <label className={`block text-[10px] font-black ${formData.diUngThuoc ? 'text-red-600' : 'text-gray-400'} uppercase tracking-widest mb-1.5`}>
                {formData.diUngThuoc ? '⚠ Dị ứng thuốc' : 'Dị ứng thuốc'}
              </label>
              <input name="diUngThuoc" value={formData.diUngThuoc} onChange={handleChange} className="w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-2xl focus:bg-white focus:border-primary outline-none transition-all font-bold text-red-600 placeholder:text-gray-300" placeholder={formData.diUngThuoc ? '' : 'Không...'} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-100">
          <button type="button" onClick={onCancel} className="px-8 py-3.5 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:border-gray-300 hover:text-gray-700 transition-all">
            Quay lại
          </button>
          <button type="submit" className="px-10 py-3.5 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
            {editPatient ? 'CẬP NHẬT THÔNG TIN' : 'TIẾP TỤC ĐẾN CHECK-IN →'}
          </button>
        </div>
      </form>
    </div>;
};
export default DangKyBenhNhan;
