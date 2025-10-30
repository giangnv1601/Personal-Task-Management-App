import { useDispatch, useSelector } from 'react-redux'
import { useMemo } from 'react'
import {
  fetchTasksThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
  clearTasksError
} from '@/features/tasks/TasksSlice.js'

export default function useTask() {
  const dispatch = useDispatch()
  const { items, loading, creating, updating, deleting, error } = useSelector(s => s.tasks)

  const actions = useMemo(() => ({
    fetchTasks: (p) => dispatch(fetchTasksThunk(p)),
    createTask: (payload) => dispatch(createTaskThunk(payload)),
    updateTask: (taskId, updates) => dispatch(updateTaskThunk({ taskId, updates })),
    deleteTask: (taskId) => dispatch(deleteTaskThunk(taskId)),
    clearError: () => dispatch(clearTasksError())
  }), [dispatch])

  return { items, loading, creating, updating, deleting, error, ...actions }
}
