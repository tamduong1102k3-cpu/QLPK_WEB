import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/chi-tiet-xet-nghiem`;

/**
 * Lấy tất cả chỉ số xét nghiệm
 * GET /
 */
export const getAllApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}`, { method: 'GET' });
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getAllApi:", error);
    throw error;
  }
};

/**
 * Lấy danh sách chỉ số xét nghiệm theo dịch vụ
 * GET /dich-vu/{maDichVu}
 */
export const getByMaDichVuApi = async (maDichVu) => {
  try {
    const response = await fetchClient(`${API_URL}/dich-vu/${maDichVu}`, { method: 'GET' });
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getByMaDichVuApi:", error);
    throw error;
  }
};

/**
 * Lấy một chỉ số xét nghiệm theo mã
 * GET /{id}
 */
export const getByIdApi = async (id) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, { method: 'GET' });
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getByIdApi:", error);
    throw error;
  }
};

/**
 * Tạo mới chỉ số xét nghiệm
 * POST /
 */
export const createApi = async (data) => {
  try {
    const response = await fetchClient(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in createApi:", error);
    throw error;
  }
};

/**
 * Cập nhật chỉ số xét nghiệm
 * PUT /{id}
 */
export const updateApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in updateApi:", error);
    throw error;
  }
};

/**
 * Xóa chỉ số xét nghiệm
 * DELETE /{id}
 */
export const deleteApi = async (id) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Error in deleteApi:", error);
    throw error;
  }
};