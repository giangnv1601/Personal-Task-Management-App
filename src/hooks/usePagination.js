import { useCallback, useMemo, useState } from "react"

/**
 * usePagination
 *
 * @param {Array} list - Danh sách dữ liệu cần phân trang
 * @param {number} pageSize - Số items mỗi trang
 * @param {number} windowSize - Số trang hiển thị hai bên trang hiện tại
 * @param {"default" | "full" | "minimal"} rangeStyle - Kiểu hiển thị page range
 * @param {boolean} hasMoreFromServer - Còn dữ liệu phía server chưa load hết (cursor hasMore)
 * 
 * @return {{
 *  page: number,
 *  setPage: function,
 *  total: number,
 *  totalPages: number,
 *  startIdx: number,
 *  endIdx: number,
 *  pageItems: Array,
 *  pageRange: Array,
 *  goPrev: function,
 *  goNext: function,
 *  goTo: function,
 * }}
 */
export default function usePagination(
  list,
  pageSize = 10,
  windowSize = 1,
  rangeStyle = "default",
  hasMoreFromServer = false,
) {
  const [page, setPage] = useState(1)

  // Tính toán dữ liệu phân trang
  const { total, totalPages, startIdx, endIdx, pageItems } = useMemo(() => {
    const total = Array.isArray(list) ? list.length : 0
    const baseTotalPages = Math.max(1, Math.ceil(total / pageSize))

    // Nếu hasMoreFromServer = true → cộng thêm 1 page ảo
    const totalPages = hasMoreFromServer ? baseTotalPages + 1 : baseTotalPages

    const startIdx = (page - 1) * pageSize
    const endIdx = startIdx + pageSize
    const pageItems = (Array.isArray(list) ? list : []).slice(startIdx, endIdx)

    return { total, totalPages, startIdx, endIdx, pageItems }
  }, [list, page, pageSize, hasMoreFromServer])

  // Điều hướng
  const goPrev = useCallback(() => setPage((p) => Math.max(1, p - 1)), [])
  const goNext = useCallback(
    () => setPage((p) => Math.min(totalPages, p + 1)),
    [totalPages],
  )
  const goTo = useCallback(
    (p) => setPage(() => Math.min(Math.max(1, p), totalPages)),
    [totalPages],
  )

  // Tính toán range số trang
  const pageRange = useMemo(() => {
    if (rangeStyle === "minimal") return []

    // Trường hợp còn dữ liệu từ server chưa load hết (default)
    if (hasMoreFromServer) {
      const set = new Set()

      // luôn có trang 1
      set.add(1) 

      if (page - 1 > 1) {
        set.add(page - 1)
      }

      if (page !== 1) {
        set.add(page)
      }

      // trang kế tiếp để user click
      set.add(page + 1) 

      const numericPages = Array.from(set)
        .filter((p) => typeof p === "number" && p >= 1)
        .sort((a, b) => a - b)

      if (!numericPages.includes(1)) numericPages.unshift(1)

      // Ví dụ:
      // page=1  -> [1,2,"…"]
      // page=2  -> [1,2,3,"…"]
      // page=3  -> [1,2,3,4,"…"]
      return [...numericPages, "…"]
    }

    // Trường hợp đã load hết dữ liệu từ server
    if (rangeStyle === "full") {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

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
  }, [page, totalPages, windowSize, rangeStyle, hasMoreFromServer])

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
