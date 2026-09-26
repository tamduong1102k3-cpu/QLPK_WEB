import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/toa-thuoc`;

/**
 * POST /
 */
export const createApi = async data => {
  try {
    const response = await fetchClient(`${API_URL}`, {
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
      } catch (e) { }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in createApi:", error);
    throw error;
  }
};

/**
 * GET /phieu-kham/{maPhieuKham}
 */
export const getByPhieuKhamApi = async maPhieuKham => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) { }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getByPhieuKhamApi:", error);
    throw error;
  }
};

/**
 * GET /benh-nhan/{maBenhNhan}
 */
export const getByBenhNhanApi = async maBenhNhan => {
  try {
    const response = await fetchClient(`${API_URL}/benh-nhan/${maBenhNhan}`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) { }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getByBenhNhanApi:", error);
    throw error;
  }
};

/**
 * GET /{id}/details
 */
export const getDetailsApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/details`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) { }
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getDetailsApi:", error);
    throw error;
  }
};

/**
 * DELETE /phieu-kham/{maPhieuKham} - Xóa toa đang chờ thanh toán và hoàn lại số lượng thuốc đã giữ
 */
export const deleteToaByPhieuKhamApi = async maPhieuKham => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in deleteToaByPhieuKhamApi:", error);
    throw error;
  }
};
