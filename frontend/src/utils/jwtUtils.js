import { jwtDecode } from 'jwt-decode';

/**
 * Decode JWT token from localStorage and return user info
 * All user info (maNhanVien, username, email, role, maTaiKhoan) 
 * is stored inside the JWT - no separate 'user' localStorage needed
 */
export const getUserFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const decoded = jwtDecode(token);
    return {
      username: decoded.sub,
      role: decoded.role,
      vaiTro: decoded.role,
      maNhanVien: decoded.maNhanVien || null,
      email: decoded.email || null,
      maTaiKhoan: decoded.maTaiKhoan || null
    };
  } catch (e) {
    return null;
  }
};

export const getMaNhanVienFromToken = () => {
  const user = getUserFromToken();
  return user?.maNhanVien || null;
};