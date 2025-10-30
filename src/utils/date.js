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
