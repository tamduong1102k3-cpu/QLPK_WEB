import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
import { throwApiError } from './apiError';
const API_URL = `${API_BASE_URL}/danhmuc`;

/**
 * GET /chuc-vu
 */
export const getAllChucVuApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/chuc-vu`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllChucVuApi:", error);
    throw error;
  }
};

/**
 * GET /chuyen-khoa
 */
export const getAllChuyenKhoaApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/chuyen-khoa`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllChuyenKhoaApi:", error);
    throw error;
  }
};

/**
 * GET /vai-tro
 */
export const getAllVaiTroApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/vai-tro`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllVaiTroApi:", error);
    throw error;
  }
};

/**
 * GET /phong
 */
export const getAllPhongApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/phong`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllPhongApi:", error);
    throw error;
  }
};

/**
 * GET /phong/ten-phong
 */
export const getDistinctTenPhongApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/phong/ten-phong`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const names = await response.json();
    if (!Array.isArray(names) || names.some(name => typeof name !== 'string')) {
      throw new Error('Dữ liệu tên phòng từ máy chủ không hợp lệ.');
    }
    return names;
  } catch (error) {
    console.error("Error in getDistinctTenPhongApi:", error);
    throw error;
  }
};

/**
 * GET /phong/by-chuc-vu/{maChucVu}
 */
export const getPhongByChucVuApi = async maChucVu => {
  try {
    const response = await fetchClient(`${API_URL}/phong/by-chuc-vu/${maChucVu}`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getPhongByChucVuApi:", error);
    throw error;
  }
};

/**
 * GET /phong/by-chuyen-khoa/{maChuyenKhoa}
 */
export const getPhongByChuyenKhoaApi = async (maChuyenKhoa) => {
  try {
    const response = await fetchClient(`${API_URL}/phong/by-chuyen-khoa/${maChuyenKhoa}`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getPhongByChuyenKhoaApi:", error);
    throw error;
  }
};

/**
 * POST /phong
 */
export const createPhongApi = async data => {
  try {
    const response = await fetchClient(`${API_URL}/phong`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in createPhongApi:", error);
    throw error;
  }
};

/**
 * PUT /phong/{id}
 */
export const updatePhongApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/phong/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in updatePhongApi:", error);
    throw error;
  }
};

/**
 * PUT /phong/{id}
 */
export const deletePhongApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/phong/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in deletePhongApi:", error);
    throw error;
  }
};

/**
 * GET /nhom-dich-vu
 * Lấy danh sách nhóm dịch vụ.
 */
export const getAllNhomDichVuApi = async maChuyenKhoa => {
  try {
    const query = maChuyenKhoa == null || maChuyenKhoa === ''
      ? ''
      : `?maChuyenKhoa=${encodeURIComponent(maChuyenKhoa)}`;
    const response = await fetchClient(`${API_BASE_URL}/nhom-dich-vu${query}`, {
      method: 'GET'
    });
    if (!response.ok) await throwApiError(response);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllNhomDichVuApi:", error);
    throw error;
  }
};
