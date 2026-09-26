import { getAllApi, updateApi, deleteApi } from '../../../api/accountApi'; 
import { getAllNhanVienApi } from '../../../api/employeeApi';
import { getAllChuyenKhoaApi, getAllVaiTroApi } from '../../../api/danhMucApi';
import React, { useState, useEffect } from 'react';
import usePagination from '../../../hooks/usePagination';
import Pagination from '../../../components/Pagination';

const VAI_TRO_OPTIONS = [
  'QUAN_TRI_VIEN',
  'BAC_SI_CHUYEN_KHOA',
  'BAC_SI',
  'TRO_LY_BAC_SI_CHUYEN_KHOA',
  'TRO_LY_BAC_SI_TONG_QUAT',
  'Y_TA',
  'LE_TAN',
  'THU_NGAN',
  'DUOC_SI',
  'NHAN_VIEN_KHO',
  'KY_THUAT_VIEN_XET_NGHIEM',
  'KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH'
];
const roleLabel = role => {
  const map = {
    QUAN_TRI_VIEN: 'Quản trị viên',
    BAC_SI_CHUYEN_KHOA: 'Bác sĩ chuyên khoa',
    BAC_SI: 'Bác sĩ',
    TRO_LY_BAC_SI_CHUYEN_KHOA: 'Trợ lý bác sĩ chuyên khoa',
    TRO_LY_BAC_SI_TONG_QUAT: 'Trợ lý bác sĩ tổng quát',
    Y_TA: 'Y tá',
    LE_TAN: 'Lễ tân',
    THU_NGAN: 'Thu ngân',
    DUOC_SI: 'Dược sĩ',
    NHAN_VIEN_KHO: 'Nhân viên kho',
    KY_THUAT_VIEN_XET_NGHIEM: 'Kỹ thuật viên xét nghiệm',
    KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH: 'Kỹ thuật viên chẩn đoán hình ảnh'
  };
  return map[role] || role;
};
const isPatientRole = role => {
  const normalized = String(role || '').trim().toLowerCase();
  return normalized === 'patient' || normalized === 'benh_nhan' || normalized === 'bệnh nhân';
};
const roleBadgeClass = role => {
  const map = {
    QUAN_TRI_VIEN: 'bg-purple-100 text-purple-700',
    BAC_SI_CHUYEN_KHOA: 'bg-blue-100 text-blue-700',
    BAC_SI: 'bg-blue-100 text-blue-700',
    TRO_LY_BAC_SI_CHUYEN_KHOA: 'bg-cyan-100 text-cyan-700',
    TRO_LY_BAC_SI_TONG_QUAT: 'bg-cyan-100 text-cyan-700',
    Y_TA: 'bg-green-100 text-green-700',
    LE_TAN: 'bg-orange-100 text-orange-700',
    THU_NGAN: 'bg-emerald-100 text-emerald-700',
    DUOC_SI: 'bg-teal-100 text-teal-700',
    NHAN_VIEN_KHO: 'bg-amber-100 text-amber-700',
    KY_THUAT_VIEN_XET_NGHIEM: 'bg-indigo-100 text-indigo-700',
    KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH: 'bg-violet-100 text-violet-700'
  };
  return map[role] || 'bg-gray-100 text-gray-600';
};
const QuanLyTaiKhoan = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVaiTro, setFilterVaiTro] = useState('');
  const [filterChuyenKhoa, setFilterChuyenKhoa] = useState('');
  const [employees, setEmployees] = useState([]);
  const [chuyenKhoaList, setChuyenKhoaList] = useState([]);
  const [vaiTroList, setVaiTroList] = useState([]);

  // Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // full account object
  const [formVaiTro, setFormVaiTro] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────
 const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      // 2. GỌI TRỰC TIẾP HÀM getAllApi()
      const data = await getAllApi(); 
      setAccounts(data || []); // Đảm bảo luôn là mảng để không lỗi .filter
    } catch (err) {
      console.error(err);
      alert("Không thể tải danh sách tài khoản: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchFilterData = async () => {
    try {
      const [employeeData, specialtyData, roleData] = await Promise.all([
        getAllNhanVienApi(),
        getAllChuyenKhoaApi(),
        getAllVaiTroApi()
      ]);
      setEmployees(employeeData || []);
      setChuyenKhoaList(specialtyData || []);
      const availableRoles = (roleData || VAI_TRO_OPTIONS.map(maVaiTro => ({ maVaiTro, tenBienThe: roleLabel(maVaiTro) })))
        .filter(role => !isPatientRole(role.maVaiTro) && !isPatientRole(role.tenBienThe));
      setVaiTroList(availableRoles);
    } catch (err) {
      console.error('Không thể tải danh mục bộ lọc tài khoản:', err);
      setVaiTroList(VAI_TRO_OPTIONS.map(maVaiTro => ({ maVaiTro, tenBienThe: roleLabel(maVaiTro) })));
    }
  };
  useEffect(() => {
    fetchAccounts();
    fetchFilterData();
  }, []);

  // ── Filter ────────────────────────────────────────────────────
  const filtered = accounts.filter(acc => {
    const employee = employees.find(emp => String(emp.maNhanVien) === String(acc.maNhanVien));
    if (filterVaiTro && acc.vaiTro !== filterVaiTro) return false;
    if (filterChuyenKhoa && String(employee?.chuyenKhoa ?? '') !== String(filterChuyenKhoa)) return false;
    if (!searchTerm) return true;
    const t = searchTerm.toLowerCase();
    return (acc.username || '').toLowerCase().includes(t) || (acc.email || '').toLowerCase().includes(t) || (acc.vaiTro || '').toLowerCase().includes(t);
  });

  const {
    paginatedData: pagedAccounts,
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

  // ── Open edit modal ───────────────────────────────────────────
  const openEdit = acc => {
    setEditTarget(acc);
    setFormVaiTro(acc.vaiTro || '');
    setFormPassword('');
    setFormError('');
    setShowModal(true);
  };

  // ── Save edit ─────────────────────────────────────────────────
    const handleSave = async e => {
    e.preventDefault();
    if (!formVaiTro) {
      setFormError('Vui lòng chọn vai trò!');
      return;
    }
    setIsSubmitting(true);
    setFormError('');
    try {
      const body = {
        username: editTarget.username,
        email: editTarget.email,
        vaiTro: formVaiTro,
        maNhanVien: editTarget.maNhanVien,
        lanDauDangNhap: editTarget.lanDauDangNhap
      };
      if (formPassword.trim()) body.matKhau = formPassword.trim();

      // 3. SỬ DỤNG HÀM updateApi
      await updateApi(editTarget.maTaiKhoan, body);
      
      alert('Cập nhật tài khoản thành công!');
      setShowModal(false);
      fetchAccounts();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────
  const handleDelete = async (id, username) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${username}" không?`)) return;
    try {
      // 4. SỬ DỤNG HÀM deleteApi
      await deleteApi(id);
      alert('Xóa tài khoản thành công!');
      fetchAccounts();
    } catch (err) {
      alert("Lỗi khi xóa: " + err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  }}>

      {/* Header Card */}
      <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)'
    }}>
        <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
          <div>
            <h2 style={{
            margin: 0,
            fontSize: '20px',
            fontWeight: 700,
            color: '#1f2937'
          }}>Quản Lý Tài Khoản</h2>
            <p style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: '#6b7280'
          }}>
              Tổng cộng: <strong style={{
              color: '#005bc0'
            }}>{accounts.length}</strong> tài khoản
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{
        marginTop: '16px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{
        position: 'relative',
        width: 'min(100%, 400px)'
      }}>
          <span className="material-symbols-outlined" style={{
          position: 'absolute',
          left: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#9ca3af',
          fontSize: '20px'
        }}>search</span>
          <input type="text" placeholder="Tìm theo username, email, vai trò..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{
          width: '100%',
          paddingLeft: '40px',
          paddingRight: searchTerm ? '36px' : '12px',
          paddingTop: '8px',
          paddingBottom: '8px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          outline: 'none',
          boxSizing: 'border-box'
        }} />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={{
          position: 'absolute',
          right: '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#9ca3af'
        }}>
              <span className="material-symbols-outlined" style={{
            fontSize: '18px'
          }}>close</span>
            </button>}
        </div>
        <select value={filterVaiTro} onChange={e => setFilterVaiTro(e.target.value)} style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          background: '#fff',
          minWidth: '190px'
        }}>
          <option value="">Tất cả vai trò</option>
          {vaiTroList.map(vaiTro => <option key={vaiTro.maVaiTro} value={vaiTro.maVaiTro}>
            {vaiTro.tenBienThe || roleLabel(vaiTro.maVaiTro)}
          </option>)}
        </select>
        <select value={filterChuyenKhoa} onChange={e => setFilterChuyenKhoa(e.target.value)} style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          fontSize: '14px',
          background: '#fff',
          minWidth: '210px'
        }}>
          <option value="">Tất cả chuyên khoa</option>
          {chuyenKhoaList.map(chuyenKhoa => <option key={chuyenKhoa.maChuyenKhoa} value={chuyenKhoa.maChuyenKhoa}>
            {chuyenKhoa.tenChuyenKhoa}
          </option>)}
        </select>
      </div>
      </div>

      {/* Table Card */}
      <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)'
    }}>
        <div style={{
        overflowX: 'auto'
      }}>
          <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
            <thead>
              <tr style={{
              background: '#f9fafb',
              borderBottom: '1px solid #e5e7eb'
            }}>
                {['Mã TK', 'Username', 'Email', 'Vai Trò', 'Trạng Thái MK', 'Thao Tác'].map(h => <th key={h} style={{
                padding: '12px 20px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 600,
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan="6" style={{
                padding: '48px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>Đang tải dữ liệu...</td></tr> : pagedAccounts.length === 0 ? <tr><td colSpan="6" style={{
                padding: '48px',
                textAlign: 'center',
                color: '#9ca3af'
              }}>
                  {searchTerm ? `Không tìm thấy tài khoản nào phù hợp với "${searchTerm}".` : 'Không có tài khoản nào.'}
                </td></tr> : pagedAccounts.map(acc => <tr key={acc.maTaiKhoan} style={{
              borderBottom: '1px solid #f3f4f6'
            }} onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{
                padding: '14px 20px',
                fontWeight: 600,
                color: '#374151'
              }}>
                    #{acc.maTaiKhoan?.toString().padStart(3, '0')}
                  </td>
                  <td style={{
                padding: '14px 20px'
              }}>
                    <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                      <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#eff6ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    fontWeight: 700,
                    fontSize: '14px',
                    flexShrink: 0
                  }}>
                        {(acc.username || '?')[0].toUpperCase()}
                      </div>
                      <span style={{
                    fontWeight: 500,
                    color: '#1f2937'
                  }}>{acc.username}</span>
                    </div>
                  </td>
                  <td style={{
                padding: '14px 20px',
                color: '#6b7280'
              }}>{acc.email || '—'}</td>
                  <td style={{
                padding: '14px 20px'
              }}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleBadgeClass(acc.vaiTro)}`}>
                      {roleLabel(acc.vaiTro)}
                    </span>
                  </td>
                  <td style={{
                padding: '14px 20px'
              }}>
                    {acc.lanDauDangNhap ? <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#fef9c3',
                  color: '#a16207'
                }}>Chưa đổi MK</span> : <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#dcfce7',
                  color: '#166534'
                }}>Đã đổi MK</span>}
                  </td>
                  <td style={{
                padding: '14px 20px',
                textAlign: 'right'
              }}>
                    <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end'
                }}>
                      <button onClick={() => openEdit(acc)} style={{
                    padding: '6px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#3b82f6',
                    borderRadius: '6px'
                  }} title="Sửa vai trò / mật khẩu">
                        <span className="material-symbols-outlined" style={{
                      fontSize: '20px'
                    }}>edit</span>
                      </button>
                      <button onClick={() => handleDelete(acc.maTaiKhoan, acc.username)} style={{
                    padding: '6px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#ef4444',
                    borderRadius: '6px'
                  }} title="Xóa tài khoản">
                        <span className="material-symbols-outlined" style={{
                      fontSize: '20px'
                    }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {!isLoading && pagedTotalItems > 0 && (
          <Pagination
            mode="inline"
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={pagedTotalItems}
            label="tài khoản"
            visiblePages={visiblePages}
            onPageChange={setCurrentPage}
            jumpPage={jumpPage}
            onJumpPage={handleJumpPage}
            onJumpBlur={handleJumpPageBlur}
          />
        )}
      </div>

      {/* ── Edit Modal ── */}
      {showModal && editTarget && <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
          <div style={{
        background: '#fff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)'
      }}>

            {/* Modal Header */}
            <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #f3f4f6'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
                <div style={{
              width: '40px',
              height: '40px',
              background: '#eff6ff',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
                  <span className="material-symbols-outlined" style={{
                color: '#2563eb'
              }}>manage_accounts</span>
                </div>
                <div>
                  <h3 style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: '#1f2937'
              }}>Chỉnh Sửa Tài Khoản</h3>
                  <p style={{
                margin: 0,
                fontSize: '13px',
                color: '#6b7280'
              }}>{editTarget.username}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            padding: '4px'
          }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} style={{
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
              {formError && <div style={{
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
                  <span className="material-symbols-outlined" style={{
              fontSize: '18px'
            }}>error</span>
                  {formError}
                </div>}

              {/* Thông tin chỉ đọc */}
              <div style={{
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '14px',
            color: '#6b7280'
          }}>
                <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px'
            }}>
                  <span>Email:</span><span style={{
                color: '#374151',
                fontWeight: 500
              }}>{editTarget.email}</span>
                  <span>Nhân viên:</span><span style={{
                color: '#374151',
                fontWeight: 500
              }}>NV{editTarget.maNhanVien?.toString().padStart(3, '0')}</span>
                </div>
              </div>

              {/* Vai Trò */}
              <div>
                <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
                  Vai Trò <span style={{
                color: '#ef4444'
              }}>*</span>
                </label>
                <select value={formVaiTro} onChange={e => setFormVaiTro(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              background: '#fff',
              outline: 'none',
              boxSizing: 'border-box'
            }}>
                  <option value="">-- Chọn vai trò --</option>
                  {VAI_TRO_OPTIONS.map(v => <option key={v} value={v}>{roleLabel(v)}</option>)}
                </select>
              </div>

              {/* Mật khẩu mới (tùy chọn) */}
              <div>
                <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '6px'
            }}>
                  Đặt lại Mật Khẩu <span style={{
                color: '#9ca3af',
                fontWeight: 400
              }}>(để trống nếu không đổi)</span>
                </label>
                <input type="password" placeholder="Nhập mật khẩu mới..." value={formPassword} onChange={e => setFormPassword(e.target.value)} style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }} />
              </div>

              {/* Buttons */}
              <div style={{
            display: 'flex',
            gap: '12px',
            paddingTop: '4px'
          }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: '#fff',
              color: '#374151',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              background: '#005bc0',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}>
                  {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>}
    </div>;
};
export default QuanLyTaiKhoan;
