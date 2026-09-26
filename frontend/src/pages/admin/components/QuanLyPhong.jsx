import { getAllPhongApi as _getAllPhongApi, getAllChucVuApi as _getAllChucVuApi, getAllChuyenKhoaApi as _getAllChuyenKhoaApi, deletePhongApi as _deletePhongApi } from '../../../api/danhMucApi';
import { API_BASE_URL } from '../../../api/config';
import { apiClient } from "../../../api/apiClient";
import React, { useState, useEffect } from 'react';
const BASE = `${API_BASE_URL}/danhmuc`;
const empty = {
  tenPhong: '',
  loaiPhong: '',
  maChuyenKhoa: '',
  maChucVu: ''
};
const fmtLoaiPhong = val => {
  if (!val) return '—';
  const map = {
    'KHOA_NOI': 'Khoa nội',
    'CLS_CHAN_DOAN_HINH_ANH': 'CLS Chẩn đoán hình ảnh',
    'CLS_XET_NGHIEM': 'CLS Xét nghiệm',
    'KHAM_CHUYEN_KHOA': 'Khám chuyên khoa',
    'LE_TAN': 'Lễ tân',
    'NHA_THUOC': 'Nhà thuốc',
    'KHO_DUOC': 'Kho dược',
    'THU_TIEN': 'Thu tiền',
    'KHOA_NGOAI': 'Khoa ngoại',
    'XET_NGHIEM': 'Xét nghiệm',
    'CHAN_DOAN_HINH_ANH': 'Chẩn đoán hình ảnh',
  
  };
  return map[val] || val.replace(/_/g, ' ');
};
const LOAI_PHONG_OPTIONS = [
  { value: 'KHOA_NOI', label: 'Khoa nội' },
  { value: 'CLS_CHAN_DOAN_HINH_ANH', label: 'CLS Chẩn đoán hình ảnh' },
  { value: 'CLS_XET_NGHIEM', label: 'CLS Xét nghiệm' },
  { value: 'KHAM_CHUYEN_KHOA', label: 'Khám chuyên khoa' },
  { value: 'LE_TAN', label: 'Lễ tân' },
  { value: 'NHA_THUOC', label: 'Nhà thuốc' },
  { value: 'KHO_DUOC', label: 'Kho dược' },
  { value: 'THU_TIEN', label: 'Thu tiền' }
];
export default function QuanLyPhong() {
  const [phongList, setPhongList] = useState([]);
  const [chucVuList, setChucVuList] = useState([]);
  const [ckList, setCkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, cv, ck] = await Promise.all([_getAllPhongApi(), _getAllChucVuApi(), _getAllChuyenKhoaApi()]);
      setPhongList(p || []);
      setChucVuList(cv || []);
      setCkList(ck || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const tenChucVu = id => chucVuList.find(c => c.id === id)?.tenChucVu || '—';
  const tenCK = id => ckList.find(c => c.maChuyenKhoa === id)?.tenChuyenKhoa || '—';
  const displayed = phongList.filter(p => p.tenPhong?.toLowerCase().includes(search.toLowerCase()) || p.loaiPhong?.toLowerCase().includes(search.toLowerCase()));

  // Open modal
  const openAdd = () => {
    setForm(empty);
    setEditId(null);
    setModal('add');
  };
  const openEdit = p => {
    setForm({
      tenPhong: p.tenPhong || '',
      loaiPhong: p.loaiPhong || '',
      maChuyenKhoa: p.maChuyenKhoa ?? '',
      maChucVu: p.maChucVu ?? ''
    });
    setEditId(p.maPhong);
    setModal('edit');
  };

  // Save
  const handleSave = async () => {
    if (!form.tenPhong.trim()) {
      alert('Vui lòng nhập tên phòng!');
      return;
    }
    setSaving(true);
    const body = {
      tenPhong: form.tenPhong.trim(),
      loaiPhong: form.loaiPhong || null,
      maChuyenKhoa: form.maChuyenKhoa !== '' ? Number(form.maChuyenKhoa) : null,
      maChucVu: form.maChucVu !== '' ? Number(form.maChucVu) : null
    };
    try {
      const url = modal === 'edit' ? `${BASE}/phong/${editId}` : `${BASE}/phong`;
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res = await apiClient(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Lỗi lưu dữ liệu');
      setModal(null);
      fetchAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async id => {
    if (!window.confirm('Xóa phòng này?')) return;
    setDeleting(id);
    try {
      await _deletePhongApi(id);
      fetchAll();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };
  return <div style={{
    fontFamily: 'Inter, sans-serif'
  }}>

      {/* Header */}
      <div style={{
      background: 'linear-gradient(135deg,#005bc0,#0077e6)',
      borderRadius: '12px',
      padding: '18px 24px',
      color: '#fff',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
        <div>
          <h2 style={{
          margin: 0,
          fontSize: '17px',
          fontWeight: 700
        }}>🏥 QUẢN LÝ PHÒNG CHỨC NĂNG</h2>
          <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          opacity: 0.8
        }}>{phongList.length} phòng trong hệ thống</p>
        </div>
        <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên phòng..." style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          outline: 'none',
          '::placeholder': {
            color: '#rgba(255,255,255,0.6)'
          }
        }} />
          <button onClick={openAdd} style={{
          padding: '8px 18px',
          background: '#fff',
          color: '#005bc0',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
            ➕ Thêm Phòng
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      overflow: 'hidden',
      border: '1px solid #e5e7eb'
    }}>
        {loading ? <div style={{
        padding: '60px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>Đang tải...</div> : <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px'
      }}>
            <thead>
              <tr style={{
            background: '#f8fafc'
          }}>
                {['#', 'Tên Phòng', 'Loại Phòng', 'Chuyên Khoa', 'Chức Vụ', 'Thao Tác'].map(h => <th key={h} style={{
              padding: '12px 14px',
              textAlign: h === 'Thao Tác' ? 'center' : 'left',
              color: '#6b7280',
              fontWeight: 600,
              borderBottom: '1px solid #e5e7eb',
              whiteSpace: 'nowrap'
            }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? <tr><td colSpan={6} style={{
              padding: '50px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>Không có dữ liệu</td></tr> : displayed.map((p, i) => <tr key={p.maPhong} style={{
            borderBottom: '1px solid #f1f5f9'
          }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{
              padding: '11px 14px',
              color: '#9ca3af',
              fontWeight: 500
            }}>{i + 1}</td>
                  <td style={{
              padding: '11px 14px'
            }}>
                    <div style={{
                fontWeight: 600,
                color: '#1e3a8a'
              }}>{p.tenPhong}</div>
                    <div style={{
                fontSize: '11px',
                color: '#9ca3af',
                marginTop: '2px'
              }}>ID: {p.maPhong}</div>
                  </td>
                  <td style={{
              padding: '11px 14px'
            }}>
                    {p.loaiPhong ? <span style={{
                background: '#eff6ff',
                color: '#1e40af',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                        {fmtLoaiPhong(p.loaiPhong)}
                      </span> : '—'}
                  </td>
                  <td style={{
              padding: '11px 14px',
              color: '#374151'
            }}>
                    {p.maChuyenKhoa ? <span style={{
                color: '#059669',
                fontWeight: 500
              }}>{tenCK(p.maChuyenKhoa)}</span> : '—'}
                  </td>
                  <td style={{
              padding: '11px 14px',
              color: '#374151'
            }}>
                    {p.maChucVu ? <span style={{
                background: '#f0fdf4',
                color: '#059669',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                        {tenChucVu(p.maChucVu)}
                      </span> : '—'}
                  </td>
                  <td style={{
              padding: '11px 14px',
              textAlign: 'center'
            }}>
                    <div style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'center'
              }}>
                      <button onClick={() => openEdit(p)} style={{
                  padding: '5px 14px',
                  background: '#eff6ff',
                  color: '#1e40af',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(p.maPhong)} disabled={deleting === p.maPhong} style={{
                  padding: '5px 14px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                        {deleting === p.maPhong ? '...' : '🗑 Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>}
      </div>

      {/* Modal */}
      {modal && <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
          <div style={{
        background: '#fff',
        width: '500px',
        maxWidth: '95vw',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>

            {/* Modal Header */}
            <div style={{
          background: 'linear-gradient(135deg,#005bc0,#0077e6)',
          padding: '18px 24px',
          color: '#fff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
              <div style={{
            fontWeight: 700,
            fontSize: '15px'
          }}>
                {modal === 'add' ? '➕ Thêm Phòng Mới' : 'Cập Nhật Phòng'}
              </div>
              <button onClick={() => setModal(null)} style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px'
          }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>

              <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px'
          }}>
                <span style={{
              fontWeight: 600,
              color: '#374151'
            }}>Tên Phòng <span style={{
                color: '#dc2626'
              }}>*</span></span>
                <input value={form.tenPhong} onChange={e => setForm({
              ...form,
              tenPhong: e.target.value
            })} placeholder="VD: P. Khám Nội Tổng Quát" style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '13px'
            }} />
              </label>

              <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px'
          }}>
                <span style={{
              fontWeight: 600,
              color: '#374151'
            }}>Loại Phòng</span>
                <select value={form.loaiPhong} onChange={e => setForm({
              ...form,
              loaiPhong: e.target.value
            })} style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '13px'
            }}>
                  <option value="">-- Chọn loại --</option>
                  {LOAI_PHONG_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </label>

              <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
                <label style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px'
            }}>
                  <span style={{
                fontWeight: 600,
                color: '#374151'
              }}>Chuyên Khoa</span>
                  <select value={form.maChuyenKhoa} onChange={e => setForm({
                ...form,
                maChuyenKhoa: e.target.value
              })} style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                    <option value="">-- Không có --</option>
                    {ckList.map(c => <option key={c.maChuyenKhoa} value={c.maChuyenKhoa}>{c.tenChuyenKhoa}</option>)}
                  </select>
                </label>

                <label style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '13px'
            }}>
                  <span style={{
                fontWeight: 600,
                color: '#374151'
              }}>Chức Vụ</span>
                  <select value={form.maChucVu} onChange={e => setForm({
                ...form,
                maChucVu: e.target.value
              })} style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                    <option value="">-- Không có --</option>
                    {chucVuList.map(c => <option key={c.id} value={c.id}>{c.tenChucVu}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
              <button onClick={() => setModal(null)} style={{
            padding: '9px 20px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '13px'
          }}>Hủy</button>
              <button onClick={handleSave} disabled={saving} style={{
            padding: '9px 24px',
            background: 'linear-gradient(135deg,#005bc0,#0077e6)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            opacity: saving ? 0.7 : 1
          }}>
                {saving ? '⏳ Đang lưu...' : '✔ Lưu'}
              </button>
            </div>
          </div>
        </div>}
    </div>;
}
