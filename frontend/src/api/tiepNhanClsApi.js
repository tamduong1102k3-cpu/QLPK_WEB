import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/tiep-nhan-cls`;

/**
 * POST /
 * Tạo mới tiếp nhận cận lâm sàng
 */
export const createTiepNhanClsApi = async data => {
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
    console.error("Error in createTiepNhanClsApi:", error);
    throw error;
  }
};

/**
 * GET /phieu-kham/{maPhieuKham}
 * Lấy tiếp nhận cận lâm sàng theo mã phiếu khám (trả về list)
 */
export const getTiepNhanClsByPhieuKhamApi = async maPhieuKham => {
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
    console.error("Error in getTiepNhanClsByPhieuKhamApi:", error);
    throw error;
  }
};
