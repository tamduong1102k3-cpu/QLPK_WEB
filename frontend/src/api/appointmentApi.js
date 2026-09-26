import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/appointments`;

/**
 * GET /doctor
 * Lấy tất cả lịch hẹn thuộc chuyên khoa của bác sĩ đang đăng nhập.
 * maChuyenKhoa được backend lấy từ JWT token (không lọc theo nguonTao).
 */
export const getByDoctorApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/doctor`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch { /* ignore parse error */ }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getByDoctorApi:", error);
    throw error;
  }
};

/**
 * GET /
 */
export const getAllApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}`, {
      method: 'GET'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch { /* ignore parse error */ }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getAllApi:", error);
    throw error;
  }
};

/**
 * POST /
 */
export const createApi = async (data) => {
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
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch { /* ignore parse error */ }
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
 */
export const updateApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
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
      } catch { /* ignore parse error */ }
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
 * GET /search?trangThai=&nguonTao=&keyword=
 * Tìm kiếm & filter lịch khám
 */
export const searchApi = async (params = {}) => {
  try {
    const query = new URLSearchParams();
    if (params.trangThai && params.trangThai !== 'ALL') query.append('trangThai', params.trangThai);
    if (params.nguonTao && params.nguonTao !== 'ALL') query.append('nguonTao', params.nguonTao);
    if (params.keyword) query.append('keyword', params.keyword);
    const url = query.toString() ? `${API_URL}/search?${query.toString()}` : `${API_URL}/search`;
    const response = await fetchClient(url, { method: 'GET' });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch { /* ignore parse error */ }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in searchApi:", error);
    throw error;
  }
};

/**
 * PUT /{id}/hoan-lich
 * Hoãn lịch hẹn (bác sĩ hoãn lịch khám) — đổi ngày khám + lý do hoãn.
 * Backend tự đảm bảo: chỉ hoãn khi CHUA_DEN, giữ slot mới/giải phóng slot cũ,
 * chặn ngày bác sĩ nghỉ, gửi thông báo cho bệnh nhân.
 * @param {number|string} id - Mã lịch khám
 * @param {Object} data - { ngayTaiKham: "YYYY-MM-DD", lyDo: "..." }
 */
export const hoanLichApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/hoan-lich`, {
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
      } catch { /* ignore parse error */ }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in hoanLichApi:", error);
    throw error;
  }
};

/**
 * DELETE /{id}
 */
export const deleteApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
        errorCode = errorData.errorCode || null;
      } catch { /* ignore parse error */ }
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in deleteApi:", error);
    throw error;
  }
};