import React, { useState, useEffect } from 'react';
import { getToaThuocByPhieuKhamApi, xacNhanCapThuocApi } from '../../../api/duocSiApi';
import InDonThuoc from './InDonThuoc';
import formatGender from '../../../utils/formatGender';

const ChiTietThuocDuocSi = ({ patient, onBack, formatCurrency, formatDateTime }) => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchPrescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getToaThuocByPhieuKhamApi(patient.maPhieuKham);
      if (Array.isArray(data)) {
        setPrescriptions(data);
      }
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError('Không thể tải đơn thuốc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patient?.maPhieuKham) {
      fetchPrescriptions();
    }
  }, [patient?.maPhieuKham]);

  // Stock + expiry indicators
  const getTonKhoBadge = (tonKho) => {
    if (tonKho == null) return null;
    if (tonKho <= 0) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-md border border-red-200">Hết hàng</span>;
    }
    if (tonKho < 20) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md border border-orange-200">Tồn: {tonKho}</span>;
    }
    if (tonKho <= 50) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">Tồn: {tonKho}</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">Tồn: {tonKho}</span>;
  };

  const getHanSuDungBadge = (hanSuDung, canhBao) => {
    if (!hanSuDung) return null;
    const isExpired = canhBao?.includes('Hết hạn');
    const isNearExpiry = canhBao?.includes('Sắp hết hạn');
    if (isExpired) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-md border border-red-200">Hết hạn: {hanSuDung}</span>;
    }
    if (isNearExpiry) {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-md border border-yellow-200">Sắp hết hạn: {hanSuDung}</span>;
    }
    return <span className="text-[10px] text-gray-400">{hanSuDung}</span>;
  };

  const handleXacNhanCapThuoc = async (maToaThuoc) => {
    setConfirming(maToaThuoc);
    setSuccessMsg(null);
    setError(null);
    try {
      const result = await xacNhanCapThuocApi(maToaThuoc);
      if (result?.success) {
        setSuccessMsg(`✅ Đã cấp thuốc thành công cho toa #${maToaThuoc}`);
        // Refresh to update status
        await fetchPrescriptions();
      }
    } catch (err) {
      // Handle blocked response (error 400 with blocked items)
      const errorData = err?.data;
      const blockedItems = errorData?.blocked || [];
      
      if (blockedItems.length > 0) {
        const detailMsg = blockedItems.map(item => 
          `• ${item.tenThuoc}: ${item.lyDo || 'không đủ điều kiện'}`
        ).join('\n');
        setError(`⛔ Không thể cấp thuốc!\n${detailMsg}`);
      } else {
        setError(err.message || 'Xác nhận thất bại');
      }
    } finally {
      setConfirming(null);
    }
  };

  const getTrangThaiBadge = (trangThai) => {
    if (trangThai === 'DA_CAP_THUOC') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
          <span className="material-symbols-outlined text-[14px]">check_circle</span>
          Đã cấp thuốc
        </span>
      );
    }
    if (trangThai === 'HET_HAN_NHAN_THUOC') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-lg border border-gray-200">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          Hết hạn nhận thuốc
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
        <span className="material-symbols-outlined text-[14px]">pending</span>
        Chờ cấp thuốc
      </span>
    );
  };

  const renderDosageCell = (value) => {
    return value || <span className="text-gray-300">—</span>;
  };

  const totalPrescriptions = prescriptions.length;
  const capXongCount = prescriptions.filter(p => p.trangThai === 'DA_CAP_THUOC').length;
  const hetHanCount = prescriptions.filter(p => p.trangThai === 'HET_HAN_NHAN_THUOC').length;
  const dangChoCount = totalPrescriptions - capXongCount - hetHanCount;

  return (
    <div className="animate-fade-in">
      {/* Patient Info Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-gray-600">arrow_back</span>
            </button>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {patient.hoTen?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{patient.hoTen}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>Mã BN: #{patient.maBenhNhan}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>Mã PK: #{patient.maPhieuKham}</span>
                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                <span>HĐ: #{patient.maHoaDon}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              Giới tính: <strong>{formatGender(patient.gioiTinh)}</strong>
            </span>
            <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
              SĐT: <strong>{patient.soDienThoai || 'N/A'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          <span className="text-sm font-medium text-emerald-700">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-400 hover:text-emerald-600">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-red-600">error</span>
          <span className="text-sm font-medium text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && prescriptions.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Tổng toa thuốc</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{totalPrescriptions}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Đã cấp</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{capXongCount}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Chờ cấp</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{dangChoCount}</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="p-10 text-center">
          <div className="flex items-center justify-center gap-3 text-gray-500">
            <span className="material-symbols-outlined animate-spin">refresh</span>
            <span className="text-sm font-medium">Đang tải đơn thuốc...</span>
          </div>
        </div>
      )}

      {/* No data */}
      {!loading && prescriptions.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-gray-300 text-3xl">medication</span>
          </div>
          <p className="text-gray-400 text-sm font-medium">Bệnh nhân này không có toa thuốc</p>
          <p className="text-gray-300 text-xs mt-1">Phiếu khám #{patient.maPhieuKham} không có đơn thuốc</p>
        </div>
      )}

      {/* Prescription Cards */}
      {!loading && prescriptions.map((toa, idx) => (
        <div key={toa.maToaThuoc} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          {/* Prescription Header */}
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                {idx + 1}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  Toa thuốc #{toa.maToaThuoc}
                  {getTrangThaiBadge(toa.trangThai)}
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Ngày tạo: {formatDateTime(toa.ngayTao)}
                  {toa.ghiChu && <span className="ml-2">• Ghi chú: {toa.ghiChu}</span>}
                </p>
              </div>
            </div>
            {toa.trangThai !== 'DA_CAP_THUOC' && toa.trangThai !== 'HET_HAN_NHAN_THUOC' && (
              <button
                onClick={() => handleXacNhanCapThuoc(toa.maToaThuoc)}
                disabled={confirming === toa.maToaThuoc}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                  confirming === toa.maToaThuoc
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-md active:scale-95'
                }`}
              >
                {confirming === toa.maToaThuoc ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    Xác nhận đã cấp thuốc
                  </>
                )}
              </button>
            )}
            {toa.trangThai === 'DA_CAP_THUOC' && (
              <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                Hoàn thành
              </span>
            )}
            {toa.trangThai === 'HET_HAN_NHAN_THUOC' && (
              <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg font-medium inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">schedule</span>
                Quá hạn - đã giải phóng thuốc
              </span>
            )}
          </div>

          {/* Medicine Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">STT</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Tên thuốc</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Hàm lượng</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">ĐVT</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Tồn kho</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Hạn SD</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Liều dùng</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Sáng</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Trưa</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Chiều</th>
                  <th className="text-center px-2 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Tối</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Số ngày</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Cách dùng</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Thời điểm dùng</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(toa.chiTietThuoc || []).map((item, i) => (
                  <tr key={item.id || i} className={`hover:bg-amber-50/40 transition-colors ${item.canhBao?.includes('Hết hạn') || item.canhBao?.includes('Hết hàng') ? 'bg-red-50/50' : item.canhBao?.includes('Sắp hết hạn') ? 'bg-yellow-50/50' : ''}`}>
                    <td className="px-4 py-3.5 text-sm text-gray-400 font-medium">{i + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-white text-[14px]">pill</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{item.tenThuoc}</p>
                          {item.hoatChat && (
                            <p className="text-[10px] text-gray-400">{item.hoatChat}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{item.hamLuong || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">{item.donViTinh || '—'}</td>
                    <td className="px-4 py-3.5 text-center">
                      {getTonKhoBadge(item.tonKho)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getHanSuDungBadge(item.hanSuDung, item.canhBao)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{item.lieuDung || '—'}</td>
                    <td className="px-2 py-3.5 text-center">
                      <span className="text-sm font-semibold text-blue-600">{renderDosageCell(item.sang)}</span>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <span className="text-sm font-semibold text-amber-600">{renderDosageCell(item.trua)}</span>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <span className="text-sm font-semibold text-orange-600">{renderDosageCell(item.chieu)}</span>
                    </td>
                    <td className="px-2 py-3.5 text-center">
                      <span className="text-sm font-semibold text-purple-600">{renderDosageCell(item.toi)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center text-sm font-bold text-gray-700">{item.soNgay || '—'}</td>
                    <td className="px-4 py-3.5">
                      {item.cachDung ? (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-cyan-500">inventory_2</span>
                          <span className="text-sm text-gray-700">{item.cachDung}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {item.thoiDiemDung ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          {item.thoiDiemDung}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {item.canhBao && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-200">
                          <span className="material-symbols-outlined text-[12px]">warning</span>
                          {item.canhBao}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {toa.ghiChu ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 border border-sky-100 rounded-lg">
                          <span className="material-symbols-outlined text-[14px] text-sky-500">note</span>
                          <span className="text-xs text-sky-700 font-medium">{toa.ghiChu}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Bottom Action Bar */}
      <div className="mt-4 flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="text-sm text-gray-500">
          <span className="font-medium">Hóa đơn #{patient.maHoaDon}</span>
          <span className="mx-2">•</span>
          <span>Tổng tiền: <strong className="text-gray-800">{formatCurrency(patient.tongTien)}</strong></span>
          {totalPrescriptions > 0 && (
            <>
              <span className="mx-2">•</span>
              <span>
                Đã cấp: <strong className="text-emerald-600">{capXongCount}/{totalPrescriptions}</strong>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {prescriptions.length > 0 && (
            <InDonThuoc
              patient={patient}
              prescriptions={prescriptions}
              formatDateTime={formatDateTime}
            />
          )}
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChiTietThuocDuocSi;