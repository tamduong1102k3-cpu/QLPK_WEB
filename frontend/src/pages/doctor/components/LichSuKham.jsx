import React, { useState, useEffect, useCallback } from 'react';
import { getApprovedHistoryApi } from '../../../api/phieuChiDinhApi';
import { getHistoryApi } from '../../../api/phieuKhamApi';
import { getByPhieuKhamApi } from '../../../api/khamLamSangApi';
import { ModalContent } from '../../../components/ChiTietKhamModal';

const LichSuKham = ({
  user,
  onSelectPatient
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const isXetNghiemDoc = user?.maChuyenKhoa === 7 || user?.tenChuyenKhoa?.toLowerCase()?.includes('xét nghiệm') || user?.tenChuyenKhoa?.toLowerCase()?.includes('xact nghiem') || user?.tenChuyenKhoa?.toLowerCase()?.includes('xact nghi?m');
  
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      let data = [];
      const params = { maBacSi: user?.maNhanVien || '' };
      if (isXetNghiemDoc) {
        data = await getApprovedHistoryApi(params);
      } else {
        data = await getHistoryApi(params);
      }
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isXetNghiemDoc]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleViewDetail = async (item) => {
    setDetailLoading(true);
    setDetailData(null);
    try {
      const data = await getByPhieuKhamApi(item.maPhieuKham);
      if (data) {
        setDetailData({
          ...data,
          maPhieuKham: item.maPhieuKham,
          hoTen: item.hoTen,
          ngayKham: item.ngayKham,
          tenChuyenKhoa: item.tenChuyenKhoa,
          tenNhanVien: item.tenNhanVien,
        });
      }
    } catch (error) {
      console.error("Lỗi tải chi tiết khám lâm sàng:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  return <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-bold text-lg text-gray-800">
          {isXetNghiemDoc ? 'Lịch Sử Phê Duyệt Hôm Ngay' : 'Lịch Sử Khám Hôm Nay'}
        </h3>
        <button onClick={fetchHistory} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
          <span className="material-symbols-outlined text-sm">refresh</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Mã Phiếu</th>
              <th className="px-6 py-4">Bệnh Nhân</th>
              <th className="px-6 py-4">{isXetNghiemDoc ? 'Giờ Duyệt' : 'Giờ Khám'}</th>
              <th className="px-6 py-4">{isXetNghiemDoc ? 'Dịch Vụ Xét Nghiệm' : 'Chẩn Đoán'}</th>
              <th className="px-6 py-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400 italic">Đang tải...</td></tr> : history.length === 0 ? <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                  {isXetNghiemDoc ? 'Chưa duyệt kết quả xét nghiệm nào' : 'Chưa có bệnh nhân nào được khám'}
                </td>
              </tr> : history.map(item => <tr key={item.maPhieuKham} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-indigo-600">#{item.maPhieuKham}</td>
                  <td className="px-6 py-4 font-bold text-gray-800">{item.hoTen}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {new Date(item.ngayKham).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 text-gray-600 italic text-sm">{item.chanDoan || 'Đang cập nhật...'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => onSelectPatient(item)} className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">edit</span>
                        Sửa / Xem
                      </button>
                      <button onClick={() => handleViewDetail(item)} className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all text-xs flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-xs">visibility</span>
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>)}
          </tbody>
        </table>
      </div>
    </div>
    
    {/* Loading detail */}
    {detailLoading && (
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center">
        <div className="bg-white p-6 rounded-2xl shadow-xl border flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-gray-600">Đang tải chi tiết...</span>
        </div>
      </div>
    )}

    {/* Detail Modal */}
    {detailData && (
      <ModalContent
        data={detailData}
        onClose={() => setDetailData(null)}
      />
    )}
};

export default LichSuKham;
