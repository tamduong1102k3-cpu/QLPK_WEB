import * as dichVuApi from '../../../api/dichVuApi';
import * as danhMucApi from '../../../api/danhMucApi';
import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../../components/NotificationContext';
const empty = {
  tenDichVu: '',
  donGia: '',
  loaiDichVu: '',
  maChuyenKhoa: '',
  maNhomDichVu: '',
  version: undefined
};
const fmtGia = val => {
  if (!val && val !== 0) return '—';
  return Number(val).toLocaleString('vi-VN') + ' đ';
};
const fmtLoai = val => {
  if (!val) return '—';
  const map = {
    'KHAM_BENH': 'Khám bệnh',
    'CLS_XET_NGHIEM': 'CLS xét nghiệm',
    'CLS_CHAN_DOAN_HINH_ANH': 'CLS chẩn đoán hình ảnh'
  };
  return map[val] || val.replace(/_/g, ' ');
};
export default function QuanLyDichVu() {
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const [list, setList] = useState([]);
  const [ckList, setCkList] = useState([]);
  const [nhomList, setNhomList] = useState([]);
  const [formNhomList, setFormNhomList] = useState([]);
  const [loadingNhom, setLoadingNhom] = useState(false);
  const nhomRequestId = useRef(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLoai, setFilterLoai] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(empty);
  const [fieldErrors, setFieldErrors] = useState({});
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dv, ck, nhom] = await Promise.all([dichVuApi.getAllApi(), danhMucApi.getAllChuyenKhoaApi(), danhMucApi.getAllNhomDichVuApi()]);
      setList(dv || []);
      setCkList(ck || []);
      setNhomList(nhom || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadNhomByChuyenKhoa = async maChuyenKhoa => {
    const requestId = ++nhomRequestId.current;
    setFormNhomList([]);
    if (maChuyenKhoa === '' || maChuyenKhoa == null) {
      setLoadingNhom(false);
      return;
    }

    setLoadingNhom(true);
    try {
      const groups = await danhMucApi.getAllNhomDichVuApi(maChuyenKhoa);
      if (requestId === nhomRequestId.current) {
        setFormNhomList(groups || []);
      }
    } catch (e) {
      if (requestId === nhomRequestId.current) {
        showError(e.message || 'Không thể tải nhóm dịch vụ.');
      }
    } finally {
      if (requestId === nhomRequestId.current) {
        setLoadingNhom(false);
      }
    }
  };

  const handleChuyenKhoaChange = e => {
    const maChuyenKhoa = e.target.value;
    setForm(current => ({
      ...current,
      maChuyenKhoa,
      maNhomDichVu: ''
    }));
    loadNhomByChuyenKhoa(maChuyenKhoa);
  };

  // Helpers
  const tenCK = id => ckList.find(c => c.maChuyenKhoa === id)?.tenChuyenKhoa || '—';
  const tenNhom = id => {
    if (!id && id !== 0) return '—';
    const n = nhomList.find(x => x.maNhom === id || x.maNhom === Number(id));
    return n ? n.tenNhom : '—';
  };

  // Unique loai for filter
  const loaiOptions = [...new Set(list.map(d => d.loaiDichVu).filter(Boolean))];
  const displayed = list.filter(d => {
    const matchSearch = d.tenDichVu?.toLowerCase().includes(search.toLowerCase());
    const matchLoai = filterLoai ? d.loaiDichVu === filterLoai : true;
    return matchSearch && matchLoai;
  });
  const openAdd = () => {
    setFieldErrors({});
    nhomRequestId.current += 1;
    setFormNhomList([]);
    setLoadingNhom(false);
    setForm(empty);
    setEditId(null);
    setModal('add');
  };
  const openEdit = d => {
    setFieldErrors({});
    setForm({
      tenDichVu: d.tenDichVu || '',
      donGia: d.donGia ?? '',
      loaiDichVu: d.loaiDichVu || '',
      maChuyenKhoa: d.maChuyenKhoa ?? '',
      maNhomDichVu: d.maNhomDichVu ?? '',
      version: d.version ?? undefined
    });
    setEditId(d.maDichVu);
    setModal('edit');
    loadNhomByChuyenKhoa(d.maChuyenKhoa ?? '');
  };
  const handleSave = async () => {
    const tenDichVu = form.tenDichVu.trim();
    if (tenDichVu.length < 2) {
      showError("Tên phải từ 2 ký tự trở lên!");
      return;
    }
    if (tenDichVu.length > 200) {
      showError("Tên không được vượt quá 200 ký tự!");
      return;
    }
    if (form.donGia === '' || form.donGia == null || !Number.isFinite(Number(form.donGia))) {
      showWarning('Vui lòng nhập đơn giá hợp lệ!');
      return;
    }
    if (Number(form.donGia) < 0) {
      showError("Giá tiền không được âm!");
      return;
    }
    if (form.maNhomDichVu !== '' && loadingNhom) {
      showWarning('Vui lòng đợi tải danh sách nhóm dịch vụ.');
      return;
    }
    if (form.maNhomDichVu !== '') {
      const selectedNhom = formNhomList.find(
        n => Number(n.maNhom) === Number(form.maNhomDichVu)
      );
      if (!form.maChuyenKhoa || !selectedNhom
          || Number(selectedNhom.maChuyenKhoa) !== Number(form.maChuyenKhoa)) {
        showError('Nhóm dịch vụ không thuộc chuyên khoa đã chọn!');
        return;
      }
    }
    setSaving(true);
    const body = {
      tenDichVu,
      donGia: Number(form.donGia),
      loaiDichVu: form.loaiDichVu || null,
      maChuyenKhoa: form.maChuyenKhoa !== '' ? Number(form.maChuyenKhoa) : null,
      maNhomDichVu: form.maNhomDichVu !== '' ? Number(form.maNhomDichVu) : null,
      version: form.version
    };
    try {
      if (modal === 'edit') {
        await dichVuApi.updateApi(editId, body);
      } else {
        await dichVuApi.createApi(body);
      }
      setModal(null);
      fetchAll();
      showSuccess(modal === 'edit' ? 'Cập nhật dịch vụ thành công!' : 'Thêm dịch vụ thành công!');
    } catch (e) {
      if (e.fieldErrors && Object.keys(e.fieldErrors).length > 0) {
        setFieldErrors(e.fieldErrors);
        return;
      }
      const status = e.status || e.response?.status;
      const msg = e.message || '';
      const isConflict = status === 409
        || msg.includes('409')
        || msg.includes('người dùng khác cập nhật')
        || msg.includes('Vui lòng tải lại');
      if (isConflict) {
        showWarning('Dữ liệu đã được người dùng khác cập nhật. Vui lòng tải lại dữ liệu mới nhất!');
        setModal(null);
        fetchAll();
      } else {
        showError(msg || 'Không thể lưu dịch vụ.');
      }
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async id => {
    showConfirm('Xóa dịch vụ này?', async () => {
      setDeleting(id);
      try {
        await dichVuApi.deleteApi(id);
        fetchAll();
        showSuccess('Xóa dịch vụ thành công!');
      } catch (e) {
        showError(e.message);
      } finally {
        setDeleting(null);
      }
    });
  };

  // Stats
  const totalDV = displayed.length;
  const avgGia = totalDV > 0 ? displayed.reduce((s, d) => s + (Number(d.donGia) || 0), 0) / totalDV : 0;
  const maxGia = Math.max(...displayed.map(d => Number(d.donGia) || 0), 0);
  return <div style={{
    fontFamily: 'Inter, sans-serif'
  }}>
      <style>{`input::placeholder { color: #fff !important; }`}</style>

      {/* Header */}
      <div style={{
      background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
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
        }}>QUẢN LÝ DỊCH VỤ</h2>
          <p style={{
          margin: '4px 0 0',
          fontSize: '12px',
          opacity: 0.8
        }}>{list.length} dịch vụ trong hệ thống</p>
        </div>
        <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên dịch vụ..." style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          outline: 'none',
          minWidth: '180px'
        }} />
          <select value={filterLoai} onChange={e => setFilterLoai(e.target.value)} style={{
          padding: '8px 12px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          outline: 'none',
          cursor: 'pointer'
        }}>
            <option value="" style={{
            color: '#111'
          }}>Tất cả loại</option>
            {loaiOptions.map(l => <option key={l} value={l} style={{
            color: '#111'
          }}>{fmtLoai(l)}</option>)}
          </select>
          <button onClick={openAdd} style={{
          padding: '8px 18px',
          background: '#fff',
          color: '#7c3aed',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 700,
          cursor: 'pointer'
        }}>
            ➕ Thêm Dịch Vụ
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3,1fr)',
      gap: '12px',
      marginBottom: '16px'
    }}>
        {[{
        label: 'Đang hiển thị',
        val: `${totalDV} dịch vụ`,
        icon: '📋',
        color: '#7c3aed',
        bg: '#f5f3ff'
      }, {
        label: 'Giá trung bình',
        val: fmtGia(Math.round(avgGia)),
        icon: '💰',
        color: '#059669',
        bg: '#f0fdf4'
      }, {
        label: 'Giá cao nhất',
        val: fmtGia(maxGia),
        icon: '📈',
        color: '#d97706',
        bg: '#fffbeb'
      }].map((c, i) => <div key={i} style={{
        background: c.bg,
        borderRadius: '10px',
        padding: '14px 18px',
        border: `1px solid ${c.color}22`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
            <span style={{
          fontSize: '22px'
        }}>{c.icon}</span>
            <div>
              <div style={{
            fontSize: '11px',
            color: '#6b7280'
          }}>{c.label}</div>
              <div style={{
            fontSize: '16px',
            fontWeight: 700,
            color: c.color
          }}>{c.val}</div>
            </div>
          </div>)}
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
            background: '#faf5ff'
          }}>
                {['#', 'Tên Dịch Vụ', 'Loại', 'Đơn Giá', 'Chuyên Khoa', 'Nhóm', 'Thao Tác'].map(h => <th key={h} style={{
              padding: '12px 14px',
              textAlign: h === 'Thao Tác' || h === 'Đơn Giá' ? 'center' : 'left',
              color: '#6b7280',
              fontWeight: 600,
              borderBottom: '1px solid #e5e7eb',
              whiteSpace: 'nowrap'
            }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? <tr><td colSpan={7} style={{
              padding: '50px',
              textAlign: 'center',
              color: '#9ca3af'
            }}>Không có dữ liệu</td></tr> : displayed.map((d, i) => <tr key={d.maDichVu} style={{
            borderBottom: '1px solid #f1f5f9',
            transition: 'background 0.15s'
          }} onMouseEnter={e => e.currentTarget.style.background = '#faf5ff'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{
              padding: '10px 14px',
              color: '#9ca3af'
            }}>{i + 1}</td>
                  <td style={{
              padding: '10px 14px'
            }}>
                    <div style={{
                fontWeight: 600,
                color: '#1e293b'
              }}>{d.tenDichVu}</div>
                    <div style={{
                fontSize: '11px',
                color: '#9ca3af'
              }}>ID: {d.maDichVu}</div>
                  </td>
                  <td style={{
              padding: '10px 14px'
            }}>
                    {d.loaiDichVu ? <span style={{
                background: d.loaiDichVu.includes('KHAM') ? '#ede9fe' : d.loaiDichVu.includes('CLS') ? '#dbeafe' : '#fef9c3',
                color: d.loaiDichVu.includes('KHAM') ? '#7c3aed' : d.loaiDichVu.includes('CLS') ? '#1e40af' : '#92400e',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600
              }}>{fmtLoai(d.loaiDichVu)}</span> : '—'}
                  </td>
                  <td style={{
              padding: '10px 14px',
              textAlign: 'center',
              fontWeight: 700,
              color: '#059669'
            }}>
                    {fmtGia(d.donGia)}
                  </td>
                  <td style={{
              padding: '10px 14px',
              color: '#374151',
              fontSize: '12px'
            }}>
                    {d.maChuyenKhoa ? tenCK(d.maChuyenKhoa) : '—'}
                  </td>
                  <td style={{
              padding: '10px 14px',
              color: '#374151',
              fontSize: '12px'
            }}>
                    {tenNhom(d.maNhomDichVu)}
                  </td>
                  <td style={{
              padding: '10px 14px',
              textAlign: 'center'
            }}>
                    <div style={{
                display: 'flex',
                gap: '6px',
                justifyContent: 'center'
              }}>
                      <button onClick={() => openEdit(d)} style={{
                  padding: '5px 12px',
                  background: '#ede9fe',
                  color: '#7c3aed',
                  border: '1px solid #ddd6fe',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                        Sửa
                      </button>
                      <button onClick={() => handleDelete(d.maDichVu)} disabled={deleting === d.maDichVu} style={{
                  padding: '5px 12px',
                  background: '#fee2e2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                        {deleting === d.maDichVu ? '...' : '🗑 Xóa'}
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
        width: '520px',
        maxWidth: '95vw',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)'
      }}>

            <div style={{
          background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
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
                {modal === 'add' ? '➕ Thêm Dịch Vụ Mới' : 'Cập Nhật Dịch Vụ'}
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

            <div style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>

              <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '13px'
          }}>
                <span style={{
              fontWeight: 600,
              color: '#374151'
            }}>Tên Dịch Vụ <span style={{
                color: '#dc2626'
              }}>*</span></span>
                <input maxLength={200} value={form.tenDichVu} onChange={e => {
              setForm({ ...form, tenDichVu: e.target.value });
              setFieldErrors(current => {
                if (!current.tenDichVu) return current;
                const next = { ...current };
                delete next.tenDichVu;
                return next;
              });
            }} placeholder="VD: Khám Nội Tổng Quát" style={{
              padding: '10px 12px',
              border: fieldErrors.tenDichVu ? '1px solid #dc2626' : '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '13px'
            }} />
                {fieldErrors.tenDichVu && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.tenDichVu}</span>}
              </label>

              <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}>
                <label style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              fontSize: '13px'
            }}>
                  <span style={{
                fontWeight: 600,
                color: '#374151'
              }}>Đơn Giá (đ) <span style={{
                  color: '#dc2626'
                }}>*</span></span>
                  <input type="number" min="0" value={form.donGia} onChange={e => setForm({
                ...form,
                donGia: e.target.value
              })} placeholder="VD: 100000" style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px'
              }} />
                </label>

                <label style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '5px',
              fontSize: '13px'
            }}>
                  <span style={{
                fontWeight: 600,
                color: '#374151'
              }}>Loại Dịch Vụ</span>
                  <select value={form.loaiDichVu} onChange={e => setForm({
                ...form,
                loaiDichVu: e.target.value
              })} style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '13px'
              }}>
                    <option value="">-- Chọn loại --</option>
                    <option value="KHAM_BENH">Khám bệnh</option>
                    <option value="CLS_XET_NGHIEM">CLS xét nghiệm</option>
                    <option value="CLS_CHAN_DOAN_HINH_ANH">CLS chẩn đoán hình ảnh</option>
                  </select>
                </label>
              </div>

              <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            fontSize: '13px'
          }}>
                <span style={{
              fontWeight: 600,
              color: '#374151'
            }}>Chuyên Khoa</span>
                <select value={form.maChuyenKhoa} onChange={handleChuyenKhoaChange} style={{
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
            gap: '5px',
            fontSize: '13px'
          }}>
                <span style={{
              fontWeight: 600,
              color: '#374151'
            }}>Nhóm Dịch Vụ</span>
                <select value={form.maNhomDichVu ?? ''} disabled={!form.maChuyenKhoa || loadingNhom} onChange={e => setForm({
              ...form,
              maNhomDichVu: e.target.value
            })} style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '13px',
              background: !form.maChuyenKhoa || loadingNhom ? '#f3f4f6' : '#fff',
              cursor: !form.maChuyenKhoa || loadingNhom ? 'not-allowed' : 'pointer'
            }}>
                  <option value="">{loadingNhom ? 'Đang tải nhóm...' : '-- Chọn nhóm --'}</option>
                  {formNhomList.map(n => <option key={n.maNhom} value={n.maNhom}>{n.tenNhom}</option>)}
                </select>
              </label>
            </div>

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
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
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