export const throwApiError = async (response, fallbackMessage) => {
  let data = null;
  try {
    data = await response.clone().json();
  } catch {
    try {
      data = await response.clone().text();
    } catch {
      data = null;
    }
  }

  const defaultMessage = fallbackMessage || `Lỗi: ${response.status}`;
  const message = typeof data === 'string'
    ? data || defaultMessage
    : data?.message || defaultMessage;
  const error = new Error(message);
  error.fieldErrors = data?.fieldErrors || null;
  error.data = data;
  error.status = response.status;
  error.errorCode = data?.errorCode || data?.code || data?.error || null;
  throw error;
};
