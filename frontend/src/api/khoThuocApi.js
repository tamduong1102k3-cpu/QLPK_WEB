import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/kho-thuoc`;

/**
 * GET /thuoc
 */
export const getAllThuocApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/thuoc`, {
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
    console.error("Error in getAllThuocApi:", error);
    throw error;
  }
};

/**
 * POST /thuoc
 */
export const createThuocApi = async data => {
  try {
    const response = await fetchClient(`${API_URL}/thuoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
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
    console.error("Error in createThuocApi:", error);
    throw error;
  }
};

/**
 * PUT /thuoc/{id}
 */
export const updateThuocApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/thuoc/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
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
    console.error("Error in updateThuocApi:", error);
    throw error;
  }
};

/**
 * DELETE /thuoc/{id}
 */
export const deleteThuocApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/thuoc/${id}`, {
      method: 'DELETE'
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
    console.error("Error in deleteThuocApi:", error);
    throw error;
  }
};

/**
 * GET /
 */
export const getAllKhoApi = async () => {
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
    console.error("Error in getAllKhoApi:", error);
    throw error;
  }
};

/**
 * GET /canh-bao - Lấy tất cả tồn kho kèm trạng thái cảnh báo
 */
export const getKhoCanhBaoApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/canh-bao`, {
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
    console.error("Error in getKhoCanhBaoApi:", error);
    throw error;
  }
};

/**
 * GET /canh-bao/thuoc - Danh sách thuốc đang có cảnh báo
 */
export const getThuocCanhBaoApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/canh-bao/thuoc`, {
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
    console.error("Error in getThuocCanhBaoApi:", error);
    throw error;
  }
};

/**
 * GET /sap-het
 */
export const getThuocSapHetApi = async (threshold = 20) => {
  try {
    const response = await fetchClient(`${API_URL}/sap-het?threshold=${threshold}`, {
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
    console.error("Error in getThuocSapHetApi:", error);
    throw error;
  }
};

/**
 * GET /phieu-nhap
 */
export const getAllPhieuNhapApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-nhap`, {
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
    console.error("Error in getAllPhieuNhapApi:", error);
    throw error;
  }
};

/**
 * GET /phieu-nhap/{id}
 */
export const getPhieuNhapByIdApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-nhap/${id}`, {
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
    console.error("Error in getPhieuNhapByIdApi:", error);
    throw error;
  }
};

/**
 * GET /phieu-nhap/{id}/chi-tiet
 */
export const getChiTietPhieuNhapApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-nhap/${id}/chi-tiet`, {
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
    console.error("Error in getChiTietPhieuNhapApi:", error);
    throw error;
  }
};

/**
 * POST /phieu-nhap
 */
export const createPhieuNhapApi = async data => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-nhap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
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
    console.error("Error in createPhieuNhapApi:", error);
    throw error;
  }
};
