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
 */
export const submitTestResultApi = async (data) => {
  try {
    const response = await fetchClient(`${API_URL}/submit-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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

/**
 * 4. Bác sĩ tạo chỉ số/phiếu chỉ định mới
 * POST /
 */
export const createReferralApi = async (data) => {
  try {
    const response = await fetchClient(`${API_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error("Lỗi khi tạo chỉ định");
    return await response.json();
  } catch (error) {
    throw error;
  }
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
  return await res.json();
};

export const rejectTestResultApi = async (id, data) => {
  const res = await fetchClient(`${API_URL}/reject-result/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
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
  return await res.json();
};

export const rejectCdhaResultApi = async (detailId, data) => {
  const res = await fetchClient(`${API_URL}/reject-cdha/${detailId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
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

/**
 * 16. Lấy danh sách kết quả CĐHA theo mã phiếu khám (Dành cho bác sĩ / tab cận lâm sàng)
 * GET /phieu-kham/{maPhieuKham}/result-cdha
 */
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
