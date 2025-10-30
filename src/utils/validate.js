// Kiểm tra URL hợp lệ
export const isValidUrl = (url) => {
  if (!url?.trim()) return true
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Kiểm tra deadline hợp lệ (phải tương lai)
export const validateDeadline = (v) => {
  const t = new Date(v).getTime()
  if (isNaN(t)) return "Định dạng deadline không hợp lệ"
  if (t < Date.now()) return "Deadline phải ở tương lai"
  return true
}
