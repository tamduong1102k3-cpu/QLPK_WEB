import { apiClient } from "../../../api/apiClient";
import { API_BASE_URL } from '../../../api/config';
import { getAllApi, getChiTietApi } from '../../../api/hoaDonApi';
import React, { useState, useEffect } from 'react';
const API = `${API_BASE_URL}/hoa-don`;
const NV_API = `${API_BASE_URL}/nhan_vien`;
const formatCurrency = amount => {
  if (amount == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};
const formatDate = dateStr => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
const statusBadge = status => {
  const map = {
    'chua thanh toan': {
      bg: '#fef9c3',
      color: '#a16207',
      label: 'Chưa thanh toán'
    },
    'da thanh toan': {
      bg: '#dcfce7',
      color: '#166534',
      label: 'Đã thanh toán'
    },
    'huy': {
      bg: '#fee2e2',
      color: '#991b1b',
      label: 'Đã hủy'
    }
  };
  const key = (status || '').toLowerCase();
  return map[key] || {
    bg: '#f3f4f6',
    color: '#4b5563',
    label: status || '—'
  };
};
const loaiMucBadge = loai => {
  const map = {
    'DICH_VU': {
      bg: '#eff6ff',
      color: '#1d4ed8',
      label: 'Dịch vụ'
    },
    'THUOC': {
      bg: '#f0fdf4',
      color: '#15803d',
      label: 'Thuốc'
    }
  };
  return map[loai] || {
    bg: '#f9fafb',
    color: '#6b7280',
    label: loai || '—'
  };
};
const QuanLyHoaDon = () => {
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [nvMap, setNvMap] = useState({}); // maNhanVien → hoTen

  // Detail panel
  const [selected, setSelected] = useState(null); // HoaDon object
  const [details, setDetails] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ── Fetch list + lookup ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [invRes, nvRes] = await Promise.all([apiClient(API), apiClient(NV_API)]);
        if (!invRes.ok) throw new Error('Lỗi tải danh sách hóa đơn');
        const [invData, nvData] = await Promise.all([invRes.json(), nvRes.json()]);
        setInvoices(invData);
        const map = {};
        nvData.forEach(n => {
          map[n.maNhanVien] = n.hoTen;
        });
        setNvMap(map);
      } catch (e) {
        alert(e.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ── Fetch detail ──────────────────────────────────────────────────
  const openDetail = async inv => {
    setSelected(inv);
    setDetails([]);
    setLoadingDetail(true);
    try {
      const detailsData = await getChiTietApi(inv.maHoaDon);
      setDetails(detailsData);
    } catch (e) {
      alert(e.message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // ── Filter ────────────────────────────────────────────────────
  const filtered = invoices.filter(inv => {
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return String(inv.maHoaDon).includes(t) || String(inv.maPhieuKham || '').includes(t) || (inv.trangThai || '').toLowerCase().includes(t);
  });

  // ── Styles ────────────────────────────────────────────────────
  const card = {
    background: '#fff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,.06)'
  };
  const th = {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
    textAlign: 'left'
  };
  const td = {
    padding: '13px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #f3f4f6',
    verticalAlign: 'middle'
  };
  return <div style={{
    display: 'flex',
    gap: '20px',
    height: '100%',
    alignItems: 'flex-start'
  }}>

      {/* ── LEFT: Invoice List ── */}
      <div style={{
      flex: selected ? '0 0 56%' : '1',
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      transition: 'flex .3s'
    }}>

        {/* Header */}
        <div style={{
        ...card,
        padding: '20px 24px'
      }}>
          <div style={{
          marginBottom: '16px'
        }}>
            <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: '#1f2937'
          }}>Quản Lý Hóa Đơn</h2>
            <p style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#6b7280'
          }}>
              Tổng cộng: <strong style={{
              color: '#005bc0'
            }}>{invoices.length}</strong> hóa đơn
            </p>
          </div>
          <div style={{
          position: 'relative',
          maxWidth: '400px'
        }}>
            <span className="material-symbols-outlined" style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '20px'
          }}>search</span>
            <input type="text" placeholder="Tìm theo mã HĐ, mã phiếu khám, trạng thái..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
            width: '100%',
            paddingLeft: '38px',
            paddingRight: '12px',
            paddingTop: '8px',
            paddingBottom: '8px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            boxSizing: 'border-box'
          }} />
          </div>
        </div>

        {/* Table */}
        <div style={{
        ...card,
        overflow: 'hidden'
      }}>
          <div style={{
          overflowX: 'auto'
        }}>
            <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
              <thead style={{
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
                <tr>
                  <th style={th}>Mã HD</th>
                  <th style={th}>Phiếu Khám</th>
                  <th style={th}>Mã NV</th>
                  <th style={th}>Họ Tên NV</th>
                  <th style={th}>Tổng Tiền</th>
                  <th style={th}>Ngày TT</th>
                  <th style={th}>Trạng Thái</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <tr><td colSpan="7" style={{
                  ...td,
                  textAlign: 'center',
                  padding: '48px',
                  color: '#9ca3af'
                }}>Đang tải dữ liệu...</td></tr> : filtered.length === 0 ? <tr><td colSpan="7" style={{
                  ...td,
                  textAlign: 'center',
                  padding: '48px',
                  color: '#9ca3af'
                }}>
                    {searchTerm ? `Không tìm thấy hóa đơn phù hợp với "${searchTerm}".` : 'Chưa có hóa đơn nào.'}
                  </td></tr> : filtered.map(inv => {
                const badge = statusBadge(inv.trangThai);
                const isActive = selected?.maHoaDon === inv.maHoaDon;
                return <tr key={inv.maHoaDon} style={{
                  background: isActive ? '#eff6ff' : 'transparent',
                  cursor: 'pointer'
                }} onClick={() => openDetail(inv)} onMouseEnter={e => {
                  if (!isActive) e.currentTarget.style.background = '#f9fafb';
                }} onMouseLeave={e => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}>
                      <td style={td}><strong>#{inv.maHoaDon?.toString().padStart(4, '0')}</strong></td>
                      <td style={td}>PK{inv.maPhieuKham?.toString().padStart(4, '0')}</td>
                      <td style={{
                    ...td,
                    fontSize: '13px',
                    color: '#6b7280'
                  }}>NV{inv.maNhanVien?.toString().padStart(3, '0')}</td>
                      <td style={{
                    ...td,
                    fontWeight: 500
                  }}>{nvMap[inv.maNhanVien] || <span style={{
                      color: '#9ca3af'
                    }}>—</span>}</td>
                      <td style={{
                    ...td,
                    fontWeight: 600,
                    color: '#059669'
                  }}>{formatCurrency(inv.tongTien)}</td>
                      <td style={td}>{formatDate(inv.ngayThanhToan)}</td>
                      <td style={td}>
                        <span style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: badge.bg,
                      color: badge.color
                    }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={td}>
                        <span className="material-symbols-outlined" style={{
                      fontSize: '20px',
                      color: isActive ? '#2563eb' : '#9ca3af'
                    }}>
                          {isActive ? 'chevron_right' : 'open_in_new'}
                        </span>
                      </td>
                    </tr>;
              })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Detail Panel ── */}
      {selected && <div style={{
      flex: '1',
      minWidth: '320px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'sticky',
      top: 0
    }}>

          {/* Detail Header */}
          <div style={{
        ...card,
        padding: '20px 24px'
      }}>
            <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
              <div>
                <h3 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 700,
              color: '#1f2937'
            }}>
                  Hóa Đơn #{selected.maHoaDon?.toString().padStart(4, '0')}
                </h3>
                <p style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: '#6b7280'
            }}>
                  Phiếu khám: PK{selected.maPhieuKham?.toString().padStart(4, '0')}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '4px',
            fontSize: '20px',
            lineHeight: 1
          }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Summary */}
            <div style={{
          marginTop: '16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px'
        }}>
              {[{
            label: 'Tổng Tiền',
            value: formatCurrency(selected.tongTien),
            highlight: true
          }, {
            label: 'Trạng Thái',
            value: statusBadge(selected.trangThai).label
          }, {
            label: 'NV Thu (Mã)',
            value: `NV${selected.maNhanVien?.toString().padStart(3, '0')}`
          }, {
            label: 'NV Thu (Tên)',
            value: nvMap[selected.maNhanVien] || '—'
          }, {
            label: 'Ngày Thanh Toán',
            value: formatDate(selected.ngayThanhToan)
          }].map(item => <div key={item.label} style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '10px 14px'
          }}>
                  <p style={{
              margin: 0,
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '2px'
            }}>{item.label}</p>
                  <p style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 600,
              color: item.highlight ? '#059669' : '#1f2937'
            }}>{item.value}</p>
                </div>)}
            </div>

            {selected.ghiChu && <div style={{
          marginTop: '12px',
          padding: '10px 14px',
          background: '#fffbeb',
          borderRadius: '8px',
          border: '1px solid #fde68a'
        }}>
                <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#92400e'
          }}><strong>Ghi chú:</strong> {selected.ghiChu}</p>
              </div>}
          </div>

          {/* Detail Items */}
          <div style={{
        ...card,
        overflow: 'hidden'
      }}>
            <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f3f4f6'
        }}>
              <h4 style={{
            margin: 0,
            fontSize: '15px',
            fontWeight: 600,
            color: '#1f2937'
          }}>Chi Tiết Hóa Đơn</h4>
            </div>
            {loadingDetail ? <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>Đang tải...</div> : details.length === 0 ? <div style={{
          padding: '32px',
          textAlign: 'center',
          color: '#9ca3af'
        }}>Không có chi tiết.</div> : <div style={{
          overflowX: 'auto'
        }}>
                <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
                  <thead style={{
              background: '#f9fafb'
            }}>
                    <tr>
                      <th style={{
                  ...th,
                  fontSize: '11px'
                }}>Nội dung</th>
                      <th style={{
                  ...th,
                  fontSize: '11px'
                }}>Loại</th>
                      <th style={{
                  ...th,
                  fontSize: '11px',
                  textAlign: 'right'
                }}>SL</th>
                      <th style={{
                  ...th,
                  fontSize: '11px',
                  textAlign: 'right'
                }}>Đơn Giá</th>
                      <th style={{
                  ...th,
                  fontSize: '11px',
                  textAlign: 'right'
                }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.map(item => {
                const lBadge = loaiMucBadge(item.loaiMuc);
                return <tr key={item.id} style={{
                  borderBottom: '1px solid #f3f4f6'
                }}>
                          <td style={{
                    ...td,
                    padding: '10px 16px',
                    fontSize: '13px'
                  }}>{item.noiDung}</td>
                          <td style={{
                    ...td,
                    padding: '10px 16px'
                  }}>
                            <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: lBadge.bg,
                      color: lBadge.color
                    }}>
                              {lBadge.label}
                            </span>
                          </td>
                          <td style={{
                    ...td,
                    padding: '10px 16px',
                    textAlign: 'right'
                  }}>{item.soLuong}</td>
                          <td style={{
                    ...td,
                    padding: '10px 16px',
                    textAlign: 'right'
                  }}>{formatCurrency(item.donGia)}</td>
                          <td style={{
                    ...td,
                    padding: '10px 16px',
                    textAlign: 'right',
                    fontWeight: 600,
                    color: '#059669'
                  }}>{formatCurrency(item.thanhTien)}</td>
                        </tr>;
              })}
                  </tbody>
                  <tfoot style={{
              background: '#f9fafb',
              borderTop: '2px solid #e5e7eb'
            }}>
                    <tr>
                      <td colSpan="4" style={{
                  ...td,
                  padding: '12px 16px',
                  fontWeight: 700,
                  fontSize: '14px',
                  textAlign: 'right'
                }}>Tổng cộng:</td>
                      <td style={{
                  ...td,
                  padding: '12px 16px',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#059669',
                  textAlign: 'right'
                }}>
                        {formatCurrency(selected.tongTien)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>}
          </div>
        </div>}
    </div>;
};
export default QuanLyHoaDon;
