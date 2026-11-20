import React, { useState } from 'react';
import { changePasswordApi } from '../../../api/accountApi';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16
  },
  modal: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: 'white',
    borderRadius: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '90vh'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    background: 'white'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  iconBox: {
    width: 40, height: 40,
    background: '#eef2ff',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  body: {
    overflowY: 'auto',
    padding: 24
  },
  errorBox: {
    padding: '10px 14px',
    background: '#fef2f2',
    color: '#dc2626',
    borderRadius: 10,
    fontSize: 14,
    border: '1px solid #fecaca',
    marginBottom: 16
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 4
  },
  input: {
    width: '100%',
    padding: '10px 40px 10px 36px',
    borderRadius: 10,
    border: '1px solid #d1d5db',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: 'white'
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#9ca3af',
    fontSize: 16
  },
  toggleBtn: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: 'translateY(-50%)',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 4,
    color: '#9ca3af',
    fontSize: 16
  },
  strengthBar: {
    height: 6,
    width: '100%',
    background: '#e5e7eb',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 8
  },
  strengthFill: {
    height: '100%',
    borderRadius: 99,
    transition: 'all 0.3s'
  },
  btnRow: {
    display: 'flex',
    gap: 12,
    marginTop: 16
  },
  btnCancel: {
    flex: 1,
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: 10,
    background: 'white',
    color: '#374151',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer'
  },
  btnSubmit: {
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderRadius: 10,
    background: '#4f46e5',
    color: 'white',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  btnSubmitDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  spinner: {
    width: 16, height: 16,
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  fieldGap: {
    marginBottom: 16
  }
};

const ModalDoiMatKhau = ({ user, onClose }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    if (score <= 1) return { label: 'Yếu', color: '#ef4444', width: '20%' };
    if (score <= 2) return { label: 'Trung bình', color: '#f59e0b', width: '40%' };
    if (score <= 3) return { label: 'Khá', color: '#3b82f6', width: '60%' };
    if (score <= 4) return { label: 'Mạnh', color: '#10b981', width: '80%' };
    return { label: 'Rất mạnh', color: '#059669', width: '100%' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!oldPassword.trim()) {
      setError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }
    if (newPassword.length < 5) {
      setError('Mật khẩu mới phải có ít nhất 5 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    if (oldPassword === newPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    setIsLoading(true);
    try {
      await changePasswordApi(user.maTaiKhoan, {
        oldPassword: oldPassword,
        newPassword: newPassword
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePassword = (field) => {
    if (field === 'old') setShowOld(!showOld);
    else if (field === 'new') setShowNew(!showNew);
    else setShowConfirm(!showConfirm);
  };

  if (success) {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{
              width: 64, height: 64,
              background: '#d1fae5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 32
            }}>
              ✅
            </div>
            <h3 style={{ margin: 0, color: '#059669', fontSize: 18, fontWeight: 700 }}>Đổi mật khẩu thành công!</h3>
            <p style={{ marginTop: 8, color: '#6b7280', fontSize: 14 }}>Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconBox}>
              <span style={{ fontSize: 24, color: '#4f46e5' }}>🔐</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1f2937' }}>Đổi mật khẩu</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Cập nhật mật khẩu đăng nhập</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.toggleBtn}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={styles.errorBox}>
                ⚠️ {error}
              </div>
            )}

            {/* Current password */}
            <div style={styles.fieldGap}>
              <label style={styles.label}>Mật khẩu hiện tại</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  type={showOld ? 'text' : 'password'}
                  required
                  style={styles.input}
                  placeholder="Nhập mật khẩu hiện tại"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <button type="button" onClick={() => togglePassword('old')} style={styles.toggleBtn}>
                  {showOld ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* New password */}
            <div style={styles.fieldGap}>
              <label style={styles.label}>Mật khẩu mới</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔓</span>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => togglePassword('new')} style={styles.toggleBtn}>
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
              {newPassword && (
                <div>
                  <div style={styles.strengthBar}>
                    <div style={{ ...styles.strengthFill, width: strength.width, backgroundColor: strength.color }} />
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: strength.color }}>
                    Độ mạnh: {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div style={styles.fieldGap}>
              <label style={styles.label}>Nhập lại mật khẩu</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔐</span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  style={styles.input}
                  placeholder="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button type="button" onClick={() => togglePassword('confirm')} style={styles.toggleBtn}>
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>
                  ⚠️ Mật khẩu không khớp
                </p>
              )}
            </div>

            <div style={styles.btnRow}>
              <button type="button" onClick={onClose} style={styles.btnCancel}>
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={isLoading}
                style={{ ...styles.btnSubmit, ...(isLoading ? styles.btnSubmitDisabled : {}) }}
              >
                {isLoading ? (
                  <>
                    <span style={styles.spinner}></span>
                    Đang xử lý...
                  </>
                ) : 'Lưu mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalDoiMatKhau;