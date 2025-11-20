import { useCallback, useEffect, useMemo, useState } from "react"

/**
 * usePagination
 *
 * @param {Array} list - Danh sách dữ liệu cần phân trang
 * @param {number} pageSize - Số items mỗi trang
 * @param {number} windowSize - Số trang hiển thị hai bên trang hiện tại
 * @param {"default" | "full" | "minimal"} rangeStyle - Kiểu hiển thị page range
 *
 * @returns {{
 *   page: number,
 *   setPage: Function,
 *   total: number,
 *   totalPages: number,
 *   startIdx: number,
 *   endIdx: number,
 *   pageItems: Array,
 *   pageRange: Array<number | "…">,
 *   goPrev: Function,
 *   goNext: Function,
 *   goTo: Function
 * }}
 */
export default function usePagination(
  list,
  pageSize = 10,
  windowSize = 1,
  rangeStyle = "default"
) {
  const [page, setPage] = useState(1)

  // Tính toán dữ liệu phân trang
  const { total, totalPages, startIdx, endIdx, pageItems } = useMemo(() => {
    const total = Array.isArray(list) ? list.length : 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const startIdx = (page - 1) * pageSize
    const endIdx = startIdx + pageSize
    const pageItems = (Array.isArray(list) ? list : []).slice(startIdx, endIdx)
    return { total, totalPages, startIdx, endIdx, pageItems }
  }, [list, page, pageSize])

  // Khi data ít lại → giảm trang nếu cần
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  // Điều hướng
  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const goNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages]
  )
  const goTo = useCallback(
    (p) => setPage(() => Math.min(Math.max(1, p), totalPages)),
    [totalPages]
  )

  // Tính toán range số trang
  const pageRange = useMemo(() => {
    if (rangeStyle === "minimal") return [] // chỉ dùng Prev/Next

    if (rangeStyle === "full") {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // default style
    const range = []
    if (totalPages <= 1) return [1]

    const left = Math.max(1, page - windowSize)
    const right = Math.min(totalPages, page + windowSize)

    // luôn thêm trang đầu
    if (left > 1) {
      range.push(1)
      if (left > 2) range.push("…")
    }

    // thêm windowSize hai bên
    for (let p = left; p <= right; p++) {
      range.push(p)
    }

    // luôn thêm trang cuối
    if (right < totalPages) {
      if (right < totalPages - 1) range.push("…")
      range.push(totalPages)
    }

    return range
  }, [page, totalPages, windowSize, rangeStyle])

  return {
    page,
    setPage,
    total,
    totalPages,
    startIdx,
    endIdx,
    pageItems,
    pageRange,
    goPrev,
    goNext,
    goTo,
  }
}
