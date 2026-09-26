import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/phieu-kham`;

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
export const getByIdApi = async (id) => {
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
 * POST /
 */
export const createApi = async data => {
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
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
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
      try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorMsg;
      } catch (e) {}
      throw new Error(errorMsg);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in updateApi:", error);
    throw error;
  }
};

/**
 * GET /today
 */
export const getTodayApi = async () => {
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
    console.error("Error in getTodayApi:", error);
    throw error;
  }
};

/**
 * POST /full-check-in
 */
export const fullCheckInApi = async data => {
  try {
    const response = await fetchClient(`${API_URL}/full-check-in`, {
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
    console.error("Error in fullCheckInApi:", error);
    throw error;
  }
};

/**
 * POST /accept-patient/{registrationId}
 */
export const acceptPatientApi = async registrationId => {
  try {
    const response = await fetchClient(`${API_URL}/accept-patient/${registrationId}`, {
      method: 'POST'
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
    console.error("Error in acceptPatientApi:", error);
    throw error;
  }
};

/**
 * GET /history
 */
export const getHistoryApi = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/history?${queryString}` : `${API_URL}/history`;
    const response = await fetchClient(url, {
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
    console.error("Error in getHistoryApi:", error);
    throw error;
  }
};

/**
 * POST /finish/{maPhieuKham}
 */
export const finishConsultationApi = async maPhieuKham => {
  try {
    const response = await fetchClient(`${API_URL}/finish/${maPhieuKham}`, {
      method: 'POST'
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
    console.error("Error in finishConsultationApi:", error);
    throw error;
  }
};

export const getAssistantHistoryApi = async (maChuyenKhoa) => {
  try {
    const response = await fetchClient(`${API_URL}/assistant-history?maChuyenKhoa=${maChuyenKhoa}`, {
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
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getAssistantHistoryApi:", error);
    throw error;
  }
};

/**
 * PUT /{maPhieuKham}/status-cls
 */
export const updateToClsApi = async (maPhieuKham) => {
  try {
    const response = await fetchClient(`${API_URL}/${maPhieuKham}/status-cls`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
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
    console.error("Error in updateToClsApi:", error);
    throw error;
  }
};

/**
 * PUT /{maPhieuKham}/status-waiting
 */
export const updateToWaitingForDoctorApi = async (maPhieuKham) => {
  try {
    const response = await fetchClient(`${API_URL}/${maPhieuKham}/status-waiting`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      }
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
    console.error("Error in updateToWaitingForDoctorApi:", error);
    throw error;
  }
};

/**
 * GET /api/phieu-kham/{id}/available-cls-results
 */
export const getAvailableClsResultsApi = async id => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/available-cls-results`, {
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
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getAvailableClsResultsApi:", error);
    throw error;
  }
};

/**
 * POST /accept-cls-patient/{registrationId}
 */
export const acceptClsPatientApi = async (registrationId, technicianId) => {
  try {
    const response = await fetchClient(`${API_URL}/accept-cls-patient/${registrationId}?technicianId=${technicianId}`, {
      method: 'POST'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in acceptClsPatientApi:", error);
    throw error;
  }
};

/**
 * POST /{maPhieuKham}/tech-confirm-cls
 */
export const techConfirmClsApi = async (maPhieuKham, technicianId, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${maPhieuKham}/tech-confirm-cls?technicianId=${technicianId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in techConfirmClsApi:", error);
    throw error;
  }
};

/**
 * POST /{maPhieuKham}/confirm-cls
 */
export const confirmClsServiceApi = async (maPhieuKham, doctorId) => {
  try {
    const response = await fetchClient(`${API_URL}/${maPhieuKham}/confirm-cls?doctorId=${doctorId}`, {
      method: 'POST'
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Lỗi: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in confirmClsServiceApi:", error);
    throw error;
  }
};

/**
 * GET /pending-cls-confirmation
 */
export const getPendingClsConfirmationApi = async (maChuyenKhoa) => {
  try {
    const response = await fetchClient(`${API_URL}/pending-cls-confirmation?maChuyenKhoa=${maChuyenKhoa}`, {
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
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getPendingClsConfirmationApi:", error);
    throw error;
  }
};

/**
 * GET /patient-history?maBenhNhan=...&maChuyenKhoa=...
 */
export const getPatientHistoryApi = async (maBenhNhan, maChuyenKhoa) => {
  try {
    let url = `${API_URL}/patient-history?maBenhNhan=${maBenhNhan}`;
    if (maChuyenKhoa != null) url += `&maChuyenKhoa=${maChuyenKhoa}`;
    const response = await fetchClient(url, {
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
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getPatientHistoryApi:", error);
    throw error;
  }
};

export const getSpecialtyHistoryApi = async maChuyenKhoa => {
  try {
    const response = await fetchClient(`${API_URL}/specialty-history?maChuyenKhoa=${maChuyenKhoa}`, {
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
    return text ? JSON.parse(text) : [];
  } catch (error) {
    console.error("Error in getSpecialtyHistoryApi:", error);
    throw error;
  }
};

/**
 * GET /current-cho?maChuyenKhoa=...
 * Lấy phiếu khám hiện tại đang có trạng thái CHO (đang được khám)
 * Trả về thông tin bệnh nhân đang được khám hiện tại
 */
export const getCurrentChoPatientApi = async (maChuyenKhoa) => {
  try {
    const url = maChuyenKhoa 
      ? `${API_URL}/current-cho?maChuyenKhoa=${maChuyenKhoa}`
      : `${API_URL}/current-cho`;
    const response = await fetchClient(url, {
      method: 'GET'
    });
    if (!response.ok) {
      // Nếu 404 hoặc không tìm thấy, trả về null
      if (response.status === 404) return null;
      throw new Error(`Lỗi: ${response.status}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Error in getCurrentChoPatientApi:", error);
    return null;
  }
};