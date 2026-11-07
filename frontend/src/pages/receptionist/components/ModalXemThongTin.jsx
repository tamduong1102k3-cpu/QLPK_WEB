import React, { useState, useEffect } from 'react';
import { getAllNhanVienApi } from '../../../api/employeeApi';
import ModalDoiMatKhau from './ModalDoiMatKhau';
import formatGender from '../../../utils/formatGender';

const ModalXemThongTin = ({ user, onClose }) => {
  const [employeeInfo, setEmployeeInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const employees = await getAllNhanVienApi();
        if (employees && user?.maNhanVien) {
          const emp = employees.find(e => e.maNhanVien === user.maNhanVien);
          setEmployeeInfo(emp);
        }
      } catch (err) {
        console.error('Error fetching employee info:', err);
        setFetchError('Không thể tải thông tin nhân viên.');
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [user]);

  const formatDate = (date) => {
    if (!date) return '---';
    try {
      return new Date(date).toLocaleDateString('vi-VN');
    } catch {
      return '---';
    }
  };

  const roleLabel = {
    LE_TAN: 'Lễ tân',
    BAC_SI: 'Bác sĩ',
    BAC_SI_CHUYEN_KHOA: 'Bác sĩ chuyên khoa',
    TRO_LY_BAC_SI_CHUYEN_KHOA: 'Trợ lý bác sĩ chuyên khoa',
    TRO_LY_BAC_SI_TONG_QUAT: 'Trợ lý bác sĩ tổng quát',
    Y_TA: 'Y tá',
    KY_THUAT_VIEN: 'Kỹ thuật viên',
    KY_THUAT_VIEN_XET_NGHIEM: 'Kỹ thuật viên xét nghiệm',
    KY_THUAT_VIEN_CHAN_DOAN_HINH_ANH: 'Kỹ thuật viên chẩn đoán hình ảnh',
    THU_NGAN: 'Thu ngân',
    DUOC_SI: 'Dược sĩ',
    NHAN_VIEN_KHO: 'Nhân viên kho',
    QUAN_TRI: 'Quản trị viên',
    QUAN_TRI_VIEN: 'Quản trị viên',
    TRO_LY: 'Trợ lý'
  };

  return (
    <>
      {showChangePassword ? (
        <ModalDoiMatKhau 
          user={user} 
          onClose={() => setShowChangePassword(false)} 
        />
      ) : (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
          onClick={onClose}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: 560,
              backgroundColor: 'white',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              background: 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40,
                  background: '#eef2ff',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: 24, color: '#4f46e5' }}>👤</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Thông tin nhân viên</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Chi tiết thông tin cá nhân</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{
                  width: 32, height: 32,
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: '#9ca3af'
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{
              overflowY: 'auto',
              flex: 1,
              padding: 24
            }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{
                    width: 40, height: 40,
                    border: '3px solid #e5e7eb',
                    borderTopColor: '#4f46e5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 16px'
                  }} />
                  <p style={{ fontSize: 14, color: '#6b7280' }}>Đang tải thông tin...</p>
                </div>
              ) : fetchError ? (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <p style={{ color: '#ef4444', fontSize: 14 }}>{fetchError}</p>
                  <button
                    onClick={onClose}
                    style={{
                      marginTop: 16,
                      padding: '8px 32px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: 14
                    }}
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <>
                  {/* Avatar & Name */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 24,
                    paddingBottom: 24,
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      width: 64, height: 64,
                      background: '#eef2ff',
                      borderRadius: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#4f46e5',
                      border: '2px solid #c7d2fe',
                      flexShrink: 0
                    }}>
                      {(employeeInfo?.hoTen || user?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#1f2937',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {employeeInfo?.hoTen || 'Chưa cập nhật'}
                      </h4>
                      <p style={{ margin: 0, fontSize: 14, color: '#6b7280', marginTop: 2 }}>
                        {roleLabel[user?.vaiTro] || user?.vaiTro || 'Nhân viên'}
                      </p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12
                  }}>
                    <InfoItem label="Email" value={employeeInfo?.email || user?.email} />
                    <InfoItem label="Tên đăng nhập" value={user?.username} />
                    <InfoItem label="Số điện thoại" value={employeeInfo?.soDienThoai} />
                    <InfoItem label="Giới tính" value={formatGender(employeeInfo?.gioiTinh)} />
                    <InfoItem label="Ngày sinh" value={formatDate(employeeInfo?.ngaySinh)} />
                    <InfoItem label="CCCD" value={employeeInfo?.cccd} />
                    <InfoItem label="Chức vụ" value={employeeInfo?.chucVu} />
                    <InfoItem label="Ngày vào làm" value={formatDate(employeeInfo?.ngayVaoLam)} />
                  </div>

                  {employeeInfo?.diaChi && (
                    <div style={{
                      marginTop: 12,
                      background: '#f9fafb',
                      borderRadius: 12,
                      padding: 16
                    }}>
                      <p style={{ margin: 0, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Địa chỉ</p>
                      <p style={{ margin: 0, fontSize: 14, color: '#1f2937', fontWeight: 500 }}>{employeeInfo.diaChi}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button
                      onClick={() => setShowChangePassword(true)}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500
                      }}
                    >
                      🔒 Đổi mật khẩu
                    </button>
                    <button
                      onClick={onClose}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: 'white',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: 12,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 500
                      }}
                    >
                      Đóng
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper component
const InfoItem = ({ label, value }) => (
  <div style={{
    background: '#f9fafb',
    borderRadius: 12,
    padding: 16
  }}>
    <p style={{
      margin: 0,
      fontSize: 11,
      color: '#6b7280',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: 4
    }}>
      {label}
    </p>
    <p style={{
      margin: 0,
      fontSize: 14,
      color: '#1f2937',
      fontWeight: 500,
      overflowWrap: 'break-word'
    }}>
      {value || '---'}
    </p>
  </div>
);

export default ModalXemThongTin;