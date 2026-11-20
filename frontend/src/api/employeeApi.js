import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
import { throwApiError } from './apiError';

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
const handleError = response => throwApiError(response);

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

export const getBacSiByChuyenKhoaApi = async (chuyenKhoa) => {
  try {
    const params = new URLSearchParams({ chuyenKhoa: String(chuyenKhoa) });
    const response = await fetchClient(`${API_URL}/bac-si-by-chuyen-khoa?${params}`, {
      method: 'GET'
    });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in getBacSiByChuyenKhoaApi:", error);
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

export const checkDeleteNhanVienApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/delete-check`, { method: 'GET' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in checkDeleteNhanVienApi:", error);
    throw error;
  }
};

export const permanentlyDeleteNhanVienApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/permanent`, { method: 'DELETE' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in permanentlyDeleteNhanVienApi:", error);
    throw error;
  }
};

/**
 * PUT /{id}/activate
 */
export const activateNhanVienAccountApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/activate`, { method: 'PUT' });
    if (!response.ok) await handleError(response);
    return await handleResponse(response);
  } catch (error) {
    console.error("Error in activateNhanVienAccountApi:", error);
    throw error;
  }
};