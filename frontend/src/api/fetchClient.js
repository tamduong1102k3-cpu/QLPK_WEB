/**
 * fetchClient - wrapper cho fetch() tự động gắn access token (từ memory),
 * handle 401 auto-refresh (qua HttpOnly cookie) + queue, và tự động bật/tắt loading overlay.
 *
 * - Access token lưu trong memory (tokenStore), KHÔNG localStorage.
 * - Refresh token (web) nằm trong HttpOnly cookie do backend quản lý.
 * - Mọi request dùng credentials: 'include' để browser tự gửi cookie (chỉ với backend origin).
 */
import { loadingManager } from './loadingManager';
import { API_BASE_URL } from './config';
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenStore';

let isRefreshing = false;
let refreshSubscribers = [];

// Hàng đợi các request đang chờ refresh xong
const onRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
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
    const baseUrl = localStorage.getItem('apiBaseUrl') || API_BASE_URL.replace(/\/api$/, '');
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

    if (!response.ok) return null;

    const data = await response.json();
    if (data.token) {
      setAccessToken(data.token);
      return data.token;
    }
    return null;
  } catch (error) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const clearSession = () => {
  clearAccessToken();
};

const handleUnauthorized = () => {
  clearSession();
  if (window.location.pathname !== '/') {
    window.location.href = '/';
  } else {
    window.location.reload();
  }
};

// Map method -> message tiếng Việt cho loading overlay
const getLoadingMessage = (method, url) => {
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
    loadingManager.show(getLoadingMessage(method, url));
  }

  const { skipLoading: _, ...cleanOptions } = options;
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
        clearSession();
        throw new Error('Sai tài khoản hoặc mật khẩu!');
      }

      // Queue cơ chế: nếu đang refresh thì chờ, nếu chưa thì refresh
      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await refreshTokenRequest();

        if (newToken) {
          isRefreshing = false;
          onRefreshed(newToken);
          // Retry request ban đầu với token mới
          const retryOptions = {
            ...cleanOptions,
            skipRefresh: true, // tránh loop refresh
            credentials: 'include',
            headers: {
              ...(options.headers || {}),
              'Authorization': `Bearer ${newToken}`
            }
          };
          const retryResponse = await fetch(url, retryOptions);
          if (!skipLoading) loadingManager.hide();
          return retryResponse;
        } else {
          isRefreshing = false;
          refreshSubscribers = [];
          handleUnauthorized();
          throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      } else {
        // Đang có request refresh khác chạy, chờ token mới
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(async (newToken) => {
            try {
              const retryOptions = {
                ...cleanOptions,
                skipRefresh: true,
                credentials: 'include',
                headers: {
                  ...(options.headers || {}),
                  'Authorization': `Bearer ${newToken}`
                }
              };
              const retryResponse = await fetch(url, retryOptions);
              if (!skipLoading) loadingManager.hide();
              resolve(retryResponse);
            } catch (err) {
              if (!skipLoading) loadingManager.hide();
              reject(err);
            }
          });
        });
      }
    }

    // Handle 403
    if (response.status === 403) {
      try {
        const cloned = response.clone();
        const bodyText = await cloned.text();
        let bodyJson = null;
        try { bodyJson = JSON.parse(bodyText); } catch (e) {}

        if (bodyJson && bodyJson.message && bodyJson.message.includes('quyền')) {
          throw new Error(bodyJson.message);
        }
      } catch (e) {
        if (e.message && e.message.includes('quyền')) throw e;
      }

      handleUnauthorized();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
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