import React, { useState, useEffect, useCallback } from 'react';
import {
  getCdhaResultsByPhieuKhamApi,
  approveCdhaResultApi,
  rejectCdhaResultApi
} from "../../../api/phieuChiDinhApi";
import { getTiepNhanClsByPhieuKhamApi } from "../../../api/tiepNhanClsApi";
import { useNotification } from '../../../components/NotificationContext';
import PrintButton from '../../../components/PrintButton';
import formatGender from '../../../utils/formatGender';

const DuyetKetQuaCDHA = ({
  patient,
  user,
  onBack,
  readOnly = false
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [tiepNhanCls, setTiepNhanCls] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [activeImageKey, setActiveImageKey] = useState('duongDanAnh1');

  const fetchCdhaResults = useCallback(async () => {
    try {
      setLoading(true);
      const [data, tiepNhanData] = await Promise.all([
        getCdhaResultsByPhieuKhamApi(patient.maPhieuKham),
        getTiepNhanClsByPhieuKhamApi(patient.maPhieuKham)
      ]);
      if (data) {
        setResults(data.map(item => ({
          ...item,
          moTaHinhAnh: item.moTaHinhAnh || '',
          ketLuan: item.ketLuan || '',
          deNghi: item.deNghi || '',
          duongDanAnh1: item.duongDanAnh1 || '',
          duongDanAnh2: item.duongDanAnh2 || ''
        })));
      }
      if (tiepNhanData && tiepNhanData.length > 0) {
        setTiepNhanCls(tiepNhanData[0]);
      }
    } catch (e) {
      console.error("Lỗi khi tải kết quả CĐHA:", e);
    } finally {
      setLoading(false);
    }
  }, [patient.maPhieuKham]);

  useEffect(() => {
    fetchCdhaResults();
  }, [fetchCdhaResults]);

  const handleTextChange = (field, value) => {
    if (results.length === 0) return;
    const updated = [...results];
    updated[selectedResultIndex][field] = value;
    setResults(updated);
  };

  const handleApprove = async () => {
    const currentResult = results[selectedResultIndex];
    if (!currentResult) return;
    if (!currentResult.ketLuan.trim()) {
      showWarning("Vui lòng điền kết luận chẩn đoán trước khi ký duyệt!");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        maBacSiThucHien: user?.maNhanVien || null,
        moTaHinhAnh: currentResult.moTaHinhAnh,
        ketLuan: currentResult.ketLuan,
        deNghi: currentResult.deNghi,
        duongDanAnh1: currentResult.duongDanAnh1,
        duongDanAnh2: currentResult.duongDanAnh2,
        // Khi xem lại ca đã duyệt (readOnly) => chỉ cập nhật nội dung, giữ nguyên trạng thái
        updateOnly: readOnly
      };
      const detailId = currentResult.maChiTietChiDinh || currentResult.idChiTietChiDinh;
      await approveCdhaResultApi(detailId, payload);
      showSuccess(readOnly ? "Đã cập nhật kết quả thành công!" : "Đã ký duyệt kết quả chẩn đoán hình ảnh thành công!");
      if (!readOnly) onBack();
      else fetchCdhaResults();
    } catch (e) {
      console.error(e);
      showError("Lỗi khi ký duyệt kết quả: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    const currentResult = results[selectedResultIndex];
    if (!currentResult) return;
    const reason = prompt("Nhập lý do không duyệt / yêu cầu kỹ thuật viên chụp lại:");
    if (reason === null) return;
    if (!reason.trim()) {
      showWarning("Lý do từ chối không được để trống!");
      return;
    }
    setSubmitting(true);
    try {
      const detailId = currentResult.maChiTietChiDinh || currentResult.idChiTietChiDinh;
      await rejectCdhaResultApi(detailId, {
        reason: reason.trim()
      });
      showSuccess("Đã từ chối kết quả và gửi yêu cầu thực hiện lại cho kỹ thuật viên!");
      onBack();
    } catch (e) {
      console.error(e);
      showError("Lỗi khi gửi yêu cầu từ chối: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = type => {
    let findings = "";
    let conclusion = "";
    let recommendation = "Theo dõi lâm sàng và kết hợp lâm sàng.";
    if (type === 'ultrasound') {
      findings = "SIÊU ÂM BỤNG TỔNG QUÁT:\nGAN: Kích thước bình thường, nhu mô đều.\nMẬT: Túi mật căng thành mỏng, không sỏi.\nTỤY, LÁCH: Kích thước bình thường.\nTHẬN: Kích thước đều hai bên, không sỏi, không ứ nước.\nBÀNG QUANG: Thành mỏng, không sỏi.";
      conclusion = "Chưa thấy hình ảnh bất thường trên siêu âm bụng tổng quát.";
    } else if (type === 'xray') {
      findings = "X-QUANG NGỰC THẲNG:\nPHẾ TRƯỜNG: Hai phế trường sáng đều, nhu mô phổi bình thường.\nBÓNG TIM: Chỉ số tim ngực trong giới hạn bình thường.\nCƠ HOÀNH: Vòm hoành hai bên đều, góc sườn hoành nhọn.";
      conclusion = "Hình ảnh tim phổi thẳng bình thường.";
    } else if (type === 'ct') {
      findings = "CT-SCANNER SỌ NÃO KHÔNG CẢN QUANG:\nNHU MÔ NÃO: Nhu mô não đều, không thấy ổ giảm đậm độ hay xuất huyết cấp tính.\nHỆ THỐNG NÃO THẤT: Cân đối, không giãn.\nXƯƠNG SỌ: Không thấy đường nứt xương sọ.";
      conclusion = "Chưa phát hiện tổn thương sọ não cấp tính trên phim CT.";
    } else if (type === 'mri') {
      findings = "MRI CỘT SỐNG THẮT LƯNG:\nTrục cột sống thắt lưng bình thường.\nĐĨA ĐỆM: Không thấy phồng hay thoát vị đĩa đệm chèn ép rễ thần kinh.\nTỦY SỐNG: Tín hiệu đoạn tủy thắt lưng bình thường.";
      conclusion = "Chưa phát hiện thoát vị đĩa đệm gây hẹp ống sống hay chèn ép rễ thần kinh.";
    }
    handleTextChange('moTaHinhAnh', findings);
    handleTextChange('ketLuan', conclusion);
    handleTextChange('deNghi', recommendation);
  };

  const currentResult = results[selectedResultIndex];
  const isApproved = currentResult?.trangThai === 'DA_DUYET';
  const hasImages = currentResult?.duongDanAnh1 || currentResult?.duongDanAnh2;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-indigo-600 font-bold italic">
        <span className="material-symbols-outlined animate-spin mr-2">sync</span>
        Đang tải kết quả chẩn đoán hình ảnh...
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-scale-up">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-indigo-200">
            {patient.hoTen?.[0] || 'BN'}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800">{patient.hoTen}</h2>
            <p className="text-sm text-gray-500">
               #{patient.maBenhNhan} • {formatGender(patient.gioiTinh)} • {patient.ngaySinh ? new Date(patient.ngaySinh).getFullYear() : ''}
            </p>
          </div>
        </div>
        <button onClick={onBack} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all border border-gray-200">
          ← QUAY LẠI
        </button>
      </div>

      {/* ── Thông tin tiếp nhận CLS ── */}
      {tiepNhanCls && patient.loaiDichVu && (
        <div className="bg-white rounded-2xl border border-violet-100 shadow-sm overflow-hidden">
          <div className="px-6 py-3 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
            <span className="material-symbols-outlined text-violet-600 text-lg">assignment</span>
            <span className="font-bold text-sm text-violet-700 uppercase tracking-wide">Thông tin tiếp nhận CLS</span>
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

      {results.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100 text-gray-400 italic">
          Bệnh nhân này chưa có kết quả chỉ định chẩn đoán hình ảnh nào được tải lên.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          {/* LEFT: Main Content (4/5) */}
          <div className="xl:col-span-4 space-y-5">
            {/* Patient Info + Service Selector */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-700">PHIẾU KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Mã BN: #{patient.maBenhNhan} | Mã PK: #{patient.maPhieuKham} |
                     Giới: {formatGender(patient.gioiTinh)} |
                    Năm sinh: {patient.ngaySinh ? new Date(patient.ngaySinh).getFullYear() : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {results.length > 1 && (
                    <div className="flex gap-2">
                      {results.map((res, index) => (
                        <button
                          key={res.id}
                          onClick={() => {
                            setSelectedResultIndex(index);
                            setActiveImageKey('duongDanAnh1');
                          }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${selectedResultIndex === index
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                          {res.tenDichVu}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Nút xem ảnh riêng biệt */}
                  {hasImages && (
                    <button
                      onClick={() => setShowImageModal(true)}
                      className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center gap-2 transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      XEM HÌNH ẢNH
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mô tả hình ảnh - LỚN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-indigo-600">description</span>
                  Mô tả hình ảnh (Findings)
                </h3>
                {!isApproved && (
                  <div className="flex gap-1.5">
                    {[
                      { key: 'ultrasound', label: 'Siêu âm' },
                      { key: 'xray', label: 'X-Quang' },
                      { key: 'ct', label: 'CT' },
                      { key: 'mri', label: 'MRI' }
                    ].map(tpl => (
                      <button
                        key={tpl.key}
                        onClick={() => applyTemplate(tpl.key)}
                        className="px-3 py-1 bg-gray-50 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 text-xs font-bold rounded-lg transition-all"
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <textarea
                rows={9}
                value={currentResult?.moTaHinhAnh || ''}
                onChange={e => handleTextChange('moTaHinhAnh', e.target.value)}
                disabled={isApproved && !readOnly}
                placeholder="Nhập mô tả chi tiết hình ảnh chẩn đoán..."
                className="w-full px-5 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base leading-relaxed"
              />
            </div>

            {/* Kết luận chẩn đoán - LỚN */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-700 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-indigo-600">assignment_turned_in</span>
                Kết luận chẩn đoán (Impression) <span className="text-rose-500 text-sm">*</span>
              </h3>
              <textarea
                rows={5}
                value={currentResult?.ketLuan || ''}
                onChange={e => handleTextChange('ketLuan', e.target.value)}
                disabled={isApproved && !readOnly}
                placeholder="VD: Viêm phổi thùy phải / Không có bất thường rõ..."
                className="w-full px-5 py-4 border-2 border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base font-bold text-indigo-900 leading-relaxed"
              />
            </div>

            {/* Đề nghị */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-base font-bold text-gray-700 flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-amber-600">lightbulb</span>
                Đề nghị / Lời dặn
              </h3>
              <input
                type="text"
                value={currentResult?.deNghi || ''}
                onChange={e => handleTextChange('deNghi', e.target.value)}
                disabled={isApproved && !readOnly}
                placeholder="VD: Kết hợp lâm sàng hoặc đề nghị làm thêm xét nghiệm..."
                className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all text-base"
              />
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
                <span>👨‍🔬 KTV: ID #{currentResult?.maNhanVienThucHien || 'Chưa rõ'}</span>
                <span>🩺 BS duyệt: {user?.hoTen || user?.username}</span>
              </div>
              <div className="flex gap-4">
                {readOnly ? (
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 w-full justify-center transition-all"
                  >
                    <span className="material-symbols-outlined">save</span>
                    LƯU CẬP NHẬT (GIỮ NGUYÊN TRẠNG THÁI)
                  </button>
                ) : !isApproved ? (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={submitting}
                      className="px-6 py-3.5 bg-white hover:bg-rose-50 text-gray-700 hover:text-rose-600 text-base font-bold rounded-xl border-2 border-gray-200 hover:border-rose-300 flex items-center gap-2 flex-1 justify-center transition-all"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      TỪ CHỐI DUYỆT
                    </button>
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 flex-[2] justify-center transition-all"
                    >
                      <span className="material-symbols-outlined">draw</span>
                      KÝ DUYỆT KẾT QUẢ
                    </button>
                  </>
                ) : (
                  <PrintButton
                    targetId={`cdha-print-area-${currentResult.id || currentResult.maChiTietChiDinh}`}
                    variant="success"
                    title="IN KẾT QUẢ CĐHA"
                    className="w-full justify-center py-3.5 text-base"
                  />
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Mini Sidebar (1/5) */}
          <div className="xl:col-span-1 space-y-4">
            {/* Service Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Dịch vụ</h4>
              <p className="text-sm font-bold text-gray-800">{currentResult?.tenDichVu || 'CĐHA'}</p>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full ${isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                  {isApproved ? '✓ ĐÃ DUYỆT' : '⏳ CHỜ DUYỆT'}
                </span>
              </div>
            </div>

            {/* Quick Image Button */}
            {hasImages && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Hình ảnh</h4>
                <button
                  onClick={() => setShowImageModal(true)}
                  className="w-full py-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-dashed border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition-all flex flex-col items-center gap-2"
                >
                  <span className="material-symbols-outlined text-4xl">image</span>
                  <span className="text-sm font-bold">XEM ẢNH</span>
                  <span className="text-[10px] text-blue-500">
                    {currentResult?.duongDanAnh2 ? '2 ảnh' : '1 ảnh'}
                  </span>
                </button>
              </div>
            )}

            {/* KTV Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">KTV thực hiện</h4>
              <p className="text-sm font-semibold text-gray-800">ID: #{currentResult?.maNhanVienThucHien || '---'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-[95vw] max-h-[95vh]" onClick={e => e.stopPropagation()}>
            <div className="absolute -top-14 right-0 flex items-center gap-3">
              {currentResult?.duongDanAnh1 && (
                <button
                  onClick={() => setActiveImageKey('duongDanAnh1')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeImageKey === 'duongDanAnh1'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  Ảnh 1
                </button>
              )}
              {currentResult?.duongDanAnh2 && (
                <button
                  onClick={() => setActiveImageKey('duongDanAnh2')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg ${activeImageKey === 'duongDanAnh2'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  Ảnh 2
                </button>
              )}
              <button
                onClick={() => setShowImageModal(false)}
                className="text-white/70 hover:text-white flex items-center gap-1 text-sm ml-4"
              >
                <span className="material-symbols-outlined">close</span>
                ĐÓNG
              </button>
            </div>
            <img
              src={currentResult?.[activeImageKey]}
              alt="Medical scan"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Print Template */}
      {currentResult && isApproved && (
        <div id={`cdha-print-area-${currentResult.id || currentResult.maChiTietChiDinh}`} className="hidden print:block p-8 bg-white text-black font-sans text-sm">
          <div className="flex justify-between items-start border-b-2 border-indigo-900 pb-4 mb-6">
            <div>
              <h2 className="text-md font-bold uppercase text-indigo-900">HỆ THỐNG PHÒNG KHÁM QUỐC TẾ MEDCORE</h2>
              <p className="text-xs text-gray-600">123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
              <p className="text-xs text-gray-600">Điện thoại: 1900 6000 • www.medcore.vn</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-black text-indigo-900 tracking-wide uppercase">KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH</h3>
              <p className="text-xs text-gray-500 font-bold">Mã kết quả: #{currentResult.maChiTietChiDinh || currentResult.id || 'N/A'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 border bg-gray-50/50 p-4 rounded-xl text-xs">
            <div>
              <p><strong>Họ tên BN:</strong> {patient.hoTen}</p>
              <p><strong>Năm sinh:</strong> {new Date(patient.ngaySinh).getFullYear()} • <strong>Giới tính:</strong> {formatGender(patient.gioiTinh)}</p>
              <p><strong>Mã BN:</strong> #{patient.maBenhNhan}</p>
            </div>
            <div>
              <p><strong>Dịch vụ:</strong> {currentResult.tenDichVu}</p>
              <p><strong>Thời gian duyệt:</strong> {new Date().toLocaleString('vi-VN')}</p>
              <p><strong>Mã PK:</strong> #{patient.maPhieuKham}</p>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="font-bold border-b border-gray-300 pb-1 mb-2 uppercase text-[11px]">Mô tả hình ảnh</h3>
            <p className="text-xs whitespace-pre-wrap">{currentResult.moTaHinhAnh || 'Chưa có mô tả.'}</p>
          </div>
          <div className="mb-6 p-4 border-2 border-indigo-900/10 rounded-xl bg-indigo-50/10">
            <strong className="text-[11px] text-indigo-900 uppercase block mb-1">Kết luận chẩn đoán</strong>
            <p className="font-bold text-sm">{currentResult.ketLuan}</p>
          </div>
          {currentResult.deNghi && (
            <div className="mb-6 p-4 border border-amber-200 rounded-xl bg-amber-50/10">
              <strong className="text-[11px] text-amber-800 uppercase block mb-1">Đề nghị</strong>
              <p className="italic">{currentResult.deNghi}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase mb-12">KTV thực hiện</p>
              <span className="font-semibold text-xs">Mã NV: #{currentResult.maNhanVienThucHien || 'Chưa rõ'}</span>
            </div>
            <div className="text-center">
              <p className="text-xs italic mb-1">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
              <p className="font-bold text-xs uppercase mb-12">Bác sĩ ký duyệt</p>
              <p className="font-serif italic text-lg text-indigo-800">{user?.hoTen || user?.username || 'Bác sĩ CĐHA'}</p>
              <p className="text-[10px] text-gray-400 mt-1">Đã ký điện tử</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuyetKetQuaCDHA;