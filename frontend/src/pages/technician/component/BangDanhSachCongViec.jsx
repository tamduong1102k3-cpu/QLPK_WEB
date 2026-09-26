import React, { useState, useMemo } from 'react';
import { formatDateOfBirth, calculateAge, formatDateTime } from './TienIchKyThuatVien';
import formatGender from '../../../utils/formatGender';

// Sort patients: normal order by soThuTu ASC, but xepCuoi=true patients go to the end
function sortPatientList(patients) {
  const sorted = [...patients].sort((a, b) => (a.soThuTu || 0) - (b.soThuTu || 0));
  const normal = sorted.filter(p => !p.xepCuoi);
  const xepCuoi = sorted.filter(p => p.xepCuoi);
  return [...normal, ...xepCuoi];
}

const BangDanhSachCongViec = ({ 
  list, 
  worklistTab, 
  setWorklistTab, 
  isImaging, 
  title, 
  onOpenResult, 
  onOpenView, 
  onOpenVitals, 
  onEditResult, 
  onMarkAbsent, 
  onMarkPresent, 
  searchQuery, 
  setSearchQuery, 
  isRefreshing, 
  onManualRefresh, 
  loading, 
  onAcceptPatient 
}) => {
  const [filterMode, setFilterMode] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const headerTitle = title || (isImaging ? 'Bệnh nhân chờ Chụp chiếu' : 'Bệnh nhân chờ Xét nghiệm');

  // Apply filter + sort before rendering
  const displayData = useMemo(() => {
    let data = list.data || [];
    
    // Filter "Đang chờ": chỉ hiển thị bệnh nhân đang chờ khám (CHO_KHAM)
    // Bệnh nhân VANG_MAT chỉ hiển thị khi chọn "Tất cả"
    if (filterMode === 'pending') {
      data = data.filter(p => p.trangThai === 'CHO_KHAM' || p.trangThai === 'DANG_KHAM');
    }
    
    return sortPatientList(data);
  }, [list.data, worklistTab, filterMode]);

  return (
    <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/60 space-y-8">
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <span className="material-symbols-outlined text-xl">pending_actions</span>
          </div>
          {headerTitle}
        </h3>
        <button onClick={onManualRefresh} disabled={isRefreshing} className="text-slate-400 hover:text-indigo-600 transition-all flex items-center justify-center p-2.5 hover:bg-indigo-50 rounded-xl group ring-1 ring-transparent hover:ring-indigo-100">
          <span className={`material-symbols-outlined ${isRefreshing ? 'animate-spin text-indigo-500' : 'group-hover:rotate-180 transition-transform duration-500'}`}>refresh</span>
        </button>
      </div>

      {/* Filter + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 border bg-white ${
                filterMode === 'pending' 
                  ? 'text-indigo-700 border-indigo-200 bg-indigo-50' 
                  : 'text-slate-600 border-slate-200 hover:border-indigo-300'
              }`}
            >
              <span className="material-symbols-outlined text-lg">filter_alt</span>
              <span>{filterMode === 'all' ? 'Tất cả' : 'Đang chờ'}</span>
            </button>
            {showFilterDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowFilterDropdown(false)}></div>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-20 min-w-[160px]">
                  <button 
                    onClick={() => { setFilterMode('all'); setShowFilterDropdown(false); }} 
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center gap-2 ${filterMode === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="material-symbols-outlined text-lg">filter_list</span>
                    Tất cả
                  </button>
                  <button 
                    onClick={() => { setFilterMode('pending'); setShowFilterDropdown(false); }} 
                    className={`w-full text-left px-4 py-3 text-sm font-bold transition-colors flex items-center gap-2 ${filterMode === 'pending' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="material-symbols-outlined text-lg">pending_actions</span>
                    Đang chờ
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative w-72">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">search</span>
          <input type="text" placeholder="Tìm tên bệnh nhân..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:font-medium placeholder:text-slate-400" />
        </div>
      </div>

      {/* Các tab ngang */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/50 backdrop-blur-sm">
        {list.receptionCount !== undefined && (
          <button onClick={() => setWorklistTab('reception')} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${worklistTab === 'reception' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
            <span>CHỜ TIẾP NHẬN</span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${worklistTab === 'reception' ? 'bg-sky-100 text-sky-700' : 'bg-slate-200 text-slate-600'}`}>{list.receptionCount}</span>
          </button>
        )}
        <button onClick={() => setWorklistTab('pending')} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${worklistTab === 'pending' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <span>CHỜ THỰC HIỆN</span>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${worklistTab === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{list.pendingCount}</span>
        </button>
        <button onClick={() => setWorklistTab('completed')} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${worklistTab === 'completed' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
          <span>ĐÃ HOÀN THÀNH</span>
          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${worklistTab === 'completed' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>{list.completedCount}</span>
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[11px]">
              <th className="py-5 px-6 min-w-[220px]">STT</th>
              <th className="py-5 px-6">Bệnh nhân</th>
              <th className="py-5 px-6 hidden lg:table-cell">SĐT</th>
              <th className="py-5 px-6 hidden xl:table-cell">CCCD</th>
              <th className="py-5 px-6">Dịch vụ</th>
              <th className="py-5 px-6 text-center w-56">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                    <p className="font-medium">Không tìm thấy dữ liệu.</p>
                  </div>
                </td>
              </tr>
            ) : displayData.map((item, idx) => (
              <tr key={item.id || idx} className={`hover:bg-slate-50/80 transition-colors duration-200 group ${item.trangThai === 'VANG_MAT' ? 'bg-red-50/60' : ''}`}>
                <td className="py-4 px-6 min-w-[220px]">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-extrabold px-3 py-1.5 rounded-lg border ${item.trangThai === 'VANG_MAT' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200/50'}`}>{item.soThuTu || idx + 1}</span>
                    {item.tenPhong && (
                      <span className="whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">{item.tenPhong}</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shadow-sm flex-shrink-0 ${formatGender(item.gioiTinh) === 'Nam' ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50' : 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 border border-rose-200/50'}`}>
                      {item.hoTen ? item.hoTen[0].toUpperCase() : 'BN'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-slate-800 text-base truncate flex items-center gap-2">
                        {item.hoTen}
                        {item.trangThai === 'VANG_MAT' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">VẮNG MẶT</span>
                        )}
                        {item.xepCuoi && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">XẾP CUỐI</span>
                        )}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${formatGender(item.gioiTinh) === 'Nam' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{formatGender(item.gioiTinh)}</span>
                        <span>•</span>
                        <span>{formatDateOfBirth(item.ngaySinh)}</span>
                        <span className="text-slate-400">({calculateAge(item.ngaySinh)})</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 hidden lg:table-cell">
                  <span className="font-bold text-slate-700">{item.soDienThoai || item.sdt || '-'}</span>
                </td>
                <td className="py-4 px-6 hidden xl:table-cell">
                  <span className="font-bold text-slate-700">{item.cccd || '-'}</span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${item.trangThai === 'VANG_MAT' ? 'bg-red-400' : worklistTab === 'pending' ? 'bg-amber-400 animate-pulse' : worklistTab === 'completed' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className="font-bold text-slate-700">{item.tenDichVu || item.tenChuyenKhoa || 'Khám bệnh'}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-center">
                  {worklistTab === 'pending' ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {item.trangThai === 'VANG_MAT' ? (
                        <span className="px-3 py-2 text-xs font-bold text-red-500 italic">Đã vắng mặt</span>
                      ) : (
                        <>
                          <button 
                            onClick={() => {
                              if (item.hasVitals) {
                                onOpenResult(item);
                              } else {
                                onOpenVitals(item);
                              }
                            }} 
                            className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-indigo-600 shadow-md shadow-indigo-500/20 text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                          >
                            <span className="material-symbols-outlined text-[18px]">stethoscope</span> KHÁM BỆNH
                          </button>
                          {onMarkAbsent && (
                            <button onClick={() => onMarkAbsent(item)} className="w-full px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-600 font-bold rounded-xl border border-red-200 hover:from-red-100 hover:to-red-200 text-xs flex items-center justify-center gap-1.5 transition-all">
                              <span className="material-symbols-outlined text-[18px]">person_off</span> VẮNG
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : worklistTab === 'reception' ? (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <button 
                        onClick={() => onAcceptPatient && onAcceptPatient(item)} 
                        className="w-full px-5 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold rounded-xl hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/20 text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]">stethoscope_arrow</span> KHÁM
                      </button>
                      {onMarkAbsent && (
                        <button onClick={() => onMarkAbsent(item)} className="w-full px-3 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-600 font-bold rounded-xl border border-red-200 hover:from-red-100 hover:to-red-200 text-xs flex items-center justify-center gap-1.5 transition-all">
                          <span className="material-symbols-outlined text-[18px]">person_off</span> VẮNG
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      {onOpenView ? (
                        <>
                          <button 
                            onClick={() => onOpenVitals(item)} 
                            className={`px-3 py-2.5 font-bold rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm ${
                              item.hasVitals 
                                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border border-emerald-200 hover:from-emerald-200 hover:to-teal-200 shadow-emerald-500/10' 
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-amber-500/20'
                            }`}
                            title={item.hasVitals ? 'Sửa chỉ số sinh hiệu' : 'Nhập chỉ số sinh hiệu'}
                          >
                            <span className="material-symbols-outlined text-[18px]">monitor_heart</span> 
                            <span className="flex items-center gap-1">
                              SINH HIỆU
                              {item.hasVitals && <span className="material-symbols-outlined text-sm">check_circle</span>}
                            </span>
                          </button>
                          <button 
                            onClick={() => {
                              if (!item.hasVitals) {
                                if (onOpenVitals) {
                                  onOpenVitals(item);
                                }
                                return;
                              }
                              onEditResult ? onEditResult(item) : onOpenResult(item);
                            }} 
                            className={`px-3 py-2.5 font-bold rounded-xl shadow-md text-xs flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm ${
                              item.hasVitals 
                                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:from-amber-500 hover:to-orange-600 shadow-amber-500/20' 
                                : 'bg-gradient-to-r from-slate-300 to-slate-400 text-white cursor-not-allowed shadow-slate-500/10'
                            }`}
                            title={item.hasVitals ? 'Nhập kết quả chuyên môn' : 'Cần nhập chỉ số sinh hiệu trước'}
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span> KẾT QUẢ
                          </button>
                        </>
                      ) : (
                        <button onClick={() => onOpenResult(item)} className="px-3 py-2.5 bg-gradient-to-r from-slate-600 to-slate-500 text-white font-bold rounded-xl hover:from-slate-700 hover:to-slate-600 shadow-md shadow-slate-500/20 text-xs flex items-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">visibility</span> XEM / SỬA
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BangDanhSachCongViec;