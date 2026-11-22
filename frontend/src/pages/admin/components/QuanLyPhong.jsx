import * as danhMucApi from '../../../api/danhMucApi';
import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../components/NotificationContext';
const TECHNICIAN_POSITION_IDS = [13, 15];
const isTechnicianPosition = maChucVu => TECHNICIAN_POSITION_IDS.includes(Number(maChucVu));
const empty = {
  tenPhong: '',
  loaiPhong: '',
  soLuongToiDa: '',
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
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  const [phongList, setPhongList] = useState([]);
  const [allRoomNames, setAllRoomNames] = useState([]);
  const [filteredNames, setFilteredNames] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [chucVuList, setChucVuList] = useState([]);
  const [ckList, setCkList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  useEffect(() => {
    fetchAll();
  }, []);
  useEffect(() => {
    if (!modal) return undefined;

    let active = true;
    danhMucApi.getDistinctTenPhongApi()
      .then(names => {
        if (active) setAllRoomNames(names);
      })
      .catch(error => {
        console.error('Không thể tải gợi ý tên phòng:', error);
        if (active) showError('Không thể tải danh sách tên phòng gợi ý.');
      });

    return () => {
      active = false;
      setShowSuggestions(false);
    };
  }, [modal, showError]);
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, cv, ck] = await Promise.all([danhMucApi.getAllPhongApi(), danhMucApi.getAllChucVuApi(), danhMucApi.getAllChuyenKhoaApi()]);
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
  const getRoomCapacitySummary = () => {
    if (form.maChuyenKhoa === '' || !isTechnicianPosition(form.maChucVu)) return null;

    const selectedKhoa = ckList.find(
      khoa => Number(khoa.maChuyenKhoa) === Number(form.maChuyenKhoa)
    );
    if (!selectedKhoa || selectedKhoa.soLuongToiDa == null) return null;

    const roomTotals = phongList
      .filter(phong => (
        Number(phong.maChuyenKhoa) === Number(form.maChuyenKhoa)
        && isTechnicianPosition(phong.maChucVu)
      ))
      .reduce((totals, phong) => {
        const quantity = Number(phong.soLuongToiDa) || 0;
        totals.current += quantity;
        if (!(modal === 'edit' && Number(phong.maPhong) === Number(editId))) {
          totals.excludingEditedRoom += quantity;
        }
        return totals;
      }, { current: 0, excludingEditedRoom: 0 });
    const specialtyLimit = Number(selectedKhoa.soLuongToiDa);

    return {
      used: roomTotals.current,
      limit: specialtyLimit,
      remaining: specialtyLimit - roomTotals.current,
      totalAfterSave: roomTotals.excludingEditedRoom + (Number(form.soLuongToiDa) || 0)
    };
  };
  const displayed = phongList.filter(p => p.tenPhong?.toLowerCase().includes(search.toLowerCase()) || p.loaiPhong?.toLowerCase().includes(search.toLowerCase()));
  const roomCapacitySummary = getRoomCapacitySummary();
  const isLimitExceeded = Boolean(
    roomCapacitySummary && (
      (modal === 'add' && roomCapacitySummary.remaining <= 0)
      || roomCapacitySummary.totalAfterSave > roomCapacitySummary.limit
    )
  );

  // Open modal
  const openAdd = () => {
    setFieldErrors({});
    setForm(empty);
    setEditId(null);
    setModal('add');
  };
  const openEdit = p => {
    setFieldErrors({});
    setForm({
      tenPhong: p.tenPhong || '',
      loaiPhong: p.loaiPhong || '',
      soLuongToiDa: p.soLuongToiDa ?? '',
      maChuyenKhoa: p.maChuyenKhoa ?? '',
      maChucVu: p.maChucVu ?? ''
    });
    setEditId(p.maPhong);
    setModal('edit');
  };

  const handleRoomNameChange = event => {
    const value = event.target.value;
    setForm(current => ({ ...current, tenPhong: value }));
    setFieldErrors(current => {
      if (!current.tenPhong) return current;
      const next = { ...current };
      delete next.tenPhong;
      return next;
    });

    const query = value.trim().toLocaleLowerCase('vi');
    if (!query) {
      setFilteredNames([]);
      setShowSuggestions(false);
      return;
    }

    const matches = allRoomNames.filter(name =>
      name.toLocaleLowerCase('vi').includes(query)
    );
    setFilteredNames(matches);
    setShowSuggestions(matches.length > 0);
  };

  const selectRoomName = name => {
    setForm(current => ({ ...current, tenPhong: name }));
    setFieldErrors(current => {
      if (!current.tenPhong) return current;
      const next = { ...current };
      delete next.tenPhong;
      return next;
    });
    setFilteredNames([]);
    setShowSuggestions(false);
  };

  // Save
  const handleSave = async () => {
    if (!form.tenPhong.trim()) {
      showWarning('Vui lòng nhập tên phòng!');
      return;
    }
    if (form.soLuongToiDa !== '' && (!Number.isInteger(Number(form.soLuongToiDa)) || Number(form.soLuongToiDa) < 1)) {
      showWarning('Số lượng bệnh nhân tối đa phải là số nguyên lớn hơn 0!');
      return;
    }
    const capacitySummary = getRoomCapacitySummary();
    if (modal === 'add' && isTechnicianPosition(form.maChucVu) && capacitySummary && capacitySummary.remaining <= 0) {
      showError('Chuyên khoa này đã đạt giới hạn số lượng, không thể thêm phòng mới.');
      return;
    }
    if (isTechnicianPosition(form.maChucVu) && capacitySummary && capacitySummary.totalAfterSave > capacitySummary.limit) {
      showError(
        `Tổng số lượng các phòng (${capacitySummary.totalAfterSave}) vượt quá giới hạn của chuyên khoa (${capacitySummary.limit}).`
      );
      return;
    }
    setSaving(true);
    const body = {
      tenPhong: form.tenPhong.trim(),
      loaiPhong: form.loaiPhong || null,
      soLuongToiDa: form.soLuongToiDa !== '' ? Number(form.soLuongToiDa) : null,
      maChuyenKhoa: form.maChuyenKhoa !== '' ? Number(form.maChuyenKhoa) : null,
      maChucVu: form.maChucVu !== '' ? Number(form.maChucVu) : null
    };
    try {
      if (modal === 'edit') {
        await danhMucApi.updatePhongApi(editId, body);
      } else {
        await danhMucApi.createPhongApi(body);
      }
      setModal(null);
      fetchAll();
      showSuccess(modal === 'edit' ? 'Cập nhật phòng thành công!' : 'Thêm phòng thành công!');
    } catch (e) {
      if (e.fieldErrors && Object.keys(e.fieldErrors).length > 0) {
        setFieldErrors(e.fieldErrors);
      } else {
        showError(e.message);
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async id => {
    showConfirm('Xóa phòng này?', async () => {
      setDeleting(id);
      try {
        await danhMucApi.deletePhongApi(id);
        fetchAll();
        showSuccess('Xóa phòng thành công!');
      } catch (e) {
        showError(e.message);
      } finally {
        setDeleting(null);
      }
    });
  };
  return <div style={{
    fontFamily: 'Inter, sans-serif'
  }}>
      <style>{`.quan-ly-phong-search::placeholder { color: #fff !important; opacity: 1; }`}</style>

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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên phòng..." className="quan-ly-phong-search" style={{
          padding: '8px 14px',
          borderRadius: '8px',
          border: 'none',
          fontSize: '13px',
          background: 'rgba(255,255,255,0.2)',
          color: '#fff',
          outline: 'none'
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
                {['#', 'Tên Phòng', 'Loại Phòng', 'Số lượng bệnh nhân', 'Chuyên Khoa', 'Chức Vụ', 'Thao Tác'].map(h => <th key={h} style={{
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
              {displayed.length === 0 ? <tr><td colSpan={7} style={{
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
              color: '#374151',
              textAlign: 'center'
            }}>
                    {p.soLuongToiDa ?? '—'}
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
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    value={form.tenPhong}
                    onChange={handleRoomNameChange}
                    onBlur={() => window.setTimeout(() => setShowSuggestions(false), 200)}
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions}
                    placeholder="VD: P. Khám Nội Tổng Quát"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '10px 12px',
                      border: fieldErrors.tenPhong ? '1px solid #dc2626' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '13px'
                    }}
                  />
                  {showSuggestions && filteredNames.length > 0 && (
                    <ul
                      role="listbox"
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 10,
                        maxHeight: '200px',
                        overflowY: 'auto',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        background: '#fff',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
                      }}
                    >
                      {filteredNames.map(name => (
                        <li key={name} role="option" aria-selected="false">
                          <button
                            type="button"
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => selectRoomName(name)}
                            style={{
                              display: 'block',
                              width: '100%',
                              padding: '9px 12px',
                              border: 'none',
                              background: '#fff',
                              color: '#374151',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            {name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {fieldErrors.tenPhong && <span style={{ color: '#dc2626', fontSize: '12px' }}>{fieldErrors.tenPhong}</span>}
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

              <label style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px'
          }}>
                <span style={{
              fontWeight: 600,
              color: '#374151'
            }}>Số Lượng Bệnh Nhân Tối Đa</span>
                <input type="number" min="1" step="1" disabled={modal === 'add' && isTechnicianPosition(form.maChucVu) && Boolean(roomCapacitySummary) && roomCapacitySummary.remaining <= 0} value={form.soLuongToiDa} onChange={e => setForm({
              ...form,
              soLuongToiDa: e.target.value
            })} placeholder="VD: 20" style={{
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '13px'
            }} />
                {roomCapacitySummary && (
                  <small style={{ color: roomCapacitySummary.remaining < 0 ? '#dc2626' : '#6b7280' }}>
                    Đã sử dụng: {roomCapacitySummary.used} / {roomCapacitySummary.limit}. Còn trống: {roomCapacitySummary.remaining}
                  </small>
                )}
                {isLimitExceeded && (
                  <small style={{ color: '#dc2626' }}>
                    {modal === 'add' && roomCapacitySummary.remaining <= 0
                      ? `Tổng số lượng các phòng KTV thuộc chuyên khoa này đã đạt giới hạn (${Math.max(roomCapacitySummary.used, roomCapacitySummary.totalAfterSave)}/${roomCapacitySummary.limit}). Không thể thêm phòng mới.`
                      : `Tổng số lượng các phòng KTV thuộc chuyên khoa này sẽ vượt quá giới hạn (${roomCapacitySummary.totalAfterSave}/${roomCapacitySummary.limit}). Không thể lưu thay đổi.`}
                  </small>
                )}
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
              <button onClick={handleSave} disabled={saving || isLimitExceeded} style={{
            padding: '9px 24px',
            background: isLimitExceeded ? '#9ca3af' : 'linear-gradient(135deg,#005bc0,#0077e6)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: saving || isLimitExceeded ? 'not-allowed' : 'pointer',
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
