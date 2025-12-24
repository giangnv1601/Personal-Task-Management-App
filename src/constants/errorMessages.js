export const ERROR_KEYS = {
  NETWORK: "network",
  UNAUTHORIZED: "unauthorized",
  NOT_FOUND: "not_found",
  VALIDATION: "validation",
  SERVER: "server",
  UNKNOWN: "unknown",
}

// Thông điệp lỗi theo key + locale
export const ERROR_MESSAGES = {
  vi: {
    [ERROR_KEYS.NETWORK]: "Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.",
    [ERROR_KEYS.UNAUTHORIZED]: "Bạn chưa được xác thực. Vui lòng đăng nhập.",
    [ERROR_KEYS.NOT_FOUND]: "Không tìm thấy tài nguyên yêu cầu.",
    [ERROR_KEYS.VALIDATION]: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
    [ERROR_KEYS.SERVER]: "Lỗi máy chủ. Vui lòng thử lại sau.",
    [ERROR_KEYS.UNKNOWN]: "Đã xảy ra lỗi. Vui lòng thử lại.",
  },
  en: {
    [ERROR_KEYS.NETWORK]: "Network error. Please check your connection and retry.",
    [ERROR_KEYS.UNAUTHORIZED]: "Unauthorized. Please sign in.",
    [ERROR_KEYS.NOT_FOUND]: "Requested resource not found.",
    [ERROR_KEYS.VALIDATION]: "Validation failed. Please check input.",
    [ERROR_KEYS.SERVER]: "Server error. Please try again later.",
    [ERROR_KEYS.UNKNOWN]: "An unknown error occurred. Please retry.",
  },
}

/**
 * Lấy message từ key + locale
 * @param {string} key
 * @param {string} [locale='vi']
 * @returns {string}
 */
export const getErrorMessage = (key, locale = "vi") =>
  (ERROR_MESSAGES[locale] && ERROR_MESSAGES[locale][key]) ||
  ERROR_MESSAGES[locale]?.[ERROR_KEYS.UNKNOWN] ||
  "Error"


//Normalize một lỗi (ví dụ từ fetch/axios) thành { key, message }
export const normalizeError = (err) => {
  // err có thể là Error, Response, object chứa status/message...
  const status = err?.status || err?.response?.status || null
  if (!status && (err?.message === "Failed to fetch" || err?.name === "TypeError")) {
    return { key: ERROR_KEYS.NETWORK, message: getErrorMessage(ERROR_KEYS.NETWORK) }
  }
  if (status === 401) {
    return { key: ERROR_KEYS.UNAUTHORIZED, message: getErrorMessage(ERROR_KEYS.UNAUTHORIZED) }
  }
  if (status === 404) {
    return { key: ERROR_KEYS.NOT_FOUND, message: getErrorMessage(ERROR_KEYS.NOT_FOUND) }
  }
  if (status >= 500) {
    return { key: ERROR_KEYS.SERVER, message: getErrorMessage(ERROR_KEYS.SERVER) }
  }
  // fallback: nếu err có message dùng message đó
  return { key: ERROR_KEYS.UNKNOWN, message: err?.message || getErrorMessage(ERROR_KEYS.UNKNOWN) }
}