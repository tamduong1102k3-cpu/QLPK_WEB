import { getAllNhanVienApi as _getNhanVienAll } from '../../../api/employeeApi';
import { API_BASE_URL } from '../../../api/config';
import { getAllApi as _getDichVuAll } from '../../../api/dichVuApi';
import { getWorkingTodayApi as _getWorkingToday, getPhongTheoBacSiApi as _getPhongTheoBacSi } from '../../../api/shiftApi';
import { getAllApi as getBenhNhanAll, searchApi, updateApi as updateBenhNhanApi } from '../../../api/benhNhanApi';
import { createApi as createDangKyApi, getTodayApi as _getTodayRegistrations } from '../../../api/dangKyKhamBenhApi';
import { updateTrangThaiApi } from '../../../api/lichKhamApi';
import { getAllChuyenKhoaApi as _getChuyenKhoaAll, getAllPhongApi as _getPhongAll } from '../../../api/danhMucApi';
import { useNotification } from '../../../components/NotificationContext';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import InPhieuTiepDon from './InPhieuTiepDon';
import DangKyBenhNhan from './DangKyBenhNhan';
import { getMaNhanVienFromAccessToken } from '../../../api/tokenStore';

const removeVietnameseTones = str => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

// Kiểm tra nhân viên có phải là Bác sĩ (chức vụ chứa "bác sĩ" nhưng KHÔNG phải "trợ lý bác sĩ")
const isDoctor = doc => {
  const roleText = removeVietnameseTones(String(
    doc?.tenChucVu ??
    doc?.ten_chuc_vu ??
    doc?.chucVu ??
    doc?.chuc_vu ??
    doc?.vaiTro ??
    doc?.vai_tro ??
    doc?.tenVaiTro ??
    doc?.ten_vai_tro ??
    ''
  ).toLowerCase().trim());
  if (!roleText) return false;
  if (roleText.includes('tro ly bac si') || roleText.includes('tro ly')) return false;
  return roleText.includes('bac si');
};

// Kiểm tra bác sĩ có ca NGHI_PHEP hôm nay không
const isDoctorOnLeaveToday = (maNhanVien, shifts) => {
  return (Array.isArray(shifts) ? shifts : []).some(shift =>
    shift.maNhanVien === maNhanVien && shift.hanhDong === 'NGHI_PHEP'
  );
};

const normalizeRoomName = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const getAssignedRoomOptions = ({ shiftsToday, selectedDepartment, phongList }) => {
  const catalog = Array.isArray(phongList) ? phongList : [];
  // phong giờ là Integer (mã phòng) — so sánh theo maPhong
  const assignedRoomIds = new Set(
    (Array.isArray(shiftsToday) ? shiftsToday : [])
      .map(shift => shift?.phong ?? shift?.maPhong)
      .filter(v => v !== null && v !== undefined && v !== '')
      .map(v => Number(v))
  );

  const filtered = catalog.filter(room => {
    const sameDepartment = !selectedDepartment || Number(room.maChuyenKhoa) === Number(selectedDepartment);
    if (!sameDepartment) return false;
    if (assignedRoomIds.size === 0) return true;
    const roomId = Number(room?.maPhong ?? room?.ma_phong);
    return assignedRoomIds.has(roomId);
  });

  if (filtered.length > 0) return filtered;
  return catalog.filter(room => !selectedDepartment || Number(room.maChuyenKhoa) === Number(selectedDepartment));
};

const QuyTrinhTiepDon = ({
  onCancel,
  onSuccess,
  waitingCount,
  presetDepartment,
  presetDoctor,
  presetPatient,
  appointmentId,
  /** true = Bệnh nhân đặt lịch qua App & chưa được xác minh danh tính (da_xac_minh_danh_tinh = 0) */
  needsIdentityVerification
}) => {
  const [step, setStep] = useState(1);
  const [searchKw, setSearchKw] = useState('');
  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientToEdit, setPatientToEdit] = useState(null); // Add this
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [services, setServices] = useState([]);
  const [phongList, setPhongList] = useState([]);
  const [todayRegistrations, setTodayRegistrations] = useState([]);
  const [shiftsToday, setShiftsToday] = useState([]);

  const { showSuccess, showError, showWarning } = useNotification();

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [roomLocked, setRoomLocked] = useState(false);
  const [roomLockError, setRoomLockError] = useState('');

  // Xác minh danh tính: lễ tân phải tick đối chiếu CCCD trước khi tiếp đón
  const [cccdVerified, setCccdVerified] = useState(false);
  const [editPatientInfo, setEditPatientInfo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (selectedPatient) {
      const fullInfo = allPatients.find(p => p.maBenhNhan === selectedPatient.maBenhNhan) || selectedPatient;
      setEditPatientInfo({ ...fullInfo });
    }
  }, [selectedPatient, allPatients]);

  const handleVerify = async () => {
    if (!editPatientInfo.hoTen || !editPatientInfo.cccd || !editPatientInfo.soDienThoai) {
      showWarning("Vui lòng điền đủ Họ tên, CCCD và Số điện thoại!");
      return;
    }
    setIsVerifying(true);
    try {
      await updateBenhNhanApi(editPatientInfo.maBenhNhan, editPatientInfo);
      setCccdVerified(true);
      showSuccess("Đã cập nhật thông tin và xác minh danh tính thành công!");
      
      setAllPatients(prev => prev.map(p => p.maBenhNhan === editPatientInfo.maBenhNhan ? { ...p, ...editPatientInfo } : p));
      setPatients(prev => prev.map(p => p.maBenhNhan === editPatientInfo.maBenhNhan ? { ...p, ...editPatientInfo } : p));
      setSelectedPatient({ ...editPatientInfo });
    } catch (e) {
      showError("Lỗi cập nhật thông tin: " + e.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const [checkInData, setCheckInData] = useState({
    maChuyenKhoa: presetDepartment ? presetDepartment.toString() : '',
    maPhong: '',
    maNhanVien: presetDoctor ? presetDoctor.toString() : '',
    maDichVu: '',
    version: undefined,
    tenDichVuDisplay: '',
    ghiChu: ''
  });

  const API_BASE = `${API_BASE_URL}`;

  const loadPatients = useCallback(async () => {
    setSearching(true);
    try {
      const data = await getBenhNhanAll();
      setPatients(data || []);
      setAllPatients(data || []);
    } catch (e) {
      console.error("Lỗi khi tải danh sách bệnh nhân:", e);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    // Load danh mục
    _getChuyenKhoaAll().then(setDepartments).catch(() => setDepartments([]));
    _getNhanVienAll().then(setDoctors).catch(() => setDoctors([]));
    _getDichVuAll().then(setServices).catch(() => setServices([]));
    _getPhongAll().then(setPhongList).catch(() => setPhongList([]));
    _getTodayRegistrations().then(data => setTodayRegistrations(Array.isArray(data) ? data : [])).catch(() => setTodayRegistrations([]));

    // Load lịch trực hôm nay
    _getWorkingToday()
      .then(data => setShiftsToday(Array.isArray(data) ? data : []))
      .catch(err => {
        console.error("Lỗi fetch lịch trực:", err);
        setShiftsToday([]);
      });

    loadPatients();

    // Nếu có presetPatient thì tự động set và chuyển sang bước 3
    if (presetPatient) {
      setSelectedPatient(presetPatient);
      setCccdVerified(false);
      setStep(3);
    }
  }, [loadPatients]);

  const availableRoomOptions = getAssignedRoomOptions({
    shiftsToday,
    selectedDepartment: checkInData.maChuyenKhoa,
    phongList,
  });

  const selectedRoom = availableRoomOptions.find(room => Number(room.maPhong) === Number(checkInData.maPhong)) || null;

  const roomUsedCount = (todayRegistrations || []).filter(item => {
    if (!checkInData.maPhong) return false;
    const itemRoom = item?.maPhong ?? item?.ma_phong;
    return Number(itemRoom) === Number(checkInData.maPhong);
  }).length;

  const roomCapacity = Number(selectedRoom?.soLuongToiDa ?? 0);
  const roomRemaining = Math.max(0, roomCapacity - roomUsedCount);

  const availableServices = services.filter(s =>
    !checkInData.maChuyenKhoa || s.maChuyenKhoa === parseInt(checkInData.maChuyenKhoa)
  );

  const availableDoctors = doctors.filter(doc => {
    if (!isDoctor(doc)) return false;
    if (isDoctorOnLeaveToday(doc.maNhanVien, shiftsToday)) return false;
    const shifts = Array.isArray(shiftsToday) ? shiftsToday : [];
    const isWorkingToday = shifts.some(shift => shift.maNhanVien === doc.maNhanVien);
    if (!isWorkingToday) return false;
    if (!checkInData.maChuyenKhoa) return true;
    return Number(doc.chuyenKhoa) === Number(checkInData.maChuyenKhoa);
  });

  // Hàm xử lý đổi bác sĩ: lookup phòng theo ca hiện tại + ngày hôm nay
  const handleDoctorChange = async (maNhanVien) => {
    if (!maNhanVien) {
      // Clear bác sĩ → unlock phòng, reset phòng
      setRoomLocked(false);
      setRoomLockError('');
      setCheckInData(prev => ({ ...prev, maNhanVien: '', maPhong: '' }));
      return;
    }

    setCheckInData(prev => ({ ...prev, maNhanVien }));
    setRoomLocked(true);
    setRoomLockError('');

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const result = await _getPhongTheoBacSi(maNhanVien, todayStr);
      setCheckInData(prev => ({ ...prev, maPhong: String(result.maPhong) }));
      setRoomLocked(true);
      setRoomLockError('');
    } catch (e) {
      setCheckInData(prev => ({ ...prev, maPhong: '' }));
      setRoomLocked(true);
      setRoomLockError(e.message || 'Không thể lấy phòng theo bác sĩ');
      showError(e.message || 'Không thể lấy phòng theo bác sĩ');
    }
  };

  useEffect(() => {
    if (roomLocked) return;
    if (!checkInData.maChuyenKhoa) {
      setCheckInData(prev => ({ ...prev, maPhong: '' }));
      return;
    }

    const matchingRooms = getAssignedRoomOptions({
      shiftsToday,
      selectedDepartment: checkInData.maChuyenKhoa,
      phongList,
    });

    if (!matchingRooms.length) {
      setCheckInData(prev => ({ ...prev, maPhong: '' }));
      return;
    }

    setCheckInData(prev => {
      if (!prev.maPhong || !matchingRooms.some(room => Number(room.maPhong) === Number(prev.maPhong))) {
        return { ...prev, maPhong: String(matchingRooms[0].maPhong) };
      }
      return prev;
    });
  }, [checkInData.maChuyenKhoa, shiftsToday, phongList, roomLocked]);

  // Effect cho dịch vụ: tự động chọn dịch vụ đầu tiên của chuyên khoa khi chuyên khoa thay đổi hoặc services load xong
  useEffect(() => {
    if (checkInData.maChuyenKhoa) {
      const filteredServices = services.filter(s =>
        s.maChuyenKhoa === parseInt(checkInData.maChuyenKhoa)
      );
      if (filteredServices.length > 0) {
        const firstService = filteredServices[0];
        setCheckInData(prev => ({
          ...prev,
          maDichVu: firstService.maDichVu.toString(),
          version: firstService.version ?? undefined,
          tenDichVuDisplay: `#${firstService.maDichVu} ${firstService.tenDichVu} - ${new Intl.NumberFormat('vi-VN').format(firstService.donGia)}đ`
        }));
      } else {
        setCheckInData(prev => ({ ...prev, maDichVu: '', version: undefined, tenDichVuDisplay: '' }));
      }
    }
  }, [checkInData.maChuyenKhoa, services]);

  const handleSearch = async e => {
    if (e) e.preventDefault();
    const normalizedQuery = removeVietnameseTones(searchKw.toLowerCase().trim());
    if (!normalizedQuery) {
      setPatients(allPatients);
      setCurrentPage(1);
      return;
    }
    setSearching(true);
    try {
      const data = await searchApi({ keyword: searchKw });
      setPatients(data || []);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleInputChange = val => {
    setSearchKw(val);
    setCurrentPage(1);
    if (!val.trim()) {
      setPatients(allPatients);
    } else {
      const normalizedQuery = removeVietnameseTones(val.toLowerCase());
      const filtered = allPatients.filter(p => {
        const hoTen = p.hoTen ? removeVietnameseTones(p.hoTen.toLowerCase()) : '';
        const soDienThoai = p.soDienThoai || '';
        const cccd = p.cccd || '';
        const maBenhNhan = p.maBenhNhan ? p.maBenhNhan.toString() : '';
        return hoTen.includes(normalizedQuery) || soDienThoai.includes(normalizedQuery) || cccd.includes(normalizedQuery) || maBenhNhan.includes(normalizedQuery);
      });
      setPatients(filtered);
    }
  };

  const startCheckIn = patient => {
    setSelectedPatient(patient);
    setCccdVerified(false);
    setStep(3);
  };

  const handleCompleteCheckIn = async e => {
    e.preventDefault();

    const maLeTan = getMaNhanVienFromAccessToken();

    // Chặn submit khi lookup phòng theo bác sĩ thất bại
    if (roomLocked && roomLockError) {
      showError(roomLockError);
      return;
    }

    // Bắt buộc chọn chuyên khoa
    if (!checkInData.maChuyenKhoa) {
      showWarning("Vui lòng chọn Chuyên khoa khám!");
      return;
    }

    if (!checkInData.maPhong) {
      showWarning("Vui lòng chọn Phòng khám trước khi tiếp đón!");
      return;
    }

    if (roomCapacity > 0 && roomRemaining <= 0) {
      showWarning(`Phòng ${selectedRoom?.tenPhong || 'đã chọn'} đã đầy trong ngày hôm nay. Vui lòng chọn phòng khác hoặc tăng hạn mức phòng.`);
      return;
    }

    // Bắt buộc xác minh danh tính nếu bệnh nhân đặt lịch qua App & chưa được xác minh
    if (needsIdentityVerification && !cccdVerified) {
      showWarning("Bệnh nhân đặt lịch qua App lần đầu - Vui lòng đối chiếu CCCD và xác nhận danh tính trước khi tiếp đón!");
      return;
    }

    // Kiểm tra bác sĩ chỉ định có nghỉ phép hôm nay không
    if (checkInData.maNhanVien) {
      const selectedDoctor = doctors.find(d => d.maNhanVien === parseInt(checkInData.maNhanVien));
      if (selectedDoctor && isDoctorOnLeaveToday(selectedDoctor.maNhanVien, shiftsToday)) {
        showWarning(`Bác sĩ ${selectedDoctor.hoTen} không làm việc hôm nay (nghỉ phép)!`);
        return;
      }
    }

    try {
      // Bước 1: Tạo đăng ký khám bệnh (DangKyKhamBenh)
      const dangKyData = {
        maBenhNhan: selectedPatient.maBenhNhan,
        maNhanVien: maLeTan,
        maChuyenKhoa: parseInt(checkInData.maChuyenKhoa),
        maPhong: checkInData.maPhong ? parseInt(checkInData.maPhong) : null,
        maDichVu: checkInData.maDichVu ? parseInt(checkInData.maDichVu) : null,
        version: checkInData.version ?? null,
        maLichKham: appointmentId || null,
        ghiChu: checkInData.ghiChu || '',
        xacNhanCccd: needsIdentityVerification ? cccdVerified : undefined
      };
      const dangKyResult = await createDangKyApi(dangKyData);
      const soThuTu = dangKyResult.soThuTu;
      const dangKyId = dangKyResult.id;

      // Bước 2: Cập nhật trạng thái lịch khám nếu có appointmentId
      if (appointmentId) {
        try {
          await updateTrangThaiApi(appointmentId, 'DA_CHECK_IN');
        } catch (err) {
          console.warn("Không thể cập nhật trạng thái lịch khám:", err);
        }
      }

      setPrintData({
        soThuTu,
        tenPhong: selectedRoom?.tenPhong || '',
        benhNhan: selectedPatient,
        chuyenKhoa: departments.find(d => d.maChuyenKhoa === parseInt(checkInData.maChuyenKhoa)),
        dichVu: services.find(s => s.maDichVu === parseInt(checkInData.maDichVu)),
        bacSi: doctors.find(d => d.maNhanVien === parseInt(checkInData.maNhanVien)),
        ghiChu: checkInData.ghiChu,
        ngayDangKy: new Date().toLocaleString('vi-VN'),
        maLeTan
      });
      setShowPrintModal(true);
    } catch (error) {
      console.error("Lỗi check-in:", error);
      const errorMsg = error.message || '';
      const status = error.status || error.response?.status;
      const errorCode = error.errorCode || error.response?.data?.errorCode;
      if (status === 409 && errorCode === 'SLOT_FULL') {
        showError('⚠️ Chuyên khoa này đã hết lượt khám trong ngày hôm nay. Vui lòng liên hệ quản lý để tăng hạn mức hoặc chọn chuyên khoa khác.');
      } else if (status === 409 && errorCode === 'VERSION_CONFLICT') {
        showWarning('Dịch vụ đã được cập nhật giá. Vui lòng tải lại và chọn lại dịch vụ khám!');
        // Làm mới danh sách dịch vụ để lấy version mới nhất
        _getDichVuAll().then(setServices).catch(() => {});
      } else if (status === 403 || status === 401 || errorMsg.includes('403') || errorMsg.includes('401')) {
        showError(`Lỗi xác thực: ${errorMsg}. Vui lòng kiểm tra tài khoản có quyền tiếp đón không, hoặc đăng nhập lại.`);
      } else {
        showError(`Lỗi: ${errorMsg}`);
      }
    }
  };



  return <>
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-8 px-4">
        {[1, 2, 3].map(s => <div key={s} className="flex items-center flex-1 last:flex-none">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all ${step === s ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : step > s ? 'bg-green-500 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
            {step > s ? <span className="material-symbols-outlined">check</span> : s}
          </div>
          {s < 3 && <div className={`h-1 flex-1 mx-4 rounded-full transition-colors ${step > s ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
        </div>)}
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
        {step === 1 && <div className="p-8">
          <h2 className="text-2xl font-black text-gray-800 mb-2">Tìm kiếm & Chọn Bệnh Nhân</h2>
          <p className="text-gray-500 mb-8">Chọn bệnh nhân từ danh sách bên dưới hoặc nhập Tên, Số điện thoại, CCCD để tìm kiếm</p>

          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
              <input autoFocus placeholder="Nhập tên, số điện thoại, CCCD hoặc mã bệnh nhân..." className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-lg font-medium" value={searchKw} onChange={e => handleInputChange(e.target.value)} />
            </div>
            <button disabled={searching} className="px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all flex items-center gap-2 shadow-lg shadow-primary/20">
              {searching ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <span className="material-symbols-outlined">search</span>}
              Tìm kiếm
            </button>
          </form>

          <div className="space-y-4 pr-2">
            {patients.length > 0 ? (() => {
              const indexOfLastItem = currentPage * itemsPerPage;
              const indexOfFirstItem = indexOfLastItem - itemsPerPage;
              const currentPatients = patients.slice(indexOfFirstItem, indexOfLastItem);
              const totalPages = Math.ceil(patients.length / itemsPerPage);

              return (
                <>
                  {currentPatients.map(p => (
                    <div key={p.maBenhNhan} className="p-5 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center justify-between hover:border-primary/30 hover:bg-white transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary font-black text-lg border border-gray-100">
                          {p.hoTen ? p.hoTen[0] : 'BN'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800">{p.hoTen}</h4>
                          <p className="text-sm text-gray-500">SĐT: {p.soDienThoai} • CCCD: {p.cccd || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setPatientToEdit(p);
                            setStep(2);
                          }} 
                          className="px-4 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all shadow-sm"
                          title="Sửa thông tin"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => startCheckIn(p)} className="px-6 py-2.5 bg-white text-primary border border-primary/20 font-bold rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm">
                          Chọn
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-6 pt-4">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_left</span>
                      </button>
                      <span className="text-sm font-bold text-gray-600">
                        Trang {currentPage} / {totalPages}
                      </span>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="material-symbols-outlined">chevron_right</span>
                      </button>
                    </div>
                  )}
                </>
              );
            })() : searchKw && !searching ? <div className="text-center py-12">
              <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500 mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl">person_search</span>
              </div>
              <p className="text-gray-600 font-bold mb-2">Không tìm thấy bệnh nhân nào</p>
              <button onClick={() => { setPatientToEdit(null); setStep(2); }} className="text-primary font-bold hover:underline">Tạo hồ sơ mới ngay</button>
            </div> : null}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center">
            <button onClick={onCancel} className="text-gray-400 font-bold hover:text-gray-600">Thoát</button>
            <button onClick={() => { setPatientToEdit(null); setStep(2); }} className="flex items-center gap-2 text-primary font-black">
              <span className="material-symbols-outlined">add_circle</span>
              Đăng ký mới
            </button>
          </div>
        </div>}

        {step === 2 && <DangKyBenhNhan
          editPatient={patientToEdit}
          onCancel={() => {
            setStep(1);
            setPatientToEdit(null);
          }}
          onSuccess={(newPatient) => {
            setSelectedPatient(newPatient);
            setStep(3);
            setPatientToEdit(null);
            loadPatients(); // Reload list to reflect any changes if edited
          }}
        />}

        {step === 3 && selectedPatient && <div className="p-8 animate-scale-up">
          <div className="flex items-center gap-4 mb-8 p-6 bg-primary/5 rounded-3xl border border-primary/10">
            <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
              {selectedPatient.hoTen ? selectedPatient.hoTen[0] : 'BN'}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-gray-800">{selectedPatient.hoTen}</h2>
              <p className="text-gray-500">Mã BN: {selectedPatient.maBenhNhan}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Số Thứ Tự Dự Kiến</p>
              <div className="text-4xl font-black text-primary">#{waitingCount + 1}</div>
            </div>
          </div>

          {/* XÁC MINH DANH TÍNH - Bệnh nhân đặt lịch qua App lần đầu (nguồn = App & da_xac_minh_danh_tinh = 0) */}
          {needsIdentityVerification && editPatientInfo && (() => {
            const getValidDate = (dateStr) => {
              if (!dateStr) return '';
              try {
                return new Date(dateStr).toISOString().split('T')[0];
              } catch(e) {
                return '';
              }
            };
            return (
              <div className="mb-6 rounded-3xl border-2 border-orange-200 bg-orange-50/60 overflow-hidden">
                <div className="px-6 py-4 bg-orange-100/70 flex items-center gap-3 border-b border-orange-200">
                  <span className="material-symbols-outlined text-orange-600 text-2xl">badge</span>
                  <div className="flex-1">
                    <h3 className="font-black text-orange-800">XÁC MINH DANH TÍNH BỆNH NHÂN</h3>
                    <p className="text-xs text-orange-700 font-medium">Bệnh nhân tự đăng ký lịch hẹn qua App lần đầu - Lễ tân cần xác minh và bổ sung thông tin</p>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex flex-col md:flex-row md:justify-start md:gap-4 md:items-center pb-2 border-b border-orange-100">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider md:w-28 flex-shrink-0">Họ tên</span>
                      <input 
                        className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        value={editPatientInfo.hoTen || ''} 
                        onChange={e => setEditPatientInfo({...editPatientInfo, hoTen: e.target.value})}
                        disabled={cccdVerified}
                      />
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-start md:gap-4 md:items-center pb-2 border-b border-orange-100">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider md:w-28 flex-shrink-0">Ngày sinh</span>
                      <input 
                        type="date"
                        className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        value={getValidDate(editPatientInfo.ngaySinh)} 
                        onChange={e => setEditPatientInfo({...editPatientInfo, ngaySinh: e.target.value})}
                        disabled={cccdVerified}
                      />
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-start md:gap-4 md:items-center pb-2 border-b border-orange-100">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider md:w-28 flex-shrink-0">Giới tính</span>
                      <select
                        className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        value={
                          editPatientInfo.gioiTinh === true || editPatientInfo.gioiTinh === 1 || editPatientInfo.gioiTinh === 'true' || editPatientInfo.gioiTinh === '1'
                            ? 'true'
                            : editPatientInfo.gioiTinh === false || editPatientInfo.gioiTinh === 0 || editPatientInfo.gioiTinh === 'false' || editPatientInfo.gioiTinh === '0'
                              ? 'false'
                              : ''
                        }
                        onChange={e => setEditPatientInfo({...editPatientInfo, gioiTinh: e.target.value === 'true' ? true : e.target.value === 'false' ? false : null})}
                        disabled={cccdVerified}
                      >
                        <option value="">N/A</option>
                        <option value="true">Nam</option>
                        <option value="false">Nữ</option>
                      </select>
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-start md:gap-4 md:items-center pb-2 border-b border-orange-100">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider md:w-28 flex-shrink-0">Số điện thoại</span>
                      <input 
                        className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        value={editPatientInfo.soDienThoai || ''} 
                        onChange={e => setEditPatientInfo({...editPatientInfo, soDienThoai: e.target.value})}
                        disabled={cccdVerified}
                      />
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-start md:gap-4 md:items-center pb-2 border-b border-orange-100">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider md:w-28 flex-shrink-0">CCCD</span>
                      <input 
                        className={`w-full text-sm font-bold bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${editPatientInfo.cccd ? 'text-primary' : 'text-red-500'}`}
                        value={editPatientInfo.cccd || ''}
                        placeholder="Chưa có - cần bổ sung"
                        onChange={e => setEditPatientInfo({...editPatientInfo, cccd: e.target.value})}
                        disabled={cccdVerified}
                      />
                    </div>
                    <div className="flex flex-col md:flex-row md:justify-start md:gap-4 md:items-center pb-2 border-b border-orange-100">
                      <span className="text-xs font-black text-gray-400 uppercase tracking-wider md:w-28 flex-shrink-0">Địa chỉ</span>
                      <input 
                        className="w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                        value={editPatientInfo.diaChi || ''} 
                        onChange={e => setEditPatientInfo({...editPatientInfo, diaChi: e.target.value})}
                        disabled={cccdVerified}
                      />
                    </div>
                  </div>

                  {!cccdVerified ? (
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 p-4 bg-white border border-orange-200 rounded-2xl">
                      <div className="flex-1 text-sm font-semibold text-gray-700 leading-relaxed">
                        Vui lòng đối chiếu CCCD và cập nhật thông tin nếu cần trước khi xác minh.
                        <span className="block text-xs text-orange-600 mt-1 font-bold">* Bắt buộc xác minh để hoàn tất tiếp đón</span>
                      </div>
                      <button 
                        type="button"
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                          <span className="material-symbols-outlined">verified</span>
                        )}
                        Xác minh
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-300 rounded-2xl">
                      <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                      <span className="text-sm font-bold text-green-700">
                        Đã đối chiếu và xác minh danh tính trùng khớp.
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setCccdVerified(false)} 
                        className="ml-auto text-xs text-green-600 underline font-bold"
                      >
                        Sửa lại
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleCompleteCheckIn} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Chuyên khoa khám</label>
                <select required className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold" value={checkInData.maChuyenKhoa} onChange={e => setCheckInData({ ...checkInData, maChuyenKhoa: e.target.value })}>
                  <option value="">-- Chọn chuyên khoa --</option>
                  {departments.map(d => <option key={d.maChuyenKhoa} value={d.maChuyenKhoa}>{d.tenChuyenKhoa}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phòng khám</label>
                <select required disabled={roomLocked} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold disabled:opacity-60 disabled:cursor-not-allowed" value={checkInData.maPhong} onChange={e => setCheckInData({ ...checkInData, maPhong: e.target.value })}>
                  <option value="">-- Chọn phòng --</option>
                  {availableRoomOptions.map(room => (
                    <option key={room.maPhong} value={room.maPhong}>
                      {room.tenPhong}
                    </option>
                  ))}
                </select>
                {roomLocked && roomLockError && (
                  <p className="mt-2 text-[11px] font-bold text-red-500">{roomLockError}</p>
                )}
                {roomLocked && !roomLockError && (
                  <p className="mt-2 text-[11px] font-bold text-emerald-600">Phòng tự động theo bác sĩ chỉ định</p>
                )}
                {checkInData.maPhong && !roomLocked && (
                  <p className="mt-2 text-[11px] font-bold text-gray-500">
                    Còn lại: <span className={roomRemaining > 0 ? 'text-emerald-600' : 'text-red-500'}>{roomRemaining}</span> / {roomCapacity || 0} slot hôm nay
                  </p>
                )}
                {checkInData.maChuyenKhoa && !availableRoomOptions.length && !roomLocked && (
                  <p className="text-[10px] text-orange-500 mt-1 font-bold italic">* Chuyên khoa này chưa có phòng được cấu hình</p>
                )}
              </div>
              <div className="relative md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dịch vụ khám</label>
                <input
                  required
                  placeholder="-- Gõ tên dịch vụ hoặc chọn --"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold"
                  style={{ color: checkInData.maDichVu ? 'transparent' : 'inherit' }}
                  value={checkInData.tenDichVuDisplay || ''}
                  onChange={e => {
                    const val = e.target.value;
                    const match = val.match(/^#(\d+)\s*/);
                    const maDichVu = match ? match[1] : '';
                    setCheckInData(prev => ({ ...prev, maDichVu, tenDichVuDisplay: val }));
                  }}
                  onFocus={() => setShowServiceDropdown(true)}
                  onBlur={() => setTimeout(() => setShowServiceDropdown(false), 200)}
                />
                {checkInData.maDichVu && (
                  <div className="absolute left-5 top-[calc(50%+8px)] -translate-y-1/2 pointer-events-none font-bold text-gray-800">
                    {checkInData.tenDichVuDisplay.replace(/^#\d+\s*/, '')}
                  </div>
                )}
                {checkInData.maDichVu && (
                  <span className="absolute right-4 top-[calc(50%+8px)] -translate-y-1/2 text-emerald-600">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </span>
                )}
                {showServiceDropdown && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                    {availableServices
                      .filter(s => {
                        const searchVal = checkInData.tenDichVuDisplay ? checkInData.tenDichVuDisplay.replace(/^#\d+\s*/, '') : '';
                        return !searchVal || removeVietnameseTones(s.tenDichVu.toLowerCase()).includes(removeVietnameseTones(searchVal.toLowerCase()));
                      })
                      .map(s => (
                        <div
                          key={s.maDichVu}
                          className={`px-5 py-3.5 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 hover:bg-indigo-50 transition-colors ${checkInData.maDichVu === s.maDichVu.toString() ? 'bg-indigo-50' : ''}`}
                          onMouseDown={() => {
                            setCheckInData(prev => ({ ...prev, maDichVu: s.maDichVu.toString(), version: s.version ?? undefined, tenDichVuDisplay: `#${s.maDichVu} ${s.tenDichVu} - ${new Intl.NumberFormat('vi-VN').format(s.donGia)}đ` }));
                            setShowServiceDropdown(false);
                          }}
                        >
                          <div>
                            <div className="text-sm font-bold text-gray-800">{s.tenDichVu}</div>
                            <div className="text-xs text-gray-400">Mã: #{s.maDichVu}</div>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN').format(s.donGia)}đ</span>
                        </div>
                      ))}
                    {availableServices.filter(s => {
                      const searchVal = checkInData.tenDichVuDisplay ? checkInData.tenDichVuDisplay.replace(/^#\d+\s*/, '') : '';
                      return !searchVal || removeVietnameseTones(s.tenDichVu.toLowerCase()).includes(removeVietnameseTones(searchVal.toLowerCase()));
                    }).length === 0 && (
                        <div className="px-5 py-8 text-center text-gray-400 italic text-sm">Không tìm thấy dịch vụ phù hợp</div>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bác sĩ chỉ định (Tùy chọn)</label>
                <select className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold" value={checkInData.maNhanVien} onChange={e => handleDoctorChange(e.target.value)}>
                  <option value="">-- Không chọn bác sĩ --</option>
                  {availableDoctors.map(d => <option key={d.maNhanVien} value={d.maNhanVien}>{d.hoTen}</option>)}
                </select>
                {checkInData.maChuyenKhoa && availableDoctors.length === 0 && <p className="text-[10px] text-orange-500 mt-1 font-bold italic">
                  * Hiện không có bác sĩ nào trực ở chuyên khoa này hôm nay
                </p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Lý do khám / Ghi chú</label>
              <textarea rows="4" className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-medium resize-none" placeholder="Đau đầu, sốt nhẹ, tái khám..." value={checkInData.ghiChu} onChange={e => setCheckInData({ ...checkInData, ghiChu: e.target.value })}></textarea>
            </div>

            <div className="pt-8 border-t border-gray-50 flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="px-8 py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors">Quay lại</button>
              <button type="submit" className="flex-1 py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-dark shadow-xl shadow-primary/20 transition-all transform hover:-translate-y-1">
                HOÀN TẤT TIẾP ĐÓN & CẤP SỐ
              </button>
            </div>
          </form>
        </div>}
      </div>
    </div>

    {/* Print Modal - placed outside the card to avoid overflow clipping */}
    {showPrintModal && printData && createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          width: '100vw',
          height: '100vh'
        }}
        onClick={() => { }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            width: '480px',
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            overflowY: 'auto',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            animation: 'scaleUp 0.3s ease-out forwards'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 p-4 sm:p-6 text-white text-center flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <span className="material-symbols-outlined text-3xl sm:text-4xl">print</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mb-1">TIẾP ĐÓN THÀNH CÔNG</h2>
            <p className="text-white/80 text-sm">Phiếu đăng ký khám bệnh</p>
          </div>

          {/* Số thứ tự */}
          <div className="px-4 py-4 sm:px-6 sm:py-6 text-center border-b border-gray-100 flex-shrink-0">
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Số Thứ Tự</p>
            <div className="text-5xl sm:text-6xl font-black text-primary">#{printData.soThuTu}</div>
            {printData.tenPhong && (
              <p className="mt-1 text-sm font-bold text-indigo-600">{printData.tenPhong}</p>
            )}
          </div>

          {/* Thông tin chi tiết */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Bệnh nhân</span>
              <span className="text-sm font-bold text-gray-800">{printData.benhNhan.hoTen}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Mã bệnh nhân</span>
              <span className="text-sm font-bold text-gray-800">#{printData.benhNhan.maBenhNhan}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Chuyên khoa</span>
              <span className="text-sm font-bold text-gray-800">{printData.chuyenKhoa?.tenChuyenKhoa || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Dịch vụ</span>
              <span className="text-sm font-bold text-gray-800">{printData.dichVu?.tenDichVu || 'Không có'}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Đơn giá</span>
              <span className="text-sm font-bold text-indigo-600">{printData.dichVu ? `${new Intl.NumberFormat('vi-VN').format(printData.dichVu.donGia)}đ` : 'N/A'}</span>
            </div>
            {printData.bacSi && (
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">Bác sĩ</span>
                <span className="text-sm font-bold text-gray-800">{printData.bacSi.hoTen}</span>
              </div>
            )}
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Thời gian</span>
              <span className="text-sm font-bold text-gray-800">{printData.ngayDangKy}</span>
            </div>
            {printData.ghiChu && (
              <div className="flex justify-between items-start pb-3 border-b border-gray-50">
                <span className="text-sm text-gray-500">Ghi chú</span>
                <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{printData.ghiChu}</span>
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="p-4 pt-0 sm:p-6 sm:pt-0 flex gap-3 flex-shrink-0">
            <button
              onClick={() => {
                setShowPrintModal(false);
                onSuccess();
              }}
              className="flex-1 py-3 sm:py-4 text-sm sm:text-base bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all"
            >
              Đóng
            </button>
            <InPhieuTiepDon
              printData={printData}
              className="flex-1 py-3 sm:py-4 text-sm sm:text-base bg-primary text-white font-black rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all"
            />
          </div>
        </div>
      </div>,
      document.body
    )}
  </>;
};

export default QuyTrinhTiepDon;