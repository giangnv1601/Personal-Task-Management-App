import { useCallback, useEffect, useMemo, useState } from "react"

export default function usePagination(list, pageSize = 10, windowSize = 1) {
  const [page, setPage] = useState(1)

  const { total, totalPages, startIdx, endIdx, pageItems } = useMemo(() => {
    const total = Array.isArray(list) ? list.length : 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const startIdx = (page - 1) * pageSize
    const endIdx = startIdx + pageSize
    const pageItems = (Array.isArray(list) ? list : []).slice(startIdx, endIdx)
    return { total, totalPages, startIdx, endIdx, pageItems }
  }, [list, page, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const goPrev = useCallback(() => setPage(p => Math.max(1, p - 1)), [])
  const goNext = useCallback(() => setPage(p => Math.min(totalPages, p + 1)), [totalPages])
  const goTo = useCallback((p) => setPage(() => Math.min(Math.max(1, p), totalPages)), [totalPages])

  const pageRange = useMemo(() => {
    const range = []
    const total = totalPages
    const add = (p) => range.push(p)
    if (total === 0) return []
    add(1)
    let left = Math.max(2, page - windowSize)
    let right = Math.min(total - 1, page + windowSize)
    if (left > 2) range.push("…")
    for (let p = left; p <= right; p++) {
      if (p !== 1 && p !== total) add(p)
    }
    if (right < total - 1) range.push("…")
    if (total > 1 && total !== range[range.length - 1]) add(total)
    return range
  }, [page, totalPages, windowSize])

  return { page, setPage, total, totalPages, startIdx, endIdx, pageItems, pageRange, goPrev, goNext, goTo }
}


