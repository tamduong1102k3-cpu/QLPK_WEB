import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  searchNhanVienApi,
  addNhanVienApi as createEmployeeApi, 
  updateNhanVienApi as updateEmployeeApi, 
  deleteNhanVienApi as deleteEmployeeApi,
  checkDeleteNhanVienApi,
  permanentlyDeleteNhanVienApi,
  activateNhanVienAccountApi
} from '../../../api/employeeApi';
import { 
  getAllChucVuApi as getChucVuApi, 
  getAllChuyenKhoaApi as getChuyenKhoaApi, 
  getAllVaiTroApi as getVaiTroApi 
} from '../../../api/danhMucApi';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';
import { useNotification } from '../../../components/NotificationContext';
import { removeVietnameseTones } from '../../../utils/searchUtils';

const isPatientRole = role => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'patient' || normalized === 'benh_nhan' || normalized === 'bệnh nhân';
};

const ROLE_CODE_BY_POSITION = {
  'bac si': 'BAC_SI',
  'bac si chuyen khoa': 'BAC_SI_CHUYEN_KHOA',
  'bac si tong quat': 'BAC_SI_TONG_QUAT',
  'tro ly bac si chuyen khoa': 'TRO_LY_BAC_SI_CHUYEN_KHOA',
  'tro ly bac si tong quat': 'TRO_LY_BAC_SI_TONG_QUAT',
  'y ta': 'Y_TA',
  'le tan': 'LE_TAN',
  'thu ngan': 'THU_NGAN',
  'duoc si': 'DUOC_SI',
  'nhan vien kho': 'NHAN_VIEN_KHO',
  'ky thuat vien xet nghiem': 'KY_THUAT_VIEN_XET_NGHIEM',
  'ky thuat vien chan doan hinh anh': 'KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH',
  'quan tri vien': 'QUAN_TRI_VIEN'
};

const DELETE_BLOCKED_MESSAGE = 'Không thể xóa nhân viên này vì còn dữ liệu liên quan.';

const normalizeCategoryLabel = label => removeVietnameseTones(String(label || ''))
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const getRoleCodeForPosition = (position, roles) => {
  const normalizedPosition = normalizeCategoryLabel(position);
  const matchingRole = roles.find(role => (
    normalizeCategoryLabel(role.tenBienThe) === normalizedPosition
  ));
  return matchingRole?.maVaiTro || ROLE_CODE_BY_POSITION[normalizedPosition] || '';
};

const createUsernameFromName = fullName => removeVietnameseTones(fullName)
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const getTodayLocalDate = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
};

const getLatestEligibleBirthDate = () => {
  const [year, month, day] = getTodayLocalDate().split('-').map(Number);
  const eligibleYear = year - 18;
  const lastDayOfMonth = new Date(eligibleYear, month, 0).getDate();
  return `${eligibleYear}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDayOfMonth)).padStart(2, '0')}`;
};

const isSpecialtyNotApplicable = (jobTitle, role) => {
  const normalizedJobTitle = removeVietnameseTones(jobTitle || '').toLowerCase();
  const normalizedRole = String(role || '').trim().toUpperCase();

  return ['duoc si', 'le tan', 'nhan vien kho', 'quan tri vien', 'thu ngan']
    .some(position => normalizedJobTitle.includes(position))
    || ['DUOC_SI', 'LE_TAN', 'NHAN_VIEN_KHO', 'QUAN_TRI_VIEN', 'THU_NGAN'].includes(normalizedRole);
};

const isSpecialtyRequired = (jobTitle, role) => {
  const normalizedJobTitle = removeVietnameseTones(jobTitle || '').toLowerCase();
  const normalizedRole = String(role || '').trim().toUpperCase();

  return normalizedJobTitle.includes('bac si')
    || normalizedRole.startsWith('BAC_SI')
    || normalizedRole.startsWith('TRO_LY_BAC_SI');
};

const QuanLyNhanVien = () => {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChuyenKhoa, setFilterChuyenKhoa] = useState('');
  const [filterVaiTro, setFilterVaiTro] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteBusyId, setDeleteBusyId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);

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
    chuyen_khoa: '', 
    bang_cap: '',
    chuc_vu: '', 
    ngay_vao_lam: '',
    username: '', 
    role: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const resetForm = () => {
    setFormData({
      ho_ten: '', gioi_tinh: '1', ngay_sinh: '', cccd: '', dia_chi: '', 
      so_dien_thoai: '', email: '', chuyen_khoa: '', bang_cap: '', 
      chuc_vu: '', ngay_vao_lam: '', username: '', role: ''
    });
    setFieldErrors({});
    setIsEditMode(false);
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (emp) => {
    setFieldErrors({});
    const role = getRoleCodeForPosition(emp.chucVu, dsVaiTro);
    setFormData({
      ho_ten: emp.hoTen || '',
      gioi_tinh: emp.gioiTinh !== null ? emp.gioiTinh.toString() : '1',
      ngay_sinh: emp.ngaySinh ? emp.ngaySinh.split('T')[0] : '',
      cccd: emp.cccd || '',
      dia_chi: emp.diaChi || '',
      so_dien_thoai: emp.soDienThoai || '',
      email: emp.email || '',
      chuyen_khoa: isSpecialtyNotApplicable(emp.chucVu, role) ? '' : emp.chuyenKhoa ? emp.chuyenKhoa.toString() : '',
      bang_cap: emp.bangCap || '',
      chuc_vu: emp.chucVu || '',
      ngay_vao_lam: emp.ngayVaoLam ? emp.ngayVaoLam.split('T')[0] : '',
    
      username: '',
      role
    });
    setEditId(emp.maNhanVien);
    setIsEditMode(true);
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    showConfirm("Bạn có chắc muốn KHÓA tài khoản nhân viên này? Nhân viên sẽ không thể đăng nhập được nữa.", async () => {
      try {
        await deleteEmployeeApi(id);
        showSuccess("Khóa tài khoản nhân viên thành công!");
        fetchEmployees();
      } catch (error) {
        showError("Lỗi khi khóa tài khoản: " + error.message);
      }
    });
  };

  const permanentlyDeleteEmployee = async (employee) => {
    setDeleteBusyId(employee.maNhanVien);
    try {
      await permanentlyDeleteNhanVienApi(employee.maNhanVien);
      setDeleteDialog(null);
      showSuccess("Xóa nhân viên và tài khoản thành công!");
      fetchEmployees();
    } catch (error) {
      setDeleteDialog(null);
      showError(error.message);
    } finally {
      setDeleteBusyId(null);
    }
  };

  const keepAndLockEmployee = async (employee) => {
    setDeleteBusyId(employee.maNhanVien);
    try {
      await deleteEmployeeApi(employee.maNhanVien);
      setDeleteDialog(null);
      showSuccess("Đã giữ lại nhân viên và khóa tài khoản.");
      fetchEmployees();
    } catch (error) {
      setDeleteDialog(null);
      showError(error.message);
    } finally {
      setDeleteBusyId(null);
    }
  };

  const handlePermanentDelete = async (employee) => {
    if (deleteBusyId !== null) return;
    setDeleteBusyId(employee.maNhanVien);
    try {
      const check = await checkDeleteNhanVienApi(employee.maNhanVien);
      if (!check.canDelete) {
        showError(check.message || DELETE_BLOCKED_MESSAGE);
        return;
      }

      if (check.hasAccount) {
        setDeleteDialog({ employee, username: check.username });
        return;
      }

      showConfirm(
        `Bạn có chắc muốn xóa nhân viên ${employee.hoTen}?`,
        () => permanentlyDeleteEmployee(employee)
      );
    } catch (error) {
      showError(error.message);
    } finally {
      setDeleteBusyId(null);
    }
  };

  const handleActivate = async (id) => {
    showConfirm("Bạn có chắc muốn MỞ KHÓA tài khoản nhân viên này? Nhân viên sẽ có thể đăng nhập trở lại.", async () => {
      try {
        await activateNhanVienAccountApi(id);
        showSuccess("Mở khóa tài khoản nhân viên thành công!");
        fetchEmployees();
      } catch (error) {
        showError("Lỗi khi mở khóa tài khoản: " + error.message);
      }
    });
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
    if (name === 'ho_ten' && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        ho_ten: value,
        username: createUsernameFromName(value)
      }));
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next.ho_ten;
        delete next.username;
        return next;
      });
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    const field = name === 'so_dien_thoai' ? 'soDienThoai' : name;
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChucVuChange = (e) => {
    const selectedValue = e.target.value;
    const role = getRoleCodeForPosition(selectedValue, dsVaiTro);
    setFormData(prev => ({
      ...prev,
      chuc_vu: selectedValue,
      role,
      chuyen_khoa: isSpecialtyNotApplicable(selectedValue, role) ? '' : prev.chuyen_khoa
    }));
  };

  const validateForm = () => {
    const email = formData.email.trim();
    const phone = formData.so_dien_thoai.trim();
    const cccd = formData.cccd.trim();
    const today = getTodayLocalDate();

    if (!formData.ho_ten.trim() || !cccd || !formData.chuc_vu || !email || !phone) {
      showError("Vui lòng nhập đầy đủ Họ và tên, CCCD, số điện thoại, Email và Chức vụ.");
      return false;
    }

    if (!formData.role) {
      showError("Không tìm thấy quyền hệ thống tương ứng với chức vụ đã chọn.");
      return false;
    }

    if (!isEditMode && !formData.username.trim()) {
      showError("Vui lòng nhập Username để tạo tài khoản.");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("Email không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ ten@domain.com.");
      return false;
    }

    if (!/^0\d{9}$/.test(phone)) {
      showError("Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.");
      return false;
    }

    if (!/^(?:\d{9}|\d{12})$/.test(cccd)) {
      showError("CCCD phải gồm đúng 9 hoặc 12 chữ số.");
      return false;
    }

    if (formData.ngay_sinh && formData.ngay_sinh > today) {
      showError("Ngày sinh không được ở tương lai.");
      return false;
    }

    if (formData.ngay_sinh) {
      const [birthYear, birthMonth, birthDay] = formData.ngay_sinh.split('-').map(Number);
      const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
      let age = todayYear - birthYear;
      if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
        age--;
      }
      if (age < 18) {
        showError("Nhân viên phải từ đủ 18 tuổi trở lên!");
        return false;
      }
    }

    if (formData.ngay_vao_lam && formData.ngay_vao_lam > today) {
      showError("Ngày vào làm không được ở tương lai.");
      return false;
    }

    if (formData.ngay_sinh && formData.ngay_vao_lam && formData.ngay_vao_lam < formData.ngay_sinh) {
      showError("Ngày vào làm không thể trước ngày sinh.");
      return false;
    }

    if (isSpecialtyRequired(formData.chuc_vu, formData.role) && !formData.chuyen_khoa) {
      showError("Vui lòng chọn chuyên khoa cho chức vụ này.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      gioiTinh: parseInt(formData.gioi_tinh),
      hoTen: formData.ho_ten,
      ngaySinh: formData.ngay_sinh,
      cccd: formData.cccd.trim(),
      diaChi: formData.dia_chi,
      soDienThoai: formData.so_dien_thoai.trim(),
      email: formData.email.trim(),
      chuyenKhoa: isSpecialtyNotApplicable(formData.chuc_vu, formData.role)
        ? null
        : formData.chuyen_khoa ? parseInt(formData.chuyen_khoa) : null,
      bangCap: formData.bang_cap,
      chucVu: formData.chuc_vu,
      role: formData.role,
      ngayVaoLam: formData.ngay_vao_lam
    };

    try {
      if (isEditMode) {
        await updateEmployeeApi(editId, payload);
        showSuccess('Cập nhật nhân viên thành công!');
      } else {
        await createEmployeeApi(payload);
        showSuccess('Thêm nhân viên và tạo tài khoản thành công! (Mật khẩu mặc định: 12345)');
      }
      
      setShowAddModal(false);
      fetchEmployees();
      resetForm();
    } catch (error) {
      if (error.fieldErrors && Object.keys(error.fieldErrors).length > 0) {
        setFieldErrors(error.fieldErrors);
      } else {
        showError('Lỗi: ' + error.message);
      }
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
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center text-gray-500">Đang tải dữ liệu...</td>
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
                  <td className="px-6 py-4">
                    {emp.hoatDong === true || emp.hoatDong === 1 ? (
                      <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">Đang hoạt động</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">Đã khóa</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleEdit(emp)} className="text-blue-500 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors mr-2">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    {emp.hoatDong === true || emp.hoatDong === 1 ? (
                      <button
                        onClick={() => handleDelete(emp.maNhanVien)}
                        title="Khóa tài khoản"
                        aria-label="Khóa tài khoản"
                        className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">lock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(emp.maNhanVien)}
                        title="Mở khóa tài khoản"
                        aria-label="Mở khóa tài khoản"
                        className="text-green-600 hover:text-green-700 p-1 rounded-md hover:bg-green-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">lock_open</span>
                      </button>
                    )}
                    <button
                      onClick={() => handlePermanentDelete(emp)}
                      disabled={deleteBusyId === emp.maNhanVien}
                      title="Xóa hồ sơ và tài khoản (chỉ khi chưa có dữ liệu liên quan)"
                      aria-label="Xóa hồ sơ và tài khoản nhân viên"
                      className="text-gray-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors ml-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {deleteBusyId === emp.maNhanVien ? 'hourglass_empty' : 'delete'}
                      </span>
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

      {deleteDialog && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-employee-title"
            className="relative w-full max-w-[32rem] rounded-xl bg-white p-6 shadow-xl"
          >
            <button
              type="button"
              onClick={() => setDeleteDialog(null)}
              disabled={deleteBusyId !== null}
              aria-label="Đóng hộp thoại"
              title="Đóng"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
            <h2 id="delete-employee-title" className="text-lg font-semibold text-gray-900">
              Xác nhận xóa nhân viên
            </h2>
            <p className="mt-3 text-sm text-gray-700">
              Nhân viên {deleteDialog.employee.hoTen} đang liên kết với tài khoản
              {' '}<span className="font-semibold">`{deleteDialog.username}`</span>.
              {' '}Bạn có muốn xóa luôn tài khoản của nhân viên này không?
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => permanentlyDeleteEmployee(deleteDialog.employee)}
                disabled={deleteBusyId !== null}
                className="min-h-11 w-full rounded-lg bg-red-600 px-3 py-2 text-center text-sm font-medium leading-5 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Có, xóa nhân viên &amp; tài khoản
              </button>
              <button
                type="button"
                onClick={() => keepAndLockEmployee(deleteDialog.employee)}
                disabled={deleteBusyId !== null}
                className="min-h-11 w-full rounded-lg bg-amber-500 px-3 py-2 text-center text-sm font-medium leading-5 text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Không, chỉ khóa tài khoản
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Employee Modal */}
      {showAddModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
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
              <form id="employeeForm" onSubmit={handleSubmit} noValidate className="space-y-6">
                
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
                      <input type="date" name="ngay_sinh" value={formData.ngay_sinh} max={getLatestEligibleBirthDate()} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số CCCD <span className="text-red-500">*</span></label>
                      <input required type="text" name="cccd" value={formData.cccd} maxLength={12} inputMode="numeric" onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary outline-none ${fieldErrors.cccd ? 'border-red-500' : 'border-gray-300'}`} />
                      {fieldErrors.cccd && <p className="mt-1 text-sm text-red-600">{fieldErrors.cccd}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                      <input required type="tel" name="so_dien_thoai" value={formData.so_dien_thoai} maxLength={10} inputMode="numeric" onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary outline-none ${fieldErrors.soDienThoai ? 'border-red-500' : 'border-gray-300'}`} />
                      {fieldErrors.soDienThoai && <p className="mt-1 text-sm text-red-600">{fieldErrors.soDienThoai}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                      <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary outline-none ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`} />
                      {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
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
                      <select required name="chuc_vu" value={formData.chuc_vu} onChange={handleChucVuChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
                        <option value="" className="bg-white text-gray-900">-- Chọn chức vụ --</option>
                        {dsChucVu.map(cv => (
                          <option key={cv.id} value={cv.tenChucVu} className="bg-white text-gray-900">{cv.tenChucVu}</option>
                        ))}
                      </select>
                    </div>
                    {!isSpecialtyNotApplicable(formData.chuc_vu, formData.role) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Chuyên khoa {isSpecialtyRequired(formData.chuc_vu, formData.role) && <span className="text-red-500">*</span>}
                        </label>
                        <select name="chuyen_khoa" value={formData.chuyen_khoa} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
                          <option value="" className="bg-white text-gray-900">-- Chọn chuyên khoa --</option>
                          {dsChuyenKhoa.map(ck => (
                            <option key={ck.maChuyenKhoa} value={ck.maChuyenKhoa} className="bg-white text-gray-900">{ck.tenChuyenKhoa}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bằng cấp</label>
                      <input type="text" placeholder="VD: Thạc sĩ, Cử nhân..." name="bang_cap" value={formData.bang_cap} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày vào làm</label>
                      <input type="date" name="ngay_vao_lam" value={formData.ngay_vao_lam} max={getTodayLocalDate()} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none" />
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
                        <input required={!isEditMode} type="text" name="username" value={formData.username} onChange={handleInputChange} className={`w-full px-3 py-2 border rounded-md focus:ring-primary focus:border-primary outline-none ${fieldErrors.username ? 'border-red-500' : 'border-gray-300'}`} />
                        {fieldErrors.username && <p className="mt-1 text-sm text-red-600">{fieldErrors.username}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quyền (Role) <span className="text-red-500">*</span></label>
                        <select required={!isEditMode} disabled={true} name="role" value={formData.role} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary outline-none bg-white text-gray-900">
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
        </div>,
        document.body
      )}

    </div>
  );
};

export default QuanLyNhanVien;
