import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/ket-qua-cls`;

/**
 * GET /api/ket-qua-cls/{chiDinhId}
 */
export const getDetailClsResultApi = async chiDinhId => {
  try {
    const response = await fetchClient(`${API_URL}/${chiDinhId}`, {
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
    console.error("Error in getDetailClsResultApi:", error);
    throw error;
  }
};
