import React from 'react';
import PrintButton from '../../../components/PrintButton';
import { sqlLikeMatch } from '../../../utils/searchUtils';
import formatGender from '../../../utils/formatGender';

const isExpired = (hanSuDung) => {
  if (!hanSuDung) return false;
  return new Date(hanSuDung) < new Date(new Date().toDateString());
};

const isOutOfStock = (tonKho) => {
  return tonKho == null || tonKho <= 0;
};

const getStockBadge = (med) => {
  if (isOutOfStock(med.tonKho)) {
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200">Hết hàng</span>;
  }
  if (med.tonKho < 20) {
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">Tồn: {med.tonKho}</span>;
  }
  if (med.tonKho <= 50) {
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200">Tồn: {med.tonKho}</span>;
  }
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">Tồn: {med.tonKho}</span>;
};

const getExpiryBadge = (med) => {
  if (!med.hanSuDung) return null;
  const expired = isExpired(med.hanSuDung);
  if (expired) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full border border-red-200">Hết hạn: {med.hanSuDung}</span>;
  }
  return <span className="text-[10px] text-gray-400">HSD: {med.hanSuDung}</span>;
};

const canAddMed = (med) => {
  return !isOutOfStock(med.tonKho) && !isExpired(med.hanSuDung);
};

const TabKeDonThuoc = ({
  medSearch,
  setMedSearch,
  showMedList,
  setShowMedList,
  allMeds,
  handleAddMed,
  handleSavePrescription,
  selectedMeds,
  setSelectedMeds,
  onUpdateMedField,
  isAssistant,
  selectedPatient,
  user,
  readOnly,
  prescriptionSavedAt
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in min-h-[500px] flex flex-col w-full">
      {prescriptionSavedAt && selectedMeds.length > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 animate-fade-in">
          <span className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
            <span className="material-symbols-outlined text-[18px]">check</span>
          </span>
          <div className="flex-1">
            <p className="text-emerald-800 font-bold text-sm">Đã lưu toa thuốc thành công</p>
            <p className="text-emerald-600 text-xs mt-0.5">
              Toa thuốc đã được lưu vào hệ thống lúc {new Date(prescriptionSavedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày {new Date(prescriptionSavedAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Kê đơn thuốc</h3>
          <p className="text-sm text-gray-500">Tìm kiếm thuốc và nhập hướng dẫn sử dụng</p>
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400">search</span>
              </div>
              <input 
                type="text" 
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:text-sm" 
                placeholder="Tìm tên thuốc..." 
                value={medSearch} 
                onChange={(e) => { setMedSearch(e.target.value); setShowMedList(true); }} 
                onFocus={() => setShowMedList(true)} 
                onBlur={() => setTimeout(() => setShowMedList(false), 200)} 
              />
              {showMedList && (
                <div className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-72 overflow-y-auto">
                  {allMeds.filter(m => !medSearch || sqlLikeMatch(m.tenThuoc, medSearch) || sqlLikeMatch(m.hoatChat, medSearch)).map(m => {
                    const canAdd = canAddMed(m);
                    return (
                      <div 
                        key={m.maThuoc} 
                        className={`p-3 border-b border-gray-50 flex flex-col gap-1.5 ${
                          canAdd ? 'hover:bg-emerald-50 cursor-pointer' : 'bg-red-50/50 cursor-not-allowed opacity-80'
                        }`} 
                        onClick={() => {
                          if (!canAdd) return;
                          handleAddMed(m);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${canAdd ? 'text-gray-800' : 'text-red-600'}`}>
                                {m.tenThuoc}
                              </span>
                              {!canAdd && (
                                <span className="material-symbols-outlined text-red-500 text-[16px]">block</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{m.hoatChat}</div>
                          </div>
                          <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded shrink-0 ml-2">{m.donViTinh}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {getStockBadge(m)}
                          {getExpiryBadge(m)}
                          {!canAdd && (
                            <span className="text-[10px] text-red-500 font-medium">Không thể thêm vào đơn</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          {!readOnly && (
            <button onClick={() => {
              if (selectedMeds.length === 0) {
                alert('Vui lòng thêm ít nhất một loại thuốc trước khi lưu đơn!');
                return;
              }
              const invalidMeds = selectedMeds.filter(m => !m.tenThuoc || !m.tenThuoc.trim());
              if (invalidMeds.length > 0) {
                alert('Có thông tin thuốc không hợp lệ trong đơn!');
                return;
              }
              handleSavePrescription(false);
            }} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">save</span>
              {isAssistant ? 'LƯU NHÁP ĐƠN THUỐC' : 'LƯU ĐƠN THUỐC'}
            </button>
          )}
          
          {selectedPatient && selectedMeds.length > 0 && (
            <PrintButton 
              targetId="prescription-print-area" 
              variant="success" 
              title="IN ĐƠN THUỐC" 
            />
          )}
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {selectedMeds.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Chưa có thuốc nào trong đơn</div>
        ) : (
          selectedMeds.map((m, idx) => (
            <div key={m.maThuoc || idx} className={`bg-white border rounded-2xl p-5 shadow-sm ${m.tonKho <= 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-gray-800">{idx + 1}. {m.tenThuoc} ({m.hoatChat})</h4>
                  {m.isSaved ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[12px]">check_circle</span>
                      Đã lưu
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      Đã thêm vào danh sách - Chưa lưu
                    </span>
                  )}
                  {m.tonKho !== undefined && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      m.tonKho <= 0 ? 'bg-red-100 text-red-700' : 
                      m.tonKho < 20 ? 'bg-orange-100 text-orange-700' :
                      m.tonKho <= 50 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      Tồn: {m.tonKho}
                    </span>
                  )}
                </div>
                {readOnly ? (
                  <span className="text-gray-300">
                    <span className="material-symbols-outlined">lock</span>
                  </span>
                ) : (
                  <button onClick={() => setSelectedMeds(selectedMeds.filter(item => item.maThuoc !== m.maThuoc))} className="text-gray-300 hover:text-red-500">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Liều dùng</label>
                  <input 
                    type="text" 
                    value={m.lieuDung || ''} 
                    onChange={(e) => onUpdateMedField(m.maThuoc, 'lieuDung', e.target.value)}
                    placeholder="VD: 1 viên/lần"
                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm" 
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Cách dùng</label>
                  <input 
                    type="text" 
                    value={m.cachDung || ''} 
                    onChange={(e) => onUpdateMedField(m.maThuoc, 'cachDung', e.target.value)}
                    placeholder="VD: Uống sau ăn"
                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm" 
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Thời điểm dùng</label>
                  <input 
                    type="text" 
                    value={m.thoiDiemDung || ''} 
                    onChange={(e) => onUpdateMedField(m.maThuoc, 'thoiDiemDung', e.target.value)}
                    placeholder="VD: Sau bữa ăn sáng"
                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm" 
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {['sang', 'trua', 'chieu', 'toi'].map(time => (
                  <div key={time}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase">{time}</label>
                    <input 
                      type="text" 
                      value={m[time] || ''} 
                      onChange={(e) => onUpdateMedField(m.maThuoc, time, e.target.value)}
                      className="w-full p-2 bg-gray-50 border rounded-lg text-sm" 
                      disabled={readOnly}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Số ngày</label>
                  <input 
                    type="number" 
                    value={m.soNgay || ''} 
                    onChange={(e) => onUpdateMedField(m.maThuoc, 'soNgay', parseInt(e.target.value) || '')}
                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm" 
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- PHẦN TỬ IN ĐƠN THUỐC (ẨN TRÊN MÀN HÌNH, CHỈ HIỂN THỊ KHI IN) --- */}
      {selectedPatient && (
        <div id="prescription-print-area" className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed text-sm">
          <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
            <div>
              <h2 className="text-md font-bold uppercase text-indigo-900">HỆ THỐNG PHÒNG KHÁM QUỐC TẾ MEDCORE</h2>
              <p className="text-xs text-gray-600">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
              <p className="text-xs text-gray-600">Điện thoại: 1900 6000 • Website: www.medcore.vn</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-black text-indigo-900 tracking-wide">ĐƠN THUỐC</h3>
              <p className="text-xs text-gray-500">Mã phiếu: #{selectedPatient.maPhieuKham}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6 border-b border-gray-100 pb-4">
            <div>
              <p><strong>Họ tên bệnh nhân:</strong> {selectedPatient.hoTen}</p>
              <p><strong>Ngày sinh:</strong> {selectedPatient.ngaySinh ? new Date(selectedPatient.ngaySinh).toLocaleDateString('vi-VN') : 'N/A'}</p>
              <p><strong>Giới tính:</strong> {formatGender(selectedPatient.gioiTinh)}</p>
            </div>
            <div>
              <p><strong>Mã bệnh nhân:</strong> #{selectedPatient.maBenhNhan}</p>
              <p><strong>Chẩn đoán sơ bộ:</strong> {selectedPatient.ghiChu || 'Khám sức khỏe tổng quát'}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold border-b border-gray-300 pb-1 mb-4 uppercase text-xs tracking-wider">Danh sách thuốc chỉ định</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-xs">
                  <th className="py-2">STT</th>
                  <th className="py-2">Tên thuốc (Hoạt chất)</th>
                  <th className="py-2 text-center">ĐVT</th>
                  <th className="py-2 text-center">Sáng</th>
                  <th className="py-2 text-center">Trưa</th>
                  <th className="py-2 text-center">Chiều</th>
                  <th className="py-2 text-center">Tối</th>
                  <th className="py-2 text-center">Số ngày</th>
                </tr>
              </thead>
              <tbody>
                {selectedMeds.map((m, idx) => (
                  <tr key={m.maThuoc || idx} className="border-b border-gray-100 text-xs">
                    <td className="py-3 font-medium">{idx + 1}</td>
                    <td className="py-3">
                      <p className="font-bold">{m.tenThuoc}</p>
                      <p className="text-gray-500 text-[10px] font-sans">({m.hoatChat})</p>
                      <p className="text-gray-600 italic text-[10px] mt-0.5">HD: {m.cachDung || 'Uống sau ăn'}</p>
                    </td>
                    <td className="py-3 text-center">{m.donViTinh || 'Viên'}</td>
                    <td className="py-3 text-center font-semibold">{m.sang || '-'}</td>
                    <td className="py-3 text-center font-semibold">{m.trua || '-'}</td>
                    <td className="py-3 text-center font-semibold">{m.chieu || '-'}</td>
                    <td className="py-3 text-center font-semibold">{m.toi || '-'}</td>
                    <td className="py-3 text-center font-bold">{m.soNgay || 1} ngày</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <p><strong>Lời dặn của bác sĩ:</strong></p>
              <p className="mt-1 italic">- Uống thuốc đúng giờ, đúng liều lượng.</p>
              <p>- Tránh uống rượu bia trong thời gian điều trị.</p>
              <p>- Tái khám theo đúng hẹn của bác sĩ hoặc khi có triệu chứng bất thường.</p>
            </div>
            <div className="text-center ml-auto min-w-[200px]">
              <p className="text-xs italic mb-1">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
              <p className="font-bold text-xs uppercase mb-12">Bác sĩ điều trị</p>
              <p className="font-serif italic text-lg text-indigo-800">{user?.hoTen || user?.username || 'Bác sĩ chuyên khoa'}</p>
              <p className="text-[10px] text-gray-400 mt-1">Đã ký điện tử</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabKeDonThuoc;