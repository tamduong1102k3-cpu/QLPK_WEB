import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { claimDoctorClsResultApi, getDoctorClsReviewQueueApi } from '../../../api/phieuChiDinhApi';
import { getAllApi as getAllServicesApi } from '../../../api/dichVuApi';
import { useNotification } from '../../../components/NotificationContext';

import DuyetKetQuaCDHA from './DuyetKetQuaCDHA';
import DuyetKetQuaXetNghiem from './DuyetKetQuaXetNghiem';

const EMPTY_PAGE = { content: [], totalPages: 0, totalElements: 0, number: 0, size: 20 };

const getDetailId = (item) => item.chiTietId ?? item.id;

const getResultType = (item) => {
  if (item.loaiDichVu === 'CLS_XET_NGHIEM' || item.loaiKetQua === 'XN') return 'xet_nghiem';
  if (item.loaiDichVu === 'CLS_CHAN_DOAN_HINH_ANH' || item.loaiKetQua === 'CDHA') return 'cdha';
  return null;
};

const serviceStatusLabel = (status) => {
  if (status === 'CHUA_THUC_HIEN') return 'Chưa thực hiện';
  if (status === 'DA_THUC_HIEN') return 'Đã thực hiện';
  return status || '';
};

const statusLabel = (item) => {
  if (item.trangThaiKq === 'CHO_DUYET') return 'Chờ duyệt';
  if (item.trangThaiKq === 'DA_DUYET') return 'Đã duyệt';
  if (item.trangThaiKq === 'TU_CHOI') return 'Từ chối';
  return serviceStatusLabel(item.trangThaiDv) || 'Chưa có trạng thái';
};

const BangDieuKhienClsBacSi = ({ user }) => {
  const { showError } = useNotification();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [openingDetailId, setOpeningDetailId] = useState(null);
  const [services, setServices] = useState([]);
  const [servicesError, setServicesError] = useState('');
  const [reviewQueue, setReviewQueue] = useState(EMPTY_PAGE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    trangThaiDv: '',
    trangThaiKq: '',
    maDichVu: ''
  });
  const [filterInputs, setFilterInputs] = useState(filters);

  const loadReviewQueue = useCallback(async (pageNumber = page, activeFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const data = await getDoctorClsReviewQueueApi({
        ...activeFilters,
        page: pageNumber,
        size: 20
      });
      if (!data || !Array.isArray(data.content) || !Number.isInteger(data.totalPages)
          || !Number.isInteger(data.number) || !Number.isFinite(data.totalElements)) {
        throw new Error('Dữ liệu hàng đợi không đúng định dạng phân trang.');
      }
      if (data.totalPages > 0 && pageNumber >= data.totalPages) {
        setPage(data.totalPages - 1);
        return;
      }
      if (data.totalPages === 0 && pageNumber > 0) {
        setPage(0);
        return;
      }
      setReviewQueue({
        content: data.content,
        totalPages: data.totalPages,
        totalElements: data.totalElements,
        number: data.number,
        size: data.size
      });
      setPage(data.number);
    } catch (error) {
      setError(error.message || 'Không thể tải danh sách chờ duyệt kết quả.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    loadReviewQueue(page, filters);
    const timer = setInterval(() => loadReviewQueue(page, filters), 30000);
    return () => clearInterval(timer);
  }, [filters, loadReviewQueue, page]);

  useEffect(() => {
    let active = true;
    getAllServicesApi()
      .then(data => {
        if (!active) return;
        const specialty = user?.maChuyenKhoa;
        setServices((Array.isArray(data) ? data : []).filter(service =>
          ['CLS_XET_NGHIEM', 'CLS_CHAN_DOAN_HINH_ANH'].includes(service.loaiDichVu)
          && (specialty == null || Number(service.maChuyenKhoa) === Number(specialty))
        ));
      })
      .catch(error => {
        if (active) setServicesError(error.message || 'Không tải được danh mục dịch vụ CLS.');
      });
    return () => { active = false; };
  }, [user?.maChuyenKhoa]);

  const currentList = reviewQueue.content;
  const visibleList = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return currentList;
    return currentList.filter(item =>
      [
        item.hoTen,
        item.maPhieuKham,
        item.maBenhNhan,
        item.cccd,
        item.soDienThoai,
        item.tenDichVu,
        getDetailId(item)
      ].some(value => String(value ?? '').toLocaleLowerCase().includes(normalizedQuery))
    );
  }, [currentList, query]);

  const openResult = async (item) => {
    const resultType = getResultType(item);
    const detailId = getDetailId(item);
    if (!resultType || item.ketQuaId == null || detailId == null || openingDetailId != null) return;
    setOpeningDetailId(detailId);
    try {
      if (item.trangThaiKq === 'CHO_DUYET') {
        const claimResult = await claimDoctorClsResultApi(detailId);
        if (!claimResult?.claimed) {
          const error = new Error(
            claimResult?.message || 'Không thể tiếp nhận kết quả CLS để xử lý.'
          );
          error.status = 409;
          throw error;
        }
      }
      setSelected({
        patient: {
          maPhieuKham: item.maPhieuKham,
          maBenhNhan: item.maBenhNhan,
          hoTen: item.hoTen,
          gioiTinh: item.gioiTinh,
          ngaySinh: item.ngaySinh,
          soDienThoai: item.soDienThoai,
          cccd: item.cccd,
          loaiDichVu: item.loaiDichVu,
          chiTietId: detailId
        },
        resultType,
        viewOnly: item.trangThaiKq !== 'CHO_DUYET'
      });
    } catch (error) {
      showError(error.message || 'Không thể mở kết quả CLS.');
      if (error.status === 409) await loadReviewQueue(page, filters);
    } finally {
      setOpeningDetailId(null);
    }
  };

  const closeResult = async () => {
    setSelected(null);
    await loadReviewQueue(page, filters);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    const nextFilters = { ...filterInputs };
    setFilters(nextFilters);
    setPage(0);
  };

  const clearFilters = () => {
    const cleared = { fromDate: '', toDate: '', trangThaiDv: '', trangThaiKq: '', maDichVu: '' };
    setFilterInputs(cleared);
    setFilters(cleared);
    setPage(0);
  };

  if (selected) {
    const ResultComponent = selected.resultType === 'xet_nghiem'
      ? DuyetKetQuaXetNghiem : DuyetKetQuaCDHA;
    return (
      <ResultComponent
        patient={selected.patient}
        user={user}
        viewOnly={selected.viewOnly}
        onBack={closeResult}
      />
    );
  }

  const totalCount = reviewQueue.totalElements;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <section className="bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200/60">
            <span className="material-symbols-outlined text-[28px]">medical_information</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cận lâm sàng</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Kết quả CLS theo chuyên môn và phạm vi phân công của bác sĩ</p>
          </div>
        </div>
        <nav className="mt-6 bg-slate-100/60 p-1.5 rounded-2xl border border-slate-200/50">
          <div className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl text-indigo-700 bg-white shadow-sm ring-1 ring-slate-200/50">
            <span className="material-symbols-outlined text-[18px]">pending_actions</span>
            Chờ duyệt kết quả
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {totalCount}
            </span>
          </div>
        </nav>
      </section>

      <section className="bg-white rounded-3xl border border-slate-200/60 shadow-sm p-4 min-h-[480px]">
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 p-3 mb-3 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="text-xs font-bold text-slate-500">
              Từ ngày
              <input type="date" value={filterInputs.fromDate} onChange={e => setFilterInputs({ ...filterInputs, fromDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
            </label>
            <label className="text-xs font-bold text-slate-500">
              Đến ngày
              <input type="date" value={filterInputs.toDate} onChange={e => setFilterInputs({ ...filterInputs, toDate: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700" />
            </label>
            <label className="text-xs font-bold text-slate-500">
              Trạng thái dịch vụ
              <select value={filterInputs.trangThaiDv} onChange={e => setFilterInputs({ ...filterInputs, trangThaiDv: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="">Tất cả</option>
                <option value="CHUA_THUC_HIEN">Chưa thực hiện</option>
                <option value="DA_THUC_HIEN">Đã thực hiện</option>
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500">
              Trạng thái kết quả
              <select value={filterInputs.trangThaiKq} onChange={e => setFilterInputs({ ...filterInputs, trangThaiKq: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="">Tất cả</option>
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="TU_CHOI">Từ chối</option>
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500">
              Dịch vụ CLS
              <select value={filterInputs.maDichVu} onChange={e => setFilterInputs({ ...filterInputs, maDichVu: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                <option value="">Tất cả dịch vụ</option>
                {services.map(service => (
                  <option key={service.maDichVu} value={service.maDichVu}>
                    {service.tenDichVu} (#{service.maDichVu})
                  </option>
                ))}
              </select>
              {servicesError && <span className="mt-1 block text-[10px] font-medium text-rose-600">{servicesError}</span>}
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">Lọc</button>
              <button type="button" onClick={clearFilters} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100">Xóa</button>
            </div>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-700">Chờ duyệt kết quả</h2>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 rounded-full px-2.5 py-1">{totalCount} chi tiết</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Tìm bệnh nhân, mã phiếu, dịch vụ..."
              className="w-64 max-w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <button type="button" onClick={() => loadReviewQueue(page, filters)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Tải lại">
              <span className={`material-symbols-outlined text-[20px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
            </button>
          </div>
        </div>

        {error ? (
          <div role="alert" className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
            {error}
          </div>
        ) : loading && currentList.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-indigo-600 font-semibold">
            <span className="material-symbols-outlined mr-2 animate-spin">sync</span>Đang tải danh sách...
          </div>
        ) : visibleList.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl">inbox</span>
            <p className="mt-2 font-semibold">{query ? 'Không tìm thấy chi tiết phù hợp.' : 'Không có chi tiết dịch vụ trong danh sách này.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Bệnh nhân / Mã PK</th>
                  <th className="px-4 py-3">Chi tiết / Dịch vụ</th>
                  <th className="px-4 py-3">Nguồn / Bác sĩ phụ trách</th>
                  <th className="px-4 py-3">Ngày chỉ định</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleList.map(item => {
                  const chiTietId = getDetailId(item);
                  const resultType = getResultType(item);
                  const canOpenResult = item.ketQuaId != null
                    && resultType != null
                    && ['CHO_DUYET', 'DA_DUYET', 'TU_CHOI'].includes(item.trangThaiKq);
                  return (
                    <React.Fragment key={chiTietId}>
                      <tr className="hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-800">{item.hoTen || '—'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-700">{item.tenDichVu || 'Dịch vụ CLS'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-xs text-slate-600">
                            {item.nguonTao === 'DANG_KY_TRUC_TIEP' ? 'Đăng ký trực tiếp' : item.nguonTao === 'BAC_SI_CHI_DINH' ? 'Bác sĩ chỉ định' : (item.nguonTao || '—')}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-indigo-700">
                            {item.nguonTao === 'BAC_SI_CHI_DINH' && item.maBacSi == null
                              ? 'Bác sĩ CLS theo chuyên môn'
                              : item.maBacSi == null ? 'Chưa có bác sĩ phụ trách' : `Bác sĩ phụ trách #${item.maBacSi}`}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {item.ngayChiDinh ? new Date(item.ngayChiDinh).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                            item.trangThaiKq === 'DA_DUYET'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.trangThaiKq === 'CHO_DUYET'
                                ? 'bg-amber-50 text-amber-700'
                                : item.trangThaiKq === 'TU_CHOI'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-600'
                          }`}>{statusLabel(item)}</span>
                          <div className="mt-1 text-xs text-slate-400">{serviceStatusLabel(item.trangThaiDv)}</div>
                        </td>
                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          {canOpenResult && (
                            <button type="button" disabled={openingDetailId != null} onClick={() => openResult(item)} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                              {openingDetailId === chiTietId ? 'Đang mở...' : item.trangThaiKq === 'CHO_DUYET' ? 'Xem / duyệt' : 'Xem kết quả'}
                            </button>
                          )}
                          {!canOpenResult && (
                            <span className="text-xs text-slate-400">
                              {item.trangThaiKq === 'TU_CHOI' ? 'Chờ KTV thực hiện lại' : 'Chưa có kết quả'}
                            </span>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!error && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-4">
            <span className="text-xs font-semibold text-slate-500">
              Trang {reviewQueue.totalPages ? page + 1 : 0} / {reviewQueue.totalPages} · {reviewQueue.totalElements} chi tiết
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 0 || loading} onClick={() => setPage(current => current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-40">Trước</button>
              <button type="button" disabled={page + 1 >= reviewQueue.totalPages || loading} onClick={() => setPage(current => current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 disabled:opacity-40">Sau</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default BangDieuKhienClsBacSi;
