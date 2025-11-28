import { useDispatch, useSelector } from 'react-redux'
import { useMemo } from 'react'
import {
  fetchTasksThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
  clearTasksError,
  optimisticToggleStatus,
} from '@/features/tasks/TasksSlice.js'

export default function useTask() {
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
  } = useSelector((s) => s.tasks)

  // Tổng trạng thái mutation
  const isMutating = creating || updating || deleting

  // Actions
  const actions = useMemo(
    () => ({
      fetchTasks: (params) => dispatch(fetchTasksThunk(params)),
      createTask: (payload) => dispatch(createTaskThunk(payload)),
      updateTask: (taskId, updates) =>
        dispatch(updateTaskThunk({ taskId, updates })),
      deleteTask: (taskId) => dispatch(deleteTaskThunk(taskId)),
      clearError: () => dispatch(clearTasksError()),
      optimisticToggleStatus: (taskId) =>
        dispatch(optimisticToggleStatus(taskId)),
    }),
    [dispatch]
  )

  return {
    // data
    items,

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
