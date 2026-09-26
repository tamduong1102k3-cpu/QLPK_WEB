import React, { useState, useMemo } from 'react';
import { sqlLikeMatch } from '../../../utils/searchUtils';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const DanhSachBenhNhanDuocSi = ({ patients, onSelectPatient, formatCurrency, formatDateTime }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('cho_cap');
  const [dateFilter, setDateFilter] = useState('today'); // 'today' | 'all'

  // Tách bệnh nhân theo trạng thái toa thuốc và bộ lọc ngày
  const { choCapList, daCapList, todayPatients } = useMemo(() => {
    const list = patients || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = (p) => {
      if (!p.ngayThanhToan) return false;
      return new Date(p.ngayThanhToan) >= today;
    };

    const choCap = list.filter(p => p.tinhTrangCapThuoc === 'CHO_CAP' && (dateFilter === 'all' || isToday(p)));
    const daCap = list.filter(p => {
      if (p.tinhTrangCapThuoc === 'CHO_CAP') return false;
      if (dateFilter === 'all') return true;
      return isToday(p);
    });
    return {
      choCapList: choCap,
      daCapList: daCap,
      todayPatients: list.filter(isToday),
    };
  }, [patients, dateFilter]);

  const activeList = activeTab === 'cho_cap' ? choCapList : daCapList;

  const {
    paginatedData: pagedPatients,
    totalItems: pagedTotalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
  } = usePagination({
    data: activeList,
    pageSize: 8,
    searchKeys: ['hoTen', 'soDienThoai', 'maBenhNhan', 'maHoaDon'],
    searchTerm,
  });

  const tabs = [
    { id: 'cho_cap', label: 'Chờ cấp thuốc', icon: 'pending_actions', count: choCapList.length },
    { id: 'da_cap', label: 'Đã cấp thuốc', icon: 'checklist', count: daCapList.length },
  ];

  const renderTinhTrang = (patient) => {
    if (patient.tinhTrangCapThuoc === 'CHO_CAP') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-200">
          <span className="material-symbols-outlined text-[14px]">pending</span>
          Chờ cấp
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
        <span className="material-symbols-outlined text-[14px]">check_circle</span>
        Đã cấp
      </span>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600">pending_actions</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Chờ cấp</p>
              <p className="text-xl font-bold text-amber-600">{choCapList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-600">checklist</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Đã cấp</p>
              <p className="text-xl font-bold text-emerald-600">{daCapList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-purple-600">today</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Hôm nay</p>
              <p className="text-xl font-bold text-gray-800">{todayPatients.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar + Date Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm bệnh nhân theo tên, số điện thoại, mã BN hoặc mã hóa đơn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-shrink-0">
            <button
              onClick={() => setDateFilter('today')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === 'today'
                  ? 'bg-white text-purple-600 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">today</span>
              Hôm nay
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateFilter === 'all'
                  ? 'bg-white text-purple-600 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              Tất cả ngày
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-5 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab.id
                  ? 'text-amber-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              {tab.label}
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeTab === tab.id
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {tab.count}
              </span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {pagedPatients.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-gray-300 text-3xl">patient_list</span>
            </div>
            <p className="text-gray-400 text-sm font-medium">
              {searchTerm
                ? 'Không tìm thấy bệnh nhân phù hợp'
                : activeTab === 'cho_cap'
                  ? dateFilter === 'today'
                    ? 'Không có bệnh nhân chờ cấp thuốc hôm nay'
                    : 'Không có bệnh nhân chờ cấp thuốc'
                  : dateFilter === 'today'
                    ? 'Chưa có bệnh nhân nào đã cấp thuốc hôm nay'
                    : 'Chưa có bệnh nhân nào đã cấp thuốc'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Mã BN</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Tên bệnh nhân</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Số điện thoại</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Hóa đơn</th>
                  <th className="text-center px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Trạng thái</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Tổng tiền</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Ngày thanh toán</th>
                  <th className="text-center px-5 py-3 text-[11px] font-bold uppercase text-gray-500 tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pagedPatients.map((patient) => (
                  <tr
                    key={`${patient.maHoaDon}-${patient.maBenhNhan}`}
                    className="hover:bg-amber-50/40 transition-colors group"
                  >
                    <td className="px-5 py-4 text-sm font-bold text-gray-700">
                      #{patient.maBenhNhan}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                          {patient.hoTen?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{patient.hoTen}</p>
                          <p className="text-[11px] text-gray-400">Mã PK: #{patient.maPhieuKham}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 font-medium">
                      {patient.soDienThoai || <span className="text-gray-300 italic">N/A</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-bold text-gray-700">#{patient.maHoaDon}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {renderTinhTrang(patient)}
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-gray-800 text-right">
                      {formatCurrency(patient.tongTien)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {formatDateTime(patient.ngayThanhToan)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => onSelectPatient(patient)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 ${
                          activeTab === 'cho_cap'
                            ? 'bg-amber-500 hover:bg-amber-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">medication</span>
                        {activeTab === 'cho_cap' ? 'Cấp thuốc' : 'Xem lại'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagedTotalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagedTotalItems}
            label="bệnh nhân"
            visiblePages={visiblePages}
            onPageChange={setCurrentPage}
            jumpPage={jumpPage}
            onJumpPage={handleJumpPage}
            onJumpBlur={handleJumpPageBlur}
            activeClass="bg-amber-600 text-white shadow-md shadow-amber-100"
            hoverClass="hover:bg-amber-50 hover:text-amber-600"
            ringClass="focus:ring-2 focus:ring-amber-200"
          />
        )}
      </div>
    </div>
  );
};

export default DanhSachBenhNhanDuocSi;