export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://qlpk-backend-spring-boot.onrender.com/api';

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL || 'https://qlpk-backend-spring-boot.onrender.com';

/**
 * API_ORIGIN — host thuần không có hậu tố /api
 * Dùng cho fetchClient dựng URL dạng `${baseUrl}/api/...`
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');
