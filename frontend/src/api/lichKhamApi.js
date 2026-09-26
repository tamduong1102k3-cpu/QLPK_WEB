import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/lich-kham`;

export const getAllApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}`, { method: 'GET' });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Error in lichKhamApi.getAllApi:', error);
    throw error;
  }
};

export const updateTrangThaiApi = async (id, trangThai) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/trang-thai`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trangThai })
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('Error in lichKhamApi.updateTrangThaiApi:', error);
    throw error;
  }
};

/**
 * Lấy lịch khám của một bác sĩ theo ngày.
 * GET /api/lich-kham/bac-si/{maBacSi}/ngay?ngayKham=YYYY-MM-DD
 * Trả: List<LichKham> — caller đếm số lịch có trangThai === "CHUA_DEN".
 */
export const getAppointmentsByDoctorAndDateApi = async (maBacSi, ngayKham) => {
  try {
    const response = await fetchClient(
      `${API_URL}/bac-si/${maBacSi}/ngay?ngayKham=${ngayKham}`,
      { method: 'GET' }
    );
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error('Error in lichKhamApi.getAppointmentsByDoctorAndDateApi:', error);
    throw error;
  }
};
