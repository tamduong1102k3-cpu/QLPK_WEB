import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/nhan_vien`;

/**
 * Helper: parse response text hoặc JSON
 */
const handleResponse = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

/**
 * Helper: xử lý lỗi response
 */
const handleError = async (response) => {
  let errorMsg = `Lỗi: ${response.status}`;
  try {
    const errorData = await response.json();
    errorMsg = errorData.message || errorMsg;
  } catch (e) {}
  throw new Error(errorMsg);
};

/**
 * GET /
 */
export const getAllNhanVienApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}`, { method: 'GET' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in getAllNhanVienApi:", error);
    throw error;
  }
};

/**
 * GET /search - tìm kiếm bằng LIKE và lọc theo chuyên khoa/vai trò
 */
export const searchNhanVienApi = async ({ keyword = '', chuyenKhoa = '', vaiTro = '' } = {}) => {
  const params = new URLSearchParams();
  if (keyword.trim()) params.set('keyword', keyword.trim());
  if (chuyenKhoa) params.set('chuyenKhoa', chuyenKhoa);
  if (vaiTro) params.set('vaiTro', vaiTro);

  try {
    const response = await fetchClient(`${API_URL}/search?${params.toString()}`, { method: 'GET' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in searchNhanVienApi:", error);
    throw error;
  }
};

/**
 * POST /
 */
export const addNhanVienApi = async data => {
  try {
    const response = await fetchClient(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in addNhanVienApi:", error);
    throw error;
  }
};

/**
 * GET /{id}
 */
export const getNhanVienByIdApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, { method: 'GET' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in getNhanVienByIdApi:", error);
    throw error;
  }
};

/**
 * PUT /{id}
 */
export const updateNhanVienApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in updateNhanVienApi:", error);
    throw error;
  }
};

/**
 * DELETE /{id}
 */
export const deleteNhanVienApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in deleteNhanVienApi:", error);
    throw error;
  }
};