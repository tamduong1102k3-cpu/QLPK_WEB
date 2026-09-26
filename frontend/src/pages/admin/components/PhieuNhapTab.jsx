import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { apiClient } from '../../../api/apiClient';
import { card, th, td, formatCurrency, formatDate } from './styles';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const API = `${API_BASE_URL}/kho-thuoc`;

export const suppliers = [
  { id: 1, name: 'Công ty Cổ phần Dược Hậu Giang (DHG)' },
  { id: 2, name: 'Công ty Cổ phần Dược phẩm Traphaco' },
  { id: 3, name: 'Công ty Cổ phần Dược phẩm OPC' },
  { id: 4, name: 'Công ty Cổ phần Dược phẩm Imexpharm' },
];

const statusStyle = s => {
  const map = {
    'hoan thanh': { bg: '#dcfce7', color: '#166534' },
    'cho xu ly': { bg: '#fef9c3', color: '#a16207' },
    'da huy': { bg: '#fee2e2', color: '#991b1b' }
  };
  return map[(s || '').toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280' };
};

const PhieuNhapTab = ({ nvMap, thuocMap, thuocList, onRefresh, readOnly, currentUser }) => {
  const [phieuList, setPhieuList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [newSlip, setNewSlip] = useState({
    maNhanVienNhap: 1,
    maNhaCungCap: 1,
    ghiChu: '',
    chiTiet: []
  });

  useEffect(() => {
    if (currentUser?.maNhanVien) {
      setNewSlip(prev => ({ ...prev, maNhanVienNhap: Number(currentUser.maNhanVien) }));
    }
  }, [currentUser]);

  const loadPhieu = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`${API}/phieu-nhap`);
      if (!res.ok) throw new Error('Lỗi tải phiếu nhập');
      setPhieuList(await res.json());
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPhieu();
  }, []);

  const openDetail = async phieu => {
    setSelected(phieu);
    setDetails([]);
    setLoadingDetail(true);
    try {
      const res = await apiClient(`${API}/phieu-nhap/${phieu.maPhieuNhapThuoc}/chi-tiet`);
      if (!res.ok) throw new Error('Lỗi tải chi tiết');
      setDetails(await res.json());
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddRow = () => {
    setNewSlip(prev => ({
      ...prev,
      chiTiet: [...prev.chiTiet, { maThuoc: thuocList[0]?.maThuoc, soLuongNhap: 1, donGiaNhap: 0, maNcc: 1 }]
    }));
  };

  const handleRemoveRow = idx => {
    setNewSlip(prev => ({ ...prev, chiTiet: prev.chiTiet.filter((_, i) => i !== idx) }));
  };

  const handleUpdateRow = (idx, field, value) => {
    const list = [...newSlip.chiTiet];
    list[idx][field] = field === 'maThuoc' || field === 'soLuongNhap' || field === 'maNcc' ? parseInt(value) : parseFloat(value);
    setNewSlip({ ...newSlip, chiTiet: list });
  };

  const handleSubmitImport = async () => {
    if (newSlip.chiTiet.length === 0) {
      alert('Vui lòng thêm ít nhất một loại thuốc');
      return;
    }
    const tongTien = newSlip.chiTiet.reduce((sum, item) => sum + item.soLuongNhap * item.donGiaNhap, 0);
    const body = { ...newSlip, tongTienNhap: tongTien };
    try {
      const res = await apiClient(`${API}/phieu-nhap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsCreating(false);
        setNewSlip({ maNhanVienNhap: currentUser?.maNhanVien ? Number(currentUser.maNhanVien) : 1, maNhaCungCap: 1, ghiChu: '', chiTiet: [] });
        loadPhieu();
        onRefresh();
      } else {
        const err = await res.text();
        alert('Lỗi: ' + err);
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const filtered = phieuList.filter(p => {
    if (!search) return true;
    const t = search.toLowerCase();
    const tenNV = (nvMap[p.maNhanVienNhap] || '').toLowerCase();
    return String(p.maPhieuNhapThuoc).includes(t) || (p.trangThai || '').toLowerCase().includes(t) || tenNV.includes(t);
  });

  const {
    paginatedData: pagedPhieu,
    totalItems: pagedTotalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
  } = usePagination({
    data: filtered,
    pageSize: 8,
  });

  return <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
    {/* LIST */}
    <div style={{ flex: selected ? '0 0 55%' : '1', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...card, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#1f2937' }}>Phiếu Nhập Thuốc</h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>
            Tổng: <strong style={{ color: '#005bc0' }}>{phieuList.length}</strong> phiếu
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <span className="material-symbols-outlined" style={{
              position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
              color: '#9ca3af', fontSize: '20px'
            }}>search</span>
            <input type="text" placeholder="Tìm kiếm phiếu..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px',
                border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none'
              }} />
          </div>
          {!readOnly && (
            <button onClick={() => setIsCreating(true)}
              style={{
                background: '#059669', color: '#fff', border: 'none', padding: '0 20px',
                borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
              }}>
              <span className="material-symbols-outlined">add_box</span> Nhập Thuốc
            </button>
          )}
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={th}>Mã Phiếu</th>
                <th style={th}>Ngày Nhập</th>
                <th style={th}>Họ Tên NV</th>
                <th style={th}>Tổng Tiền</th>
                <th style={th}>Trạng Thái</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan="6" style={{ ...td, textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Đang tải...</td></tr>
                : pagedPhieu.length === 0
                  ? <tr><td colSpan="6" style={{ ...td, textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Không có dữ liệu.</td></tr>
                  : pagedPhieu.map(p => {
                      const st = statusStyle(p.trangThai);
                      const isActive = selected?.maPhieuNhapThuoc === p.maPhieuNhapThuoc;
                      return <tr key={p.maPhieuNhapThuoc} onClick={() => openDetail(p)}
                        style={{ background: isActive ? '#eff6ff' : 'transparent', cursor: 'pointer' }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb'; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = isActive ? '#eff6ff' : 'transparent'; }}>
                        <td style={td}><strong>#PN{p.maPhieuNhapThuoc?.toString().padStart(3, '0')}</strong></td>
                        <td style={td}>{formatDate(p.ngayNhap)}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{nvMap[p.maNhanVienNhap] || '—'}</td>
                        <td style={{ ...td, fontWeight: 600, color: '#059669' }}>{formatCurrency(p.tongTienNhap)}</td>
                        <td style={td}>
                          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: st.bg, color: st.color }}>
                            {p.trangThai || '—'}
                          </span>
                        </td>
                        <td style={td}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: isActive ? '#2563eb' : '#9ca3af' }}>
                            {isActive ? 'chevron_right' : 'open_in_new'}
                          </span>
                        </td>
                      </tr>;
                    })}
            </tbody>
          </table>
        </div>

        {!loading && pagedTotalItems > 0 && (
          <Pagination
            mode="inline"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagedTotalItems}
            label="phiếu"
            visiblePages={visiblePages}
            onPageChange={setCurrentPage}
            jumpPage={jumpPage}
            onJumpPage={handleJumpPage}
            onJumpBlur={handleJumpPageBlur}
          />
        )}
      </div>
    </div>

    {/* DETAIL PANEL */}
    {selected && <div style={{
      flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'sticky', top: 0
    }}>
      <div style={{ ...card, padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1f2937' }}>
              Phiếu #PN{selected.maPhieuNhapThuoc?.toString().padStart(3, '0')}
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#6b7280' }}>{formatDate(selected.ngayNhap)}</p>
          </div>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[{
            label: 'Tổng Tiền Nhập', value: formatCurrency(selected.tongTienNhap), highlight: true
          }, {
            label: 'Nhà Cung Cấp', value: suppliers.find(s => s.id === selected.maNhaCungCap)?.name || '—'
          }, {
            label: 'Trạng Thái', value: selected.trangThai || '—'
          }, {
            label: 'NV Nhập (Mã)', value: `NV${selected.maNhanVienNhap?.toString().padStart(3, '0')}`
          }, {
            label: 'NV Nhập (Tên)', value: nvMap[selected.maNhanVienNhap] || '—'
          }].map(item => <div key={item.label}
            style={{ background: '#f9fafb', borderRadius: '8px', padding: '10px 12px' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: item.highlight ? '#059669' : '#1f2937' }}>{item.value}</p>
          </div>)}
        </div>
      </div>

      <div style={{ ...card, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>Chi Tiết Thuốc Nhập</h4>
        </div>
        {loadingDetail
          ? <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Đang tải...</div>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th style={{ ...th, fontSize: '11px' }}>Tên Thuốc</th>
                    <th style={{ ...th, fontSize: '11px', textAlign: 'right' }}>SL</th>
                    <th style={{ ...th, fontSize: '11px', textAlign: 'right' }}>Đơn Giá</th>
                    <th style={{ ...th, fontSize: '11px', textAlign: 'right' }}>Thành Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map(d => <tr key={d.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ ...td, padding: '10px 16px', fontWeight: 500 }}>{thuocMap[d.maThuoc]?.tenThuoc || '—'}</td>
                    <td style={{ ...td, padding: '10px 16px', textAlign: 'right' }}>{d.soLuongNhap}</td>
                    <td style={{ ...td, padding: '10px 16px', textAlign: 'right' }}>{formatCurrency(d.donGiaNhap)}</td>
                    <td style={{ ...td, padding: '10px 16px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{formatCurrency(d.thanhTien)}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>}
      </div>
    </div>}

    {/* CREATE MODAL */}
    {isCreating && <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{ ...card, width: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Tạo Phiếu Nhập Thuốc</h3>
          <button onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Nhân viên thực hiện</label>
              <select value={newSlip.maNhanVienNhap}
                onChange={e => setNewSlip({ ...newSlip, maNhanVienNhap: parseInt(e.target.value) })}
                disabled={!!currentUser?.maNhanVien}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', background: currentUser?.maNhanVien ? '#f3f4f6' : '#fff', cursor: currentUser?.maNhanVien ? 'not-allowed' : 'default' }}>
                {Object.entries(nvMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Nhà cung cấp</label>
              <select value={newSlip.maNhaCungCap}
                onChange={e => setNewSlip({ ...newSlip, maNhaCungCap: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Ghi chú</label>
              <input placeholder="Lý do nhập, thông tin NCC..." value={newSlip.ghiChu}
                onChange={e => setNewSlip({ ...newSlip, ghiChu: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db' }} />
            </div>
          </div>

          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0 }}>Danh sách thuốc nhập</h4>
            <button onClick={handleAddRow}
              style={{ background: '#eff6ff', color: '#005bc0', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              + Thêm dòng
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ ...th, padding: '8px' }}>Tên Thuốc</th>
                <th style={{ ...th, padding: '8px', width: '100px' }}>Số lượng</th>
                <th style={{ ...th, padding: '8px', width: '150px' }}>Giá nhập</th>
                <th style={{ ...th, padding: '8px', width: '150px' }}>Thành tiền</th>
                <th style={{ ...th, padding: '8px', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {newSlip.chiTiet.map((row, idx) => <tr key={idx}>
                <td style={{ ...td, padding: '8px' }}>
                  <select value={row.maThuoc} onChange={e => handleUpdateRow(idx, 'maThuoc', e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                    {thuocList.map(t => <option key={t.maThuoc} value={t.maThuoc}>{t.tenThuoc}</option>)}
                  </select>
                </td>
                <td style={{ ...td, padding: '8px' }}>
                  <input type="number" min="1" value={row.soLuongNhap}
                    onChange={e => handleUpdateRow(idx, 'soLuongNhap', e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                </td>
                <td style={{ ...td, padding: '8px' }}>
                  <input type="number" value={row.donGiaNhap}
                    onChange={e => handleUpdateRow(idx, 'donGiaNhap', e.target.value)}
                    style={{ width: '100%', padding: '6px', border: '1px solid #e5e7eb', borderRadius: '4px' }} />
                </td>
                <td style={{ ...td, padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                  {formatCurrency(row.soLuongNhap * row.donGiaNhap)}
                </td>
                <td style={{ ...td, padding: '8px' }}>
                  <button onClick={() => handleRemoveRow(idx)}
                    style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </td>
              </tr>)}
            </tbody>
          </table>
          {newSlip.chiTiet.length === 0 &&
            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>Chưa có thuốc nào được chọn</div>}
        </div>
        <div style={{
          padding: '20px 24px', background: '#f9fafb', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ fontSize: '18px' }}>
            Tổng cộng: <strong style={{ color: '#059669' }}>
              {formatCurrency(newSlip.chiTiet.reduce((sum, item) => sum + item.soLuongNhap * item.donGiaNhap, 0))}
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setIsCreating(false)}
              style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff' }}>Hủy</button>
            <button onClick={handleSubmitImport}
              style={{ padding: '10px 32px', borderRadius: '8px', background: '#059669', color: '#fff', border: 'none', fontWeight: 700 }}>
              Xác Nhận Nhập
            </button>
          </div>
        </div>
      </div>
    </div>}
  </div>;
};

export default PhieuNhapTab;