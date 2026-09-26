import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const CA_LAM_DANH_MUC_URL = `${API_BASE_URL}/ca-lam-danh-muc`;

/**
 * Lấy danh sách ca làm việc
 */
export const getAllCaLamDanhMucApi = async () => {
  try {
    const response = await fetchClient(`${CA_LAM_DANH_MUC_URL}`, {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error(`Lỗi: ${response.status} - Không thể tải danh mục ca`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllCaLamDanhMucApi:", error);
    throw error;
  }
};

/**
 * Tạo mới một ca làm việc
 */
export const createCaLamDanhMucApi = async (data) => {
  try {
    const response = await fetchClient(`${CA_LAM_DANH_MUC_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể tạo ca làm việc");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in createCaLamDanhMucApi:", error);
    throw error;
  }
};

/**
 * Cập nhật ca làm việc theo ID
 */
export const updateCaLamDanhMucApi = async (id, data) => {
  try {
    const response = await fetchClient(`${CA_LAM_DANH_MUC_URL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Không thể cập nhật ca làm việc");
    }
    return await response.json();
  } catch (error) {
    console.error("Error in updateCaLamDanhMucApi:", error);
    throw error;
  }
};

/**
 * Xóa ca làm việc theo ID
 */
export const deleteCaLamDanhMucApi = async (id) => {
  try {
    const response = await fetchClient(`${CA_LAM_DANH_MUC_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Lỗi: ${response.status} - Không thể xóa ca làm việc`);
    }
    return true;
  } catch (error) {
    console.error("Error in deleteCaLamDanhMucApi:", error);
    throw error;
  }
};