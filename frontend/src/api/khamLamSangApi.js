import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/kham-lam-sang`;

/**
 * POST /
 */
export const saveApi = async data => {
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
      } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in saveApi:", error);
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
      } catch (e) {}
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
      } catch (e) {}
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
 * POST /with-vitals
 */
export const saveWithVitalsApi = async payload => {
  try {
    const response = await fetchClient(`${API_URL}/with-vitals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
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
    console.error("Error in saveWithVitalsApi:", error);
    throw error;
  }
};
