import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/ket-qua-cdha`;

/**
 * Lấy danh sách kết quả CĐHA trong ngày (tất cả bác sĩ)
 * GET /api/ket-qua-cdha/today
 */
export const getTodayResultsApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/today`, {
      skipLoading: true
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getTodayResultsApi:", error);
    return [];
  }
};

/**
 * Lấy danh sách kết quả CĐHA trong ngày của bác sĩ chẩn đoán hình ảnh
 * GET /api/ket-qua-cdha/today/doctor/{doctorId}
 */
export const getTodayCdhaResultsByDoctorApi = async (doctorId) => {
  try {
    const response = await fetchClient(`${API_URL}/today/doctor/${doctorId}`, {
      skipLoading: true
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error in getTodayCdhaResultsByDoctorApi:", error);
    return [];
  }
};
