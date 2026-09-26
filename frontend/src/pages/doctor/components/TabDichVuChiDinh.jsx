import React from 'react';
import PrintButton from '../../../components/PrintButton';
import { sqlLikeMatch } from '../../../utils/searchUtils';
import { useNotification } from '../../../components/NotificationContext';
import formatGender from '../../../utils/formatGender';

const TabDichVuChiDinh = ({
  serviceSearch,
  setServiceSearch,
  showServiceList,
  setShowServiceList,
  allServices,
  handleAddService,
  handleRemoveService,
  handleSaveReferral,
  selectedServices,
  setSelectedServices,
  isAssistant,
  selectedPatient,
  user,
  readOnly
}) => {
  const { showWarning } = useNotification();

  const handleSaveWithValidation = () => {
    if (selectedServices.length === 0) {
      showWarning('Vui lòng chọn ít nhất một dịch vụ trước khi lưu!');
      return;
    }
    handleSaveReferral();
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in min-h-[500px] flex flex-col w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Chỉ định dịch vụ cận lâm sàng</h3>
          <p className="text-sm text-gray-500">Tìm kiếm và chọn các dịch vụ kỹ thuật cho bệnh nhân</p>
        </div>
        <div className="flex items-center gap-3">
          {!readOnly && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400">search</span>
              </div>
              <input
                type="text"
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all"
                placeholder="Tìm tên dịch vụ..."
                value={serviceSearch}
                onChange={(e) => { setServiceSearch(e.target.value); setShowServiceList(true); }}
                onFocus={() => setShowServiceList(true)}
                onBlur={() => setTimeout(() => setShowServiceList(false), 200)}
              />
              {showServiceList && (
                <div className="absolute z-30 mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto">
                  {allServices.filter(s => !serviceSearch || sqlLikeMatch(s.tenDichVu, serviceSearch)).map(s => (
                    <div key={s.maDichVu} className="p-3 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0" onClick={() => handleAddService(s)}>
                      <div>
                        <div className="text-sm font-bold text-gray-800">{s.tenDichVu}</div>
                        <div className="text-xs text-gray-500">{s.maChuyenKhoa ? 'Kỹ thuật chuyên khoa' : 'Dịch vụ chung'}</div>
                      </div>
                      <div className="text-sm font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.donGia)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!readOnly && (
            <button onClick={handleSaveWithValidation} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">save</span>
              {isAssistant ? 'LƯU NHÁP CHỈ ĐỊNH' : 'LƯU CHỈ ĐỊNH'}
            </button>
          )}
          {selectedPatient && selectedServices.length > 0 && (
            <PrintButton 
              targetId="services-print-area" 
              variant="primary" 
              title="IN CHỈ ĐỊNH" 
            />
          )}
        </div>
      </div>
      
      {selectedServices.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
            <span className="material-symbols-outlined text-3xl">playlist_add</span>
          </div>
          <p className="text-gray-400 font-medium">Chưa có dịch vụ nào được chọn</p>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-y-auto flex-1 pr-1">
            <table className="w-full text-left">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Tên dịch vụ</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">SL</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Đơn giá</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-right">Thành tiền</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase text-center">Xóa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedServices.map(s => (
                  <tr key={s.maDichVu} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-semibold text-gray-800">{s.tenDichVu}</td>
                    <td className="px-4 py-4 text-sm text-center">
                      <input 
                        type="number" 
                        min="1" 
                        className="w-12 border rounded p-1 text-center bg-transparent" 
                        value={s.soLuong} 
                        onChange={(e) => { 
                          const val = parseInt(e.target.value) || 1; 
                          setSelectedServices(selectedServices.map(item => item.maDichVu === s.maDichVu ? {...item, soLuong: val} : item)); 
                        }} 
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-right font-medium text-gray-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.donGia)}</td>
                    <td className="px-4 py-4 text-sm text-right font-bold text-indigo-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.donGia * s.soLuong)}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        s.trangThaiDv === 'DA_THUC_HIEN' 
                          ? 'bg-green-100 text-green-700' 
                          : s.trangThaiDv === 'CHUA_THUC_HIEN' 
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          s.trangThaiDv === 'DA_THUC_HIEN' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></span>
                        {s.trangThaiDv === 'DA_THUC_HIEN' ? 'Đã thực hiện' : 'Chưa thực hiện'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {readOnly || s.trangThaiDv === 'DA_THUC_HIEN' ? (
                        <span className={`${s.trangThaiDv === 'DA_THUC_HIEN' ? 'text-gray-300' : 'text-gray-300'}`}>
                          <span className="material-symbols-outlined">lock</span>
                        </span>
                      ) : (
                        <button onClick={() => handleRemoveService(s.maDichVu)} className="text-red-400 hover:text-red-600 transition-colors">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-between items-center">
            <div className="text-gray-500">Tổng cộng: <span className="font-bold text-gray-800">{selectedServices.length} dịch vụ</span></div>
            <div className="text-2xl font-black text-indigo-600">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedServices.reduce((acc, s) => acc + (s.donGia * s.soLuong), 0))}
            </div>
          </div>
        </div>
      )}

      {/* --- PHẦN TỬ IN PHIẾU CHỈ ĐỊNH (ẨN TRÊN MÀN HÌNH, CHỈ HIỂN THỊ KHI IN) --- */}
      {selectedPatient && (
        <div id="services-print-area" className="hidden print:block p-8 bg-white text-black font-sans leading-relaxed text-sm">
          <div className="flex justify-between items-start border-b border-gray-300 pb-4 mb-6">
            <div>
              <h2 className="text-md font-bold uppercase text-indigo-900">HỆ THỐNG PHÒNG KHÁM QUỐC TẾ MEDCORE</h2>
              <p className="text-xs text-gray-600">Địa chỉ: 123 Đường Ba Tháng Hai, Quận 10, TP. Hồ Chí Minh</p>
              <p className="text-xs text-gray-600">Điện thoại: 1900 6000 • Website: www.medcore.vn</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-black text-indigo-900 tracking-wide">PHIẾU CHỈ ĐỊNH DỊCH VỤ</h3>
              <p className="text-xs text-gray-500">Mã phiếu khám: #{selectedPatient.maPhieuKham}</p>
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
              <p><strong>Lý do khám / Chẩn đoán:</strong> {selectedPatient.ghiChu || 'Khám tổng quát'}</p>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-bold border-b border-gray-300 pb-1 mb-4 uppercase text-xs tracking-wider">Danh sách dịch vụ cận lâm sàng chỉ định</h3>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-xs">
                  <th className="py-2">STT</th>
                  <th className="py-2">Tên dịch vụ cận lâm sàng</th>
                  <th className="py-2 text-center">Số lượng</th>
                  <th className="py-2 text-right">Đơn giá</th>
                  <th className="py-2 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {selectedServices.map((s, idx) => (
                  <tr key={s.maDichVu} className="border-b border-gray-100 text-xs">
                    <td className="py-3 font-medium">{idx + 1}</td>
                    <td className="py-3 font-bold">{s.tenDichVu}</td>
                    <td className="py-3 text-center">{s.soLuong}</td>
                    <td className="py-3 text-right">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.donGia)}</td>
                    <td className="py-3 text-right font-bold text-indigo-900">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(s.donGia * s.soLuong)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 font-bold">
                  <td colSpan="4" className="py-4 text-right">Tổng cộng thanh toán:</td>
                  <td className="py-4 text-right text-base text-indigo-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedServices.reduce((acc, s) => acc + (s.donGia * s.soLuong), 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-12 pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              <p><strong>Hướng dẫn cho bệnh nhân:</strong></p>
              <p className="mt-1">- Bệnh nhân cầm phiếu này đến quầy thu ngân để thanh toán phí dịch vụ.</p>
              <p>- Sau đó di chuyển đến các phòng kỹ thuật ghi trên phiếu để thực hiện chỉ định.</p>
            </div>
            <div className="text-center ml-auto min-w-[200px]">
              <p className="text-xs italic mb-1">Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
              <p className="font-bold text-xs uppercase mb-12">Bác sĩ chỉ định</p>
              <p className="font-serif italic text-lg text-indigo-800">{user?.hoTen || user?.username || 'Bác sĩ chuyên khoa'}</p>
              <p className="text-[10px] text-gray-400 mt-1">Đã ký điện tử</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabDichVuChiDinh;