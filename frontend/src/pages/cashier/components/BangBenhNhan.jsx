import React from 'react';
import formatGender from '../../../utils/formatGender';

const BangBenhNhan = ({ 
  worklistTab, setWorklistTab, setSelectedPatient,
  pendingCount, paidCount,
  searchTerm, setSearchTerm, 
  isLoading, filtered, selectedPatient,
  handleSelectPatient, handleSelectPaidPatient, handlePayClick
}) => {
  return (
    <>
      <div className="flex justify-between items-center border-b border-slate-100 pb-5">
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          Danh sách thanh toán hôm nay
        </h3>
        <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-emerald-600 transition-all flex items-center justify-center p-2.5 hover:bg-emerald-50 rounded-xl group ring-1 ring-transparent hover:ring-emerald-100">
          <span className="material-symbols-outlined group-hover:rotate-180 transition-transform duration-500">refresh</span>
        </button>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/50 w-fit backdrop-blur-sm">
          <button onClick={() => { setWorklistTab('pending'); setSelectedPatient(null); }} className={`flex-1 flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-300 ${worklistTab === 'pending' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
<span className="whitespace-nowrap">Chờ thanh toán</span>
            <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black ${worklistTab === 'pending' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{pendingCount}</span>
          </button>
          <button onClick={() => { setWorklistTab('completed'); setSelectedPatient(null); }} className={`flex-1 flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold transition-all duration-300 ${worklistTab === 'completed' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}>
<span className="whitespace-nowrap">Đã thanh toán</span>
            <span className={`px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-black ${worklistTab === 'completed' ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-600'}`}>{paidCount}</span>
          </button>
        </div>

        <div className="relative w-full md:w-80 lg:w-96 group flex-shrink-0">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none">search</span>
          <input type="text" placeholder="Tìm tên, SĐT, mã PK..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10 rounded-2xl text-sm font-semibold outline-none transition-all placeholder:font-medium placeholder:text-slate-400" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200/60 shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[11px]">
              <th className="py-5 px-4 w-14 text-center">STT</th>
              <th className="py-5 px-4 w-36">Mã Khám</th>
              <th className="py-5 px-4">Bệnh nhân</th>
              <th className="py-5 px-4">CCCD</th>
              <th className="py-5 px-4">SĐT</th>
              <th className="py-5 px-4">Chuyên khoa</th>
              <th className="py-5 px-4 text-center w-48">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-slate-400">
                  <div className="flex items-center justify-center">
                    <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                    Đang tải...
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                    <p className="font-medium">Không tìm thấy bệnh nhân.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => {
                const isSelected = selectedPatient?.maPhieuKham === item.maPhieuKham;
                return (
                  <tr
                    key={item.maPhieuKham}
                    onClick={() => worklistTab === 'pending' ? handleSelectPatient(item) : handleSelectPaidPatient(item)}
                    className={`hover:bg-slate-50/80 transition-colors duration-200 cursor-pointer ${isSelected ? 'bg-emerald-50/40 font-medium' : ''}`}
                  >
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-bold text-slate-400">{index + 1}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-extrabold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50">#{item.maPhieuKham}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black shadow-sm flex-shrink-0 ${formatGender(item.gioiTinh) === 'Nam' ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 border border-blue-200/50' : 'bg-gradient-to-br from-rose-100 to-pink-100 text-rose-700 border border-rose-200/50'}`}>
                          {item.hoTen ? item.hoTen[0].toUpperCase() : 'BN'}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-800 text-base truncate">{item.hoTen}</h4>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-slate-700">{item.cccd || <span className="text-slate-300 italic">N/A</span>}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-slate-700">{item.soDienThoai || <span className="text-slate-300 italic">N/A</span>}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-700">{item.tenChuyenKhoa || '—'}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {worklistTab === 'pending' ? (
                        <button
                          onClick={(e) => handlePayClick(item, e)}
                          className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-600 shadow-md shadow-emerald-500/20 text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm mx-auto"
                        >
                          <span className="material-symbols-outlined text-[18px]">payments</span> THANH TOÁN
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectPaidPatient(item); }}
                          className="px-4 py-2.5 bg-gradient-to-r from-slate-600 to-slate-500 text-white font-bold rounded-xl hover:from-slate-700 hover:to-slate-600 shadow-md shadow-slate-500/20 text-xs flex items-center justify-center gap-1.5 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm mx-auto"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span> CHI TIẾT
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default BangBenhNhan;
