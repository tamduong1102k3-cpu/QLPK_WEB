import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/danhmuc`;

/**
 * GET /chuc-vu
 */
export const getAllChucVuApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/chuc-vu`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllPhongApi:", error);
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getPhongByChucVuApi:", error);
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
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
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch { /* ignore parse error */ }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in deletePhongApi:", error);
    throw error;
  }
};
