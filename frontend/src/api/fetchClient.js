/**
 * fetchClient - wrapper cho fetch() tự động gắn access token (từ memory),
 * handle 401 auto-refresh (qua HttpOnly cookie) + queue, và tự động bật/tắt loading overlay.
 *
 * - Access token lưu trong memory (tokenStore), KHÔNG localStorage.
 * - Refresh token (web) nằm trong HttpOnly cookie do backend quản lý.
 * - Mọi request dùng credentials: 'include' để browser tự gửi cookie (chỉ với backend origin).
 */
import { loadingManager } from './loadingManager';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';
import { API_ORIGIN } from './config';

let refreshPromise = null;
let sessionExpiredInProgress = false;

export const resetSessionExpiredHandling = () => {
  sessionExpiredInProgress = false;
};

const handleSessionExpired = () => {
  clearAccessToken();
  if (!sessionExpiredInProgress) {
    sessionExpiredInProgress = true;
    window.dispatchEvent(new CustomEvent('session-expired'));
  }
};

const getAuthHeaders = () => {
  const token = getAccessToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const getRefreshEndpoint = () => {
  return '/api/taikhoan/refresh-token';
};

/**
 * Gọi refresh qua HttpOnly cookie (web).
 * Không gửi refresh token trong body - browser tự đính cookie.
 * Thêm X-Requested-With cho CSRF protection.
 *
 * Timeout 30s: đủ lâu để chờ backend phản hồi (kể cả Render.com cold start),
 * tránh treo vô hạn. Không dùng timeout ngắn (3s) vì sẽ cắt ngang request
 * hợp lệ khi mạng chậm, gây refresh thất bại sai.
 */
const REFRESH_TIMEOUT_MS = 30000;

const refreshTokenRequest = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);

  try {
    const baseUrl = API_ORIGIN;
    const endpoint = getRefreshEndpoint();

    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      signal: controller.signal
      // Không body - refresh token nằm trong HttpOnly cookie
    });

    if (!response.ok) {
      let code = null;
      try {
        const data = await response.clone().json();
        code = data?.code;
      } catch {
        // ignore parse errors
      }
      if (response.status === 401) {
        return { token: null, reason: code === 'SESSION_REVOKED' ? 'revoked' : 'invalid' };
      }
      if (response.status >= 500) {
        return { token: null, reason: 'server' };
      }
      return { token: null, reason: 'invalid' };
    }

    const data = await response.json();
    if (data.token) {
      setAccessToken(data.token);
      return { token: data.token, reason: 'success' };
    }
    return { token: null, reason: 'invalid' };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return { token: null, reason: 'timeout' };
    }
    return { token: null, reason: 'network' };
  } finally {
    clearTimeout(timeoutId);
  }
};

// clearSession removed (access token cleared via handleSessionExpired)

const handleUnauthorized = () => {
  handleSessionExpired();
};

// Map method -> message tiếng Việt cho loading overlay
const getLoadingMessage = (method) => {
  const baseMsg = {
    GET: 'Đang tải dữ liệu...',
    POST: 'Đang lưu dữ liệu...',
    PUT: 'Đang cập nhật...',
    DELETE: 'Đang xóa...',
    PATCH: 'Đang cập nhật...'
  };
  return baseMsg[method] || 'Đang xử lý...';
};

/**
 * fetchClient(url, options) - tự động gắn access token, handle 401 + refresh queue, loading overlay.
 *
 * options.skipLoading = true để bỏ qua loading overlay
 * options.skipRefresh = true để bỏ qua auto-refresh (dùng cho chính request refresh token)
 */
const fetchClient = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const defaultSkip = method === 'GET';
  const skipLoading = options.skipLoading !== undefined ? options.skipLoading === true : defaultSkip;

  if (!skipLoading) {
    loadingManager.show(getLoadingMessage(method));
  }

  const cleanOptions = { ...options };
  delete cleanOptions.skipLoading;
  const enhancedOptions = {
    ...cleanOptions,
    credentials: 'include', // browser tự gửi HttpOnly refresh token cookie
    headers: {
      ...(options.headers || {}),
      ...getAuthHeaders()
    }
  };

  try {
    const response = await fetch(url, enhancedOptions);

    // Nếu 401 và không phải chính request refresh, thử refresh + retry
    if (response.status === 401 && !options.skipRefresh) {
      // Bỏ qua nếu là request login
      if (url.includes('/login')) {
        clearAccessToken();
        throw new Error('Sai tài khoản hoặc mật khẩu!');
      }

      // Kiểm tra SESSION_REVOKED trực tiếp trong response 401
      try {
        const cloned = response.clone();
        const bodyJson = await cloned.json();
        if (bodyJson?.code === 'SESSION_REVOKED') {
          handleSessionExpired();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      } catch (e) {
        if (e?.message === 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') throw e;
      }

      // Single-flight: dùng chung một refreshPromise
      if (!refreshPromise) {
        refreshPromise = refreshTokenRequest().finally(() => {
          refreshPromise = null;
        });
      }

      const result = await refreshPromise;

      if (result?.token) {
        // Retry request ban đầu với token mới
        const retryOptions = {
          ...cleanOptions,
          skipRefresh: true, // tránh loop refresh
          credentials: 'include',
          headers: {
            ...(options.headers || {}),
            'Authorization': `Bearer ${result.token}`
          }
        };
        const retryResponse = await fetch(url, retryOptions);
        if (!skipLoading) loadingManager.hide();
        return retryResponse;
      }

      // Refresh thất bại
      if (result?.reason === 'revoked' || result?.reason === 'invalid') {
        handleSessionExpired();
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }

      // Network/server/timeout: giữ phiên, báo lỗi kết nối
      throw new Error(
        result?.reason === 'network' || result?.reason === 'timeout'
          ? 'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.'
          : 'Lỗi máy chủ. Vui lòng thử lại sau.'
      );
    }

    // Handle 403 (không coi là hết phiên)
    if (response.status === 403) {
      try {
        const cloned = response.clone();
        const bodyText = await cloned.text();
        let bodyJson = null;
        try { bodyJson = JSON.parse(bodyText); } catch { /* ignore */ }
        if (bodyJson && bodyJson.message) {
          throw new Error(bodyJson.message);
        }
      } catch (e) {
        if (e?.message && e.message !== 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') {
          // rethrow permission/server messages
        }
      }
      throw new Error('Bạn không có quyền thực hiện hành động này.');
    }

    return response;
  } catch (error) {
    if (error.message === 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') {
      throw error;
    }
    throw error;
  } finally {
    if (!skipLoading) {
      loadingManager.hide();
    }
  }
};

export default fetchClient;
export { handleUnauthorized };