import React, { useState, useEffect } from 'react';
import { 
  getXetNhiemResultsByPhieuKhamApi, 
  approveTestResultApi, 
  rejectTestResultApi 
} from "../../../api/phieuChiDinhApi";
import { getTiepNhanClsByPhieuKhamApi } from "../../../api/tiepNhanClsApi";
import { useNotification } from '../../../components/NotificationContext';
import PrintButton from '../../../components/PrintButton';
import formatGender from '../../../utils/formatGender';

const DuyetKetQuaXetNghiem = ({
  patient,
  user,
  onBack,
  readOnly = false
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [tiepNhanCls, setTiepNhanCls] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  // Modal hệ thống nhập lý do từ chối
  const [rejectState, setRejectState] = useState({ isOpen: false, result: null, index: null });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchData();
  }, [patient.maPhieuKham]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [data, tiepNhanData] = await Promise.all([
        getXetNhiemResultsByPhieuKhamApi(patient.maPhieuKham),
        getTiepNhanClsByPhieuKhamApi(patient.maPhieuKham)
      ]);
      if (data) {
        setResults(data.map(item => ({
          ...item,
          ketLuan: item.ketLuan || '',
          ketQua: item.ketQua || '',
          ghiChuThem: item.ghiChuThem || ''
        })));
      }
      
      if (tiepNhanData && tiepNhanData.length > 0) {
        setTiepNhanCls(tiepNhanData[0]);
      }
    } catch (e) {
      console.error("Lỗi khi tải dữ liệu:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleMetaChange = (resultIndex, field, value) => {
    const updated = [...results];
    updated[resultIndex][field] = value;
    setResults(updated);
  };

  const handleApprove = async (result, index) => {
    if (!result.ketLuan.trim()) {
      showWarning("Vui lòng điền kết luận trước khi duyệt kết quả!");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        maBsKetLuan: user?.maNhanVien || null,
        ketLuan: result.ketLuan,
        ketQua: result.ketQua,
        ghiChuThem: result.ghiChuThem,
       
        updateOnly: readOnly
      };
      await approveTestResultApi(result.id, payload);
      showSuccess(readOnly ? "Đã cập nhật kết quả thành công!" : "Đã ký duyệt kết quả xét nghiệm thành công!");
      fetchData();
    } catch (e) {
      console.error(e);
      showError("Lỗi khi duyệt kết quả: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Mở modal hệ thống nhập lý do từ chối
  const openRejectModal = (result, index) => {
    setRejectReason('');
    setRejectState({ isOpen: true, result, index });
  };

  const closeRejectModal = () => {
    setRejectState({ isOpen: false, result: null, index: null });
    setRejectReason('');
  };

  const confirmReject = async () => {
    const reason = rejectReason.trim();
    if (!reason) {
      showWarning("Lý do không duyệt không được để trống!");
      return;
    }
    const { result } = rejectState;
    setSubmitting(true);
    try {
      await rejectTestResultApi(result.id, { reason });
      closeRejectModal();
      showSuccess("Đã từ chối kết quả xét nghiệm và yêu cầu kỹ thuật viên làm lại!");
      onBack();
    } catch (e) {
      console.error(e);
      showError("Lỗi khi từ chối kết quả: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-20 text-indigo-600 font-bold italic">
        <span className="material-symbols-outlined animate-spin mr-2">sync</span>
        Đang tải kết quả cận lâm sàng của bệnh nhân...
      </div>;
  }

  return <div className="space-y-6 animate-scale-up">
      {readOnly && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3 text-amber-800">
          <span className="material-symbols-outlined text-amber-600">visibility</span>
          <span className="font-bold text-sm">
            ĐANG XEM LẠI KẾT QUẢ ĐÃ DUYỆT — Mọi thay đổi chỉ cập nhật thông tin, KHÔNG thay đổi trạng thái.
          </span>
        </div>
      )}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between bg-gradient-to-r from-white to-indigo-50/30">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-rose-200">
            {patient.hoTen?.[0] || 'BN'}
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800">{patient.hoTen}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm font-medium text-gray-500">
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-md">#{patient.maBenhNhan}</span>
              <span>•</span>
              <span>{formatGender(patient.gioiTinh)}</span>
              <span>•</span>
              <span>{new Date(patient.ngaySinh).getFullYear()}</span>
            </div>
          </div>
        </div>
        <button onClick={onBack} className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 border border-gray-200">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          QUAY LẠI HÀNG ĐỢI
        </button>
      </div>

      {/* ── Thông tin tiếp nhận CLS ── */}
      {tiepNhanCls && patient.loaiDichVu && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-lg">assignment</span>
            <span className="font-bold text-sm text-indigo-700 uppercase tracking-wide">Thông tin tiếp nhận CLS</span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Lý do đến</span>
              <span className="font-semibold text-gray-800">{tiepNhanCls.lyDoDen}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Thông tin sàng lọc</span>
              <span className="font-medium text-gray-700">{tiepNhanCls.thongTinSangLoc}</span>
            </div>
            {tiepNhanCls.ghiChu && (
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase block mb-1">Ghi chú</span>
                <span className="font-medium text-gray-700">{tiepNhanCls.ghiChu}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {results.length === 0 ? <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 text-gray-400 italic">
          Chưa có kết quả xét nghiệm nào được kỹ thuật viên nhập cho lượt khám này.
        </div> : <div className="space-y-6">
          {results.map((result, rIdx) => {
        const isApproved = result.trangThai === 'DA_DUYET';
        return <div key={result.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <span className="material-symbols-outlined">science</span>
                    </span>
                    <div>
                      <h3 className="font-extrabold text-gray-800">{result.tenDichVu}</h3>
                      <p className="text-[11px] text-gray-400">ID Kết quả: #{result.id} • Ngày thực hiện: {new Date(result.ngayThucHien).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  {isApproved ? <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      ĐÃ PHÊ DUYỆT
                    </span> : <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                      <span className="material-symbols-outlined text-sm">pending_actions</span>
                      CHỜ PHÊ DUYỆT
                    </span>}
                </div>

                <div className="p-6 space-y-6">
                  {/* Nội dung kết quả KTV nhập (gộp chỉ số + biên bản) */}
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center gap-2">
                      <span className="material-symbols-outlined text-gray-400 text-sm">description</span>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Kết quả xét nghiệm</span>
                    </div>
                    <div className="p-4">
                      <pre className={`whitespace-pre-wrap text-sm font-medium leading-relaxed ${isApproved && !readOnly ? 'text-gray-700' : ''}`}>
                        {result.ketQua || "Chưa có nội dung kết quả từ kỹ thuật viên."}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Ghi Chú Thêm</label>
                      <textarea rows="3" value={result.ghiChuThem} disabled={isApproved && !readOnly} placeholder="Ghi chú thêm từ kỹ thuật viên hoặc bác sĩ..." onChange={e => handleMetaChange(rIdx, 'ghiChuThem', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium" />
                    </div>

                    <div className="flex flex-col justify-between">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Kết Luận Của Bác Sĩ Xét Nghiệm <span className="text-rose-500">*</span></label>
                        <textarea rows="6" value={result.ketLuan} disabled={isApproved && !readOnly} placeholder="VD: Các chỉ số trong giới hạn bình thường. Không có biểu hiện bệnh lý..." onChange={e => handleMetaChange(rIdx, 'ketLuan', e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-bold text-gray-800" />
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 bg-gray-50/50 p-4 rounded-xl">
                        <span className="text-xs text-gray-400 font-bold">KTV Thực hiện: {result.tenNguoiThucHien || `ID #${result.nguoiThucHien || '---'}`}</span>
                        {readOnly ? (
                          <button type="button" disabled={submitting} onClick={() => handleApprove(result, rIdx)} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-100 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">save</span>
                            LƯU CẬP NHẬT (GIỮ NGUYÊN TRẠNG THÁI)
                          </button>
                        ) : !isApproved ? (
                          <div className="flex gap-2">
                            <button type="button" disabled={submitting} onClick={() => openRejectModal(result, rIdx)} className="px-5 py-2.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-600 text-xs font-bold rounded-xl transition-all border border-gray-200 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              KHÔNG DUYỆT
                            </button>
                            <button type="button" disabled={submitting} onClick={() => handleApprove(result, rIdx)} className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-100 flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm">draw</span>
                              DUYỆT & KĐ KẾT QUẢ
                            </button>
                          </div>
                        ) : (
                          <PrintButton 
                            targetId={`test-print-area-${result.id}`} 
                            variant="success" 
                            title="IN KẾT QUẢ XÉT NGHIỆM" 
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- PHẦN TỬ IN PHIẾU XÉT NGHIỆM (ẨN TRÊN MÀN HÌNH, CHỈ HIỂN THỊ KHI IN) --- */}
                  {isApproved && (
                    <div id={`test-print-area-${result.id}`} className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed text-sm">
                      <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4 mb-6">
                        <div>
                          <h2 className="text-md font-bold uppercase text-indigo-900">HỆ THỐNG PHÒNG KHÁM QUỐC TẾ MEDCORE</h2>
                          <p className="text-xs text-gray-600">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
                          <p className="text-xs text-gray-600">Điện thoại: 1900 6000 • Website: www.medcore.vn</p>
                        </div>
                        <div className="text-right">
                          <h3 className="text-lg font-black text-indigo-900 tracking-wide uppercase">PHIẾU KẾT QUẢ XÉT NGHIỆM</h3>
                          <p className="text-xs text-gray-500 font-bold">Mã kết quả: #{result.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6 border bg-gray-50/50 p-4 rounded-xl text-xs">
                        <div>
                          <p><strong>Họ tên bệnh nhân:</strong> <span className="font-bold text-sm">{patient.hoTen}</span></p>
                          <p><strong>Năm sinh:</strong> {new Date(patient.ngaySinh).getFullYear()} • <strong>Giới tính:</strong> {formatGender(patient.gioiTinh)}</p>
                          <p><strong>Mã bệnh nhân:</strong> #{patient.maBenhNhan}</p>
                        </div>
                        <div>
                          <p><strong>Dịch vụ thực hiện:</strong> <span className="font-bold">{result.tenDichVu}</span></p>
                          <p><strong>Thời gian thực hiện:</strong> {new Date(result.ngayThucHien).toLocaleString('vi-VN')}</p>
                          <p><strong>Mã phiếu khám:</strong> #{patient.maPhieuKham}</p>
                        </div>
                      </div>

                      <div className="mb-6 p-3 border rounded-xl bg-gray-50/30 text-xs">
                        <strong className="text-[10px] text-gray-400 uppercase block mb-1">Kết quả xét nghiệm</strong>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{result.ketQua}</p>
                      </div>

                      {result.ghiChuThem && (
                        <div className="mb-6 p-3 border rounded-xl bg-gray-50/30 text-xs">
                          <strong className="text-[10px] text-gray-400 uppercase block mb-1">Ghi chú thêm</strong>
                          <p className="text-gray-700 italic">{result.ghiChuThem}</p>
                        </div>
                      )}

                      <div className="mb-8 p-4 border-2 border-indigo-900/10 rounded-2xl bg-indigo-50/10 text-xs">
                        <strong className="text-[11px] text-indigo-900 uppercase block mb-1">Kết luận chuyên môn</strong>
                        <p className="font-bold text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">{result.ketLuan}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-100">
                        <div className="text-center min-w-[200px]">
                          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-12">Kỹ thuật viên thực hiện</p>
                          <span className="font-semibold text-xs text-gray-600">{result.tenNguoiThucHien || `Mã NV: #${result.nguoiThucHien || '---'}`}</span>
                        </div>
                        <div className="text-center ml-auto min-w-[200px]">
                          <p className="text-xs italic mb-1">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                          <p className="font-bold text-xs uppercase mb-12">Bác sĩ kết luận & ký duyệt</p>
                          <p className="font-serif italic text-lg text-indigo-800">{user?.hoTen || user?.username || 'Bác sĩ chuyên khoa'}</p>
                          <p className="text-[10px] text-gray-400 mt-1">Đã ký điện tử</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>;
      })}
        </div>}

      {/* Modal hệ thống nhập lý do không duyệt */}
      {rejectState.isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <span className="material-symbols-outlined">cancel</span>
                </span>
                <div>
                  <h3 className="font-black text-red-700 text-base">TỪ CHỐI KẾT QUẢ</h3>
                  <p className="text-xs text-red-400 font-medium">Yêu cầu kỹ thuật viên làm lại xét nghiệm</p>
                </div>
              </div>
              <button onClick={closeRejectModal} className="p-2 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Lý do không duyệt <span className="text-red-500">*</span></label>
              <textarea
                rows="4"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Vui lòng nhập lý do không duyệt / yêu cầu làm lại xét nghiệm..."
                autoFocus
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-300 outline-none text-sm font-medium text-slate-700 transition-all resize-none"
              />
              {rejectReason.trim() === '' && (
                <p className="text-[11px] text-red-400 font-medium mt-1">Lý do không được để trống.</p>
              )}
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={closeRejectModal} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-colors">
                HỦY
              </button>
              <button
                type="button"
                disabled={submitting || !rejectReason.trim()}
                onClick={confirmReject}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl shadow-md shadow-red-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">block</span>
                XÁC NHẬN TỪ CHỐI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>;
};
export default DuyetKetQuaXetNghiem;
