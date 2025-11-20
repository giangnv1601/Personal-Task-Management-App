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

// Chuyển local datetime "YYYY-MM-DDTHH:mm" về UTC ISO
export const toUTCISOString = (localDatetime) => {
  if (!localDatetime) return null
  const date = new Date(localDatetime)
  return isNaN(date.getTime()) ? null : date.toISOString()
}

// Hiển thị cả ngày + giờ (theo vi-VN)
// Ví dụ: "14/02/2025 09:32"
export const formatDateTime = (iso) => {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"

  const pad = (n) => String(n).padStart(2, "0")
  const dd = pad(d.getDate())
  const mm = pad(d.getMonth() + 1)
  const yyyy = d.getFullYear()
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`
}

// Ví dụ:
// - "5 phút trước"
// - "2 giờ trước"
// - "hôm qua"
// - "trong 3 ngày"
// - "vừa xong"
export const formatRelativeTime = (iso) => {
  if (!iso) return "—"
  const past = new Date(iso)
  if (isNaN(past.getTime())) return "—"

  const now = new Date()
  const diffMs = now - past
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  // Tương lai (diffMs < 0)
  if (diffMs < 0) {
    const aheadSec = Math.abs(diffSec)
    const aheadMin = Math.abs(diffMin)
    const aheadHour = Math.abs(diffHour)
    const aheadDay = Math.abs(diffDay)

    if (aheadSec < 60) return "trong vài giây"
    if (aheadMin < 60) return `trong ${aheadMin} phút`
    if (aheadHour < 24) return `trong ${aheadHour} giờ`
    return `trong ${aheadDay} ngày`
  }

  // Quá khứ
  if (diffSec < 5) return "vừa xong"
  if (diffSec < 60) return `${diffSec} giây trước`
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay === 1) return "hôm qua"
  if (diffDay < 7) return `${diffDay} ngày trước`
  return
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