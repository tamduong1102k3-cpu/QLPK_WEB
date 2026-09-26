import React, { useState } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { deleteThuocApi as _deleteThuocApi } from '../../../api/khoThuocApi';
import { apiClient } from "../../../api/apiClient";
import { useNotification } from '../../../components/NotificationContext';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { card, th, td, formatCurrency } from './styles';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const API = `${API_BASE_URL}/kho-thuoc`;

const ThuocTab = ({ items, onRefresh, readOnly, isPharmacist }) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const {
    paginatedData: pagedItems,
    totalItems,
    totalPages,
    currentPage,
    setCurrentPage,
    visiblePages,
    jumpPage,
    handleJumpPage,
    handleJumpPageBlur,
  } = usePagination({
    data: items,
    pageSize: 10,
    searchKeys: ['tenThuoc', 'hoatChat'],
    searchTerm: search,
  });

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await _deleteThuocApi(confirmDelete.maThuoc);
      showSuccess('Đã xóa thuốc thành công!');
      onRefresh();
    } catch (e) {
      showError('Lỗi khi xóa thuốc: ' + (e.message || 'Vui lòng thử lại.'));
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    if (readOnly) {
      showWarning('Bạn không có quyền chỉnh sửa giá thuốc!');
      return;
    }
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.donGiaNhap = parseFloat(data.donGiaNhap) || 0;
    data.donGiaBan = parseFloat(data.donGiaBan) || 0;
    // Gửi version hiện tại của client khi UPDATE (Optimistic Lock) — không tự tăng version
    if (editing?.maThuoc && editing.version != null) {
      data.version = editing.version;
    }
    setLoading(true);
    try {
      const url = editing?.maThuoc ? `${API}/thuoc/${editing.maThuoc}` : `${API}/thuoc`;
      const method = editing?.maThuoc ? 'PUT' : 'POST';
      const res = await apiClient(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      // Xử lý 409 CONFLICT do Optimistic Lock (apiClient trả Response ok=false, status=409 thay vì throw)
      const conflictStatus = res.status === 409 || res.status?.toString?.() === '409';
      if (res.ok) {
        setEditing(null);
        showSuccess(editing?.maThuoc ? 'Đã cập nhật thuốc thành công!' : 'Đã thêm thuốc mới thành công!');
        onRefresh();
      }
      else if (conflictStatus) {
        showWarning('⚠️ Dữ liệu đã được cập nhật bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất!');
        setEditing(null);
        onRefresh();
      }
      else showError('Lỗi khi lưu thuốc');
    } catch (e) {
      // Fallback: nếu apiClient throw trực tiếp lỗi 409
      const status = e.status || e.response?.status || (e.message && e.message.includes('409') ? 409 : null);
      if (status === 409) {
        showWarning('⚠️ Dữ liệu đã được cập nhật bởi người dùng khác. Vui lòng tải lại dữ liệu mới nhất!');
        setEditing(null);
        onRefresh();
      } else {
        showError(e.message || 'Lỗi khi lưu thuốc');
      }
    }
    finally { setLoading(false); }
  };

  return <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ ...card, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '380px' }}>
        <span className="material-symbols-outlined" style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          color: '#9ca3af', fontSize: '20px'
        }}>search</span>
        <input type="text" placeholder="Tìm theo tên thuốc, hoạt chất..." value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', paddingLeft: '38px', paddingRight: '12px', height: '40px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
      </div>
      {(!readOnly || isPharmacist) && (
        <button onClick={() => setEditing({})}
          style={{ background: '#005bc0', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <span className="material-symbols-outlined">add</span> Thêm Thuốc Mới
        </button>
      )}
    </div>

    <div style={{ ...card, overflowX: 'auto' }}>
      <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f9fafb' }}>
          <tr>
            <th style={th}>Tên Thuốc / Hoạt Chất</th>
            <th style={th}>Loại / Dạng</th>
            <th style={th}>Đơn Vị</th>
            <th style={th}>Giá Nhập / Bán</th>
            <th style={th}>Hạn SD</th>
            <th style={th}>Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {pagedItems.map(i => <tr key={i.maThuoc}>
            <td style={td}>
              <div style={{ fontWeight: 600 }}>{i.tenThuoc}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{i.hoatChat} - {i.hamLuong}</div>
            </td>
            <td style={td}>{i.loaiThuoc} / {i.dangThuoc}</td>
            <td style={td}>{i.donViTinh}</td>
            <td style={td}>
              <div style={{ color: '#059669', fontSize: '13px' }}>N: {formatCurrency(i.donGiaNhap)}</div>
              <div style={{ color: '#005bc0', fontSize: '13px' }}>B: {formatCurrency(i.donGiaBan)}</div>
            </td>
            <td style={td}>{i.hanSuDung ? new Date(i.hanSuDung).toLocaleDateString('vi-VN') : '—'}</td>
            <td style={td}>
              {readOnly && !isPharmacist
                ? <span style={{ fontSize: '12px', color: '#9ca3af' }}>—</span>
                : <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setEditing(i)}
                      style={{ background: 'none', border: 'none', color: '#005bc0', cursor: 'pointer' }} title="Sửa">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    {!isPharmacist && (
                      <button onClick={() => setConfirmDelete({ maThuoc: i.maThuoc, tenThuoc: i.tenThuoc })}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }} title="Xóa">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    )}
                  </div>}
            </td>
          </tr>)}
          {pagedItems.length === 0 && (
            <tr><td colSpan="6" style={{ ...td, textAlign: 'center', padding: '48px', color: '#9ca3af' }}>Không có dữ liệu.</td></tr>
          )}
        </tbody>
      </table>

      {totalItems > 0 && (
        <Pagination
          mode="inline"
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          label="thuốc"
          visiblePages={visiblePages}
          onPageChange={setCurrentPage}
          jumpPage={jumpPage}
          onJumpPage={handleJumpPage}
          onJumpBlur={handleJumpPageBlur}
        />
      )}
    </div>

    {editing && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ ...card, width: '600px', padding: '24px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{editing.maThuoc ? 'Sửa Thuốc' : 'Thêm Thuốc Mới'}</h3>
        <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Tên thuốc *</label>
            <input name="tenThuoc" defaultValue={editing.tenThuoc} required
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Hoạt chất</label>
            <input name="hoatChat" defaultValue={editing.hoatChat}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Hàm lượng</label>
            <input name="hamLuong" defaultValue={editing.hamLuong}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Dạng thuốc</label>
            <input name="dangThuoc" defaultValue={editing.dangThuoc}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Loại thuốc</label>
            <input name="loaiThuoc" defaultValue={editing.loaiThuoc}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Đơn vị tính</label>
            <input name="donViTinh" defaultValue={editing.donViTinh}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Hạn sử dụng</label>
            <input type="date" name="hanSuDung" defaultValue={editing.hanSuDung}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Giá nhập</label>
            <input type="number" name="donGiaNhap" defaultValue={editing.donGiaNhap} readOnly={readOnly || isPharmacist}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', background: (readOnly || isPharmacist) ? '#f3f4f6' : '#fff', cursor: (readOnly || isPharmacist) ? 'not-allowed' : 'text', color: (readOnly || isPharmacist) ? '#6b7280' : '#374151' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Giá bán</label>
            <input type="number" name="donGiaBan" defaultValue={editing.donGiaBan} readOnly={readOnly || isPharmacist}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', background: (readOnly || isPharmacist) ? '#f3f4f6' : '#fff', cursor: (readOnly || isPharmacist) ? 'not-allowed' : 'text', color: (readOnly || isPharmacist) ? '#6b7280' : '#374151' }} />
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" onClick={() => setEditing(null)}
              style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'none' }}>Hủy</button>
            <button type="submit" disabled={loading}
              style={{ padding: '8px 24px', borderRadius: '6px', background: '#005bc0', color: '#fff', border: 'none', fontWeight: 600 }}>
              {loading ? 'Đang lưu...' : 'Lưu Lại'}
            </button>
          </div>
        </form>
      </div>
    </div>}

    <ConfirmDialog
      isOpen={!!confirmDelete}
      title="Xác nhận xóa thuốc"
      message={confirmDelete ? `Bạn có chắc chắn muốn xóa thuốc "${confirmDelete.tenThuoc}"?` : ''}
      type="danger"
      icon="delete"
      onConfirm={handleDelete}
      onCancel={() => setConfirmDelete(null)}
    />
  </div>;
};

export default ThuocTab;