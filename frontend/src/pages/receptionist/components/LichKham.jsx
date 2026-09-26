import { getAllApi } from '../../../api/lichKhamApi';
import { getAllApi as getAllDichVuApi } from '../../../api/dichVuApi';
import { getAllChuyenKhoaApi, getAllPhongApi } from '../../../api/danhMucApi';
import { getAllCaLamDanhMucApi } from '../../../api/caLamDanhMucApi';
import { updateApi as updateAppointmentApi, hoanLichApi } from '../../../api/appointmentApi';
import { getShiftsByNhanVienApi } from '../../../api/shiftApi';
import { getAllApi as getAllBenhNhanApi } from '../../../api/benhNhanApi';
import { getAllNhanVienApi } from '../../../api/employeeApi';
import { useState, useEffect, useCallback } from 'react';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';
import { AppointmentModal, getAvailableShiftIds } from '../../doctor/components/TabHenTaiKham';

const MODAL_STYLE = `
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.9) translateY(20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
`;

const LichKham = ({ onCheckIn, compact, simple, user }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dichVuMap, setDichVuMap] = useState({});

  // Dữ liệu dropdown cho modal cập nhật (dùng AppointmentModal)
  const [chuyenKhoaList, setChuyenKhoaList] = useState([]);
  const [dichVuList, setDichVuList] = useState([]);
  const [phongList, setPhongList] = useState([]);
  const [benhNhanList, setBenhNhanList] = useState([]);
  const [caList, setCaList] = useState([]);
  const [nhanVienList, setNhanVienList] = useState([]);
  const [doctorShifts, setDoctorShifts] = useState([]);

  const [editModal, setEditModal] = useState({ open: false, appointment: null });
  const [editFormData, setEditFormData] = useState({
    maBenhNhan: '',
    maChuyenKhoa: '',
    maPhong: '',
    maDichVu: '',
    maBacSi: '',
    ngayTaiKham: '',
    maCa: '',
    ghiChu: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [hoanLich, setHoanLich] = useState(false);
  const [lyDoHoan, setLyDoHoan] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // Tải danh sách dịch vụ để tra cứu tên
        try {
          const dvData = await getAllDichVuApi();
          if (Array.isArray(dvData)) {
            const map = {};
            dvData.forEach(dv => { if (dv.maDichVu) map[dv.maDichVu] = dv.tenDichVu; });
            setDichVuMap(map);
          }
        } catch (e) { console.warn('Không thể tải danh sách dịch vụ:', e); }

        const data = await getAllApi();
        setAppointments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Lỗi tải lịch khám:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Tải danh sách dropdown cho modal cập nhật
  useEffect(() => {
    (async () => {
      try { const ck = await getAllChuyenKhoaApi(); setChuyenKhoaList(Array.isArray(ck) ? ck : []); } catch (e) { console.warn('Không thể tải chuyên khoa:', e); }
      try { const dv = await getAllDichVuApi(); setDichVuList(Array.isArray(dv) ? dv : []); } catch (e) { console.warn('Không thể tải dịch vụ:', e); }
      try { const ph = await getAllPhongApi(); setPhongList(Array.isArray(ph) ? ph : []); } catch (e) { console.warn('Không thể tải phòng:', e); }
      try { const bn = await getAllBenhNhanApi(); setBenhNhanList(Array.isArray(bn) ? bn : []); } catch (e) { console.warn('Không thể tải bệnh nhân:', e); }
      try { const ca = await getAllCaLamDanhMucApi(); setCaList(Array.isArray(ca) ? ca : []); } catch (e) { console.warn('Không thể tải ca làm việc:', e); }
      try { const nv = await getAllNhanVienApi(); setNhanVienList(Array.isArray(nv) ? nv : []); } catch (e) { console.warn('Không thể tải danh sách nhân viên:', e); }
    })();
  }, []);

  // Hàm load lịch làm việc của bác sĩ theo mã bác sĩ
  const loadDoctorShifts = useCallback(async (maBacSi) => {
    if (!maBacSi) {
      setDoctorShifts([]);
      return;
    }
    try {
      const shifts = await getShiftsByNhanVienApi(maBacSi);
      setDoctorShifts(Array.isArray(shifts) ? shifts : []);
    } catch (err) {
      console.error('Error loading doctor shifts:', err);
      setDoctorShifts([]);
    }
  }, []);

  const refreshList = useCallback(async () => {
    try {
      const data = await getAllApi();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Lỗi tải lại lịch khám:', err);
    }
  }, []);

  // Mở modal cập nhật — điền formData từ appointment + load lịch làm việc của bác sĩ của lịch đó
  const openEditModal = (a) => {
    setEditFormData({
      maBenhNhan: a.maBenhNhan ?? '',
      tenBenhNhan: a.tenBenhNhan ?? '',
      maChuyenKhoa: a.maChuyenKhoa ?? '',
      maPhong: a.maPhong ?? '',
      maDichVu: a.maDichVu ?? '',
      maBacSi: a.maBacSi ?? a.maNhanVien ?? '',
      ngayTaiKham: a.ngayKham ?? a.ngayTaiKham ?? '',
      maCa: a.maCa ?? '',
      ghiChu: a.ghiChu ?? ''
    });
    setEditModal({ open: true, appointment: a });
    // Calendar phải dựa trên ma_bac_si của lịch khám, không phải user đang đăng nhập (lễ tân)
    loadDoctorShifts(a.maBacSi ?? a.maNhanVien);
  };

  const closeEditModal = () => {
    setEditModal({ open: false, appointment: null });
    setSavingEdit(false);
    setHoanLich(false);
    setLyDoHoan('');
  };

  // Helper normalize ngày — cắt bỏ phần giờ nếu có (ISO datetime → yyyy-MM-dd)
  const normalizeDate = (v) => v ? String(v).split('T')[0] : '';

  // Lưu thông tin đã sửa — CHỈ gọi updateApi()
  // - KHÔNG tick "Hoãn" → update() bình thường, giữ nguyên trạng thái
  // - TICK "Hoãn" → update() với trangThai='HOAN' + lyDoHoan field riêng
  //   → Backend tự tạo lịch mới + đánh dấu lịch cũ HOAN
  const handleSaveEdit = async () => {
    const appointment = editModal.appointment;
    if (!appointment) return;

    // Normalize ngày cũ + mới để so sánh đúng (tránh lệch format)
    const oldDate = normalizeDate(appointment.ngayKham);
    const newDate = normalizeDate(editFormData.ngayTaiKham);
    const dateChanged = newDate !== '' && newDate !== oldDate;

    // Validation ngày — CHỈ khi thực sự đổi ngày
    if (dateChanged) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (newDate < todayStr) {
        alert('Không thể chọn ngày trong quá khứ');
        return;
      }
      if (newDate === todayStr) {
        alert('Không thể chọn ngày hôm nay. Vui lòng chọn từ ngày mai trở đi.');
        return;
      }
    }

    // Nếu đổi ngày mà chưa tick "Hoãn" → chặn
    if (dateChanged && !hoanLich) {
      alert('Bạn đã đổi ngày khám. Vui lòng tick "Hoãn lịch" và nhập lý do để lưu.');
      return;
    }

    setSavingEdit(true);
    try {
      const payload = {
        maBenhNhan: Number(editFormData.maBenhNhan),
        maChuyenKhoa: Number(editFormData.maChuyenKhoa),
        maBacSi: editFormData.maBacSi ? Number(editFormData.maBacSi) : null,
        maPhong: editFormData.maPhong ? Number(editFormData.maPhong) : null,
        maDichVu: editFormData.maDichVu ? Number(editFormData.maDichVu) : null,
        maCa: editFormData.maCa ? Number(editFormData.maCa) : null,
        ngayTaiKham: editFormData.ngayTaiKham || null,
        ghiChu: editFormData.ghiChu || null
      };

      if (hoanLich) {
        // Tick "Hoãn" → trạng thái HOAN + lý do hoãn field RIÊNG (không nhét vào ghiChu)
        payload.trangThai = 'HOAN';
        payload.lyDoHoan = lyDoHoan?.trim();
      }

      await updateAppointmentApi(appointment.id, payload);
      closeEditModal();
      await refreshList();
    } catch (err) {
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Hàm lấy tên dịch vụ: ưu tiên từ response backend, fallback về cache
  const getTenDichVu = (a) => {
    return a.tenDichVu || dichVuMap[a.maDichVu] || '--';
  };

  const statusLabels = {
    CHUA_DEN: { label: 'Chưa đến', color: 'bg-gray-100 text-gray-700' },
    DA_CHECK_IN: { label: 'Đã check-in', color: 'bg-green-100 text-green-700' },
    HOAN_THANH: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
    HUY: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
    QUA_HEN: { label: 'Quá hẹn', color: 'bg-orange-100 text-orange-700' },
    HOAN: { label: 'Hoãn', color: 'bg-amber-100 text-amber-700' },
  };

  const getStatus = (status) => statusLabels[status] || { label: status || 'Chưa xác định', color: 'bg-gray-100 text-gray-700' };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.ngayKham === todayStr || (a.ngayKham && a.ngayKham.trim().startsWith(todayStr)));

  // Compact mode: card view (không phân trang)
  if (compact) {
    if (loading) return <div className="text-center py-4 text-gray-400 italic text-sm">Đang tải...</div>;
    if (todayAppointments.length === 0) return <div className="text-center py-8 text-gray-400 text-sm">Không có lịch khám hôm nay</div>;

    return todayAppointments.slice(0, 5).map((a) => {
      const isPending = a.trangThai === 'CHUA_DEN';
      return (
        <div key={a.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined text-lg">calendar_month</span>
            </div>
            <div>
              <p className="font-bold text-sm text-gray-800">{a.tenBenhNhan || `BN#${a.maBenhNhan}`}</p>
              <p className="text-[11px] text-gray-500">{a.tenChuyenKhoa || ''}{a.tenBacSi ? ` - BS: ${a.tenBacSi}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => openEditModal(a)} className="text-[11px] font-bold bg-blue-50 text-blue-600 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-all" title="Cập nhật">
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            {isPending ? (
              <button onClick={() => {
                onCheckIn && onCheckIn({ id: a.id, maBenhNhan: a.maBenhNhan, tenBenhNhan: a.tenBenhNhan, maChuyenKhoa: a.maChuyenKhoa, maBacSi: a.maBacSi, nguonTao: a.nguonTao || a.nguon_tao, daXacMinhDanhTinh: a.daXacMinhDanhTinh });
              }} className="text-[11px] font-bold bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 shadow-sm shadow-green-500/20 transition-all">Check-in</button>
            ) : (
              <span className="text-[11px] text-gray-400">{getStatus(a.trangThai).label}</span>
            )}
          </div>
        </div>
      );
    });
  }

  // Bọc filter trong useCallback để reference ổn định giữa các render,
  // tránh bị reset trang về 1 mỗi lần re-render (lỗi không chuyển trang được)
  const appointmentFilters = useCallback((a) => (
    filterStatus === 'ALL' || a.trangThai === filterStatus
  ), [filterStatus]);

  // Full mode: table - dùng usePagination để filter + search + phân trang
  const {
    paginatedData: paginated,
    filteredData: filtered,
    totalItems: filteredCount,
    totalPages,
    currentPage,
    setCurrentPage,
    safeCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
    pageError,
  } = usePagination({
    data: appointments,
    pageSize: 8,
    searchKeys: ['tenBenhNhan', 'maBenhNhan', 'tenBacSi', 'tenChuyenKhoa', 'tenDichVu'],
    searchTerm: search,
    filters: appointmentFilters,
  });

  const getSourceBadge = (source) => {
    const s = source?.toUpperCase();
    if (s === 'TAI_KHAM') return <span className="text-purple-600 text-[12px] font-bold uppercase tracking-wide">Tái khám</span>;
    if (s === 'DAT_LICH_APP') return <span className="text-indigo-600 text-[12px] font-bold uppercase tracking-wide">App</span>;
    return <span className="text-gray-500 text-[12px] font-bold uppercase tracking-wide">{source || 'Khác'}</span>;
  };

  // Lấy danh sách ca khả dụng cho ngày đã chọn
  const getAvailableCa = (dateStr) => {
    const ids = getAvailableShiftIds(doctorShifts, dateStr);
    return caList.filter(ca => ids.includes(Number(ca.id)));
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  return (
    <div className={simple ? '' : 'space-y-3 animate-fade-in'}>
      {!simple && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Lịch khám của bệnh nhân</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input type="text" placeholder="Tìm bệnh nhân, bác sĩ..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); }}>
                <option value="ALL">Tất cả trạng thái</option>
                <option value="CHUA_DEN">Chưa đến</option>
                <option value="DA_CHECK_IN">Đã check-in</option>
                <option value="HOAN_THANH">Hoàn thành</option>
                <option value="HUY">Đã hủy</option>
                <option value="QUA_HEN">Quá hẹn</option>
                <option value="HOAN">Hoãn</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* IN-LIST WARNING */}
      {pageError && (
        <div className="mb-3 px-4 py-3 bg-rose-50 rounded-xl border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>
          {pageError}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 text-sm text-gray-500 font-medium">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Bệnh Nhân</th>
              <th className="px-4 py-3">Chuyên Khoa</th>
              <th className="px-4 py-3">Dịch Vụ</th>
              <th className="px-4 py-3">Bác Sĩ</th>
              <th className="px-4 py-3">Ngày Khám</th>
              <th className="px-4 py-3">Nguồn</th>
              <th className="px-4 py-3">Trạng Thái</th>
              <th className="px-4 py-3">Ghi Chú</th>
              <th className="px-4 py-3 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="text-center py-10 text-gray-400 italic">Đang tải dữ liệu...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="10" className="text-center py-10 text-gray-400 italic">Không tìm thấy lịch khám nào</td></tr>
            ) : (
              paginated.map(a => {
                const status = getStatus(a.trangThai);
                const isPending = a.trangThai === 'CHUA_DEN';
                return (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-400">#{a.id}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-800">{a.tenBenhNhan || `BN#${a.maBenhNhan}`}</div>
                      {a.maBenhNhan && <div className="text-xs text-gray-400">Mã BN: {a.maBenhNhan}</div>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{a.tenChuyenKhoa || '--'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{getTenDichVu(a)}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{a.tenBacSi || '--'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 font-medium">{a.ngayKham ? new Date(a.ngayKham).toLocaleDateString('vi-VN') : '--'}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        {getSourceBadge(a.nguonTao || a.nguon_tao)}
                        {(a.nguonTao || a.nguon_tao) === 'DAT_LICH_APP' && !a.daXacMinhDanhTinh && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold w-fit">
                            <span className="material-symbols-outlined text-[11px]">gpp_maybe</span>Chưa XM
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.color}`}>{status.label}</span>
                        {a.maLichKhamGoc && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold w-fit">
                            <span className="material-symbols-outlined text-[11px]">link</span>Hoãn từ #{a.maLichKhamGoc}
                          </span>
                        )}
                        {a.trangThai === 'HOAN' && a.maLichKhamMoi && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold w-fit">
                            <span className="material-symbols-outlined text-[11px]">arrow_forward</span>Đã hoãn sang #{a.maLichKhamMoi}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-400 max-w-[200px] truncate">{a.ghiChu || '--'}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(a)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all" title="Cập nhật lịch khám">
                          <span className="material-symbols-outlined text-sm">edit</span>Cập nhật
                        </button>
                        {isPending && (
                          <button onClick={() => {
                            onCheckIn && onCheckIn({ id: a.id, maBenhNhan: a.maBenhNhan, tenBenhNhan: a.tenBenhNhan, maChuyenKhoa: a.maChuyenKhoa, maBacSi: a.maBacSi, nguonTao: a.nguonTao || a.nguon_tao, daXacMinhDanhTinh: a.daXacMinhDanhTinh });
                          }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm shadow-emerald-200 hover:shadow-md font-semibold text-xs">
                            <span className="material-symbols-outlined text-sm">assignment_turned_in</span>Tiếp đón
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 text-right">Hiển thị {filtered.length} / {appointments.length} lịch khám</div>
      )}

      {/* PAGINATION UI (chỉ chế độ bảng đầy đủ) */}
      {!loading && filtered.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCount}
          label="lịch khám"
          visiblePages={visiblePages}
          onPageChange={setCurrentPage}
          jumpPage={jumpPage}
          onJumpPage={handleJumpPage}
          onJumpBlur={handleJumpPageBlur}
          activeClass="bg-emerald-600 text-white shadow-md shadow-emerald-100"
          hoverClass="hover:bg-green-50 hover:text-green-600"
          ringClass="focus:ring-2 focus:ring-green-200"
        />
      )}

      {/* MODAL CẬP NHẬT LỊCH KHÁM — dùng AppointmentModal mode="update" */}
      {editModal.open && editModal.appointment && (
        <AppointmentModal
          mode="update"
          formData={editFormData}
          setFormData={setEditFormData}
          onClose={closeEditModal}
          onCreate={handleSaveEdit}
          getMinDate={getMinDate}
          patient={{ maBenhNhan: editModal.appointment.maBenhNhan, hoTen: editModal.appointment.tenBenhNhan }}
          chuyenKhoaList={chuyenKhoaList}
          dichVuList={dichVuList}
          benhNhanList={benhNhanList}
          phongList={phongList}
          nhanVienList={nhanVienList}
          onBacSiChange={(maBacSi) => loadDoctorShifts(maBacSi)}
          creating={savingEdit}
          doctorShifts={doctorShifts}
          availableCaList={getAvailableCa(editFormData.ngayTaiKham)}
          hoanLich={hoanLich}
          setHoanLich={setHoanLich}
          lyDoHoan={lyDoHoan}
          setLyDoHoan={setLyDoHoan}
          originalDate={editModal.appointment.ngayKham}
        />
      )}
    </div>
  );
};

export default LichKham;