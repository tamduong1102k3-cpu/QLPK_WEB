import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/duoc-si`;

/**
 * GET /phieu-kham/{maPhieuKham}/toa-thuoc
 * Lấy danh sách toa thuốc + chi tiết thuốc (kèm thông tin thuốc) cho một phiếu khám
 * Dùng cho dược sĩ xem thuốc cần cấp
 */
export const getToaThuocByPhieuKhamApi = async (maPhieuKham) => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}/toa-thuoc`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {}
      const error = new Error(errorMsg);
      error.data = errorData;
      error.status = response.status;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getToaThuocByPhieuKhamApi:", error);
    throw error;
  }
};

/**
 * POST /toa-thuoc/{maToaThuoc}/xac-nhan-cap-thuoc
 * Xác nhận dược sĩ đã cấp thuốc -> cập nhật trạng thái toa thuốc thành DA_CAP_THUOC
 */
export const xacNhanCapThuocApi = async (maToaThuoc) => {
  try {
    const response = await fetchClient(`${API_URL}/toa-thuoc/${maToaThuoc}/xac-nhan-cap-thuoc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorData = null;
      try {
        errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {}
      const error = new Error(errorMsg);
      error.data = errorData;
      error.status = response.status;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in xacNhanCapThuocApi:", error);
    throw error;
  }
};