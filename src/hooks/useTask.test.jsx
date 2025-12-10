import { renderHook, act, waitFor } from '@testing-library/react'
import useTask from './useTask'
import { useDispatch, useSelector } from 'react-redux'
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

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock('@/features/tasks/TasksSlice.js', () => ({
  fetchTasksThunk: jest.fn(),
  fetchTasksCursorThunk: jest.fn(),
  createTaskThunk: jest.fn(),
  updateTaskThunk: jest.fn(),
  deleteTaskThunk: jest.fn(),
  clearTasksError: jest.fn(),
  optimisticToggleStatus: jest.fn(),
}))

jest.mock('@/utils/date', () => ({
  isDeadlineBeforeOrEqual: jest.fn(),
}))

describe('useTask hook (Unit)', () => {
  let mockDispatch
  let mockState

  beforeEach(() => {
    jest.clearAllMocks()

    mockDispatch = jest.fn()
    useDispatch.mockReturnValue(mockDispatch)

    // State mặc định: items rỗng → effect return sớm, tránh vòng lặp
    mockState = {
      tasks: {
        items: [],
        loading: false,
        creating: false,
        updating: false,
        deleting: false,
        error: null,
        errorType: null,
        errorStatus: null,
        cursor: 'cursor-1',
        hasMore: true,
      },
    }

    useSelector.mockImplementation((selector) => selector(mockState))
    isDeadlineBeforeOrEqual.mockReset()
  })

  // ---------- Wiring / state cơ bản ----------

  test('trả về state từ Redux + flags isMutating, cursor, hasMore', () => {
    const { result } = renderHook(() => useTask())

    expect(result.current.items).toEqual([])
    expect(result.current.itemsFiltered).toEqual([])

    expect(result.current.loading).toBe(false)
    expect(result.current.creating).toBe(false)
    expect(result.current.updating).toBe(false)
    expect(result.current.deleting).toBe(false)
    expect(result.current.isMutating).toBe(false)

    expect(result.current.cursor).toBe('cursor-1')
    expect(result.current.hasMore).toBe(true)

    expect(result.current.error).toBeNull()
    expect(result.current.errorType).toBeNull()
    expect(result.current.errorStatus).toBeNull()

    expect(result.current.isFiltering).toBe(false)
  })

  test('fetchTasks gọi dispatch(fetchTasksThunk(params))', () => {
    const thunkResult = { type: 'tasks/fetch/pending' }
    fetchTasksThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    const params = { userId: 'u1', limit: 20 }
    act(() => {
      result.current.fetchTasks(params)
    })

    expect(fetchTasksThunk).toHaveBeenCalledWith(params)
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('fetchTasksCursor gọi dispatch(fetchTasksCursorThunk(params))', () => {
    const thunkResult = { type: 'tasks/fetchCursor/pending' }
    fetchTasksCursorThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    const params = { userId: 'u1', cursor: 'c1' }
    act(() => {
      result.current.fetchTasksCursor(params)
    })

    expect(fetchTasksCursorThunk).toHaveBeenCalledWith(params)
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('createTask gọi dispatch(createTaskThunk(payload))', () => {
    const thunkResult = { type: 'tasks/create/pending' }
    createTaskThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    const payload = { title: 'New Task' }
    act(() => {
      result.current.createTask(payload)
    })

    expect(createTaskThunk).toHaveBeenCalledWith(payload)
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('updateTask gọi dispatch(updateTaskThunk({ taskId, updates }))', () => {
    const thunkResult = { type: 'tasks/update/pending' }
    updateTaskThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    act(() => {
      result.current.updateTask('task-1', { title: 'Updated' })
    })

    expect(updateTaskThunk).toHaveBeenCalledWith({
      taskId: 'task-1',
      updates: { title: 'Updated' },
    })
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('deleteTask gọi dispatch(deleteTaskThunk(taskId))', () => {
    const thunkResult = { type: 'tasks/delete/pending' }
    deleteTaskThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    act(() => {
      result.current.deleteTask('task-1')
    })

    expect(deleteTaskThunk).toHaveBeenCalledWith('task-1')
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('clearError gọi dispatch(clearTasksError())', () => {
    const thunkResult = { type: 'tasks/clearError' }
    clearTasksError.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    act(() => {
      result.current.clearError()
    })

    expect(clearTasksError).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('optimisticToggleStatus gọi dispatch(optimisticToggleStatus(taskId))', () => {
    const thunkResult = { type: 'tasks/toggleStatus' }
    optimisticToggleStatus.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useTask())

    act(() => {
      result.current.optimisticToggleStatus('task-1')
    })

    expect(optimisticToggleStatus).toHaveBeenCalledWith('task-1')
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  // ---------- Filtering logic (đoạn bạn muốn cover) ----------

  test('map thêm done và lọc theo searchText (title)', async () => {
    const items = [
      { id: '1', title: 'Task Alpha', status: 'done', priority: 'high' },
      { id: '2', title: 'Something else', status: 'todo', priority: 'low' },
    ]

    // override useSelector để dùng items này, giữ nguyên reference
    useSelector.mockImplementation((selector) =>
      selector({
        tasks: {
          ...mockState.tasks,
          items, // cùng một array reference cho mọi render
        },
      }),
    )

    const { result } = renderHook(() =>
      useTask({ searchText: 'task' }), // term = 'task'
    )

    await waitFor(() => {
      expect(result.current.itemsFiltered.length).toBe(1)
    })

    const only = result.current.itemsFiltered[0]
    expect(only.id).toBe('1')
    expect(only.done).toBe(true) // status 'done' → done = true
  })

  test('lọc theo priorityFilter và statusFilter', async () => {
    const items = [
      { id: '1', title: 'A', status: 'todo', priority: 'high' },
      { id: '2', title: 'B', status: 'done', priority: 'low' },
      { id: '3', title: 'C', status: 'done', priority: 'high' },
    ]

    useSelector.mockImplementation((selector) =>
      selector({
        tasks: {
          ...mockState.tasks,
          items,
        },
      }),
    )

    const { result } = renderHook(() =>
      useTask({ priorityFilter: 'high', statusFilter: 'done' }),
    )

    await waitFor(() => {
      expect(result.current.itemsFiltered.length).toBe(1)
    })

    const only = result.current.itemsFiltered[0]
    expect(only.id).toBe('3')
    expect(only.priority).toBe('high')
    expect(only.status).toBe('done')
  })

  test('lọc theo deadlineFilter và gọi isDeadlineBeforeOrEqual', async () => {
    const items = [
      {
        id: '1',
        title: 'Early',
        status: 'todo',
        priority: 'high',
        deadline: '2024-01-05T00:00:00.000Z',
      },
      {
        id: '2',
        title: 'Late',
        status: 'todo',
        priority: 'high',
        deadline: '2024-01-10T00:00:00.000Z',
      },
    ]

    useSelector.mockImplementation((selector) =>
      selector({
        tasks: {
          ...mockState.tasks,
          items,
        },
      }),
    )

    // Giả lập behavior: chỉ cho task 1 "đạt điều kiện"
    isDeadlineBeforeOrEqual.mockImplementation((deadline, dateStr) => {
      return deadline === '2024-01-05T00:00:00.000Z' && dateStr === '2024-01-06'
    })

    const { result } = renderHook(() =>
      useTask({ deadlineFilter: '2024-01-06' }),
    )

    await waitFor(() => {
      expect(result.current.itemsFiltered.length).toBe(1)
    })

    expect(isDeadlineBeforeOrEqual).toHaveBeenCalled()
    const only = result.current.itemsFiltered[0]
    expect(only.id).toBe('1')
  })
})
