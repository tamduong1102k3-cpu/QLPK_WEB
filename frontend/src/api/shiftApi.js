import fetchClient from "./fetchClient";
import { API_BASE_URL } from './config';
const API_URL = `${API_BASE_URL}/phan-cong`;
const CA_LAM_URL = `${API_BASE_URL}/ca-lam`;

/**
 * Lấy tất cả danh sách phân công ca làm
 */
export const getAllShiftsApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(`Lỗi: ${response.status} - Không thể tải bảng phân công`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error in getAllShiftsApi:", error);
    throw error;
  }
};

/**
 * Tạo mới một ca làm việc
 */
const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (error) {
    const cleanText = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleanText ? { message: cleanText } : null;
  }
};

const getErrorMessage = async (response, fallback) => {
  try {
    const errorData = await parseJsonResponse(response);
    if (errorData?.message) return errorData.message;
    if (typeof errorData === "string" && errorData.trim()) return errorData;
    if (response && response.status)
      return `${fallback} (HTTP ${response.status})`;
    return fallback;
  } catch (error) {
    return fallback;
  }
};

const normalizeMonthData = (data) => {
  if (!data || !Array.isArray(data.days)) return data;

  return {
    ...data,
    days: data.days.map((day) => {
      // Deduplicate macDinh: keep only first occurrence of each maCa
      const seenMaCa = new Set();
      const uniqueMacDinh = (day.macDinh || []).filter((item) => {
        // Dedup by ca.id, fallback maCa, fallback id (mỗi bản ghi luôn có id duy nhất)
        const key = item.ca?.id ?? item.maCa ?? item.id;
        if (seenMaCa.has(key)) {
          return false;
        }
        seenMaCa.add(key);
        return true;
      });

      const theoNgay = Array.isArray(day.theoNgay)
        ? day.theoNgay
        : Array.isArray(day.ngoaiLe)
          ? day.ngoaiLe
          : [];

      return {
        ...day,
        macDinh: uniqueMacDinh,
        ngoaiLe: theoNgay.map((item) => ({
          ...item,
          loai:
            item.loai ??
            (item.hanhDong === "NGHI_PHEP"
              ? "NGHI_PHEP"
              : item.hanhDong === "THAY_THE"
                ? "DOI_CA"
                : "THEM_CA"),
          maCaMacDinh:
            item.maCaMacDinh ?? item.maCa ?? item.ca?.id ?? null,
          gioLam: item.gioLam ?? item.ca?.gioBatDau ?? null,
          gioKetThuc: item.gioKetThuc ?? item.ca?.gioKetThuc ?? null,
        })),
      };
    }),
  };
};

export const createShiftApi = async (data) => {
  try {
    const response = await fetchClient(`${API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Không thể tạo ca làm việc"),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in createShiftApi:", error);
    throw error;
  }
};

export const createDefaultShiftMonthApi = async (payload) => {
  try {
    const normalized = {
      ...payload,
      kieuPhanCong: "MAC_DINH",
      hanhDong: null,
    };
    const response = await fetchClient(`${API_URL}/default-month`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalized),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Không thể tạo ca mặc định cho tháng"),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in createDefaultShiftMonthApi:", error);
    throw error;
  }
};

export const nhanCaMacDinhDenCuoiNamApi = async (payload) => {
  try {
    const response = await fetchClient(
      `${API_URL}/nhan-ca-mac-dinh-den-cuoi-nam`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Không thể nhân ca mặc định đến cuối năm",
        ),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in nhanCaMacDinhDenCuoiNamApi:", error);
    throw error;
  }
};

export const deleteDefaultShiftByWeekdayApi = async ({
  maNhanVien,
  nam,
  thang,
  thu,
}) => {
  try {
    const params = new URLSearchParams({
      maNhanVien: String(maNhanVien),
      nam: String(nam),
      thang: String(thang),
      thu,
    });
    const response = await fetchClient(
      `${API_URL}/default-month?${params.toString()}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Không thể xóa ca mặc định theo thứ trong tháng",
        ),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in deleteDefaultShiftByWeekdayApi:", error);
    throw error;
  }
};

/**
 * Xóa một ca làm việc theo ID
 */
export const deleteShiftApi = async (id) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Không thể xóa ca làm việc");
    }
    return true;
  } catch (error) {
    console.error("Error in deleteShiftApi:", error);
    throw error;
  }
};

/**
 * Cập nhật ca làm việc theo ID
 */
export const updateShiftApi = async (id, data) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Không thể cập nhật ca làm việc"),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in updateShiftApi:", error);
    throw error;
  }
};

/**
 * CẬP NHẬT HÀNG LOẠT: Sửa ca mặc định cho TẤT CẢ các ngày cùng thứ trong tháng.
 * Chỉ gửi khi người dùng bật cờ updateAllThu = true.
 * Backend sẽ từ chối nếu updateAllThu không phải true.
 */
export const updateDefaultShiftMonthApi = async (payload) => {
  try {
    const normalized = {
      ...payload,
      kieuPhanCong: "MAC_DINH",
      hanhDong: null,
      updateAllThu: true,
    };
    const response = await fetchClient(`${API_URL}/default-month`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalized),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(
          response,
          "Không thể cập nhật ca mặc định hàng loạt",
        ),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in updateDefaultShiftMonthApi:", error);
    throw error;
  }
};

// Giữ lại các hàm khác của bạn nếu cần
export const getWorkingTodayApi = async () => {
  try {
    const response = await fetchClient(`${API_URL}/working-today`, {
      method: "GET",
    });
    if (!response.ok) {
      throw new Error(
        `Lỗi: ${response.status} - Không thể lấy lịch trực hôm nay`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getWorkingTodayApi:", error);
    throw error;
  }
};

/**
 * Lấy phòng làm việc hiện tại của một nhân viên dựa trên thời gian thực
 * Endpoint: GET /api/phan-cong/current-room/{maNhanVien}
 */
export const getCurrentRoomApi = async (maNhanVien) => {
  try {
    const response = await fetchClient(
      `${API_URL}/current-room/${maNhanVien}`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Lỗi: ${response.status} - Không thể lấy thông tin phòng hiện tại`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getCurrentRoomApi:", error);
    throw error;
  }
};

/**
 * Lấy phòng làm việc của bác sĩ theo ca hiện tại và ngày chỉ định.
 * Endpoint: GET /api/phan-cong/phong-theo-bac-si?maBacSi=X&ngay=YYYY-MM-DD
 * Trả: { maCa, maPhong, tenPhong } hoặc throw Error kèm message lỗi từ backend.
 */
export const getPhongTheoBacSiApi = async (maBacSi, ngay) => {
  try {
    const params = new URLSearchParams({
      maBacSi: String(maBacSi),
      ngay,
    });
    const response = await fetchClient(
      `${API_URL}/phong-theo-bac-si?${params.toString()}`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      const err = await parseJsonResponse(response);
      throw new Error(
        err?.message ||
          `Lỗi: ${response.status} - Không thể lấy phòng theo bác sĩ`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getPhongTheoBacSiApi:", error);
    throw error;
  }
};

/**
 * Lấy lịch làm việc (các thứ trong tuần) của một nhân viên theo mã nhân viên
 * Endpoint: GET /api/phan-cong/by-nhan-vien/{maNhanVien}
 */
export const getShiftsByNhanVienApi = async (maNhanVien) => {
  try {
    const response = await fetchClient(
      `${API_URL}/by-nhan-vien/${maNhanVien}`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      throw new Error(
        `Lỗi: ${response.status} - Không thể lấy lịch làm việc của nhân viên`,
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error in getShiftsByNhanVienApi:", error);
    throw error;
  }
};

/**
 * Lấy lịch cả tháng đã gộp (ca mặc định + ngoại lệ) của 1 nhân viên.
 * GET /api/ca-lam-danh-muc/thang?maNhanVien=&nam=&thang=
 * Now using unified bang_phan_cong_ca_lam with kieuPhanCong=MAC_DINH and THEO_NGAY
 */
export const getMonthScheduleApi = async (maNhanVien, nam, thang) => {
  try {
    const response = await fetchClient(
      `${CA_LAM_URL.replace('/api/ca-lam', '/api/ca-lam-danh-muc')}/thang?maNhanVien=${maNhanVien}&nam=${nam}&thang=${thang}`,
      {
        method: "GET",
      },
    );
    if (!response.ok) {
      throw new Error(`Lỗi: ${response.status} - Không thể tải lịch tháng`);
    }
    const raw = await response.json();
    return normalizeMonthData(raw);
  } catch (error) {
    console.error("Error in getMonthScheduleApi:", error);
    throw error;
  }
};

/**
 * Tạo ngoại lệ ca làm việc (nghỉ phép / đổi ca / thêm ca) cho 1 ngày.
 * Now using unified bang_phan_cong_ca_lam with kieuPhanCong=THEO_NGAY
 * POST /api/phan-cong
 */
export const createExceptionApi = async (payload) => {
  try {
    // Map legacy payload to unified format
    const mapped = {
      maNhanVien: payload.maNhanVien,
      ngay: payload.ngay,
      maCa: payload.maCaMacDinh ?? payload.maCa ?? (Array.isArray(payload.caIds) ? payload.caIds[0] : null),
      phong: payload.loai === "NGHI_PHEP" ? null : payload.phong,
      kieuPhanCong: "THEO_NGAY",
      hanhDong:
        payload.loai === "NGHI_PHEP"
          ? "NGHI_PHEP"
          : payload.loai === "DOI_CA"
            ? "THAY_THE"
            : "THEM",
      lyDo: payload.lyDo ?? null,
    };
    
    const response = await fetchClient(`${API_URL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapped),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, `Lỗi: ${response.status}`),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in createExceptionApi:", error);
    throw error;
  }
};

/**
 * Cập nhật ngoại lệ ca làm việc theo id.
 * Now using unified bang_phan_cong_ca_lam with kieuPhanCong=THEO_NGAY
 * PUT /api/phan-cong/{id}
 */
export const updateExceptionApi = async (id, payload) => {
  try {
    const mapped = {
      maNhanVien: payload.maNhanVien,
      ngay: payload.ngay,
      maCa: payload.maCaMacDinh ?? payload.maCa ?? (Array.isArray(payload.caIds) ? payload.caIds[0] : null),
      phong: payload.loai === "NGHI_PHEP" ? null : payload.phong,
      hanhDong:
        payload.loai === "NGHI_PHEP"
          ? "NGHI_PHEP"
          : payload.loai === "DOI_CA"
            ? "THAY_THE"
            : "THEM",
      lyDo: payload.lyDo ?? null,
    };

    if (payload.kieuPhanCong != null) {
      mapped.kieuPhanCong = payload.kieuPhanCong;
    }

    const response = await fetchClient(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapped),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, `Lỗi: ${response.status}`),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in updateExceptionApi:", error);
    throw error;
  }
};

export const updateShiftActionApi = async (id, { hanhDong, lyDo }) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hanhDong, lyDo }),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, `Lỗi: ${response.status}`),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in updateShiftActionApi:", error);
    throw error;
  }
};

/**
 * Đánh dấu nghỉ phép đột xuất — gọi endpoint chuyên dụng /{id}/nghi-phep.
 * Body CHỈ có lyDo (endpoint chỉ đọc body.get("lyDo")).
 * Backend tự động hủy hàng loạt lịch khám CHUA_DEN của bác sĩ trong ngày nghỉ
 * và gửi thông báo cho bệnh nhân bị hủy lịch.
 */
export const updateShiftNghiPhepApi = async (id, lyDo) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}/nghi-phep`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lyDo }),
    });
    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, `Lỗi: ${response.status}`),
      );
    }
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error in updateShiftNghiPhepApi:", error);
    throw error;
  }
};

/**
 * Xóa ngoại lệ ca làm việc theo id.
 * Now using unified bang_phan_cong_ca_lam
 * DELETE /api/phan-cong/{id}
 */
export const deleteExceptionApi = async (id) => {
  try {
    const response = await fetchClient(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Lỗi: ${response.status} - Không thể xóa ngoại lệ`);
    }
    return true;
  } catch (error) {
    console.error("Error in deleteExceptionApi:", error);
    throw error;
  }
};
