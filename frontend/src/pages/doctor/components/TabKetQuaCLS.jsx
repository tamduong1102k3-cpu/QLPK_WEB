import React, { useState, useEffect, useCallback } from 'react';
import { getAvailableClsResultsApi } from '../../../api/phieuKhamApi';
import { getDetailClsResultApi } from '../../../api/ketQuaClsApi';
import { useNotification } from '../../../components/NotificationContext';

const TabKetQuaCLS = ({ maPhieuKham }) => {
  const { showError } = useNotification();
  const [availableCls, setAvailableCls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Referenced IDs from clinical exam to display checkmarks
  const [referencedIds, setReferencedIds] = useState([]);

  const fetchAvailableCls = useCallback(async () => {
    if (!maPhieuKham) return;
    setLoading(true);
    try {
      const data = await getAvailableClsResultsApi(maPhieuKham);
      setAvailableCls(data || []);

      // Load referenced checkmarks from localStorage
      const refKey = `ref-cls-${maPhieuKham}`;
      const savedRefs = JSON.parse(localStorage.getItem(refKey) || "[]");
      setReferencedIds(savedRefs);
    } catch (error) {
      console.error("Lỗi fetch danh sách CLS:", error);
    } finally {
      setLoading(false);
    }
  }, [maPhieuKham]);

  useEffect(() => {
    fetchAvailableCls();
  }, [fetchAvailableCls, maPhieuKham]);

  const handleViewDetail = async (chiDinhId) => {
    setDetailLoading(true);
    try {
      const detail = await getDetailClsResultApi(chiDinhId);
      setSelectedResult(detail);
    } catch (error) {
      console.error("Lỗi lấy chi tiết kết quả CLS:", error);
      showError("Không thể tải kết quả chi tiết!");
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm text-gray-400 font-medium">Đang tải danh sách kết quả cận lâm sàng...</p>
      </div>
    );
  }

  const labs = availableCls.filter(item => item.loai === 'XET_NGHIEM');
  const cdhas = availableCls.filter(item => item.loai === 'CDHA');

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-fade-in space-y-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-indigo-600">biotech</span>
          Kết Quả Cận Lâm Sàng
        </h2>
        {maPhieuKham && (
          <button 
            onClick={fetchAvailableCls}
            title="Làm mới dữ liệu"
            className="p-2 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-xl transition-all border border-transparent hover:border-indigo-100 flex items-center gap-1 text-xs font-bold"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            LÀM MỚI
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* KHU VỰC 1: KẾT QUẢ XÉT NGHIỆM */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-rose-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
            <span className="material-symbols-outlined text-rose-500">science</span>
            Kết Quả Xét Nghiệm ({labs.length})
          </h3>

          {labs.length > 0 ? (
            <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden shadow-2xs">
              {labs.map(item => {
                const isReferenced = referencedIds.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 transition-all ${
                      isReferenced ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isReferenced && (
                        <span className="material-symbols-outlined text-emerald-500 font-black text-lg" title="Đã đồng bộ sang khám lâm sàng">
                          check_circle
                        </span>
                      )}
                      <span className={`text-sm font-bold ${isReferenced ? 'text-emerald-700 font-extrabold' : 'text-gray-700'}`}>
                        {item.tenDichVu}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetail(item.id)}
                      className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg text-xs transition-all"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <span className="material-symbols-outlined text-3xl text-gray-300 mb-1 block">science</span>
              Chưa có kết quả xét nghiệm được duyệt
            </div>
          )}
        </div>

        {/* KHU VỰC 2: KẾT QUẢ CHẨN ĐOÁN HÌNH ẢNH */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-blue-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-50 pb-2">
            <span className="material-symbols-outlined text-blue-500">radiology</span>
            Kết Quả Chẩn Đoán Hình Ảnh ({cdhas.length})
          </h3>

          {cdhas.length > 0 ? (
            <div className="border border-gray-100 rounded-2xl divide-y divide-gray-100 overflow-hidden shadow-2xs">
              {cdhas.map(item => {
                const isReferenced = referencedIds.includes(item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 transition-all ${
                      isReferenced ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isReferenced && (
                        <span className="material-symbols-outlined text-emerald-500 font-black text-lg" title="Đã đồng bộ sang khám lâm sàng">
                          check_circle
                        </span>
                      )}
                      <span className={`text-sm font-bold ${isReferenced ? 'text-emerald-700 font-extrabold' : 'text-gray-700'}`}>
                        {item.tenDichVu}
                      </span>
                    </div>
                    <button
                      onClick={() => handleViewDetail(item.id)}
                      className="px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold rounded-lg text-xs transition-all"
                    >
                      Xem chi tiết
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <span className="material-symbols-outlined text-3xl text-gray-300 mb-1 block">radiology</span>
              Chưa có kết quả chẩn đoán hình ảnh
            </div>
          )}
        </div>
      </div>

      {/* POPUP XEM CHI TIẾT KẾT QUẢ */}
      {selectedResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="bg-indigo-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">
                  {selectedResult.loaiDichVu === 'XET_NGHIEM' ? 'biotech' : 'radiology'}
                </span>
                <span className="font-black text-base">{selectedResult.tenDichVu}</span>
              </div>
              <button 
                onClick={() => setSelectedResult(null)}
                className="p-1 hover:bg-white/10 text-white/80 hover:text-white rounded-full transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kết quả chi tiết</p>
                <p className="text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-200/50 whitespace-pre-line leading-relaxed font-medium">
                  {selectedResult.noiDungKetQua || 'Không có mô tả chi tiết.'}
                </p>
              </div>

              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Kết luận của bác sĩ chuyên khoa</p>
                <p className="text-sm font-bold text-rose-600 bg-rose-50/30 p-4 rounded-2xl border border-rose-100 whitespace-pre-line leading-relaxed">
                  {selectedResult.ketLuan || 'Chưa có kết luận.'}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedResult(null)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-gray-200"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl shadow-xl border flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-gray-600">Đang tải kết quả chi tiết...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabKetQuaCLS;