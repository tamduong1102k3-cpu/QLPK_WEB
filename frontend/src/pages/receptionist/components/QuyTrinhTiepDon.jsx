import { getBacSiByChuyenKhoaApi } from '../../../api/employeeApi';
import { getAllApi as _getDichVuAll } from '../../../api/dichVuApi';
import { getWorkingTodayApi as _getWorkingToday, getPhongTheoBacSiApi as _getPhongTheoBacSi, getAvailableClsRoomsApi } from '../../../api/shiftApi';
import { getAllApi as getBenhNhanAll, getByIdApi as getBenhNhanById, searchApi, xacMinhDanhTinhApi } from '../../../api/benhNhanApi';
import { createApi as createDangKyApi, getTodayApi as _getTodayRegistrations } from '../../../api/dangKyKhamBenhApi';
import { updateTrangThaiApi } from '../../../api/lichKhamApi';
import { getAllChuyenKhoaApi as _getChuyenKhoaAll, getAllPhongApi as _getPhongAll } from '../../../api/danhMucApi';
import { useNotification } from '../../../components/NotificationContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import InPhieuTiepDon from './InPhieuTiepDon';
import DangKyBenhNhan from './DangKyBenhNhan';
import { getMaNhanVienFromAccessToken } from '../../../api/tokenStore';
import { API_BASE_URL } from '../../../api/config';
import {
  getLatestPatientBirthDate,
  MINIMUM_PATIENT_BIRTH_DATE,
  validatePatientBirthDate,
} from '../../../utils/patientBirthDate';

const removeVietnameseTones = str => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};


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

const isClsService = service =>
  service?.loaiDichVu === 'CLS_XET_NGHIEM' ||
  service?.loaiDichVu === 'CLS_CHAN_DOAN_HINH_ANH';

const getAssignedRoomOptions = ({ shiftsToday, selectedDepartment, phongList }) => {
  const catalog = Array.isArray(phongList) ? phongList : [];
 
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

const toDateInputValue = value => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const toIdentityFormData = patient => ({
  maBenhNhan: patient?.maBenhNhan ?? null,
  soLanQuaHen: patient?.soLanQuaHen ?? 0,
  hoTen: patient?.hoTen ?? '',
  ngaySinh: patient?.ngaySinh ?? '',
  gioiTinh: patient?.gioiTinh ?? null,
  soDienThoai: patient?.soDienThoai ?? '',
  cccd: patient?.cccd ?? '',
  email: patient?.email ?? '',
  diaChi: patient?.diaChi ?? '',
  ngheNghiep: patient?.ngheNghiep ?? '',
  nhomMau: patient?.nhomMau ?? '',
  diUngThuoc: patient?.diUngThuoc ?? '',
  tienSuBenh: patient?.tienSuBenh ?? '',
  nguoiGiamHo: patient?.nguoiGiamHo ?? '',
  soDienThoaiNguoiGiamHo: patient?.soDienThoaiNguoiGiamHo ?? '',
  ghiChu: patient?.ghiChu ?? '',
});

const toVerificationPayload = patient => ({
  hoTen: patient.hoTen,
  ngaySinh: patient.ngaySinh || null,
  gioiTinh: patient.gioiTinh ?? null,
  soDienThoai: patient.soDienThoai,
  cccd: patient.cccd,
  email: patient.email?.trim() || null,
  diaChi: patient.diaChi || null,
  ngheNghiep: patient.ngheNghiep || null,
  nhomMau: patient.nhomMau || null,
  diUngThuoc: patient.diUngThuoc || null,
  tienSuBenh: patient.tienSuBenh || null,
  nguoiGiamHo: patient.nguoiGiamHo || null,
  soDienThoaiNguoiGiamHo: patient.soDienThoaiNguoiGiamHo || null,
  ghiChu: patient.ghiChu || null,
});

const QuyTrinhTiepDon = ({
  onCancel,
  onSuccess,
  waitingCount,
  presetDepartment,
  presetDoctor,
  presetPatient,
  appointmentId
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
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorLoadError, setDoctorLoadError] = useState('');
  const [services, setServices] = useState([]);
  const [phongList, setPhongList] = useState([]);
  const [clsRoomOptions, setClsRoomOptions] = useState([]);
  const [clsRoomsLoading, setClsRoomsLoading] = useState(false);
  const [clsRoomError, setClsRoomError] = useState('');
  const [todayRegistrations, setTodayRegistrations] = useState([]);
  const [shiftsToday, setShiftsToday] = useState([]);

  const { showSuccess, showError, showWarning } = useNotification();

  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printData, setPrintData] = useState(null);
  const [roomLocked, setRoomLocked] = useState(false);
  const [roomLockError, setRoomLockError] = useState('');
  const doctorRoomRequestId = useRef(0);
  const doctorsRef = useRef([]);
  const selectedDoctorIdRef = useRef(presetDoctor ? String(presetDoctor) : '');

  const [editPatientInfo, setEditPatientInfo] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [identityErrors, setIdentityErrors] = useState({});

  useEffect(() => {
    if (selectedPatient) {
      const fullInfo = allPatients.find(p => p.maBenhNhan === selectedPatient.maBenhNhan) || selectedPatient;
      setEditPatientInfo(toIdentityFormData(fullInfo));
    }
  }, [selectedPatient, allPatients]);

  const handleVerify = async () => {
    const errors = {};
    if (!editPatientInfo?.hoTen?.trim()) errors.hoTen = 'Vui lòng nhập họ và tên';
    if (!editPatientInfo?.cccd?.trim()) errors.cccd = 'Vui lòng nhập CCCD/CMND';
    if (!editPatientInfo?.soDienThoai?.trim()) errors.soDienThoai = 'Vui lòng nhập số điện thoại';
    const ngaySinhError = validatePatientBirthDate(editPatientInfo?.ngaySinh);
    if (ngaySinhError) errors.ngaySinh = ngaySinhError;
    if (Object.keys(errors).length > 0) {
      setIdentityErrors(errors);
      return;
    }

    setIsVerifying(true);
    try {
      const verifiedPatient = await xacMinhDanhTinhApi(
        editPatientInfo.maBenhNhan,
        toVerificationPayload(editPatientInfo)
      );
      if (verifiedPatient?.daXacMinhDanhTinh !== true) {
        throw new Error('Backend chưa xác nhận trạng thái đã xác minh.');
      }

      setSelectedPatient(verifiedPatient);
      setEditPatientInfo(toIdentityFormData(verifiedPatient));
      setAllPatients(prev => prev.map(p => p.maBenhNhan === verifiedPatient.maBenhNhan ? verifiedPatient : p));
      setPatients(prev => prev.map(p => p.maBenhNhan === verifiedPatient.maBenhNhan ? verifiedPatient : p));
      setIdentityErrors({});
      setStep(3);
      showSuccess("Đã lưu thông tin và xác minh danh tính thành công!");
    } catch (e) {
      const fieldErrors = e.fieldErrors || {};
      setIdentityErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        showError("Lỗi xác minh danh tính: " + e.message);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const updateIdentityField = (field, value) => {
    setEditPatientInfo(previous => ({ ...previous, [field]: value }));
    setIdentityErrors(previous => ({ ...previous, [field]: null }));
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

  const API_BASE = API_BASE_URL;

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


    if (presetPatient?.maBenhNhan) {
      getBenhNhanById(presetPatient.maBenhNhan)
        .then(patient => {
          if (!patient) throw new Error('Không tìm thấy hồ sơ bệnh nhân.');
          setSelectedPatient(patient);
          setEditPatientInfo(toIdentityFormData(patient));
          setIdentityErrors({});
          setStep(patient.daXacMinhDanhTinh === true ? 3 : 2);
        })
        .catch(error => showError(`Không thể tải hồ sơ bệnh nhân: ${error.message}`));
    }
  }, [loadPatients, presetPatient?.maBenhNhan, showError]);

  const selectedService = services.find(
    service => String(service.maDichVu) === String(checkInData.maDichVu)
  );
  const selectedServiceIsCls = isClsService(selectedService);

  const availableRoomOptions = selectedServiceIsCls
    ? clsRoomOptions
    : getAssignedRoomOptions({
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

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const service = services.find(
        item => String(item.maDichVu) === String(checkInData.maDichVu)
      );
      ++doctorRoomRequestId.current;

      if (!service || !service.maChuyenKhoa) {
        doctorsRef.current = [];
        setDoctors([]);
        setDoctorsLoading(false);
        setDoctorLoadError('');
        setClsRoomOptions([]);
        setClsRoomsLoading(false);
        setClsRoomError('');
        if (services.length > 0) {
          selectedDoctorIdRef.current = '';
          setRoomLocked(false);
          setRoomLockError('');
          setCheckInData(prev => ({ ...prev, maNhanVien: '' }));
        }
        return;
      }

      const maChuyenKhoa = Number(service.maChuyenKhoa);
      const currentDoctor = doctorsRef.current.find(
        doctor => String(doctor.maNhanVien) === String(selectedDoctorIdRef.current)
      );
      const shouldClearDoctor = currentDoctor
        && Number(currentDoctor.chuyenKhoa) !== maChuyenKhoa;
      if (shouldClearDoctor) {
        selectedDoctorIdRef.current = '';
        setRoomLocked(false);
        setRoomLockError('');
      }

      setCheckInData(prev => ({
        ...prev,
        maChuyenKhoa: String(maChuyenKhoa),
        maNhanVien: shouldClearDoctor ? '' : prev.maNhanVien,
        maPhong: shouldClearDoctor ? '' : prev.maPhong
      }));

      doctorsRef.current = [];
      setDoctors([]);
      setDoctorsLoading(true);
      setDoctorLoadError('');
      getBacSiByChuyenKhoaApi(maChuyenKhoa)
        .then(data => {
          if (!active) return;
          const result = Array.isArray(data) ? data : [];
          doctorsRef.current = result;
          setDoctors(result);
          const selectedDoctorStillAvailable = selectedDoctorIdRef.current
            && result.some(doctor =>
              String(doctor.maNhanVien) === String(selectedDoctorIdRef.current)
            );
          if (selectedDoctorIdRef.current && !selectedDoctorStillAvailable) {
            selectedDoctorIdRef.current = '';
            if (!isClsService(service)) {
              setRoomLocked(false);
              setRoomLockError('');
            }
            setCheckInData(prev => ({
              ...prev,
              maNhanVien: '',
              maPhong: isClsService(service) ? prev.maPhong : ''
            }));
          }
        })
        .catch(error => {
          if (!active) return;
          doctorsRef.current = [];
          setDoctors([]);
          selectedDoctorIdRef.current = '';
          if (!isClsService(service)) {
            setRoomLocked(false);
            setRoomLockError('');
          }
          setCheckInData(prev => ({
            ...prev,
            maNhanVien: '',
            maPhong: isClsService(service) ? prev.maPhong : ''
          }));
          setDoctorLoadError(error.message || 'Không thể tải danh sách bác sĩ');
        })
        .finally(() => {
          if (active) setDoctorsLoading(false);
        });

      if (isClsService(service)) {
        setRoomLocked(false);
        setRoomLockError('');
        setCheckInData(prev => ({ ...prev, maPhong: '' }));
        setClsRoomOptions([]);
        setClsRoomsLoading(true);
        setClsRoomError('');
        getAvailableClsRoomsApi(service.maDichVu)
          .then(data => {
            if (!active) return;
            setClsRoomOptions(Array.isArray(data) ? data : []);
          })
          .catch(error => {
            if (!active) return;
            setClsRoomOptions([]);
            setClsRoomError(error.message || 'Không thể tải phòng kỹ thuật viên');
          })
          .finally(() => {
            if (active) setClsRoomsLoading(false);
          });
      } else {
        setClsRoomOptions([]);
        setClsRoomsLoading(false);
        setClsRoomError('');
      }
    });

    return () => {
      active = false;
    };
  }, [checkInData.maDichVu, services]);

  // Hàm xử lý đổi bác sĩ: lookup phòng theo ca hiện tại + ngày hôm nay
  const handleDoctorChange = async (maNhanVien) => {
    selectedDoctorIdRef.current = maNhanVien;
    if (selectedServiceIsCls) {
      setCheckInData(prev => ({ ...prev, maNhanVien }));
      return;
    }

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
    const requestId = ++doctorRoomRequestId.current;

    try {
      // Lấy ngày theo giờ VN (tránh lỗi UTC lùi 1 ngày vào rạng sáng)
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      const result = await _getPhongTheoBacSi(maNhanVien, todayStr);
      if (requestId !== doctorRoomRequestId.current) return;
      setCheckInData(prev => ({ ...prev, maPhong: String(result.maPhong) }));
      setRoomLocked(true);
      setRoomLockError('');
    } catch (e) {
      if (requestId !== doctorRoomRequestId.current) return;
      setCheckInData(prev => ({ ...prev, maPhong: '' }));
      setRoomLocked(true);
      setRoomLockError(e.message || 'Không thể lấy phòng theo bác sĩ');
      showError(e.message || 'Không thể lấy phòng theo bác sĩ');
    }
  };

  useEffect(() => {
    if (selectedServiceIsCls) return;
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
  }, [checkInData.maChuyenKhoa, shiftsToday, phongList, roomLocked, selectedServiceIsCls]);

  // Effect cho dịch vụ: tự động chọn dịch vụ đầu tiên của chuyên khoa khi chuyên khoa thay đổi hoặc services load xong
  useEffect(() => {
    if (checkInData.maChuyenKhoa) {
      const filteredServices = services.filter(s =>
        s.maChuyenKhoa === parseInt(checkInData.maChuyenKhoa)
      );
      if (filteredServices.length > 0) {
        const firstService = filteredServices[0];
        setServiceSearch('');
        setCheckInData(prev => ({
          ...prev,
          maDichVu: firstService.maDichVu.toString(),
          version: firstService.version ?? undefined,
          tenDichVuDisplay: `#${firstService.maDichVu} ${firstService.tenDichVu} - ${new Intl.NumberFormat('vi-VN').format(firstService.donGia)}đ`
        }));
      } else {
        setServiceSearch('');
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
    setEditPatientInfo(toIdentityFormData(patient));
    setIdentityErrors({});
    setStep(patient.daXacMinhDanhTinh === true ? 3 : 2);
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

    if (!checkInData.maDichVu) {
      showWarning("Vui lòng chọn dịch vụ khám từ danh sách!");
      return;
    }

    if (selectedServiceIsCls && clsRoomsLoading) {
      showWarning("Đang tải danh sách phòng kỹ thuật viên. Vui lòng thử lại.");
      return;
    }

    if (!checkInData.maPhong) {
      showWarning(selectedServiceIsCls && !availableRoomOptions.length
        ? (clsRoomError || "Không có phòng CLS với kỹ thuật viên đang trực.")
        : "Vui lòng chọn Phòng khám trước khi tiếp đón!");
      return;
    }

    if (!checkInData.maNhanVien) {
        showError('Vui lòng chọn bác sĩ chỉ định');
        return;
    }

    if (roomCapacity > 0 && roomRemaining <= 0) {
      showWarning(`Phòng ${selectedRoom?.tenPhong || 'đã chọn'} đã đầy trong ngày hôm nay. Vui lòng chọn phòng khác hoặc tăng hạn mức phòng.`);
      return;
    }

    if (selectedPatient?.daXacMinhDanhTinh !== true) {
      showWarning("Bệnh nhân chưa xác minh danh tính. Vui lòng kiểm tra thông tin và xác minh CCCD trước khi tiếp đón!");
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
      //  Tạo đăng ký khám bệnh (DangKyKhamBenh)
      const dangKyData = {
        maBenhNhan: selectedPatient.maBenhNhan,
        maNhanVien: maLeTan,
        maBacSi: checkInData.maNhanVien ? parseInt(checkInData.maNhanVien) : null,
        maChuyenKhoa: parseInt(checkInData.maChuyenKhoa),
        maPhong: checkInData.maPhong ? parseInt(checkInData.maPhong) : null,
        maDichVu: checkInData.maDichVu ? parseInt(checkInData.maDichVu) : null,
        version: checkInData.version ?? null,
        maLichKham: appointmentId || null,
        ghiChu: checkInData.ghiChu || '',
        xacNhanCccd: true
      };
      const dangKyResult = await createDangKyApi(dangKyData);
      const soThuTu = dangKyResult.soThuTu;
      const dangKyId = dangKyResult.id;

      // Cập nhật trạng thái lịch khám nếu có appointmentId
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
                            setSelectedPatient(null);
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
              <button onClick={() => { setSelectedPatient(null); setEditPatientInfo(null); setPatientToEdit(null); setStep(2); }} className="text-primary font-bold hover:underline">Tạo hồ sơ mới ngay</button>
            </div> : null}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center">
            <button onClick={onCancel} className="text-gray-400 font-bold hover:text-gray-600">Thoát</button>
            <button onClick={() => { setSelectedPatient(null); setEditPatientInfo(null); setPatientToEdit(null); setStep(2); }} className="flex items-center gap-2 text-primary font-black">
              <span className="material-symbols-outlined">add_circle</span>
              Đăng ký mới
            </button>
          </div>
        </div>}

        {step === 2 && (patientToEdit || !selectedPatient) && <DangKyBenhNhan
          editPatient={patientToEdit}
          onCancel={() => {
            setStep(1);
            setSelectedPatient(null);
            setEditPatientInfo(null);
            setPatientToEdit(null);
          }}
          onSuccess={newPatient => {
            setSelectedPatient(newPatient);
            setEditPatientInfo(toIdentityFormData(newPatient));
            setIdentityErrors({});
            setStep(newPatient.daXacMinhDanhTinh === true ? 3 : 2);
            setPatientToEdit(null);
            loadPatients();
          }}
        />}

        {step === 2 && selectedPatient && selectedPatient.daXacMinhDanhTinh !== true && editPatientInfo && (
          <form
            onSubmit={event => {
              event.preventDefault();
              handleVerify();
            }}
            className="p-8 animate-scale-up"
          >
            <div className="mb-6 rounded-3xl border-2 border-orange-200 bg-orange-50/60 overflow-hidden">
              <div className="px-6 py-4 bg-orange-100/70 flex items-center gap-3 border-b border-orange-200">
                <span className="material-symbols-outlined text-orange-600 text-2xl">badge</span>
                <div className="flex-1">
                  <h2 className="font-black text-orange-800">KIỂM TRA & XÁC MINH THÔNG TIN BỆNH NHÂN</h2>
                  <p className="text-xs text-orange-700 font-medium">Đối chiếu hồ sơ với CCCD/giấy tờ tùy thân trước khi tiếp đón.</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-orange-800">
                    <span>Mã BN: #{selectedPatient.maBenhNhan}</span>
                    {(selectedPatient.soLanQuaHen ?? 0) > 0 && (
                      <span className="rounded-full bg-orange-200 px-2.5 py-1">
                        Số lần quá hẹn: {selectedPatient.soLanQuaHen}
                      </span>
                    )}
                  </div>
                </div>
                <span className="rounded-full bg-orange-200 px-3 py-1 text-xs font-black text-orange-800">Chưa xác minh danh tính</span>
              </div>

              <div className="p-6">
                <section>
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Thông tin cá nhân & liên hệ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Họ tên *
                    <input
                      required
                      className={`mt-1 w-full text-sm font-bold text-gray-800 bg-white border ${identityErrors.hoTen ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                      value={editPatientInfo.hoTen || ''}
                      onChange={event => updateIdentityField('hoTen', event.target.value)}
                    />
                    {identityErrors.hoTen && <span className="mt-1 block normal-case text-red-600">{identityErrors.hoTen}</span>}
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Ngày sinh *
                    <input
                      type="date"
                      min={MINIMUM_PATIENT_BIRTH_DATE}
                      max={getLatestPatientBirthDate()}
                      aria-invalid={Boolean(identityErrors.ngaySinh)}
                      className={`mt-1 w-full text-sm font-bold text-gray-800 bg-white border ${identityErrors.ngaySinh ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                      value={toDateInputValue(editPatientInfo.ngaySinh)}
                      onChange={event => updateIdentityField('ngaySinh', event.target.value || null)}
                    />
                    {identityErrors.ngaySinh && <span className="mt-1 block normal-case text-red-600">{identityErrors.ngaySinh}</span>}
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Giới tính
                    <select
                      className="mt-1 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                      value={editPatientInfo.gioiTinh === true ? 'true' : editPatientInfo.gioiTinh === false ? 'false' : ''}
                      onChange={event => updateIdentityField(
                        'gioiTinh',
                        event.target.value === '' ? null : event.target.value === 'true'
                      )}
                    >
                      <option value="">Chưa cập nhật</option>
                      <option value="true">Nam</option>
                      <option value="false">Nữ</option>
                    </select>
                    {identityErrors.gioiTinh && <span className="mt-1 block normal-case text-red-600">{identityErrors.gioiTinh}</span>}
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Số điện thoại
                    <input
                      required
                      type="tel"
                      className={`mt-1 w-full text-sm font-bold text-gray-800 bg-white border ${identityErrors.soDienThoai ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                      value={editPatientInfo.soDienThoai || ''}
                      onChange={event => updateIdentityField('soDienThoai', event.target.value)}
                    />
                    {identityErrors.soDienThoai && <span className="mt-1 block normal-case text-red-600">{identityErrors.soDienThoai}</span>}
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Số CCCD/CMND *
                    <input
                      required
                      className={`mt-1 w-full text-sm font-bold text-gray-800 bg-white border ${identityErrors.cccd ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                      value={editPatientInfo.cccd || ''}
                      onChange={event => updateIdentityField('cccd', event.target.value)}
                    />
                    {identityErrors.cccd && <span className="mt-1 block normal-case text-red-600">{identityErrors.cccd}</span>}
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Email
                    <input
                      type="email"
                      className={`mt-1 w-full text-sm font-bold text-gray-800 bg-white border ${identityErrors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg px-3 py-2`}
                      value={editPatientInfo.email || ''}
                      onChange={event => updateIdentityField('email', event.target.value)}
                    />
                    {identityErrors.email && <span className="mt-1 block normal-case text-red-600">{identityErrors.email}</span>}
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Nghề nghiệp
                    <input
                      maxLength={30}
                      className="mt-1 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                      value={editPatientInfo.ngheNghiep || ''}
                      onChange={event => updateIdentityField('ngheNghiep', event.target.value)}
                    />
                  </label>
                  <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                    Địa chỉ
                    <input
                      maxLength={255}
                      className="mt-1 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                      value={editPatientInfo.diaChi || ''}
                      onChange={event => updateIdentityField('diaChi', event.target.value)}
                    />
                    {identityErrors.diaChi && <span className="mt-1 block normal-case text-red-600">{identityErrors.diaChi}</span>}
                  </label>
                  </div>
                </section>

                <section className="mt-7">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Thông tin y tế
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      Nhóm máu
                      <select
                        className="mt-1 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                        value={editPatientInfo.nhomMau || ''}
                        onChange={event => updateIdentityField('nhomMau', event.target.value)}
                      >
                        <option value="">Chưa cập nhật</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      Dị ứng thuốc
                      <input
                        maxLength={50}
                        className={`mt-1 w-full text-sm font-bold bg-white border ${editPatientInfo.diUngThuoc ? 'border-red-200 text-red-600' : 'border-gray-200 text-gray-800'} rounded-lg px-3 py-2`}
                        value={editPatientInfo.diUngThuoc || ''}
                        onChange={event => updateIdentityField('diUngThuoc', event.target.value)}
                        placeholder="Không..."
                      />
                    </label>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider md:col-span-2">
                      Tiền sử bệnh
                      <textarea
                        maxLength={255}
                        rows={3}
                        className="mt-1 w-full resize-none text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                        value={editPatientInfo.tienSuBenh || ''}
                        onChange={event => updateIdentityField('tienSuBenh', event.target.value)}
                        placeholder="Tiểu đường, cao huyết áp, chưa phát hiện bệnh nền..."
                      />
                    </label>
                  </div>
                </section>

                <section className="mt-7">
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-primary">
                    <span className="h-5 w-1 rounded-full bg-primary" />
                    Người giám hộ & ghi chú
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      Người giám hộ
                      <input
                        maxLength={30}
                        className="mt-1 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                        value={editPatientInfo.nguoiGiamHo || ''}
                        onChange={event => updateIdentityField('nguoiGiamHo', event.target.value)}
                      />
                    </label>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider">
                      SĐT người giám hộ
                      <input
                        type="tel"
                        maxLength={20}
                        className="mt-1 w-full text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                        value={editPatientInfo.soDienThoaiNguoiGiamHo || ''}
                        onChange={event => updateIdentityField('soDienThoaiNguoiGiamHo', event.target.value)}
                      />
                    </label>
                    <label className="text-xs font-black text-gray-500 uppercase tracking-wider md:col-span-2">
                      Ghi chú
                      <textarea
                        rows={3}
                        className="mt-1 w-full resize-none text-sm font-bold text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2"
                        value={editPatientInfo.ghiChu || ''}
                        onChange={event => updateIdentityField('ghiChu', event.target.value)}
                      />
                    </label>
                  </div>
                </section>

                <p className="mt-5 rounded-xl border border-orange-200 bg-white p-4 text-sm font-semibold text-orange-800">
                  Vui lòng kiểm tra các thông tin trên giấy tờ tùy thân. Chưa xác minh danh tính — chưa thể cấp số khám.
                </p>
                <div className="mt-5 flex justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPatient(null);
                      setEditPatientInfo(null);
                      setStep(1);
                    }}
                    className="rounded-xl px-5 py-2.5 font-bold text-gray-500 hover:bg-white"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 font-bold text-white shadow-md transition-all hover:bg-green-700 disabled:opacity-50"
                  >
                    {isVerifying && <span className="material-symbols-outlined animate-spin">progress_activity</span>}
                    Lưu & Xác minh danh tính
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

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
                <select required disabled={roomLocked || (selectedServiceIsCls && clsRoomsLoading)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold disabled:opacity-60 disabled:cursor-not-allowed" value={checkInData.maPhong} onChange={e => setCheckInData({ ...checkInData, maPhong: e.target.value })}>
                  <option value="">-- Chọn phòng --</option>
                  {availableRoomOptions.map(room => (
                    <option key={room.maPhong} value={room.maPhong}>
                      {room.tenPhong}{selectedServiceIsCls ? ` (${room.soBenhNhanDangCho ?? 0} đang chờ)` : ''}
                    </option>
                  ))}
                </select>
                {selectedServiceIsCls && clsRoomsLoading && (
                  <p className="mt-2 text-[11px] font-bold text-gray-500">Đang tải phòng có kỹ thuật viên trực...</p>
                )}
                {selectedServiceIsCls && clsRoomError && (
                  <p className="mt-2 text-[11px] font-bold text-red-500">{clsRoomError}</p>
                )}
                {selectedServiceIsCls && !clsRoomsLoading && !clsRoomError && !availableRoomOptions.length && (
                  <p className="mt-2 text-[11px] font-bold text-orange-600">Không có phòng CLS phù hợp đang có kỹ thuật viên trực.</p>
                )}
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
                {checkInData.maChuyenKhoa && !selectedServiceIsCls && !availableRoomOptions.length && !roomLocked && (
                  <p className="text-[10px] text-orange-500 mt-1 font-bold italic">* Chuyên khoa này chưa có phòng được cấu hình</p>
                )}
              </div>
              <div className="relative md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Dịch vụ khám</label>
                <input
                  required={!checkInData.maDichVu}
                  placeholder="-- Gõ tên dịch vụ hoặc chọn --"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold"
                  style={{ color: checkInData.maDichVu && !showServiceDropdown ? 'transparent' : 'inherit' }}
                  value={showServiceDropdown ? serviceSearch : checkInData.tenDichVuDisplay || ''}
                  onChange={e => {
                    setServiceSearch(e.target.value);
                    setCheckInData(prev => ({ ...prev, maDichVu: '', version: undefined, tenDichVuDisplay: '' }));
                  }}
                  onFocus={() => {
                    setServiceSearch('');
                    setShowServiceDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => {
                    setShowServiceDropdown(false);
                    setServiceSearch('');
                  }, 200)}
                />
                {checkInData.maDichVu && !showServiceDropdown && (
                  <div className="absolute left-5 top-[calc(50%+8px)] -translate-y-1/2 pointer-events-none font-bold text-gray-800">
                    {checkInData.tenDichVuDisplay.replace(/^#\d+\s*/, '')}
                  </div>
                )}
                {checkInData.maDichVu && !showServiceDropdown && (
                  <span className="absolute right-4 top-[calc(50%+8px)] -translate-y-1/2 text-emerald-600">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </span>
                )}
                {showServiceDropdown && (
                  <div className="absolute z-30 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
                    {availableServices
                      .filter(s => {
                        const searchVal = serviceSearch;
                        return !searchVal || removeVietnameseTones(s.tenDichVu.toLowerCase()).includes(removeVietnameseTones(searchVal.toLowerCase()));
                      })
                      .map(s => (
                        <div
                          key={s.maDichVu}
                          className={`px-5 py-3.5 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0 hover:bg-indigo-50 transition-colors ${checkInData.maDichVu === s.maDichVu.toString() ? 'bg-indigo-50' : ''}`}
                          onMouseDown={() => {
                            setCheckInData(prev => ({ ...prev, maDichVu: s.maDichVu.toString(), version: s.version ?? undefined, tenDichVuDisplay: `#${s.maDichVu} ${s.tenDichVu} - ${new Intl.NumberFormat('vi-VN').format(s.donGia)}đ` }));
                            setServiceSearch('');
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
                      const searchVal = serviceSearch;
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
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Bác sĩ chỉ định (*)</label>
                <select className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold" value={checkInData.maNhanVien} onChange={e => handleDoctorChange(e.target.value)}>
                  <option value="">-- Không chọn bác sĩ --</option>
                  {availableDoctors.map(d => <option key={d.maNhanVien} value={d.maNhanVien}>{d.hoTen}</option>)}
                </select>
                {checkInData.maChuyenKhoa && availableDoctors.length === 0 && <p className="text-[10px] text-orange-500 mt-1 font-bold italic">
                  {doctorsLoading
                    ? '* Đang tải danh sách bác sĩ...'
                    : doctorLoadError
                      ? `* ${doctorLoadError}`
                      : '* Hiện không có bác sĩ nào trực ở chuyên khoa này hôm nay'}
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
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm text-gray-500">Bác sĩ</span>
              <span className="text-sm font-bold text-gray-800">{printData.bacSi?.hoTen || 'Chưa chỉ định'}</span>
            </div>
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