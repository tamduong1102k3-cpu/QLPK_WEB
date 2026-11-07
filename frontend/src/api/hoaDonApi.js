import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/hoa-don`;

/**
 * GET /paid-invoices-with-thuoc
 * Lấy danh sách hóa đơn đã thanh toán CÓ thuốc (JOIN ct_hoa_don loai_muc = 'THUOC')
 * Chỉ lấy bệnh nhân có thuốc, không lấy DICH_VU
 */
export const getPaidInvoicesWithThuocApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/paid-invoices-with-thuoc`, {
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
    console.error("Error in getPaidInvoicesWithThuocApi:", error);
    throw error;
  }
};

/**
 * GET /{id}/chi-tiet-thuoc
 */
export const getAllApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}`, {
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
    console.error("Error in getAllApi:", error);
    throw error;
  }
};

/**
 * GET /{id}
 */
export const getByIdApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
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
    console.error("Error in getByIdApi:", error);
    throw error;
  }
};

/**
 * GET /{id}/chi-tiet
 */
export const getChiTietApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/chi-tiet`, {
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
    console.error("Error in getChiTietApi:", error);
    throw error;
  }
};

/**
 * GET /phieu-kham/{maPhieuKham}/billing-items
 */
export const getBillingItemsApi = async maPhieuKham => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}/billing-items`, {
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
    console.error("Error in getBillingItemsApi:", error);
    throw error;
  }
};

/**
 * POST /phieu-kham/{maPhieuKham}/create
 */
export const createInvoiceFromPhieuKhamApi = async (maPhieuKham, data) => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in createInvoiceFromPhieuKhamApi:", error);
    throw error;
  }
};

/**
 * POST /{id}/thanh-toan
 */
export const thanhToanApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/thanh-toan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      let errorMsg = `Lỗi: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in thanhToanApi:", error);
    throw error;
  }
};

/**
 * GET /paid-invoices
 * Lấy danh sách hóa đơn đã thanh toán kèm thông tin bệnh nhân (cho dược sĩ)
 */
export const getPaidInvoicesApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/paid-invoices`, {
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
    console.error("Error in getPaidInvoicesApi:", error);
    throw error;
  }
};

/**
 * GET /paid-invoices-with-thuoc-status
 * Lấy danh sách hóa đơn đã thanh toán CÓ thuốc kèm trạng thái toa thuốc (cho dược sĩ 2 tab)
 * Mỗi bản ghi có thêm trường tinhTrangCapThuoc: 'CHO_CAP' | 'DA_CAP'
 */
export const getPaidInvoicesWithThuocAndStatusApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/paid-invoices-with-thuoc-status`, {
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
    console.error("Error in getPaidInvoicesWithThuocAndStatusApi:", error);
    throw error;
  }
};

/**
 * GET /paid-invoices-da-cap-thuoc
 * Lấy danh sách hóa đơn đã thanh toán CÓ thuốc đã cấp (DA_CAP_THUOC) - cho lịch sử dược sĩ
 */
export const getPaidInvoicesDaCapThuocApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/paid-invoices-da-cap-thuoc`, {
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
    console.error("Error in getPaidInvoicesDaCapThuocApi:", error);
    throw error;
  }
};

/**
 * GET /{id}/chi-tiet-thuoc
 */
export const getChiTietThuocApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/chi-tiet-thuoc`, {
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
    console.error("Error in getChiTietThuocApi:", error);
    throw error;
  }
};