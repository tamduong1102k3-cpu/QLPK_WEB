import { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { getByDoctorApi, createApi, updateApi, hoanLichApi } from '../../../api/appointmentApi';
import { getAllChuyenKhoaApi, getAllPhongApi } from '../../../api/danhMucApi';
import { getAllApi as getAllDichVuApi } from '../../../api/dichVuApi';
import { getAllApi as getAllBenhNhanApi } from '../../../api/benhNhanApi';
import { getShiftsByNhanVienApi } from '../../../api/shiftApi';
import { getAllCaLamDanhMucApi } from '../../../api/caLamDanhMucApi';
import WorkScheduleDateCalendar from '../../../components/WorkScheduleDateCalendar';
import { useNotification } from '../../../components/NotificationContext';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const MODAL_STYLE = `
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

const selectStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#f9fafb',
  border: '1.5px solid #e5e7eb',
  borderRadius: '0.75rem',
  fontSize: 12,
  color: '#374151',
  outline: 'none',
  boxSizing: 'border-box'
};

const formatDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getVietnameseDayFromDate = (dateStr) => {
  if (!dateStr) return '';
  return ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date(`${dateStr}T12:00:00`).getDay()];
};

const getUniqueWorkingDays = (shifts) => {
  if (!Array.isArray(shifts) || shifts.length === 0) return [];
  const order = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  return [...new Set(shifts.map((shift) => shift?.thu).filter(Boolean))]
    .sort((left, right) => order.indexOf(left) - order.indexOf(right));
};

const normalizeRoomName = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const getAssignedRoomOptions = ({ doctorShifts, selectedDate, selectedCaId, chuyenKhoaId, phongList }) => {
  const catalog = Array.isArray(phongList) ? phongList : [];
  const selectedDayName = selectedDate ? getVietnameseDayFromDate(selectedDate) : '';

  const candidateAssignments = Array.isArray(doctorShifts)
    ? doctorShifts.filter((shift) => {
        const matchesDate = !selectedDate || shift?.ngay === selectedDate || (!shift?.ngay && shift?.thu === selectedDayName);
        const matchesCa = !selectedCaId || String(shift?.ca?.id ?? shift?.maCa ?? shift?.maCaMacDinh ?? '') === String(selectedCaId);
        const matchesDepartment = !chuyenKhoaId || String(shift?.maChuyenKhoa ?? '') === String(chuyenKhoaId) || !shift?.maChuyenKhoa;
        return matchesDate && matchesCa && matchesDepartment;
      })
    : [];

  const assignedRoomNames = new Set(
    candidateAssignments
      .map((shift) => normalizeRoomName(shift?.phong || shift?.tenPhong || shift?.phongLamViec))
      .filter(Boolean)
  );

  const filteredCatalog = catalog.filter((room) => {
    const sameDepartment = !chuyenKhoaId || String(room?.maChuyenKhoa) === String(chuyenKhoaId);
    if (!sameDepartment) return false;
    if (assignedRoomNames.size === 0) return true;
    const roomName = normalizeRoomName(room?.tenPhong || room?.ten_phong);
    return assignedRoomNames.has(roomName);
  });

  if (filteredCatalog.length > 0) return filteredCatalog;
  return catalog.filter((room) => !chuyenKhoaId || String(room?.maChuyenKhoa) === String(chuyenKhoaId));
};

const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  const today = new Date();
  const target = new Date(`${dateStr}T12:00:00`);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return <span className="text-[10px] text-red-400 font-medium">Đã qua</span>;
  if (diff === 0) return <span className="text-[10px] text-emerald-500 font-bold">Hôm nay</span>;
  if (diff === 1) return <span className="text-[10px] text-indigo-500 font-medium">Ngày mai</span>;
  return <span className="text-[10px] text-gray-400">Còn {diff} ngày</span>;
};

const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

const isDoctor = (doc) => {
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

const getShiftId = (shift) => shift?.ca?.id ?? shift?.maCa ?? shift?.maCaMacDinh ?? null;

const getAvailableShiftIds = (shifts, dateStr) => {
  if (!dateStr || !Array.isArray(shifts)) return [];
  const date = new Date(`${dateStr}T12:00:00`);
  const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = dayNames[date.getDay()];
  const rowsOnDate = shifts.filter(shift => shift?.ngay === dateStr);
  if (rowsOnDate.some(shift => shift?.kieuPhanCong === 'THEO_NGAY' && shift?.hanhDong === 'NGHI_PHEP')) return [];

  const replacement = rowsOnDate.filter(shift => shift?.kieuPhanCong === 'THEO_NGAY' && shift?.hanhDong === 'THAY_THE');
  const extra = rowsOnDate.filter(shift => shift?.kieuPhanCong === 'THEO_NGAY' && shift?.hanhDong === 'THEM');
  const defaults = shifts.filter(shift => shift?.kieuPhanCong === 'MAC_DINH'
    && (shift?.ngay === dateStr || (!shift?.ngay && shift?.thu === dayName)));
  const rows = replacement.length > 0 ? [...replacement, ...extra] : [...defaults, ...extra];
  return [...new Set(rows.map(getShiftId).filter(Boolean).map(Number))];
};

const STATUS_CONFIG = {
  CHUA_DEN: { label: 'Chưa đến', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  DA_DEN: { label: 'Đã đến', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  HOAN: { label: 'Hoãn', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
};

const NGUON_TAO_CONFIG = {
  TAI_KHAM: { label: 'Tái khám', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  DAT_LICH_APP: { label: 'Đặt lịch app', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
};

const StatusDropdown = ({ appointment, onUpdate }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const config = STATUS_CONFIG[appointment.trangThai] || {};

  const handleChange = async (status) => {
    setOpen(false);
    if (status === appointment.trangThai) return;
    setLoading(true);
    try {
      await onUpdate(appointment.id, { ...appointment, trangThai: status });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button type="button" onClick={() => setOpen((value) => !value)} disabled={loading} className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full border cursor-pointer hover:opacity-80 ${config.cls || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
        {loading ? <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <span className={`w-1.5 h-1.5 rounded-full ${config.dot || 'bg-gray-400'}`} />}
        {config.label || appointment.trangThai}
        <span className="material-symbols-outlined text-[12px]">expand_more</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl">
          {Object.entries(STATUS_CONFIG).map(([status, item]) => (
            <button key={status} type="button" onClick={() => handleChange(status)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-gray-50">
              <span className={`w-2 h-2 rounded-full ${item.dot}`} />
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Create/Update Modal (Portal) ─── */
const AppointmentModal = ({ formData, setFormData, onClose, onCreate, getMinDate, patient, chuyenKhoaList, dichVuList, benhNhanList, phongList, creating, doctorShifts, availableCaList, mode = 'create', nhanVienList = [], onBacSiChange, hoanLich = false, setHoanLich, lyDoHoan = '', setLyDoHoan, originalDate = '' }) => {
  const isUpdate = mode === 'update';
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientList, setShowPatientList] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [bacSiChangeWarning, setBacSiChangeWarning] = useState('');
  // Lưu bác sĩ + ngày ban đầu khi mở modal — để tính diff lúc submit
  const initialBacSiRef = useRef(formData.maBacSi);
  const initialDateRef = useRef(formData.ngayTaiKham);

  // Khi đổi bác sĩ: kiểm tra ngày hiện tại còn hợp lệ với bác sĩ mới không.
  // Nếu KHÔNG → reset ngày + ca, báo người dùng chọn lại.
  useEffect(() => {
    if (!isUpdate) return;
    if (String(formData.maBacSi) === String(initialBacSiRef.current)) return; // chưa đổi bác sĩ
    if (!formData.ngayTaiKham) return; // ngày đã bị reset rồi

    if (Array.isArray(doctorShifts) && doctorShifts.length > 0) {
      const availableIds = getAvailableShiftIds(doctorShifts, formData.ngayTaiKham);
      if (availableIds.length === 0) {
        // Bác sĩ mới không làm việc vào ngày đang chọn → reset ngày + ca, bắt chọn lại
        setBacSiChangeWarning(
          `Bác sĩ mới không làm việc vào ngày ${formatDateDisplay(formData.ngayTaiKham)}. Vui lòng chọn ngày khác.`
        );
        setFormData(prev => ({ ...prev, ngayTaiKham: '', maCa: '' }));
        clearError('ngayTaiKham');
        clearError('maCa');
      } else {
        setBacSiChangeWarning('');
      }
    }
  }, [doctorShifts, formData.ngayTaiKham, isUpdate, formData.maBacSi]);

  const errorStyle = { borderColor: '#ef4444', background: '#fef2f2' };

  const clearError = (key) => {
    setFormErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Normalize ngày — cắt bỏ phần giờ nếu có (ISO datetime → yyyy-MM-dd)
  const normalizeDate = (v) => v ? String(v).split('T')[0] : '';

  // Tính xem người dùng có đổi ngày so với ngày gốc không
  const oldDate = normalizeDate(originalDate);
  const newDate = normalizeDate(formData.ngayTaiKham);
  const dateChanged = isUpdate && newDate !== '' && newDate !== oldDate;

  // Nút Lưu chỉ disable khi: đổi ngày mà chưa tick "Hoãn"
  const canSave = !dateChanged || hoanLich;

  const validateAndSubmit = () => {
    const errors = {};
    // Validate đầy đủ mọi field — không phân nhánh theo hoanLich
    if (!formData.maBenhNhan) errors.maBenhNhan = 'Chưa chọn bệnh nhân';
    if (!formData.maChuyenKhoa) errors.maChuyenKhoa = 'Chưa chọn chuyên khoa';
    if (!formData.maPhong) errors.maPhong = 'Chưa chọn phòng khám';
    if (!formData.maDichVu) errors.maDichVu = 'Chưa chọn dịch vụ';
    if (nhanVienList.length > 0 && !formData.maBacSi) errors.maBacSi = 'Chưa chọn bác sĩ';
    if (!formData.ngayTaiKham) errors.ngayTaiKham = 'Chưa chọn ngày khám';
    if (!formData.maCa) errors.maCa = 'Chưa chọn ca khám';
    // Tick "Hoãn" → trạng thái HOAN, bắt buộc nhập lý do
    if (isUpdate && hoanLich && !lyDoHoan?.trim()) {
      errors.lyDoHoan = 'Vui lòng nhập lý do hoãn lịch';
    }
    // Đổi ngày mà chưa tick "Hoãn" → chặn
    if (dateChanged && !hoanLich) {
      errors.ngayTaiKham = 'Bạn đã đổi ngày khám. Vui lòng tick "Hoãn lịch" và nhập lý do để lưu.';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      onCreate();
    }
  };

  // Lọc dịch vụ theo chuyên khoa đã chọn
  const filteredDichVus = formData.maChuyenKhoa
    ? dichVuList.filter(dv => String(dv.maChuyenKhoa) === String(formData.maChuyenKhoa))
    : dichVuList;

  // Lọc bác sĩ theo chuyên khoa đã chọn (chỉ khi có nhanVienList — lễ tân)
  const filteredBacSiList = nhanVienList.length > 0
    ? nhanVienList.filter(nv => {
        if (!isDoctor(nv)) return false;
        if (!formData.maChuyenKhoa) return true;
        return String(nv.chuyenKhoa ?? nv.maChuyenKhoa ?? '') === String(formData.maChuyenKhoa);
      })
    : [];

  const filteredPhongList = getAssignedRoomOptions({
    doctorShifts,
    selectedDate: formData.ngayTaiKham,
    selectedCaId: formData.maCa,
    chuyenKhoaId: formData.maChuyenKhoa,
    phongList,
  });

  // Lọc bệnh nhân theo từ khóa
  const filteredBenhNhans = benhNhanList.filter(bn =>
    !patientSearch
    || (bn.hoTen || '').toLowerCase().includes(patientSearch.toLowerCase())
    || String(bn.maBenhNhan).includes(patientSearch)
    || (bn.soDienThoai || '').toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 8);

  const selectedChuyenKhoa = chuyenKhoaList.find(c => String(c.maChuyenKhoa) === String(formData.maChuyenKhoa));
  const selectedDichVu = dichVuList.find(d => String(d.maDichVu) === String(formData.maDichVu));

  return ReactDOM.createPortal(
    <>
      <style>{MODAL_STYLE}</style>
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(8px)',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%', maxWidth: '1100px',
            background: '#fff', borderRadius: '1.5rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            animation: 'modalIn 0.28s cubic-bezier(.34,1.56,.64,1) both',
            margin: 'auto'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>calendar_add_on</span>
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff', margin: 0 }}>{isUpdate ? 'Cập nhật lịch khám' : 'Tạo lịch hẹn tái khám'}</h3>
                <p style={{ color: 'rgba(199,210,254,0.9)', fontSize: 12, margin: '2px 0 0' }}>
                  {patient ? `Bệnh nhân: ${patient.hoTen || 'N/A'}` : 'Điền đầy đủ thông tin bên dưới'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '0.625rem', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '220px minmax(0, 1fr)', gap: '0.75rem', alignItems: 'start' }}>
            {/* Cột trái: bệnh nhân, chuyên khoa, dịch vụ */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Chọn bệnh nhân - only when no patient from exam view */}
            {patient ? (
              <div style={{ padding: '0.75rem 1rem', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#16a34a' }}>person</span>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#166534' }}>{patient.hoTen || 'N/A'}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#15803d' }}>Mã BN: {patient.maBenhNhan} • Tự động từ phiếu khám</p>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>person_search</span>
                  Chọn bệnh nhân <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => { setPatientSearch(e.target.value); setShowPatientList(true); }}
                    onFocus={() => setShowPatientList(true)}
                    onBlur={() => setTimeout(() => setShowPatientList(false), 200)}
                    placeholder="Tìm theo tên, mã BN hoặc SĐT..."
                    style={{ ...selectStyle, paddingLeft: '2.5rem' }}
                  />
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#9ca3af' }}>search</span>
                  {showPatientList && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6, background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: '0.75rem', boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 20, maxHeight: 240, overflowY: 'auto' }}>
                      {filteredBenhNhans.length === 0 ? (
                        <div style={{ padding: '0.75rem 1rem', fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>Không tìm thấy bệnh nhân</div>
                      ) : filteredBenhNhans.map(bn => (
                        <button
                          key={bn.maBenhNhan}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, maBenhNhan: bn.maBenhNhan, tenBenhNhan: bn.hoTen });
                            setPatientSearch(bn.hoTen);
                            setShowPatientList(false);
                            clearError('maBenhNhan');
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', padding: '0.6rem 0.9rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{ width: 32, height: 32, borderRadius: '0.625rem', background: 'linear-gradient(135deg, #818cf8, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {(bn.hoTen || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1f2937' }}>{bn.hoTen}</p>
                            <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9ca3af' }}>Mã #{bn.maBenhNhan} {bn.soDienThoai ? `• ${bn.soDienThoai}` : ''}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.maBenhNhan && (
                  <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                    {formErrors.maBenhNhan}
                  </p>
                )}
              </div>
            )}

            {/* Chọn chuyên khoa */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>local_hospital</span>
                Chuyên khoa <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.maChuyenKhoa || ''}
                onChange={e => {
                  const maChuyenKhoa = e.target.value ? Number(e.target.value) : '';
                  setFormData({ ...formData, maChuyenKhoa, maDichVu: '', maBacSi: '', maPhong: '', ngayTaiKham: '', maCa: '' });
                  if (onBacSiChange) onBacSiChange('');
                  clearError('maChuyenKhoa');
                }}
                style={formErrors.maChuyenKhoa ? { ...selectStyle, ...errorStyle } : selectStyle}
              >
                <option value="">-- Chọn chuyên khoa --</option>
                {chuyenKhoaList.map(ck => (
                  <option key={ck.maChuyenKhoa} value={ck.maChuyenKhoa}>{ck.tenChuyenKhoa}</option>
                ))}
              </select>
              {formErrors.maChuyenKhoa && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.maChuyenKhoa}
                </p>
              )}
              {selectedChuyenKhoa && (
                <p style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>
                  {selectedChuyenKhoa.tenChuyenKhoa}
                </p>
              )}
            </div>

            {/* Chọn phòng — luôn editable */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>meeting_room</span>
                Phòng khám <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.maPhong || ''}
                onChange={e => { setFormData({ ...formData, maPhong: e.target.value ? Number(e.target.value) : '' }); clearError('maPhong'); }}
                style={formErrors.maPhong ? { ...selectStyle, ...errorStyle } : selectStyle}
                disabled={!formData.maChuyenKhoa || (nhanVienList.length > 0 && !formData.maBacSi)}
              >
                <option value="">
                  {!formData.maChuyenKhoa
                    ? '-- Chọn chuyên khoa trước --'
                    : (nhanVienList.length > 0 && !formData.maBacSi)
                      ? '-- Chọn bác sĩ trước --'
                      : '-- Chọn phòng --'}
                </option>
                {filteredPhongList.map(room => (
                  <option key={room.maPhong} value={room.maPhong}>
                    {room.tenPhong}
                  </option>
                ))}
              </select>
              {formErrors.maPhong && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.maPhong}
                </p>
              )}
              {filteredPhongList.length === 0 && formData.maChuyenKhoa && (
                <p style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
                  Chuyên khoa này chưa có phòng được cấu hình.
                </p>
              )}
            </div>

            {/* Chọn dịch vụ — luôn editable */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>medical_services</span>
                Dịch vụ <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.maDichVu || ''}
                onChange={e => { setFormData({ ...formData, maDichVu: e.target.value ? Number(e.target.value) : '' }); clearError('maDichVu'); }}
                style={formErrors.maDichVu ? { ...selectStyle, ...errorStyle } : selectStyle}
                disabled={!formData.maChuyenKhoa}
              >
                <option value="">{formData.maChuyenKhoa ? '-- Chọn dịch vụ --' : '-- Chọn chuyên khoa trước --'}</option>
                {filteredDichVus.map(dv => (
                  <option key={dv.maDichVu} value={dv.maDichVu}>
                    {dv.tenDichVu}{dv.donGia ? ` - ${new Intl.NumberFormat('vi-VN').format(dv.donGia)}đ` : ''}
                  </option>
                ))}
              </select>
              {formErrors.maDichVu && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.maDichVu}
                </p>
              )}
              {selectedDichVu && (
                <p style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check_circle</span>
                  {selectedDichVu.tenDichVu}{selectedDichVu.donGia ? ` • ${new Intl.NumberFormat('vi-VN').format(selectedDichVu.donGia)}đ` : ''}
                </p>
              )}
            </div>

            {/* Chọn bác sĩ — CHỈ hiển thị khi có nhanVienList (lễ tân), luôn editable */}
            {nhanVienList.length > 0 && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>stethoscope</span>
                  Bác sĩ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.maBacSi ?? ''}
                  onChange={e => {
                    const maBacSi = e.target.value ? Number(e.target.value) : '';
                    // Khi đổi bác sĩ: reset ca khám (ca cũ có thể không thuộc lịch bác sĩ mới)
                    // Giữ nguyên ngày khám (disabled trong nhánh không hoãn)
                    setFormData({ ...formData, maBacSi, maPhong: '', maCa: '' });
                    if (onBacSiChange) onBacSiChange(maBacSi);
                    clearError('maBacSi');
                  }}
                  style={formErrors.maBacSi ? { ...selectStyle, ...errorStyle } : selectStyle}
                  disabled={!formData.maChuyenKhoa}
                >
                  <option value="">{formData.maChuyenKhoa ? '-- Chọn bác sĩ --' : '-- Chọn chuyên khoa trước --'}</option>
                  {filteredBacSiList.map(nv => (
                    <option key={nv.maNhanVien} value={nv.maNhanVien}>{nv.hoTen}</option>
                  ))}
                </select>
                {formData.maChuyenKhoa && filteredBacSiList.length === 0 && (
                  <p style={{ fontSize: 10, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>warning</span>
                    Chuyên khoa này chưa có bác sĩ được cấu hình.
                  </p>
                )}
                {formErrors.maBacSi && (
                  <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                    {formErrors.maBacSi}
                  </p>
                )}
              </div>
            )}
            </div>
            {/* /Cột trái */}

            {/* Cột phải: ngày tái khám + ghi chú */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Ngày tái khám — luôn editable */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>event</span>
                Ngày tái khám <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <WorkScheduleDateCalendar
                selectedDate={formData.ngayTaiKham}
                minDateStr={getMinDate()}
                shifts={doctorShifts}
                onSelect={(dateStr) => {
                  setFormData(prev => ({ ...prev, ngayTaiKham: dateStr, maCa: '' }));
                  clearError('ngayTaiKham');
                  clearError('maCa');
                }}
              />
              {formErrors.ngayTaiKham && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.ngayTaiKham}
                </p>
              )}
              {formData.ngayTaiKham && (
                <p style={{ fontSize: 11, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6, fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event_available</span>
                  Đã chọn: {formatDateDisplay(formData.ngayTaiKham)} ({getVietnameseDayFromDate(formData.ngayTaiKham)})
                </p>
              )}
              {doctorShifts && doctorShifts.length > 0 && (
                <p style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>calendar_month</span>
                  Bác sĩ làm việc: <strong>{getUniqueWorkingDays(doctorShifts).join(', ')}</strong>
                </p>
              )}
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>schedule</span>
                Ca khám <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={formData.maCa || ''}
                onChange={e => { setFormData({ ...formData, maCa: e.target.value ? Number(e.target.value) : '' }); clearError('maCa'); }}
                disabled={!formData.ngayTaiKham}
                style={formErrors.maCa ? { ...selectStyle, ...errorStyle } : selectStyle}
              >
                <option value="">{formData.ngayTaiKham ? '-- Chọn ca khám --' : '-- Chọn ngày trước --'}</option>
                {availableCaList.map(ca => (
                  <option key={ca.id} value={ca.id}>{ca.tenCa} ({ca.gioBatDau} - {ca.gioKetThuc})</option>
                ))}
              </select>
              {formData.ngayTaiKham && availableCaList.length === 0 && (
                <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>Bác sĩ không có ca phù hợp trong ngày đã chọn.</p>
              )}
              {formErrors.maCa && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.maCa}
                </p>
              )}
            </div>

            {/* Ghi chú — luôn editable */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#818cf8' }}>notes</span>
                Ghi chú
              </label>
              <textarea
                value={formData.ghiChu}
                onChange={e => setFormData({ ...formData, ghiChu: e.target.value })}
                rows={3}
                placeholder="Ghi chú thêm về lịch hẹn..."
                style={{ width: '100%', padding: '0.75rem 1rem', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '0.75rem', fontSize: 14, color: '#374151', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            {/* Hoãn lịch — chỉ hiển thị trong mode update */}
            {isUpdate && setHoanLich && (
              <div style={{ padding: '0.75rem 1rem', background: hoanLich ? '#fffbeb' : '#f8fafc', border: `1.5px solid ${hoanLich ? '#f59e0b' : '#e2e8f0'}`, borderRadius: '0.75rem', transition: 'all 0.2s' }}>
                {bacSiChangeWarning && (
                  <div style={{ padding: '0.6rem 0.85rem', background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '0.625rem', fontSize: 12, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>warning</span>
                    {bacSiChangeWarning}
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: hoanLich ? '#b45309' : '#374151' }}>
                  <input
                    type="checkbox"
                    checked={hoanLich}
                    onChange={e => {
                      setHoanLich(e.target.checked);
                      if (!e.target.checked) setLyDoHoan?.('');
                    }}
                    style={{ width: 16, height: 16, accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: hoanLich ? '#f59e0b' : '#9ca3af' }}>event_repeat</span>
                  Hoãn lịch
                </label>
                {/* Lý do hoãn — chỉ hiển thị khi tick "Hoãn lịch" */}
                {hoanLich && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      value={lyDoHoan}
                      onChange={e => { setLyDoHoan?.(e.target.value); if (formErrors.lyDoHoan) clearError('lyDoHoan'); }}
                      rows={2}
                      placeholder="Nhập lý do hoãn lịch..."
                      style={{ width: '100%', padding: '0.6rem 0.85rem', background: '#fff', border: `1.5px solid ${formErrors.lyDoHoan ? '#ef4444' : '#fcd34d'}`, borderRadius: '0.625rem', fontSize: 13, color: '#374151', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#f59e0b'}
                      onBlur={e => e.target.style.borderColor = formErrors.lyDoHoan ? '#ef4444' : '#fcd34d'}
                    />
                    {formErrors.lyDoHoan && (
                      <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                        {formErrors.lyDoHoan}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            </div>
            {/* /Cột phải */}
          </div>

          {/* Footer */}
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              disabled={creating}
              style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: 14, color: '#4b5563', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.5 : 1 }}
            >
              Hủy bỏ
            </button>
            <button
              onClick={validateAndSubmit}
              disabled={creating || !canSave}
              style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: 14, color: '#fff', cursor: (creating || !canSave) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 15px rgba(79,70,229,0.35)', opacity: (creating || !canSave) ? 0.5 : 1 }}
            >
              {creating ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
              )}
              {creating ? (isUpdate ? 'Đang lưu...' : 'Đang tạo...') : (isUpdate ? 'Lưu thay đổi' : 'Xác nhận tạo')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

/* ─── Cancel Modal (Portal) ─── */
const CancelModal = ({ onClose, onConfirm, lyDo, setLyDo, deletingId }) =>
  ReactDOM.createPortal(
    <>
      <style>{MODAL_STYLE}</style>
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(8px)',
          boxSizing: 'border-box'
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%', maxWidth: '460px',
            background: '#fff', borderRadius: '1.5rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            animation: 'modalIn 0.28s cubic-bezier(.34,1.56,.64,1) both'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)', padding: '1.25rem 1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>event_busy</span>
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', margin: 0 }}>Hủy lịch hẹn</h3>
                <p style={{ color: 'rgba(254,226,226,0.9)', fontSize: 12, margin: '2px 0 0' }}>
                  Bác sĩ hủy lịch - sẽ thông báo cho bệnh nhân
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: '0.9rem', right: '0.9rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.625rem', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#f87171' }}>notes</span>
              Lý do hủy <span style={{ color: '#f87171' }}>*</span>
            </label>
            <textarea
              value={lyDo}
              onChange={e => setLyDo(e.target.value)}
              rows={4}
              placeholder="VD: Bác sĩ nghỉ phép / thiết bị bảo trì / bệnh nhân đổi lịch..."
              style={{ width: '100%', padding: '0.85rem 1rem', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '0.75rem', fontSize: 14, color: '#374151', outline: 'none', boxSizing: 'border-box', resize: 'none' }}
              onFocus={e => e.target.style.borderColor = '#f87171'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Footer */}
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              disabled={deletingId !== null}
              style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: 14, color: '#4b5563', cursor: 'pointer', opacity: deletingId !== null ? 0.5 : 1 }}
            >
              Quay lại
            </button>
            <button
              onClick={onConfirm}
              disabled={deletingId !== null}
              style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #dc2626, #f87171)', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: 14, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 15px rgba(220,38,38,0.35)', opacity: deletingId !== null ? 0.6 : 1 }}
            >
              {deletingId !== null ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_busy</span>
              )}
              {deletingId !== null ? 'Đang hủy...' : 'Xác nhận hủy'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );

/* ─── Reschedule Modal (Portal) — Hoãn lịch khám ─── */
const RescheduleModal = ({ appointment, onClose, onConfirm, ngayMoi, setNgayMoi, maCa, setMaCa, lyDo, setLyDo, rescheduling, doctorShifts, availableCaList }) => {
  const [formErrors, setFormErrors] = useState({});

  const errorStyle = { borderColor: '#ef4444', background: '#fef2f2' };

  const clearError = (key) => {
    setFormErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateAndSubmit = () => {
    const errors = {};
    if (!ngayMoi) errors.ngayMoi = 'Chưa chọn ngày khám mới';
    if (!maCa) errors.maCa = 'Chưa chọn ca khám mới';
    if (!lyDo || !lyDo.trim()) errors.lyDo = 'Vui lòng nhập lý do hoãn lịch';
    setFormErrors(errors);
    if (Object.keys(errors).length === 0) {
      onConfirm();
    }
  };

  const getMinDate = () => {
      const today = formatDateInput(new Date());
      if (appointment?.ngayTaiKham && appointment.ngayTaiKham >= today) return appointment.ngayTaiKham;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  return ReactDOM.createPortal(
    <>
      <style>{MODAL_STYLE}</style>
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem',
          background: 'rgba(15,23,42,0.6)',
          backdropFilter: 'blur(8px)',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
        onClick={onClose}
      >
        <div
          style={{
            width: '100%', maxWidth: '900px',
            background: '#fff', borderRadius: '1.5rem',
            boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            animation: 'modalIn 0.28s cubic-bezier(.34,1.56,.64,1) both',
            margin: 'auto'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '1.25rem 1.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>event_repeat</span>
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', margin: 0 }}>Hoãn lịch khám</h3>
                <p style={{ color: 'rgba(199,210,254,0.9)', fontSize: 12, margin: '2px 0 0' }}>
                  Bác sĩ hoãn lịch - sẽ thông báo cho bệnh nhân
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ position: 'absolute', top: '0.9rem', right: '0.9rem', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '0.625rem', padding: '0.4rem', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#fff' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Thông tin lịch hiện tại */}
            {appointment && (
              <div style={{ padding: '0.75rem 1rem', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '0.75rem' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1f2937' }}>
                  {appointment.tenBenhNhan || `BN#${appointment.maBenhNhan}`}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7280' }}>
                  Ngày khám hiện tại:{' '}
                  <strong style={{ color: '#4f46e5' }}>
                    {appointment.ngayTaiKham ? new Date(appointment.ngayTaiKham).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                  </strong>
                  {appointment.tenChuyenKhoa ? ` • ${appointment.tenChuyenKhoa}` : ''}
                  {appointment.tenCa ? ` • ${appointment.tenCa}` : ''}
                </p>
              </div>
            )}

            {/* Chọn ngày mới */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>event</span>
                Ngày khám mới <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <WorkScheduleDateCalendar
                selectedDate={ngayMoi}
                minDateStr={getMinDate()}
                shifts={doctorShifts}
                onSelect={(dateStr) => { setNgayMoi(dateStr); setMaCa(''); clearError('ngayMoi'); clearError('maCa'); }}
              />
              {formErrors.ngayMoi && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.ngayMoi}
                </p>
              )}
              {ngayMoi && (
                <p style={{ fontSize: 11, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 3, marginTop: 6, fontWeight: 700 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event_available</span>
                  Đã chọn: {formatDateDisplay(ngayMoi)} ({getVietnameseDayFromDate(ngayMoi)})
                </p>
              )}
              {doctorShifts && doctorShifts.length > 0 && (
                <p style={{ fontSize: 10, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>calendar_month</span>
                  Bác sĩ làm việc: <strong>{getUniqueWorkingDays(doctorShifts).join(', ')}</strong>
                </p>
              )}
            </div>

            {/* Lý do hoãn */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#4f46e5' }}>schedule</span>
                Ca khám mới <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={maCa || ''}
                onChange={e => { setMaCa(e.target.value ? Number(e.target.value) : ''); clearError('maCa'); }}
                disabled={!ngayMoi}
                style={formErrors.maCa ? { ...selectStyle, ...errorStyle } : selectStyle}
              >
                <option value="">{ngayMoi ? '-- Chọn ca khám --' : '-- Chọn ngày trước --'}</option>
                {availableCaList.map(ca => (
                  <option key={ca.id} value={ca.id}>{ca.tenCa} ({ca.gioBatDau} - {ca.gioKetThuc})</option>
                ))}
              </select>
              {formErrors.maCa && <p style={{ fontSize: 11, color: '#ef4444', marginTop: 5, fontWeight: 600 }}>{formErrors.maCa}</p>}
            </div>

            {/* Lý do hoãn */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#818cf8' }}>notes</span>
                Lý do hoãn <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={lyDo}
                onChange={e => { setLyDo(e.target.value); clearError('lyDo'); }}
                rows={3}
                placeholder="VD: Bác sĩ nghỉ phép / thiết bị bảo trì / lịch quá tải..."
                style={{ width: '100%', padding: '0.85rem 1rem', background: '#f9fafb', border: '1.5px solid #e5e7eb', borderRadius: '0.75rem', fontSize: 14, color: '#374151', outline: 'none', boxSizing: 'border-box', resize: 'none', ...(formErrors.lyDo ? errorStyle : {}) }}
                onFocus={e => e.target.style.borderColor = '#818cf8'}
                onBlur={e => e.target.style.borderColor = formErrors.lyDo ? '#ef4444' : '#e5e7eb'}
              />
              {formErrors.lyDo && (
                <p style={{ fontSize: 11, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3, marginTop: 5, fontWeight: 600 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>error</span>
                  {formErrors.lyDo}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={onClose}
              disabled={rescheduling}
              style={{ flex: 1, padding: '0.75rem', background: '#f3f4f6', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: 14, color: '#4b5563', cursor: rescheduling ? 'not-allowed' : 'pointer', opacity: rescheduling ? 0.5 : 1 }}
            >
              Quay lại
            </button>
            <button
              onClick={validateAndSubmit}
              disabled={rescheduling}
              style={{ flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', border: 'none', borderRadius: '0.75rem', fontWeight: 700, fontSize: 14, color: '#fff', cursor: rescheduling ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 15px rgba(79,70,229,0.35)', opacity: rescheduling ? 0.6 : 1 }}
            >
              {rescheduling ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" style={{ display: 'inline-block' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>event_repeat</span>
              )}
              {rescheduling ? 'Đang hoãn...' : 'Xác nhận hoãn'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

/* ═══════════════════════════════════════════════════════════════════════ */

const FILTER_OPTS = [
  { value: '', label: 'Tất cả' },
  { value: 'CHUA_DEN', label: 'Chưa đến' },
  { value: 'DA_DEN', label: 'Đã đến' },
  { value: 'HOAN', label: 'Hoãn' },
];

const TabHenTaiKham = ({ user, patient, appointments: externalAppointments }) => {
  const { showSuccess, showError } = useNotification();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLyDo, setCancelLyDo] = useState('');
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleMaCa, setRescheduleMaCa] = useState('');
  const [rescheduleLyDo, setRescheduleLyDo] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Dữ liệu dropdown
  const [chuyenKhoaList, setChuyenKhoaList] = useState([]);
  const [dichVuList, setDichVuList] = useState([]);
  const [phongList, setPhongList] = useState([]);
  const [benhNhanList, setBenhNhanList] = useState([]);
  const [caList, setCaList] = useState([]);

  const [formData, setFormData] = useState({
    maBenhNhan: patient?.maBenhNhan || '',
    maChuyenKhoa: user?.maChuyenKhoa || '',
    maPhong: '',
    maDichVu: '',
    ngayTaiKham: '',
    maCa: '',
    ghiChu: ''
  });

  // Lịch làm việc (các thứ trong tuần) của bác sĩ hiện tại
  const [doctorShifts, setDoctorShifts] = useState([]);

  // Load lịch làm việc của bác sĩ đang đăng nhập
  useEffect(() => {
    const loadDoctorShifts = async () => {
      if (!user?.maNhanVien) return;
      try {
        const shifts = await getShiftsByNhanVienApi(user.maNhanVien);
        setDoctorShifts(Array.isArray(shifts) ? shifts : []);
      } catch (err) {
        console.error('Error loading doctor shifts:', err);
        setDoctorShifts([]);
      }
    };
    loadDoctorShifts();
  }, [user?.maNhanVien]);

  // Load dropdown data
  useEffect(() => {
    const loadDropdowns = async () => {
      try {
        const [ck, dv, ph, bn, ca] = await Promise.all([
          getAllChuyenKhoaApi(),
          getAllDichVuApi(),
          getAllPhongApi(),
          getAllBenhNhanApi(),
          getAllCaLamDanhMucApi()
        ]);
        const normalizedPhongList = Array.isArray(ph) ? ph : [];
        setChuyenKhoaList(ck || []);
        setDichVuList(dv || []);
        setPhongList(normalizedPhongList);
        setBenhNhanList(bn || []);
        setCaList(Array.isArray(ca) ? ca : []);
      } catch (err) {
        console.error('Error loading dropdown data:', err);
      }
    };
    loadDropdowns();
  }, []);

  useEffect(() => {
    if (!formData.maChuyenKhoa) {
      setFormData(prev => ({ ...prev, maPhong: '' }));
      return;
    }

    const matchingRooms = getAssignedRoomOptions({
      doctorShifts,
      selectedDate: formData.ngayTaiKham,
      selectedCaId: formData.maCa,
      chuyenKhoaId: formData.maChuyenKhoa,
      phongList,
    });

    if (!matchingRooms.length) {
      setFormData(prev => ({ ...prev, maPhong: '' }));
      return;
    }

    setFormData(prev => {
      if (!prev.maPhong || !matchingRooms.some(room => Number(room.maPhong) === Number(prev.maPhong))) {
        return { ...prev, maPhong: matchingRooms[0].maPhong };
      }
      return prev;
    });
  }, [formData.maChuyenKhoa, formData.ngayTaiKham, formData.maCa, doctorShifts, phongList]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Nếu có externalAppointments (truyền từ ngoài — ví dụ từ LichKham lễ tân)
      // thì dùng trực tiếp, không gọi getByDoctorApi() (vì lễ tân không có maChuyenKhoa trong JWT)
      const data = externalAppointments && externalAppointments.length > 0
        ? externalAppointments
        : await getByDoctorApi();
      // Tab trong màn hình khám bệnh: chỉ hiển thị lịch hẹn của bệnh nhân ĐANG KHÁM
      const filtered = patient?.maBenhNhan
        ? (data || []).filter(a => Number(a.maBenhNhan) === Number(patient.maBenhNhan))
        : (data || []);
      setAppointments(filtered);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [patient, externalAppointments]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const openModal = () => {
    setFormData({
      maBenhNhan: patient?.maBenhNhan || '',
      tenBenhNhan: patient?.hoTen || '',
      maChuyenKhoa: user?.maChuyenKhoa || '',
      maPhong: '',
      maDichVu: '',
      ngayTaiKham: '',
      maCa: '',
      ghiChu: ''
    });
    setShowModal(true);
  };

  const handleCreate = async () => {
    if (creating) return;
    if (!formData.maBenhNhan || !formData.maChuyenKhoa || !formData.maPhong || !formData.maDichVu || !formData.ngayTaiKham || !formData.maCa) {
      showError('Vui lòng nhập đầy đủ thông tin (bệnh nhân, chuyên khoa, phòng, dịch vụ, ngày)');
      return;
    }
    // Kiểm tra lại ngày tái khám có khớp với lịch làm việc của bác sĩ
    const selectedDay = getVietnameseDayFromDate(formData.ngayTaiKham);
    const workingDays = getUniqueWorkingDays(doctorShifts);
    if (workingDays.length > 0 && !workingDays.includes(selectedDay)) {
      showError(`Ngày ${selectedDay} không nằm trong lịch làm việc của bác sĩ. Bác sĩ làm việc vào các ngày: ${workingDays.join(', ')}`);
      return;
    }
    setCreating(true);
    try {
      await createApi({
        maBenhNhan: Number(formData.maBenhNhan),
        maChuyenKhoa: Number(formData.maChuyenKhoa),
        maPhong: Number(formData.maPhong),
        maDichVu: Number(formData.maDichVu),
        maNhanVien: Number(user?.maNhanVien),
        maPhieuKham: patient?.maPhieuKham,
        ngayTaiKham: formData.ngayTaiKham,
        maCa: Number(formData.maCa),
        trangThai: 'CHUA_DEN',
        nguonTao: 'TAI_KHAM',
        ghiChu: formData.ghiChu
      });
      showSuccess('Đã tạo lịch hẹn tái khám thành công!');
      setShowModal(false);
      fetchData();
    } catch (err) {
      showError('Lỗi: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id, data) => {
    try {
      await updateApi(id, data);
      showSuccess('Đã cập nhật trạng thái!');
      fetchData();
    } catch (err) {
      showError('Lỗi: ' + err.message);
    }
  };

  const openCancelModal = (id) => {
    setCancelTarget(id);
    setCancelLyDo('');
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelLyDo('');
  };

  const confirmCancel = async () => {
    const lyDoFinal = cancelLyDo.trim();
    if (!lyDoFinal) {
      showError('Vui lòng nhập lý do hủy lịch hẹn');
      return;
    }
    setDeletingId(cancelTarget);
    try {
      await updateApi(cancelTarget, {
        trangThai: 'HUY',
        ghiChu: lyDoFinal
      });
      showSuccess('Đã hủy lịch hẹn và thông báo cho bệnh nhân');
      closeCancelModal();
      fetchData();
    } catch (err) {
      showError('Lỗi: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const openRescheduleModal = (appointment) => {
    setRescheduleTarget(appointment);
    setRescheduleDate('');
    setRescheduleMaCa('');
    setRescheduleLyDo('');
  };

  const closeRescheduleModal = () => {
    setRescheduleTarget(null);
    setRescheduleDate('');
    setRescheduleMaCa('');
    setRescheduleLyDo('');
  };

  const confirmReschedule = async () => {
    if (rescheduling) return;
    if (!rescheduleDate) {
      showError('Vui lòng chọn ngày khám mới');
      return;
    }
    const lyDoFinal = rescheduleLyDo.trim();
    if (!lyDoFinal) {
      showError('Vui lòng nhập lý do hoãn lịch');
      return;
    }
    setRescheduling(true);
    try {
      await hoanLichApi(rescheduleTarget.id, {
        ngayTaiKham: rescheduleDate,
        maCa: Number(rescheduleMaCa),
        lyDo: lyDoFinal
      });
      showSuccess('Đã hoãn lịch và thông báo cho bệnh nhân');
      closeRescheduleModal();
      fetchData();
    } catch (err) {
      showError('Lỗi: ' + err.message);
    } finally {
      setRescheduling(false);
    }
  };

  const getAvailableCa = (dateStr) => {
    const ids = getAvailableShiftIds(doctorShifts, dateStr);
    return caList.filter(ca => ids.includes(Number(ca.id)));
  };

  /* ── Derived ── */
  const stats = {
    total: appointments.length,
    chuaDen: appointments.filter(a => a.trangThai === 'CHUA_DEN').length,
    daDen: appointments.filter(a => a.trangThai === 'DA_DEN').length,
    hoan: appointments.filter(a => a.trangThai === 'HOAN').length,
  };

  // Bọc filter trong useCallback để reference ổn định giữa các render,
  // tránh bị reset trang về 1 mỗi lần re-render (lỗi không chuyển trang được)
  const appointmentFilters = useCallback((a) => {
    const matchStatus = !filterStatus || a.trangThai === filterStatus;
    const matchDate = !filterDate || a.ngayTaiKham === filterDate;
    const matchChuyenKhoa = !user?.maChuyenKhoa || a.maChuyenKhoa === user.maChuyenKhoa;
    return matchStatus && matchDate && matchChuyenKhoa;
  }, [filterStatus, filterDate, user]);

  // Filter + search + phân trang dùng chung
  const {
    filteredData: filtered,
    paginatedData: paginated,
    totalItems: filteredCount,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
    pageError,
  } = usePagination({
    data: appointments,
    pageSize: 8,
    searchKeys: ['tenBenhNhan', 'maBenhNhan', 'tenChuyenKhoa', 'tenDichVu', 'tenNhanVien', 'tenPhong'],
    searchTerm: search,
    filters: appointmentFilters,
  });

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header + Stats ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-100">
              <span className="material-symbols-outlined text-white text-[22px]">calendar_month</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Lịch Hẹn Tái Khám</h2>
              <p className="text-sm text-gray-400 mt-0.5">Quản lý lịch hẹn tái khám cho bệnh nhân</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
              title="Làm mới"
            >
              <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
            <button
              onClick={openModal}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-violet-700 transition-all shadow-md shadow-indigo-200 flex items-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tạo lịch hẹn
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-100">
          {[
            { label: 'Tổng lịch hẹn', value: stats.total, filterValue: '', icon: 'calendar_month', color: 'text-indigo-600 bg-indigo-50' },
            { label: 'Chưa đến', value: stats.chuaDen, filterValue: 'CHUA_DEN', icon: 'schedule', color: 'text-amber-600 bg-amber-50' },
            { label: 'Đã đến', value: stats.daDen, filterValue: 'DA_DEN', icon: 'check_circle', color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Đã hoãn', value: stats.hoan, filterValue: 'HOAN', icon: 'cancel', color: 'text-red-500 bg-red-50' },
          ].map(s => (
            <button
              key={s.label}
              onClick={() => { setCurrentPage(1); setFilterStatus(prev => prev === s.filterValue ? '' : s.filterValue); }}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-indigo-200 transition-all text-left"
            >
              <span className={`material-symbols-outlined text-[20px] p-2 rounded-lg ${s.color}`}>{s.icon}</span>
              <div>
                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
                <p className="text-xl font-black text-gray-800 leading-tight">{s.value}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Search + Filter bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-[18px]">search</span>
            <input
              type="text"
              value={search}
              onChange={e => { setCurrentPage(1); setSearch(e.target.value); }}
              placeholder="Tìm bệnh nhân, chuyên khoa, dịch vụ, bác sĩ..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm"
            />
            {search && (
              <button onClick={() => { setCurrentPage(1); setSearch(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Date filter */}
        <div className="relative">
          <input
            type="date"
            value={filterDate}
            onChange={e => { setCurrentPage(1); setFilterDate(e.target.value); }}
            className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm"
            title="Lọc theo ngày tái khám"
          />
          {filterDate && (
            <button
              onClick={() => { setCurrentPage(1); setFilterDate(''); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              title="Xóa lọc ngày"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Status filter dropdown */}
        <select
          value={filterStatus}
          onChange={e => { setCurrentPage(1); setFilterStatus(e.target.value); }}
          className="px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all shadow-sm"
          title="Lọc theo trạng thái"
        >
          <option value="">Tất cả trạng thái</option>
          {FILTER_OPTS.filter(o => o.value).map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Status filter pills */}
        <div className="flex items-center gap-2">
          {FILTER_OPTS.map(o => (
            <button
              key={o.value}
              onClick={() => { setCurrentPage(1); setFilterStatus(o.value); }}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${filterStatus === o.value
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                }`}
            >
              {o.label}
              {o.value && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${filterStatus === o.value ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {appointments.filter(a => a.trangThai === o.value).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-indigo-100 border-t-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-gray-400">Đang tải dữ liệu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-200 text-gray-300">
              <span className="material-symbols-outlined text-4xl">{search || filterStatus || filterDate ? 'search_off' : 'calendar_month'}</span>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-500 text-base">
                {search || filterStatus || filterDate ? 'Không tìm thấy kết quả' : 'Chưa có lịch hẹn nào'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search || filterStatus || filterDate ? 'Thử thay đổi từ khóa hoặc bộ lọc' : 'Nhấn "Tạo lịch hẹn" để thêm mới'}
              </p>
            </div>
            {!search && !filterStatus && !filterDate && (
              <button onClick={openModal} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Tạo lịch hẹn
              </button>
            )}
          </div>
        ) : (
          <>
            {/* IN-LIST WARNING */}
            {pageError && (
              <div className="px-5 py-3 bg-rose-50 border-b border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {pageError}
              </div>
            )}
            <div className="px-5 py-3 border-b border-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400 font-medium">
                Hiển thị <span className="font-bold text-gray-700">{filtered.length}</span>
                {filtered.length < appointments.length && <> / {appointments.length}</>} lịch hẹn
              </p>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 460 }}>
              <table className="w-full">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['ID', 'Bệnh nhân', 'Chuyên khoa', 'Dịch vụ', 'Bác sĩ', 'Ca khám', 'Phòng', 'Ngày tái khám', 'Trạng thái', 'Nguồn tạo', 'Ghi chú', 'Thao tác'].map(h => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${!h || h === 'Trạng thái' ? 'text-center' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginated.map(a => (
                    <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors group">
                      {/* ID */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">#{a.id}</span>
                      </td>

                      {/* Patient */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                            {(a.tenBenhNhan || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 leading-tight whitespace-nowrap">{a.tenBenhNhan || '—'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">MBN #{a.maBenhNhan}</p>
                          </div>
                        </div>
                      </td>

                      {/* Specialty */}
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{a.tenChuyenKhoa || '—'}</td>

                      {/* Service */}
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{a.tenDichVu || '—'}</td>

                      {/* Doctor */}
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{a.tenNhanVien || '—'}</td>

                      {/* Shift */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {a.tenCa ? (
                          <div>
                            <p className="text-sm font-bold text-gray-700">{a.tenCa}</p>
                            <p className="text-[10px] text-gray-400">{a.gioBatDau || '—'} - {a.gioKetThuc || '—'}</p>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Room */}
                      <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        {(() => {
                          const roomName = a.tenPhong || a.phong || (phongList.find(room => Number(room.maPhong) === Number(a.maPhong))?.tenPhong || '—');
                          return roomName;
                        })()}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-gray-700 whitespace-nowrap">
                          {a.ngayTaiKham ? new Date(a.ngayTaiKham).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                        </p>
                        {a.ngayTaiKham && <div className="mt-0.5">{getDaysUntil(a.ngayTaiKham)}</div>}
                      </td>

                      {/* Status — clickable dropdown */}
                      <td className="px-5 py-3.5 text-center">
                        <StatusDropdown appointment={a} onUpdate={handleUpdate} />
                      </td>

                      {/* Source */}
                      <td className="px-5 py-3.5">
                        {a.nguonTao ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-full border ${NGUON_TAO_CONFIG[a.nguonTao]?.cls || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {NGUON_TAO_CONFIG[a.nguonTao]?.label || a.nguonTao}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Note */}
                      <td className="px-5 py-3.5 max-w-[140px]">
                        {a.ghiChu
                          ? <p className="text-sm text-gray-500 truncate" title={a.ghiChu}>{a.ghiChu}</p>
                          : <span className="text-gray-300">—</span>}
                      </td>

                      {/* Actions — chỉ hiển thị nút khi lịch còn CHUA_DEN (chưa check-in, chưa hủy, chưa quá hẹn) */}
                      <td className="px-5 py-3.5 text-center">
                        {a.trangThai === 'CHUA_DEN' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openRescheduleModal(a)}
                              disabled={rescheduling}
                              className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all disabled:opacity-50"
                              title="Hoãn lịch khám"
                            >
                              <span className="material-symbols-outlined text-[18px]">event_repeat</span>
                            </button>
                            <button
                              onClick={() => openCancelModal(a.id)}
                              disabled={deletingId === a.id}
                              className="p-2 text-red-400 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                              title="Hủy lịch hẹn"
                            >
                              <span className={`material-symbols-outlined text-[18px] ${deletingId === a.id ? 'animate-spin' : ''}`}>
                                {deletingId === a.id ? 'refresh' : 'delete'}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION UI */}
            {filtered.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredCount}
                  label="lịch hẹn"
                  visiblePages={visiblePages}
                  onPageChange={setCurrentPage}
                  jumpPage={jumpPage}
                  onJumpPage={handleJumpPage}
                  onJumpBlur={handleJumpPageBlur}
                  activeClass="bg-indigo-600 text-white shadow-md shadow-indigo-100"
                  hoverClass="hover:bg-indigo-50 hover:text-indigo-600"
                  ringClass="focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <AppointmentModal
          formData={formData}
          setFormData={setFormData}
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
          getMinDate={getMinDate}
          patient={patient}
          chuyenKhoaList={chuyenKhoaList}
          dichVuList={dichVuList}
          benhNhanList={benhNhanList}
          phongList={phongList}
          creating={creating}
          doctorShifts={doctorShifts}
          availableCaList={getAvailableCa(formData.ngayTaiKham)}
        />
      )}

      {/* ── Cancel Modal ── */}
      {cancelTarget !== null && (
        <CancelModal
          onClose={closeCancelModal}
          onConfirm={confirmCancel}
          lyDo={cancelLyDo}
          setLyDo={setCancelLyDo}
          deletingId={deletingId}
        />
      )}

      {/* ── Reschedule Modal ── */}
      {rescheduleTarget !== null && (
        <RescheduleModal
          appointment={rescheduleTarget}
          onClose={closeRescheduleModal}
          onConfirm={confirmReschedule}
          ngayMoi={rescheduleDate}
          setNgayMoi={setRescheduleDate}
          maCa={rescheduleMaCa}
          setMaCa={setRescheduleMaCa}
          lyDo={rescheduleLyDo}
          setLyDo={setRescheduleLyDo}
          rescheduling={rescheduling}
          doctorShifts={doctorShifts}
          availableCaList={getAvailableCa(rescheduleDate)}
        />
      )}
    </div>
  );
};

export { AppointmentModal, formatDateInput, formatDateDisplay, getVietnameseDayFromDate, getUniqueWorkingDays, getAssignedRoomOptions, getAvailableShiftIds, getShiftId };

export default TabHenTaiKham;
