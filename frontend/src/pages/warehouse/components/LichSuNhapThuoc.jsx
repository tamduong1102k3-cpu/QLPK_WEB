import React, { useState } from 'react';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const LichSuNhapThuoc = ({ phieuNhapList, handleViewDetail, getTenThuoc, formatCurrency, formatDateTime }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    paginatedData: pagedPhieu,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
  } = usePagination({
    data: phieuNhapList,
    pageSize: 8,
    searchKeys: ['maPhieuNhapThuoc', 'trangThai'],
    searchTerm,
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-600">history</span>
          Lịch sử nhập thuốc
        </h3>

        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm mã phiếu, trạng thái..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none w-56 transition-all placeholder:font-normal placeholder:text-gray-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500">Mã PN</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500">Ngày nhập</th>
              <th className="text-right px-4 py-3 text-[11px] font-bold uppercase text-gray-500">Tổng tiền</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase text-gray-500">Trạng thái</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold uppercase text-gray-500">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pagedPhieu.map(phieu => (
              <tr key={phieu.maPhieuNhapThuoc} className="hover:bg-cyan-50/30 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-cyan-600">#{phieu.maPhieuNhapThuoc}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(phieu.ngayNhap)}</td>
                <td className="px-4 py-3 text-sm font-bold text-right text-gray-700">{formatCurrency(phieu.tongTienNhap)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${phieu.trangThai === 'Hoan thanh' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-50 text-gray-600'}`}>
                    {phieu.trangThai}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleViewDetail(phieu)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-cyan-600 hover:text-white text-slate-600 rounded-lg text-xs font-bold transition-all">
                    <span className="material-symbols-outlined text-[14px]">visibility</span>Xem
                  </button>
                </td>
              </tr>
            ))}
            {pagedPhieu.length === 0 && (
              <tr>
                <td colSpan="5" className="py-10 text-center text-gray-400 text-sm">Chưa có phiếu nhập</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          label="phiếu"
          visiblePages={visiblePages}
          onPageChange={setCurrentPage}
          jumpPage={jumpPage}
          onJumpPage={handleJumpPage}
          onJumpBlur={handleJumpPageBlur}
          activeClass="bg-cyan-600 text-white shadow-md shadow-cyan-100"
          hoverClass="hover:bg-cyan-50 hover:text-cyan-600"
          ringClass="focus:ring-2 focus:ring-cyan-200"
        />
      )}
    </div>
  );
};

export default LichSuNhapThuoc;