import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/ket-qua-xet-nghiem`;

/**
 * GET /today
 */
export const getTodayResultsApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/today`, {
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
    console.error("Error in getTodayResultsApi:", error);
    throw error;
  }
};

/**
 * PUT /{id}/approve
 */
export const approveResultApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/approve`, {
      method: 'PUT'
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
    console.error("Error in approveResultApi:", error);
    throw error;
  }
};
