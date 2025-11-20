/**
 * Validate plain text length.
 * Returns true if valid or an error message string for use with react-hook-form.
 * @param {string} text
 * @param {{min?: number, max?: number}} [opts]
 * @returns {true|string}
 */
export const validateText = (text, { min = 0, max = Infinity } = {}) => {
  const val = text?.trim() || ""

  if (min && val.length < min) {
    return `Tối thiểu ${min} ký tự`
  }

  if (max !== Infinity && val.length > max) {
    return `Tối đa ${max} ký tự`
  }

  return true
}

/**
 * Validate deadline input.
 * @param {string|null} v local/ISO datetime or null
 * @param {{allowPast?: boolean}} [opts]
 * @returns {true|string}
 */
export const validateDeadline = (v, { allowPast = false } = {}) => {
  if (!v) return "Vui lòng chọn deadline"

  const t = new Date(v).getTime()
  if (isNaN(t)) return "Định dạng deadline không hợp lệ"

  if (!allowPast && t < Date.now()) {
    return "Deadline phải ở tương lai"
  }

  return true
}

/**
 * Quick URL check
 * @param {string} url
 * @returns {boolean}
 */
export const isValidUrl = (url) => {
  if (!url?.trim()) return true
  try {
    new URL(url)
    return true
  } catch {
    return "URL không hợp lệ"
  }
}
