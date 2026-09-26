import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../api/config';
import { createPortal } from 'react-dom';
import { apiClient } from '../../../api/apiClient';
import { useNotification } from '../../../components/NotificationContext';

const API = `${API_BASE_URL}/chuyen-khoa`;

const QuanLyChuyenKhoa = () => {
  const [chuyenKhoas, setChuyenKhoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    tenChuyenKhoa: '',
    moTa: '',
    soLuongToiDa: 0
  });
  const { showSuccess, showError } = useNotification();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient(API);
      if (res.ok) {
        const data = await res.json();
        setChuyenKhoas(data ?? []);
      } else {
        setError('Không thể tải danh sách chuyên khoa. Vui lòng thử lại.');
        setChuyenKhoas([]);
      }
    } catch (err) {
      console.error('Error fetching chuyen khoa:', err);
      setError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
      setChuyenKhoas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditing(null);
    setFormData({ tenChuyenKhoa: '', moTa: '', soLuongToiDa: 0 });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditing(item);
    setFormData({
      tenChuyenKhoa: item.tenChuyenKhoa || '',
      moTa: item.moTa || '',
      soLuongToiDa: item.soLuongToiDa ?? 0
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ tenChuyenKhoa: '', moTa: '', soLuongToiDa: 0 });
  };

  const handleSave = async () => {
    try {
      const url = editing
        ? `${API}/${editing.maChuyenKhoa}`
        : API;
      const method = editing ? 'PUT' : 'POST';

      const res = await apiClient(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        handleCloseModal();
        fetchData();
        showSuccess(editing ? 'Cập nhật chuyên khoa thành công!' : 'Thêm chuyên khoa thành công!');
      } else {
        showError('Lỗi khi lưu chuyên khoa. Vui lòng thử lại.');
      }
    } catch (err) {
      console.error('Error saving chuyen khoa:', err);
      showError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chuyên khoa "${item.tenChuyenKhoa}"?`)) return;
    try {
      const res = await apiClient(`${API}/${item.maChuyenKhoa}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
        showSuccess('Xóa chuyên khoa thành công!');
      } else {
        showError('Không thể xóa chuyên khoa này.');
      }
    } catch (err) {
      console.error('Error deleting chuyen khoa:', err);
      showError('Lỗi kết nối máy chủ. Vui lòng thử lại.');
    }
  };

  // Lọc dữ liệu theo từ khóa tìm kiếm
  const filteredChuyenKhoas = chuyenKhoas.filter(item => {
    const t = searchTerm.toLowerCase().trim();
    if (!t) return true;
    return (item.tenChuyenKhoa || '').toLowerCase().includes(t) || (item.moTa || '').toLowerCase().includes(t);
  });

  const modalContent = showModal ? createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999999 }}>
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw]" style={{ animation: 'scaleUp 0.2s ease-out' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-base font-bold text-gray-800">{editing ? 'Sửa Chuyên Khoa' : 'Thêm Chuyên Khoa'}</h3>
          <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '22px', color: '#9ca3af', padding: '4px 8px', borderRadius: '8px' }}
            onMouseEnter={e => { e.target.style.backgroundColor = '#f3f4f6'; e.target.style.color = '#4b5563'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = '#9ca3af'; }}
          >×</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Chuyên Khoa</label>
            <input type="text" value={formData.tenChuyenKhoa} onChange={e => setFormData({ ...formData, tenChuyenKhoa: e.target.value })}
              style={{ width: '100%', minWidth: 0, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#005bbf'; e.target.style.boxShadow = '0 0 0 2px rgba(0,91,191,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              placeholder="Nhập tên chuyên khoa" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô Tả</label>
            <textarea value={formData.moTa} onChange={e => setFormData({ ...formData, moTa: e.target.value })}
              style={{ width: '100%', minWidth: 0, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', height: '80px', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#005bbf'; e.target.style.boxShadow = '0 0 0 2px rgba(0,91,191,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              placeholder="Nhập mô tả" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số Lượng Tối Đa</label>
            <input type="number" min="0" value={formData.soLuongToiDa} onChange={e => setFormData({ ...formData, soLuongToiDa: parseInt(e.target.value) || 0 })}
              style={{ width: '100%', minWidth: 0, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.target.style.borderColor = '#005bbf'; e.target.style.boxShadow = '0 0 0 2px rgba(0,91,191,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
              placeholder="0" />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button onClick={handleCloseModal}
            style={{ flex: 1, padding: '10px 16px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: 'white', color: '#4b5563', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.target.style.backgroundColor = '#f9fafb'; }}
            onMouseLeave={e => { e.target.style.backgroundColor = 'white'; }}>Hủy</button>
          <button onClick={handleSave}
            style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', backgroundColor: '#005bbf', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            onMouseEnter={e => { e.target.style.opacity = '0.9'; }}
            onMouseLeave={e => { e.target.style.opacity = '1'; }}>{editing ? 'Cập nhật' : 'Thêm mới'}</button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-blue-600">local_hospital</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">Quản Lý Chuyên Khoa</h2>
            <p className="text-sm text-gray-500 mt-1">Danh sách các chuyên khoa trong hệ thống phòng khám</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex-1 w-full sm:w-auto sm:max-w-xl">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: '10px', color: '#9ca3af', fontSize: '20px', pointerEvents: 'none', zIndex: 1 }}>search</span>
              <input 
                type="text" 
                placeholder="Tìm kiếm chuyên khoa..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                style={{
                  width: '100%',
                  minWidth: '280px',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={e => { e.target.style.borderColor = '#005bbf'; e.target.style.boxShadow = '0 0 0 2px rgba(0,91,191,0.15)'; }}
                onBlur={e => { e.target.style.borderColor = '#d1d5db'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
          <button onClick={handleOpenAdd} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity shrink-0 whitespace-nowrap">
            <span className="material-symbols-outlined text-lg">add</span>Thêm Chuyên Khoa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Header dữ liệu: hiển thị tổng số / kết quả tìm kiếm */}
        {!loading && !error && (
          <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-700">Danh Sách Chuyên Khoa</h3>
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                {filteredChuyenKhoas.length}
              </span>
            </div>
            {searchTerm.trim() && (
              <button onClick={() => setSearchTerm('')} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 bg-transparent border border-gray-200 rounded-full px-2.5 py-1 transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
                Xóa tìm kiếm "{searchTerm.trim()}"
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-400">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <span className="text-sm">Đang tải...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-40">cloud_off</span>
            <p className="text-sm font-medium text-gray-500">{error}</p>
            <button 
              onClick={fetchData} 
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              Thử Lại
            </button>
          </div>
        ) : filteredChuyenKhoas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-40">
              {searchTerm.trim() ? 'search_off' : 'local_hospital'}
            </span>
            <p className="text-sm font-medium">
              {searchTerm.trim() ? 'Không tìm thấy chuyên khoa phù hợp' : 'Chưa có chuyên khoa nào'}
            </p>
            <p className="text-xs mt-1">
              {searchTerm.trim() ? 'Thử với từ khóa khác hoặc xóa bộ lọc tìm kiếm' : 'Nhấn "Thêm Chuyên Khoa" để bắt đầu'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên Chuyên Khoa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Mô Tả</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">SL Tối Đa</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredChuyenKhoas.map((item, idx) => (
                  <tr key={item.maChuyenKhoa || idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3.5 text-sm text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-gray-800">{item.tenChuyenKhoa}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500 max-w-[240px] truncate">{item.moTa || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-semibold text-xs">{item.soLuongToiDa ?? 0}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(item)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button onClick={() => handleDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalContent}
    </div>
  );
};

export default QuanLyChuyenKhoa;