import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/thong-ke`;

/**
 * GET /theo-nam
 */
export const namCoDuLieuApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/theo-nam`, {
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
    console.error("Error in namCoDuLieuApi:", error);
    throw error;
  }
};

/**
 * GET /dashboard-summary
 */
export const getDashboardSummaryApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/dashboard-summary`, {
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
    console.error("Error in getDashboardSummaryApi:", error);
    throw error;
  }
};
