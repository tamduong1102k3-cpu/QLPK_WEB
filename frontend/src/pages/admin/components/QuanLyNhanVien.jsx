import React, { useState, useEffect } from 'react';
import { 
  searchNhanVienApi,
  addNhanVienApi as createEmployeeApi, 
  updateNhanVienApi as updateEmployeeApi, 
  deleteNhanVienApi as deleteEmployeeApi 
} from '../../../api/employeeApi';
import { 
  getAllChucVuApi as getChucVuApi, 
  getAllChuyenKhoaApi as getChuyenKhoaApi, 
  getAllVaiTroApi as getVaiTroApi 
} from '../../../api/danhMucApi';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const isPatientRole = role => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'patient' || normalized === 'benh_nhan' || normalized === 'bệnh nhân';
};

const QuanLyNhanVien = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChuyenKhoa, setFilterChuyenKhoa] = useState('');
  const [filterVaiTro, setFilterVaiTro] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // --- DỮ LIỆU DANH MỤC TỪ DATABASE ---
  const [dsChuyenKhoa, setDsChuyenKhoa] = useState([]);
  const [dsChucVu, setDsChucVu] = useState([]);
  const [dsVaiTro, setDsVaiTro] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEmployees({ keyword: searchTerm, chuyenKhoa: filterChuyenKhoa, vaiTro: filterVaiTro });
  }, [searchTerm, filterChuyenKhoa, filterVaiTro]);

  // Khóa cuộn trang nền khi mở Modal
  useEffect(() => {
    if (showAddModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showAddModal]);

  const fetchCategories = async () => {
    try {
      const [chucVuData, chuyenKhoaData, vaiTroData] = await Promise.all([
        getChucVuApi(),
        getChuyenKhoaApi(),
        getVaiTroApi()
      ]);
      setDsChucVu(chucVuData || []);
      setDsChuyenKhoa(chuyenKhoaData || []);
      
      const fallbackVaiTro = [
        { maVaiTro: 'QUAN_TRI_VIEN', tenBienThe: 'Quản Trị Viên' },
        { maVaiTro: 'BAC_SI_CHUYEN_KHOA', tenBienThe: 'Bác sĩ chuyên khoa' },
        { maVaiTro: 'BAC_SI', tenBienThe: 'Bác sĩ' },
        { maVaiTro: 'TRO_LY_BAC_SI_CHUYEN_KHOA', tenBienThe: 'Trợ lý bác sĩ chuyên khoa' },
        { maVaiTro: 'TRO_LY_BAC_SI_TONG_QUAT', tenBienThe: 'Trợ lý bác sĩ tổng quát' },
        { maVaiTro: 'Y_TA', tenBienThe: 'Y tá' },
        { maVaiTro: 'LE_TAN', tenBienThe: 'Lễ tân' },
        { maVaiTro: 'THU_NGAN', tenBienThe: 'Thu ngân' },
        { maVaiTro: 'DUOC_SI', tenBienThe: 'Dược sĩ' },
        { maVaiTro: 'NHAN_VIEN_KHO', tenBienThe: 'Nhân viên kho' },
        { maVaiTro: 'KY_THUAT_VIEN_XET_NGHIEM', tenBienThe: 'Kỹ thuật viên xét nghiệm' },
        { maVaiTro: 'KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH', tenBienThe: 'Kỹ thuật viên chẩn đoán hình ảnh' }
      ];

      if (vaiTroData && vaiTroData.length > 0) {
        const processed = vaiTroData
          .filter(vt => !isPatientRole(vt.maVaiTro) && !isPatientRole(vt.tenBienThe))
          .map(vt => ({
            ...vt,
            tenBienThe: vt.tenBienThe || (fallbackVaiTro.find(f => f.maVaiTro === vt.maVaiTro)?.tenBienThe || vt.maVaiTro)
          }));
        setDsVaiTro(processed);
      } else {
        setDsVaiTro(fallbackVaiTro);
      }
    } catch (error) {
      console.error("Lỗi lấy danh mục:", error);
      setDsVaiTro([
        { maVaiTro: 'QUAN_TRI_VIEN', tenBienThe: 'Quản trị viên' },
        { maVaiTro: 'BAC_SI_CHUYEN_KHOA', tenBienThe: 'Bác sĩ chuyên khoa' },
        { maVaiTro: 'BAC_SI', tenBienThe: 'Bác sĩ' },
        { maVaiTro: 'TRO_LY_BAC_SI_CHUYEN_KHOA', tenBienThe: 'Trợ lý bác sĩ chuyên khoa' },
        { maVaiTro: 'TRO_LY_BAC_SI_TONG_QUAT', tenBienThe: 'Trợ lý bác sĩ tổng quát' },
        { maVaiTro: 'Y_TA', tenBienThe: 'Y tá' },
        { maVaiTro: 'LE_TAN', tenBienThe: 'Lễ tân' },
        { maVaiTro: 'THU_NGAN', tenBienThe: 'Thu ngân' },
        { maVaiTro: 'DUOC_SI', tenBienThe: 'Dược sĩ' },
        { maVaiTro: 'NHAN_VIEN_KHO', tenBienThe: 'Nhân viên kho' },
        { maVaiTro: 'KY_THUAT_VIEN_XET_NGHIEM', tenBienThe: 'Kỹ thuật viên xét nghiệm' },
        { maVaiTro: 'KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH', tenBienThe: 'Kỹ thuật viên chẩn đoán hình ảnh' }
      ]);
    }
  };

  const fetchEmployees = async (filters = {
    keyword: searchTerm,
    chuyenKhoa: filterChuyenKhoa,
    vaiTro: filterVaiTro
  }) => {
    setIsLoading(true);
    try {
      const data = await searchNhanVienApi(filters);
      setEmployees(data || []);
    } catch (error) {
      console.error("Lỗi khi fetch danh sách nhân viên:", error);
    } finally {
      setIsLoading(false);
    }
  };


  // Form state
  const [formData, setFormData] = useState({
    ho_ten: '',
    gioi_tinh: '1', // 1: Nam, 0: Nữ
    ngay_sinh: '',
    cccd: '',
    dia_chi: '',
    so_dien_thoai: '',
    email: '',
    chuyen_khoa: '', // Lưu maChuyenKhoa (ID) dạng string để match với select option
    bang_cap: '',
    chuc_vu: '', // Sẽ lưu ID hoặc Tên tùy backend cần
    ngay_vao_lam: '',
    username: '', 
    role: 'BAC_SI_TONG_QUAT' // Default role
  });

  const resetForm = () => {
    setFormData({
      ho_ten: '', gioi_tinh: '1', ngay_sinh: '', cccd: '', dia_chi: '', 
      so_dien_thoai: '', email: '', chuyen_khoa: '', bang_cap: '', 
      chuc_vu: '', ngay_vao_lam: '', username: '', role: 'BAC_SI_TONG_QUAT'
    });
    setIsEditMode(false);
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (emp) => {
    setFormData({
      ho_ten: emp.hoTen || '',
      gioi_tinh: emp.gioiTinh !== null ? emp.gioiTinh.toString() : '1',
      ngay_sinh: emp.ngaySinh ? emp.ngaySinh.split('T')[0] : '', // format YYYY-MM-DD
      cccd: emp.cccd || '',
      dia_chi: emp.diaChi || '',
      so_dien_thoai: emp.soDienThoai || '',
      email: emp.email || '',
      chuyen_khoa: emp.chuyenKhoa ? emp.chuyenKhoa.toString() : '',
      bang_cap: emp.bangCap || '',
      chuc_vu: emp.chucVu || '',
      ngay_vao_lam: emp.ngayVaoLam ? emp.ngayVaoLam.split('T')[0] : '',
      // Username and role won't be editable in this basic edit, but keep them in state
      username: '',
      role: ''
    });
    setEditId(emp.maNhanVien);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa nhân viên này? Hành động này sẽ xóa luôn tài khoản hệ thống của họ!")) {
      try {
        await deleteEmployeeApi(id);
        alert("Xóa nhân viên thành công!");
        fetchEmployees();
      } catch (error) {
        alert("Lỗi khi xóa: " + error.message);
      }
    }
  };

  const filteredEmployees = employees;

  const {
    paginatedData: pagedEmployees,
    totalItems: pagedTotalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
  } = usePagination({
    data: filteredEmployees,
    pageSize: 8,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Kiểm tra thủ công các trường bắt buộc
    if (!formData.ho_ten.trim() || !formData.cccd.trim() || !formData.chuc_vu || !formData.email.trim()) {
      alert("Vui lòng nhập đầy đủ các thông tin bắt buộc (có đánh dấu sao *) !");
      return;
    }
    
    if (!isEditMode && (!formData.username.trim() || !formData.role || !formData.email.trim())) {
      alert("Vui lòng nhập Email, Username và Quyền để tạo tài khoản!");
      return;
    }

    // Format dữ liệu gửi lên (giới tính kiểu int: 1=Nam, 0=Nữ)
    const payload = {
      ...formData,
      gioiTinh: parseInt(formData.gioi_tinh),
      hoTen: formData.ho_ten,
      ngaySinh: formData.ngay_sinh,
      diaChi: formData.dia_chi,
      soDienThoai: formData.so_dien_thoai,
      chuyenKhoa: formData.chuyen_khoa ? parseInt(formData.chuyen_khoa) : null,
      bangCap: formData.bang_cap,
      chucVu: formData.chuc_vu,
      ngayVaoLam: formData.ngay_vao_lam
    };

    try {
      if (isEditMode) {
        await updateEmployeeApi(editId, payload);
        alert('Cập nhật nhân viên thành công!');
      } else {
        await createEmployeeApi(payload);
        alert('Thêm nhân viên và tạo tài khoản thành công! (Mật khẩu mặc định: 12345)');
      }
      
      setShowAddModal(false);
      fetchEmployees();
      resetForm();
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
          <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Tìm theo tên, email, SĐT, CCCD..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
          />
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400">search</span>
          </div>
          <select
            value={filterChuyenKhoa}
            onChange={(e) => setFilterChuyenKhoa(e.target.value)}
            className="w-full sm:w-52 px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
          >
            <option value="">Tất cả chuyên khoa</option>
            {dsChuyenKhoa.map((ck) => (
              <option key={ck.maChuyenKhoa} value={ck.maChuyenKhoa}>
                {ck.tenChuyenKhoa}
              </option>
            ))}
          </select>
          <select
            value={filterVaiTro}
            onChange={(e) => setFilterVaiTro(e.target.value)}
            className="w-full sm:w-60 px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
          >
            <option value="">Tất cả vai trò</option>
            {dsVaiTro.map((vt) => (
              <option key={vt.maVaiTro} value={vt.maVaiTro}>
                {vt.tenBienThe}
              </option>
            ))}
          </select>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors whitespace-nowrap"
        >
          <span className="material-symbols-outlined">person_add</span>
          Thêm Nhân Viên Mới
        </button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
                <th className="px-6 py-4 font-medium">Mã NV</th>
                <th className="px-6 py-4 font-medium">Họ và tên</th>
                <th className="px-6 py-4 font-medium">Chức vụ / Chuyên khoa</th>
                <th className="px-6 py-4 font-medium">Liên hệ</th>
                <th className="px-6 py-4 font-medium">Ngày vào làm</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">Đang tải dữ liệu...</td>
                </tr>
              ) : pagedEmployees.map((emp) => (
                <tr key={emp.maNhanVien} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700">NV{emp.maNhanVien ? emp.maNhanVien.toString().padStart(3, '0') : '???'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {emp.hoTen ? emp.hoTen.charAt(0) : '?'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{emp.hoTen}</p>
                        <p className="text-xs text-gray-500">{emp.gioiTinh === 1 ? 'Nam' : 'Nữ'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800 font-medium">{emp.chucVu}</p>
                    <p className="text-xs text-gray-500">{dsChuyenKhoa.find(ck => ck.maChuyenKhoa === emp.chuyenKhoa)?.tenChuyenKhoa || 'Không'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-800">{emp.soDienThoai}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {emp.ngayVaoLam ? new Date(emp.ngayVaoLam).toLocaleDateString('vi-VN') : ''}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(emp)} className="text-blue-500 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors mr-2">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    <button onClick={() => handleDelete(emp.maNhanVien)} className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors">
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagedEmployees.length === 0 && !isLoading && (
          <div className="p-10 text-center text-gray-500">
            Không tìm thấy nhân viên nào phù hợp với "{searchTerm}".
          </div>
        )}
        {!isLoading && pagedTotalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagedTotalItems}
            label="nhân viên"
            visiblePages={visiblePages}
            onPageChange={setCurrentPage}
            jumpPage={jumpPage}
            onJumpPage={handleJumpPage}
            onJumpBlur={handleJumpPageBlur}
          />
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-fade-in max-h-[90vh] overflow-y-auto relative border border-gray-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-2xl sticky top-0 z-20">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{isEditMode ? 'edit_square' : 'person_add'}</span>
                {isEditMode ? 'Cập Nhật Nhân Viên' : 'Thêm Nhân Viên Mới'}
              </h2>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body - Form */}
            <div className="p-6">
              <form id="employeeForm" onSubmit={handleSubmit} className="space-y-6">
                
                {/* Section 1: Thông tin cá nhân */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 border-b pb-2 mb-4 text-primary">1. Thông tin cá nhân</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                      <input required type="text" name="ho_ten" value={formData.ho_ten} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                      <select name="gioi_tinh" value={formData.gioi_tinh} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
                        <option value="1" className="bg-white text-gray-900">Nam</option>
                        <option value="0" className="bg-white text-gray-900">Nữ</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                      <input type="date" name="ngay_sinh" value={formData.ngay_sinh} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD <span className="text-red-500">*</span></label>
                      <input required type="text" name="cccd" value={formData.cccd} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input type="tel" name="so_dien_thoai" value={formData.so_dien_thoai} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input type="text" name="dia_chi" value={formData.dia_chi} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                  </div>
                </div>

                {/* Section 2: Thông tin công việc */}
                <div>
                  <h3 className="text-base font-semibold text-gray-800 border-b pb-2 mb-4 text-primary">2. Thông tin công việc</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ <span className="text-red-500">*</span></label>
                      <select required name="chuc_vu" value={formData.chuc_vu} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
                        <option value="" className="bg-white text-gray-900">-- Chọn chức vụ --</option>
                        {dsChucVu.map(cv => (
                          <option key={cv.id} value={cv.tenChucVu} className="bg-white text-gray-900">{cv.tenChucVu}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Chuyên khoa</label>
                      <select name="chuyen_khoa" value={formData.chuyen_khoa} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
                        <option value="" className="bg-white text-gray-900">-- Chọn chuyên khoa --</option>
                        {dsChuyenKhoa.map(ck => (
                          <option key={ck.maChuyenKhoa} value={ck.maChuyenKhoa} className="bg-white text-gray-900">{ck.tenChuyenKhoa}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bằng cấp</label>
                      <input type="text" placeholder="VD: Thạc sĩ, Cử nhân..." name="bang_cap" value={formData.bang_cap} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày vào làm</label>
                      <input type="date" name="ngay_vao_lam" value={formData.ngay_vao_lam} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                  </div>
                </div>

                {/* Section 3: Thông tin tài khoản đăng nhập (Chỉ hiển thị khi thêm mới) */}
                {!isEditMode && (
                  <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-600">manage_accounts</span>
                      3. Tạo tài khoản hệ thống
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (Username) <span className="text-red-500">*</span></label>
                        <input required={!isEditMode} type="text" name="username" value={formData.username} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quyền (Role) <span className="text-red-500">*</span></label>
                        <select required={!isEditMode} name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
                          <option value="" className="bg-white text-gray-900">-- Chọn quyền --</option>
                          {dsVaiTro.map(vt => (
                            <option key={vt.maVaiTro} value={vt.maVaiTro} className="bg-white text-gray-900">{vt.tenBienThe}</option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 italic">* Mật khẩu mặc định sẽ là <strong>12345</strong> và yêu cầu đổi ở lần đăng nhập đầu tiên.</p>
                      </div>
                    </div>
                  </div>
                )}

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                form="employeeForm"
                className="px-6 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">{isEditMode ? 'save' : 'add_circle'}</span>
                {isEditMode ? 'Cập Nhật' : 'Lưu & Cấp Tài Khoản'}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default QuanLyNhanVien;

