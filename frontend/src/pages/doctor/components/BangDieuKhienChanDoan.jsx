import React, { useState, useEffect, useCallback } from 'react';
import {
  getPendingApprovalListApi,
  getApprovedListApi
} from '../../../api/phieuChiDinhApi';
import DuyetKetQuaXetNghiem from './DuyetKetQuaXetNghiem';
import DuyetKetQuaCDHA from './DuyetKetQuaCDHA';
import { toast } from 'react-toastify';
import formatGender from '../../../utils/formatGender';

const TABS = [
  { key: 'pending',     label: 'Chờ duyệt',   icon: 'pending_actions' },
  { key: 'approved',    label: 'Đã duyệt',    icon: 'verified' },
];

const BangDieuKhienChanDoan = ({ user, onBack }) => {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingList, setPendingList] = useState([]);
  const [approvedList, setApprovedList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedLoai, setSelectedLoai] = useState(null);

  const maCK = user?.maChuyenKhoa;
  const isXn = maCK === 7;

  const toPatient = (item) => ({
    maPhieuKham: item.maPhieuKham, maBenhNhan: item.maBenhNhan,
    hoTen: item.hoTen, gioiTinh: item.gioiTinh, ngaySinh: item.ngaySinh,
    soDienThoai: item.soDienThoai, cccd: item.cccd,
    loaiDichVu: item.loaiDichVu,
  });

  const normalize = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filterData = (list) => {
    if (!query.trim()) return list;
    const q = normalize(query);
    return list.filter((i) =>
      normalize(i.hoTen).includes(q) ||
      String(i.maPhieuKham || '').includes(q) ||
      String(i.maBenhNhan || '').includes(q) ||
      String(i.cccd || '').includes(q) ||
      String(i.soDienThoai || '').includes(q)
    );
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = maCK ? { maChuyenKhoa: maCK } : {};
      const [p, a] = await Promise.allSettled([
        getPendingApprovalListApi(params),
        getApprovedListApi(params),
      ]);
      if (p.status === 'fulfilled') setPendingList(p.value || []);
      if (a.status === 'fulfilled') setApprovedList(a.value || []);
    } catch (e) { console.error(e); toast.error('Không tải được dữ liệu.'); }
    finally { setLoading(false); }
  }, [maCK]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30000); return () => clearInterval(t); }, [fetchData]);

  const handleSelect = (item) => {
    const loai = item.loaiKetQua === 'XN' ? 'xet_nghiem' : item.loaiKetQua === 'CDHA' ? 'cdha' : item.loaiKetQua;
    setSelectedPatient(toPatient(item));
    setSelectedLoai(loai);
  };
  const handleBack = () => { setSelectedPatient(null); setSelectedLoai(null); fetchData(); };

  if (selectedPatient && selectedLoai) {
    // Khi mở từ tab "Đã duyệt" (approvedList), set readOnly=true để chỉ cập nhật nội dung, không đổi trạng thái
    const isReviewingApproved = activeTab === 'approved';
    if (selectedLoai === 'xet_nghiem')
      return <DuyetKetQuaXetNghiem patient={selectedPatient} user={user} onBack={handleBack} readOnly={isReviewingApproved} />;
    if (selectedLoai === 'cdha')
      return <DuyetKetQuaCDHA patient={selectedPatient} user={user} onBack={handleBack} readOnly={isReviewingApproved} />;
  }

  const currentList = activeTab === 'pending' ? pendingList : approvedList;
  const counts = {
    pending: pendingList.length,
    approved: approvedList.length,
  };
  const filteredList = filterData(currentList);

  const initials = (name) =>
    (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const formatYear = (d) => {
    if (!d) return '';
    try { return new Date(d).getFullYear().toString(); } catch { return d; }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Section with Glassmorphism */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="flex items-center justify-between flex-wrap gap-4 relative z-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 duration-300 ${
              isXn ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-200/60' : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-200/60'
            }`}>
              <span className="material-symbols-outlined text-white text-[28px]">
                {isXn ? 'biotech' : 'medical_information'}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {isXn ? 'Duyệt Kết Quả Xét Nghiệm' : 'Duyệt Chẩn Đoán Hình Ảnh'}
                </h1>
                {loading && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full ring-1 ring-indigo-200/50 animate-pulse">
                    <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                    Đang tải
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và xét duyệt kết quả cận lâm sàng của bệnh nhân</p>
            </div>
          </div>
        </div>

        {/* Tabs with modern pill design */}
        <div className="flex items-center gap-2 mt-6 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 w-fit relative z-10">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setQuery(''); }}
                className={`flex items-center gap-2.5 px-5 py-2.5 text-sm font-bold rounded-xl transition-all duration-300 relative overflow-hidden ${
                  isActive
                    ? 'text-indigo-700 bg-white shadow-sm ring-1 ring-slate-200/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                }`}>
                <span className={`material-symbols-outlined text-[18px] transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                  {tab.icon}
                </span>
                {tab.label}
                <span className={`flex items-center justify-center text-[11px] h-5 min-w-[20px] px-1.5 rounded-full font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-100 text-indigo-700'
                    : counts[tab.key] > 0 ? 'bg-slate-300/50 text-slate-600' : 'bg-slate-200/50 text-slate-400'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-3xl border border-slate-200/60 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.02)] p-2 min-h-[500px] flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100/80 flex items-center justify-between flex-wrap gap-4">
          <div className="relative w-full max-w-md flex-1 min-w-[250px] group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <span className="material-symbols-outlined text-xl">search</span>
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm bệnh nhân, mã phiếu, CCCD..."
              value={query} 
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-slate-50/50 border border-slate-200/80 rounded-2xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100/50 transition-all shadow-inner shadow-slate-100/50" 
            />
            {query && (
              <button onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-rose-500 transition-colors">
                <span className="material-symbols-outlined text-[20px]">cancel</span>
              </button>
            )}
          </div>
          
          <div className="text-sm font-medium text-slate-500 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100">
            Tổng cộng: <span className="font-bold text-indigo-600 ml-1">{filteredList.length}</span> kết quả
          </div>
        </div>

        {/* Table Area */}
        <div className="p-2 flex-1">
          {loading && pendingList.length === 0 && approvedList.length === 0 ? (
            <div className="animate-pulse space-y-4 p-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                  <div className="w-12 h-12 rounded-2xl bg-slate-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </div>
                  <div className="w-24 h-8 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap rounded-tl-2xl">Bệnh nhân</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Mã PK</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">CCCD</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Dịch vụ</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">SĐT</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Năm sinh</th>
                    <th className="py-4 px-5 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right rounded-tr-2xl">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center w-full min-w-[350px] mx-auto">
                          <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center mb-5 shadow-sm mx-auto">
                            <span className="material-symbols-outlined text-4xl text-slate-300">
                              {activeTab === 'pending' ? 'inbox_customize' : 'history'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-700 mb-2 whitespace-nowrap">
                            {activeTab === 'pending' ? 'Tuyệt vời! Không có kết quả nào chờ duyệt' : 'Chưa có kết quả đã duyệt'}
                          </h3>
                          <p className="text-sm text-slate-500 font-medium text-center whitespace-nowrap">
                            {query ? 'Không tìm thấy kết quả nào khớp với từ khóa tìm kiếm của bạn.' : (
                              activeTab === 'pending' ? 'Tất cả kết quả xét nghiệm và chẩn đoán đã được xử lý.' : 'Những kết quả sau khi duyệt sẽ được lưu trữ và hiển thị tại đây.'
                            )}
                          </p>
                          {query && (
                            <button onClick={() => setQuery('')} className="mt-5 px-6 py-2.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors">
                              Xóa bộ lọc tìm kiếm
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : filteredList.map((item) => {
                    const loai = item.loaiKetQua === 'XN' ? 'XN' : item.loaiKetQua === 'CDHA' ? 'CĐHA' : item.loaiKetQua;
                    const loaiColor = item.loaiKetQua === 'XN' 
                      ? 'text-cyan-700 bg-cyan-50 border-cyan-200' 
                      : 'text-violet-700 bg-violet-50 border-violet-200';
                    const isApproved = activeTab === 'approved';
                    return (
                      <tr key={item.maPhieuKham}
                        onClick={() => handleSelect(item)}
                        className="hover:bg-slate-50/80 cursor-pointer transition-all duration-200 group">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${
                                isApproved ? 'from-emerald-400 to-teal-500' : 'from-indigo-400 to-blue-500'
                              } text-white text-sm font-bold flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                              {initials(item.hoTen)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-sm block mb-0.5 group-hover:text-indigo-600 transition-colors">{item.hoTen}</span>
                              <span className="text-[11px] font-semibold text-slate-400">{formatGender(item.gioiTinh)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <span className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-mono text-xs font-bold border border-slate-200/60">
                            #{item.maPhieuKham}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm font-semibold text-slate-600">{item.cccd || '—'}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${loaiColor}`}>
                            <span className="material-symbols-outlined text-[16px]">{item.loaiKetQua === 'XN' ? 'science' : 'radiology'}</span>
                            {loai}
                          </span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm font-semibold text-slate-600">{item.soDienThoai || '—'}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-sm font-semibold text-slate-600">{formatYear(item.ngaySinh)}</span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                              isApproved 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                              {isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
                            </span>
                            <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-indigo-300 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all shadow-sm">
                              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BangDieuKhienChanDoan;