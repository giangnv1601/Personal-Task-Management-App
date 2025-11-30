import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useMemo, useState, useTransition } from 'react'
import {
  fetchTasksThunk,
  fetchTasksCursorThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
  clearTasksError,
  optimisticToggleStatus,
} from '@/features/tasks/TasksSlice.js'
import { isDeadlineBeforeOrEqual } from '@/utils/date'

export default function useTask({
  searchText = '',
  priorityFilter = 'all',
  statusFilter = 'all',
  deadlineFilter = '',
} = {}) {
  const dispatch = useDispatch()

  const {
    items,
    loading,
    creating,
    updating,
    deleting,
    error,
    errorType,
    errorStatus,
    cursor,
    hasMore,
  } = useSelector((s) => s.tasks)

  // Tổng trạng thái mutation
  const isMutating = creating || updating || deleting

  // Filtering
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
      // map thêm done từ status (để UI chỉ cần dùng t.done)
      let next = src.map((t) => ({
        ...t,
        done: t.status === 'done',
      }))

      // Search theo title
      if (term) {
        next = next.filter((t) =>
          (t.title || '').toLowerCase().includes(term),
        )
      }

      // Lọc priority
      if (pf !== 'all') {
        next = next.filter(
          (t) => String(t.priority || '').toLowerCase() === pf,
        )
      }

      // Lọc status
      if (sf !== 'all') {
        next = next.filter(
          (t) => String(t.status || '').toLowerCase() === sf,
        )
      }

      // Lọc deadline (≤ ngày chọn)
      if (df) {
        next = next.filter(
          (t) => t.deadline && isDeadlineBeforeOrEqual(t.deadline, df),
        )
      }

      setItemsFiltered(next)
    })
  }, [items, searchText, priorityFilter, statusFilter, deadlineFilter])

  // Actions
  const actions = useMemo(
    () => ({
      fetchTasks: (params) => dispatch(fetchTasksThunk(params)),
      fetchTasksCursor: (params) => dispatch(fetchTasksCursorThunk(params)),
      createTask: (payload) => dispatch(createTaskThunk(payload)),
      updateTask: (taskId, updates) =>
        dispatch(updateTaskThunk({ taskId, updates })),
      deleteTask: (taskId) => dispatch(deleteTaskThunk(taskId)),
      clearError: () => dispatch(clearTasksError()),
      optimisticToggleStatus: (taskId) =>
        dispatch(optimisticToggleStatus(taskId)),
    }),
    [dispatch],
  )

  return {
    // data gốc + data đã lọc
    items,
    itemsFiltered,

    // trạng thái lọc (useTransition)
    isFiltering,

    // cursor state
    cursor,
    hasMore,

    // status
    loading,
    creating,
    updating,
    deleting,
    isMutating,

    // thông tin lỗi
    error,
    errorType,
    errorStatus,

    // actions
    ...actions,
  }
}
