// ISO/string/Date -> "YYYY-MM-DDTHH:mm" (local)
export const toLocalInput = (d) => {
  if (!d) return ""
  const dt = typeof d === "string" ? new Date(d) : d
  if (isNaN(dt.getTime())) return ""
  const pad = (n) => String(n).padStart(2, "0")
  const yyyy = dt.getFullYear()
  const MM = pad(dt.getMonth() + 1)
  const dd = pad(dt.getDate())
  const hh = pad(dt.getHours())
  const mm = pad(dt.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

// Chuyển local datetime về UTC ISO
export const toUTCISOString = (localDatetime) => {
  if (!localDatetime) return null
  const date = new Date(localDatetime)
  return isNaN(date.getTime()) ? null : date.toISOString()
}

// Định dạng ngày theo locale vi-VN
export const formatDate = (iso) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("vi-VN")
}

// So sánh deadline (UTC ISO) <= ngày chọn (yyyy-mm-dd), theo NGÀY (bỏ giờ)
export const isDeadlineBeforeOrEqual = (deadlineISO, yyyyMmDd) => {
  if (!deadlineISO || !yyyyMmDd) return false
  const d1 = new Date(deadlineISO)
  const d2 = new Date(yyyyMmDd)
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  return d1.getTime() <= d2.getTime()
}