/**
 * tokenStore.js
 * Lưu Access Token TRONG MEMORY (JavaScript module singleton).
 * KHÔNG lưu vào localStorage/sessionStorage để tránh bị đánh cắp qua XSS.
 *
 * Refresh Token (web) nằm trong HttpOnly cookie do backend quản lý.
 */
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

export const decodeTokenPayload = (token) => {
  if (!token) return null;
  try {
    const b = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(window.atob(b)));
    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const getRoleFromAccessToken = () => decodeTokenPayload(getAccessToken())?.role || null;
export const getHoTenFromAccessToken = () => decodeTokenPayload(getAccessToken())?.hoTen || null;
export const getLanDauDangNhapFromAccessToken = () => decodeTokenPayload(getAccessToken())?.lanDauDangNhap ?? false;
export const getMaNhanVienFromAccessToken = () => {
  const v = decodeTokenPayload(getAccessToken())?.maNhanVien;
  return (typeof v === 'number' ? v : Number(v)) || null;
};