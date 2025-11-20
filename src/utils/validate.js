/**
 * Validate URL (empty allowed)
 * @param {string} url
 * @returns {true | string}
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

/**
 * Validate deadline
 * @param {string} v - datetime-local string
 * @param {Object} options
 * @param {boolean} options.allowPast - cho phép deadline quá khứ không?
 * @returns {true | string}
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
 * Validate text length
 * @param {string} text
 * @param {Object} options
 * @param {number} options.min
 * @param {number} options.max
 * @returns {true | string}
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
