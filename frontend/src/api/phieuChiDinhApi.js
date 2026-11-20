import fetchClient from './fetchClient';
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/phieu-chi-dinh`;

/**
 * 1. Lấy danh sách chờ thực hiện CLS (Dành cho KTV)
 * GET /pending-tests?maChuyenKhoa=...
 */
export const getPendingTestsApi = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/pending-tests?${queryString}` : `${API_URL}/pending-tests`;
    const response = await fetchClient(url);
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error in getPendingTestsApi:", error);
    throw error;
  }
};

/**
 * 2. Lấy danh sách đã hoàn thành hôm nay (Dành cho KTV)
 * GET /completed-tests-today?maChuyenKhoa=...
 */
export const getCompletedTestsTodayApi = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/completed-tests-today?${queryString}` : `${API_URL}/completed-tests-today`;
    const response = await fetchClient(url);
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error in getCompletedTestsTodayApi:", error);
    throw error;
  }
};

/**
 * 3. Kỹ thuật viên nộp kết quả (Lab/X-Quang/Siêu âm)
 * POST /submit-result
 * Hỗ trợ gallery N ảnh: payload.danhSachAnh (mảng URL). BE tự fallback
 * duongDanAnh1/2 cho client cũ.
 */
export const submitTestResultApi = async (data) => {
  try {
    const payload = { ...data };
    const list = Array.isArray(payload.danhSachAnh)
      ? payload.danhSachAnh.filter(Boolean)
      : [];
    // Backward-compat: luôn gửi kèm 2 field cũ từ gallery
    if (payload.duongDanAnh1 == null) payload.duongDanAnh1 = list[0] || null;
    if (payload.duongDanAnh2 == null) payload.duongDanAnh2 = list[1] || null;
    if (list.length > 0) payload.danhSachAnh = list;
    const response = await fetchClient(`${API_URL}/submit-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Lỗi khi nộp kết quả");
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

const throwClsResultApiError = async (response) => {
  let errorData = {};
  try {
    errorData = await response.json();
  } catch {
    // Error responses may have an empty or non-JSON body.
  }

  const statusMessages = {
    403: "Bạn không có quyền thực hiện thao tác này.",
    404: "Không tìm thấy kết quả cần xử lý.",
    409: "Kết quả đã thay đổi hoặc không còn ở trạng thái cho phép xử lý. Vui lòng tải lại danh sách."
  };
  const message = (typeof errorData?.message === 'string' && errorData.message.trim())
    || statusMessages[response.status]
    || `Không thể xử lý kết quả (HTTP ${response.status}).`;

  throw new Error(message);

  const error = new Error(message);
  error.status = response.status;
  throw error;

};

/**
 * 4. Bác sĩ tạo chỉ số/phiếu chỉ định mới
 * POST /
 */
export const createReferralApi = async (data) => {
  const response = await fetchClient(`${API_URL}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    let message = `Không thể tạo chỉ định (HTTP ${response.status}).`;
    try {
      const errorData = await response.json();
      if (typeof errorData?.message === 'string' && errorData.message.trim()) {
        message = errorData.message;
      }
    } catch {
      // Keep the status-based message for an empty or non-JSON error response.
    }
    throw new Error(message);
  }
  return await response.json();
};

export const createApi = createReferralApi;

/**
 * 4b. Lấy danh sách phiếu chỉ định theo mã bệnh nhân
 * GET /benh-nhan/{maBenhNhan}
 */
export const getByBenhNhanApi = async (maBenhNhan) => {
  try {
    const response = await fetchClient(`${API_URL}/benh-nhan/${maBenhNhan}`);
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error in getByBenhNhanApi:", error);
    throw error;
  }
};

/**
 * 5. Lấy danh sách chỉ định theo mã phiếu khám (Dành cho Bác sĩ)
 * GET /phieu-kham/{maPhieuKham}
 */
export const getByPhieuKhamApi = async (maPhieuKham) => {
  const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}`);
  return await response.json();
};

/**
 * 6. Lấy chi tiết các dịch vụ trong phiếu chỉ định
 * GET /{id}/details
 */
export const getDetailsApi = async (id) => {
  const response = await fetchClient(`${API_URL}/${id}/details`);
  return await response.json();
};

/**
 * 7. Lấy kết quả Chẩn Đoán Hình Ảnh (CĐHA) theo detailId
 * GET /result-cdha/{detailId}
 */
export const getCdhaResultApi = async (detailId) => {
  const response = await fetchClient(`${API_URL}/result-cdha/${detailId}`);
  if (!response.ok) return null;
  return await response.json();
};

/**
 * 8. Lấy kết quả Xét Nghiệm theo detailId
 * GET /result-xet-nghiem/{detailId}
 */
export const getXetNhiemResultApi = async (detailId) => {
  const response = await fetchClient(`${API_URL}/result-xet-nghiem/${detailId}`);
  if (!response.ok) return null;
  return await response.json();
};

/**
 * 9. QUAN TRỌNG: Upload hình ảnh (Dành cho KTV CĐHA)
 * POST /upload-image
 */
export const uploadImageApi = async (formData) => {
  try {
    const response = await fetchClient(`${API_URL}/upload-image`, {
      method: 'POST',
      // Lưu ý: Không set Content-Type header khi dùng FormData
      body: formData
    });
    if (!response.ok) throw new Error("Lỗi khi upload ảnh");
    return await response.json();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

/**
 * 10. Bác sĩ Duyệt/Từ chối kết quả Xét nghiệm
 * POST /approve-result/{id}
 * POST /reject-result/{id}
 */
export const approveTestResultApi = async (id, data) => {
  const res = await fetchClient(`${API_URL}/approve-result/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) await throwClsResultApiError(res);
  return await res.json();
};

export const rejectTestResultApi = async (id, data) => {
  const res = await fetchClient(`${API_URL}/reject-result/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) await throwClsResultApiError(res);
  return await res.json();
};

/**
 * 11. Bác sĩ Duyệt/Từ chối kết quả CĐHA (Mới)
 * POST /approve-cdha/{detailId}
 * POST /reject-cdha/{detailId}
 */
export const approveCdhaResultApi = async (detailId, data) => {
  const res = await fetchClient(`${API_URL}/approve-cdha/${detailId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) await throwClsResultApiError(res);
  return await res.json();
};

export const rejectCdhaResultApi = async (detailId, data) => {
  const res = await fetchClient(`${API_URL}/reject-cdha/${detailId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) await throwClsResultApiError(res);
  return await res.json();
};

/**
 * 12. Lấy lịch sử phê duyệt của bác sĩ chuyên khoa (Dành cho bác sĩ XN/CĐHA)
 * GET /approved-history?maBacSi=...
 */
export const getApprovedHistoryApi = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const res = await fetchClient(`${API_URL}/approved-history?${queryString}`);
  if (!res.ok) return [];
  return await res.json();
};

/**
 * 13. Lấy danh sách kết quả xét nghiệm theo mã phiếu khám (Dành cho bác sĩ / tab cận lâm sàng)
 * GET /phieu-kham/{maPhieuKham}/result-xet-nghiem
 */
export const getXetNhiemResultsByPhieuKhamApi = async (maPhieuKham) => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}/result-xet-xet-nghiem`.replace("result-xet-xet-nghiem", "result-xet-nghiem"));
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error in getXetNhiemResultsByPhieuKhamApi:", error);
    throw error;
  }
};

/**
 * 14. Lấy danh sách chờ duyệt theo chuyên khoa (Dành cho bác sĩ chẩn đoán/xét nghiệm)
 * GET /pending-approval?maChuyenKhoa=...
 */
export const getPendingApprovalListApi = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_URL}/pending-approval?${queryString}` : `${API_URL}/pending-approval`;
  const response = await fetchClient(url, { skipLoading: true });
  if (!response.ok) return [];
  return await response.json();
};

/**
 * 15. Lấy danh sách đã duyệt theo chuyên khoa (Dành cho bác sĩ chẩn đoán/xét nghiệm)
 * GET /approved-list?maChuyenKhoa=...
 */
export const getApprovedListApi = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${API_URL}/approved-list?${queryString}` : `${API_URL}/approved-list`;
  const response = await fetchClient(url, { skipLoading: true });
  if (!response.ok) return [];
  return await response.json();
};

const DOCTOR_CLS_API_URL = `${API_URL}/doctor/cls`;

const readDoctorClsResponse = async (response) => {
  if (!response.ok) {
    let message = `Không thể tải dữ liệu (HTTP ${response.status})`;
    try {
      const error = await response.json();
      message = error.message || error.detail || error.title || message;
    } catch (e) {
      // Use the status-based message when the server response is not JSON.
    }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  return response.json();
};

export const getDoctorClsReviewQueueApi = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  });
  const suffix = query.toString();
  const response = await fetchClient(
    `${DOCTOR_CLS_API_URL}/review-queue${suffix ? `?${suffix}` : ''}`,
    { skipLoading: true }
  );
  return readDoctorClsResponse(response);
};


export const claimDoctorClsResultApi = async (detailId) => {
  const response = await fetchClient(`${API_URL}/doctor/claim-result/${detailId}`, {
    method: 'POST'
  });
  return readDoctorClsResponse(response);
};


export const getCdhaResultsByPhieuKhamApi = async (maPhieuKham) => {
  try {
    const response = await fetchClient(`${API_URL}/phieu-kham/${maPhieuKham}/result-cdha`);
    if (!response.ok) throw new Error(`Lỗi: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error in getCdhaResultsByPhieuKhamApi:", error);
    throw error;
  }
};
