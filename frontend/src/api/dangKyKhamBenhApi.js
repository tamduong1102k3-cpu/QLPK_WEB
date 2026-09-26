import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/dang-ky`;

/**
 * GET /today?keyword=xxx
 */
export const getTodayApi = async (keyword = '') => {
  try {
    const url = keyword
      ? `${API_URL}/today?keyword=${encodeURIComponent(keyword)}`
      : `${API_URL}/today`;
    const response = await fetchClient(url, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getTodayApi:", error);
    throw error;
  }
};

/**
 * GET /
 * Lấy tất cả đăng ký khám bệnh
 */
export const getAllApi = async () => {
  try {
    const response = await fetchClient(API_URL, { method: 'GET' });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; errorCode = errorData.errorCode || null; } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getAllApi:", error);
    throw error;
  }
};

/**
 * GET /{id}
 * Lấy đăng ký khám bệnh theo ID
 */
export const getByIdApi = async (id) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, { method: 'GET' });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; errorCode = errorData.errorCode || null; } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getByIdApi:", error);
    throw error;
  }
};

/**
 * POST /
 * Tạo mới đăng ký khám bệnh
 */
export const createApi = async (data) => {
  try {
    const response = await fetchClient(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      // Đọc full response body để debug
      let responseBody = null;
      try {
        const clonedResponse = response.clone();
        const textBody = await clonedResponse.text();
        responseBody = textBody;
        try {
          const errorData = JSON.parse(textBody);
          responseBody = errorData;
          errorMsg = errorData.message || errorMsg;
          errorCode = errorData.errorCode || null;
        } catch (jsonParseError) {}
      } catch (readError) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in createApi:", error);
    throw error;
  }
};

/**
 * PUT /{id}
 * Cập nhật đăng ký khám bệnh
 */
export const updateApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; errorCode = errorData.errorCode || null; } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in updateApi:", error);
    throw error;
  }
};

/**
 * DELETE /{id}
 * Xóa đăng ký khám bệnh
 */
export const deleteApi = async (id) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; errorCode = errorData.errorCode || null; } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    return true;
  } catch (error) {
    console.error("Error in deleteApi:", error);
    throw error;
  }
};

/**
 * PUT /{id}/status
 */
export const updateStatusApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in updateStatusApi:", error);
    throw error;
  }
};

