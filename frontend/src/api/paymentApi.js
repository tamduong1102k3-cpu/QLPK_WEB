import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';

const API_URL = `${API_BASE_URL}/payment`;

/**
 * POST /vnpay/create/{maHoaDon}
 * Backend trả: { url: "https://sandbox.vnpayment.vn/..." }
 *              400: { error: "..." }
 */
export const createVnpayUrlApi = async (maHoaDon) => {
  try {
    const response = await fetchClient(`${API_URL}/vnpay/create/${maHoaDon}`, {
      method: 'POST'
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      let errorCode = null;
      try {
        const errorData = await response.json();
        // ⚠️ PaymentController trả {error: ...} KHÔNG phải {message: ...}
        errorMsg = errorData.message || errorData.error || errorMsg;
        errorCode = errorData.errorCode;
      } catch (e) {}
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = errorCode;
      throw error;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in createVnpayUrlApi:", error);
    throw error;
  }
};
