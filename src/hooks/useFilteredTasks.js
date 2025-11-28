import { useEffect, useState, useTransition } from 'react'
import useTask from './useTask'
import { isDeadlineBeforeOrEqual } from '@/utils/date'

export default function useFilteredTasks({
  searchText = '',
  priorityFilter = 'all',
  statusFilter = 'all',
  deadlineFilter = '',
} = {}) {
  const { items, ...rest } = useTask()

  const [itemsFiltered, setItemsFiltered] = useState([])
  const [isFiltering, startTransition] = useTransition()

  useEffect(() => {
    const src = Array.isArray(items) ? items : []

    if (src.length === 0) {
      setItemsFiltered([])
      return
    }

    const term = (searchText || '').toLowerCase()
    const pf = (priorityFilter || 'all').toLowerCase()
    const sf = (statusFilter || 'all').toLowerCase()
    const df = deadlineFilter

    startTransition(() => {
      // map thêm done từ status
      let next = src.map((t) => ({
        ...t,
        done: t.status === 'done',
      }))

      // Search theo title
      if (term) {
        next = next.filter((t) =>
          (t.title || '').toLowerCase().includes(term)
        )
      }

      // Lọc priority
      if (pf !== 'all') {
        next = next.filter(
          (t) => String(t.priority || '').toLowerCase() === pf
        )
      }

      // Lọc status
      if (sf !== 'all') {
        next = next.filter(
          (t) => String(t.status || '').toLowerCase() === sf
        )
      }

      // Lọc deadline (≤ ngày chọn)
      if (df) {
        next = next.filter(
          (t) => t.deadline && isDeadlineBeforeOrEqual(t.deadline, df)
        )
      }

      setItemsFiltered(next)
    })
  }, [items, searchText, priorityFilter, statusFilter, deadlineFilter])

  return {
    ...rest,
    
    items,
    itemsFiltered,
    isFiltering,
  }
}
