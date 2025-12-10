// src/features/tasks/__tests__/TasksSlice.test.jsx
import tasksReducer, {
  clearTasksError,
  optimisticToggleStatus,
  fetchTasksThunk,
  fetchTasksCursorThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
} from '@/features/tasks/TasksSlice.js'

import {
  fetchTasks,
  fetchTasksCursor,
  createTask,
  updateTask,
  deleteTask,
} from '@/api/taskApi.js'

// Mock toàn bộ API layer
jest.mock('@/api/taskApi.js', () => ({
  fetchTasks: jest.fn(),
  fetchTasksCursor: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}))

const makeInitialState = () => ({
  items: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null,
  errorType: null,
  errorStatus: null,
  cursor: null,
  hasMore: true,
  optimisticBackup: {},
})

describe('tasksSlice – reducers & extraReducers', () => {
  test('should return initial state when passed undefined', () => {
    const state = tasksReducer(undefined, { type: '@@INIT' })

    expect(state).toEqual({
      items: [],
      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
      errorType: null,
      errorStatus: null,
      cursor: null,
      hasMore: true,
      optimisticBackup: {},
    })
  })

  test('clearTasksError xoá error, errorType, errorStatus', () => {
    const prev = {
      ...makeInitialState(),
      error: 'Lỗi gì đó',
      errorType: 'server',
      errorStatus: 500,
    }

    const next = tasksReducer(prev, clearTasksError())

    expect(next.error).toBeNull()
    expect(next.errorType).toBeNull()
    expect(next.errorStatus).toBeNull()
  })

  test('optimisticToggleStatus lưu backup lần đầu và flip status', () => {
    const prev = {
      ...makeInitialState(),
      items: [
        { id: '1', title: 'Task 1', status: 'todo' },
        { id: '2', title: 'Task 2', status: 'done' },
      ],
      optimisticBackup: {},
    }

    const next1 = tasksReducer(prev, optimisticToggleStatus('1'))
    expect(next1.items[0].status).toBe('done')
    expect(next1.optimisticBackup['1']).toEqual({
      id: '1',
      title: 'Task 1',
      status: 'todo',
    })

    // Toggle lần 2: vẫn dựa trên status hiện tại nhưng không override backup
    const next2 = tasksReducer(next1, optimisticToggleStatus('1'))
    expect(next2.items[0].status).toBe('todo')
    expect(next2.optimisticBackup['1']).toEqual({
      id: '1',
      title: 'Task 1',
      status: 'todo',
    })
  })

  test('optimisticToggleStatus không làm gì khi taskId không tồn tại', () => {
    const prev = {
      ...makeInitialState(),
      items: [{ id: '1', status: 'todo' }],
      optimisticBackup: {},
    }

    const next = tasksReducer(prev, optimisticToggleStatus('2'))
    expect(next).toEqual(prev)
  })

  test('fetchTasksThunk.fulfilled gán items và tắt loading', () => {
    const prev = {
      ...makeInitialState(),
      loading: true,
    }

    const payload = [
      { id: '1', title: 'T1' },
      { id: '2', title: 'T2' },
    ]

    const next = tasksReducer(prev, {
      type: fetchTasksThunk.fulfilled.type,
      payload,
    })

    expect(next.loading).toBe(false)
    expect(next.items).toEqual(payload)
  })

  test('fetchTasksThunk.rejected set error, errorType, errorStatus từ payload', () => {
    const prev = {
      ...makeInitialState(),
      loading: true,
    }

    const payload = {
      message: 'Validation error',
      status: 400,
      type: 'validation',
    }

    const next = tasksReducer(prev, {
      type: fetchTasksThunk.rejected.type,
      payload,
      error: { message: 'ignored' },
    })

    expect(next.loading).toBe(false)
    expect(next.error).toBe('Validation error')
    expect(next.errorType).toBe('validation')
    expect(next.errorStatus).toBe(400)
  })

  test('fetchTasksCursorThunk.fulfilled – first page thay hoàn toàn items & set cursor/hasMore', () => {
    const prev = {
      ...makeInitialState(),
      loading: true,
      items: [{ id: 'old', title: 'Old' }],
    }

    const payload = {
      items: [
        { id: '1', title: 'T1' },
        { id: '2', title: 'T2' },
      ],
      nextCursor: 'cursor-123',
      hasMore: true,
    }

    const action = {
      type: fetchTasksCursorThunk.fulfilled.type,
      payload,
      meta: {
        arg: { cursor: null, limit: 20, userId: 'user-123' },
      },
    }

    const next = tasksReducer(prev, action)

    expect(next.loading).toBe(false)
    expect(next.items).toEqual(payload.items)
    expect(next.cursor).toBe('cursor-123')
    expect(next.hasMore).toBe(true)
  })

  test('fetchTasksCursorThunk.fulfilled – next page append và tránh trùng id', () => {
    const prev = {
      ...makeInitialState(),
      loading: true,
      items: [
        { id: '1', title: 'T1' },
        { id: '2', title: 'T2' },
      ],
      cursor: 'cursor-old',
    }

    const payload = {
      items: [
        { id: '2', title: 'T2 duplicate' },
        { id: '3', title: 'T3' },
      ],
      nextCursor: 'cursor-new',
      hasMore: false,
    }

    const action = {
      type: fetchTasksCursorThunk.fulfilled.type,
      payload,
      meta: {
        arg: { cursor: 'cursor-old', limit: 20, userId: 'user-123' },
      },
    }

    const next = tasksReducer(prev, action)

    expect(next.loading).toBe(false)
    expect(next.items).toEqual([
      { id: '1', title: 'T1' },
      { id: '2', title: 'T2' },
      { id: '3', title: 'T3' },
    ])
    expect(next.cursor).toBe('cursor-new')
    expect(next.hasMore).toBe(false)
  })

  test('fetchTasksCursorThunk.rejected set error từ payload', () => {
    const prev = {
      ...makeInitialState(),
      loading: true,
    }

    const payload = {
      message: 'Cursor failed',
      status: 500,
      type: 'server',
    }

    const next = tasksReducer(prev, {
      type: fetchTasksCursorThunk.rejected.type,
      payload,
      error: { message: 'ignored' },
    })

    expect(next.loading).toBe(false)
    expect(next.error).toBe('Cursor failed')
    expect(next.errorType).toBe('server')
    expect(next.errorStatus).toBe(500)
  })

  test('createTaskThunk.fulfilled push task mới lên đầu items', () => {
    const prev = {
      ...makeInitialState(),
      creating: true,
      items: [{ id: '1', title: 'Old' }],
    }

    const payload = { id: '2', title: 'New task' }

    const next = tasksReducer(prev, {
      type: createTaskThunk.fulfilled.type,
      payload,
    })

    expect(next.creating).toBe(false)
    expect(next.items[0]).toEqual(payload)
    expect(next.items[1]).toEqual({ id: '1', title: 'Old' })
  })

  test('createTaskThunk.rejected set error từ payload', () => {
    const prev = {
      ...makeInitialState(),
      creating: true,
    }

    const payload = {
      message: 'Create failed',
      status: 400,
      type: 'validation',
    }

    const next = tasksReducer(prev, {
      type: createTaskThunk.rejected.type,
      payload,
      error: { message: 'ignored' },
    })

    expect(next.creating).toBe(false)
    expect(next.error).toBe('Create failed')
    expect(next.errorType).toBe('validation')
    expect(next.errorStatus).toBe(400)
  })

  test('updateTaskThunk.fulfilled update item và xoá optimisticBackup', () => {
    const prev = {
      ...makeInitialState(),
      updating: true,
      items: [
        { id: '1', title: 'Old title', status: 'todo' },
        { id: '2', title: 'Another', status: 'done' },
      ],
      optimisticBackup: {
        '1': { id: '1', title: 'Old title', status: 'todo' },
      },
    }

    const payload = { id: '1', title: 'New title', status: 'done' }

    const next = tasksReducer(prev, {
      type: updateTaskThunk.fulfilled.type,
      payload,
    })

    expect(next.updating).toBe(false)
    expect(next.items[0]).toEqual(payload)
    expect(next.optimisticBackup['1']).toBeUndefined()
  })

  test('updateTaskThunk.rejected revert lại từ optimisticBackup và set error', () => {
    const prev = {
      ...makeInitialState(),
      updating: true,
      items: [
        { id: '1', title: 'Optimistic title', status: 'done' },
      ],
      optimisticBackup: {
        '1': { id: '1', title: 'Original title', status: 'todo' },
      },
    }

    const payload = {
      message: 'Update failed',
      status: 500,
      type: 'server',
    }

    const action = {
      type: updateTaskThunk.rejected.type,
      payload,
      error: { message: 'ignored' },
      meta: { arg: { taskId: '1' } },
    }

    const next = tasksReducer(prev, action)

    expect(next.updating).toBe(false)
    expect(next.error).toBe('Update failed')
    expect(next.errorType).toBe('server')
    expect(next.errorStatus).toBe(500)
    // Revert lại item từ backup
    expect(next.items[0]).toEqual({
      id: '1',
      title: 'Original title',
      status: 'todo',
    })
    // Xoá backup
    expect(next.optimisticBackup['1']).toBeUndefined()
  })

  test('deleteTaskThunk.fulfilled xoá item và xoá backup nếu có', () => {
    const prev = {
      ...makeInitialState(),
      deleting: true,
      items: [
        { id: '1', title: 'T1' },
        { id: '2', title: 'T2' },
      ],
      optimisticBackup: {
        '1': { id: '1', title: 'T1 backup' },
      },
    }

    const next = tasksReducer(prev, {
      type: deleteTaskThunk.fulfilled.type,
      payload: '1',
    })

    expect(next.deleting).toBe(false)
    expect(next.items).toEqual([{ id: '2', title: 'T2' }])
    expect(next.optimisticBackup['1']).toBeUndefined()
  })

  test('deleteTaskThunk.rejected set error từ payload', () => {
    const prev = {
      ...makeInitialState(),
      deleting: true,
    }

    const payload = {
      message: 'Delete failed',
      status: 500,
      type: 'server',
    }

    const next = tasksReducer(prev, {
      type: deleteTaskThunk.rejected.type,
      payload,
      error: { message: 'ignored' },
    })

    expect(next.deleting).toBe(false)
    expect(next.error).toBe('Delete failed')
    expect(next.errorType).toBe('server')
    expect(next.errorStatus).toBe(500)
  })
})

describe('tasksSlice – thunks gọi API (mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('fetchTasksThunk thành công khi API ok=true', async () => {
    fetchTasks.mockResolvedValue({
      ok: true,
      status: 200,
      data: [{ id: '1', title: 'API Task' }],
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await fetchTasksThunk({ userId: 'user-123', limit: 10, offset: 0 })(
      dispatch,
      getState,
      undefined,
    )

    expect(fetchTasks).toHaveBeenCalledWith({
      userId: 'user-123',
      limit: 10,
      offset: 0,
    })

    // pending + fulfilled
    expect(dispatch).toHaveBeenCalledTimes(2)
    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(fetchTasksThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual([{ id: '1', title: 'API Task' }])
  })

  test('fetchTasksThunk rejected với type="validation" khi ok=false & status>=400', async () => {
    fetchTasks.mockResolvedValue({
      ok: false,
      status: 400,
      error: 'Bad request',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await fetchTasksThunk({ userId: 'user-123' })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(fetchTasksThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Bad request',
      status: 400,
      type: 'validation', // từ buildErrorPayload
    })
  })

  test('fetchTasksThunk rejected với type="network" khi API throw', async () => {
    fetchTasks.mockRejectedValue(new Error('Network down'))

    const dispatch = jest.fn()
    const getState = () => ({})

    await fetchTasksThunk({ userId: 'user-123' })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(fetchTasksThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Network down',
      status: 0,
      type: 'network',
    })
  })

  test('fetchTasksCursorThunk trả items, nextCursor, hasMore chuẩn', async () => {
    fetchTasksCursor.mockResolvedValue({
      ok: true,
      status: 200,
      data: [{ id: '1' }, { id: '2' }],
      nextCursor: 'cursor-xyz',
      hasMore: true,
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await fetchTasksCursorThunk({
      userId: 'user-123',
      limit: 2,
      cursor: null,
    })(dispatch, getState, undefined)

    expect(fetchTasksCursor).toHaveBeenCalledWith({
      userId: 'user-123',
      limit: 2,
      cursor: null,
    })

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(fetchTasksCursorThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual({
      items: [{ id: '1' }, { id: '2' }],
      nextCursor: 'cursor-xyz',
      hasMore: true,
    })
  })

  test('fetchTasksCursorThunk rejected khi ok=false', async () => {
    fetchTasksCursor.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Server boom',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await fetchTasksCursorThunk({ userId: 'user-123' })(
      dispatch,
      getState,
      undefined,
    )

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(fetchTasksCursorThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Server boom',
      status: 500,
      type: 'server',
    })
  })

  test('createTaskThunk thành công khi ok=true và data là mảng', async () => {
    const apiTask = { id: '123', title: 'From API' }

    createTask.mockResolvedValue({
      ok: true,
      status: 201,
      data: [apiTask],
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await createTaskThunk({ title: 'From API' })(
      dispatch,
      getState,
      undefined,
    )

    expect(createTask).toHaveBeenCalledWith({ title: 'From API' })

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(createTaskThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual(apiTask)
  })

  test('createTaskThunk rejected khi ok=false', async () => {
    createTask.mockResolvedValue({
      ok: false,
      status: 422,
      error: 'Validation failed',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await createTaskThunk({ title: 'Bad' })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(createTaskThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Validation failed',
      status: 422,
      type: 'validation',
    })
  })

  test('createTaskThunk rejected khi API throw', async () => {
    createTask.mockRejectedValue(new Error('Network lost'))

    const dispatch = jest.fn()
    const getState = () => ({})

    await createTaskThunk({ title: 'Any' })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(createTaskThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Network lost',
      status: 0,
      type: 'network',
    })
  })

  // ====== 3 TEST MỚI: updateTaskThunk ======

  test('updateTaskThunk gọi updateTask đúng tham số và dispatch fulfilled khi ok=true', async () => {
    const updatedTask = { id: '123', title: 'Updated from API', status: 'done' }

    // API trả về ok=true, data là mảng (Supabase + Prefer:return=representation)
    updateTask.mockResolvedValue({
      ok: true,
      data: [updatedTask],
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await updateTaskThunk({
      taskId: '123',
      updates: { title: 'Updated from API', status: 'done' },
    })(dispatch, getState, undefined)

    // Gọi đúng API với taskId + updates
    expect(updateTask).toHaveBeenCalledWith(
      '123',
      { title: 'Updated from API', status: 'done' },
    )

    // Lần 1: pending, lần 2: fulfilled với payload đã bóc từ mảng
    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(updateTaskThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual(updatedTask)
  })

  test('updateTaskThunk trả rejectedWithValue type=server khi ok=false & status>=500', async () => {
    updateTask.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Server exploded',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await updateTaskThunk({
      taskId: '123',
      updates: { title: 'Will fail' },
    })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(updateTaskThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Server exploded',
      status: 500,
      type: 'server', // nhánh buildErrorPayload với status >= 500
    })
  })

  test('updateTaskThunk trả rejectedWithValue type=network khi API throw (catch branch)', async () => {
    updateTask.mockRejectedValue(new Error('Network timeout'))

    const dispatch = jest.fn()
    const getState = () => ({})

    await updateTaskThunk({
      taskId: '999',
      updates: { title: 'Whatever' },
    })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(updateTaskThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Network timeout',
      status: 0,
      type: 'network', // nhánh catch trong updateTaskThunk
    })
  })

  test('deleteTaskThunk thành công khi ok=true', async () => {
    deleteTask.mockResolvedValue({
      ok: true,
      status: 204,
      data: null,
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await deleteTaskThunk('123')(dispatch, getState, undefined)

    expect(deleteTask).toHaveBeenCalledWith('123')

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(deleteTaskThunk.fulfilled.type)
    expect(fulfilled.payload).toBe('123')
  })

  test('deleteTaskThunk rejected khi ok=false', async () => {
    deleteTask.mockResolvedValue({
      ok: false,
      status: 500,
      error: 'Delete failed at server',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await deleteTaskThunk('123')(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(deleteTaskThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Delete failed at server',
      status: 500,
      type: 'server',
    })
  })

  test('deleteTaskThunk rejected khi API throw', async () => {
    deleteTask.mockRejectedValue(new Error('Network gone'))

    const dispatch = jest.fn()
    const getState = () => ({})

    await deleteTaskThunk('123')(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(deleteTaskThunk.rejected.type)
    expect(rejected.payload).toEqual({
      message: 'Network gone',
      status: 0,
      type: 'network',
    })
  })
})
