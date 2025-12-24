import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { 
  fetchTasks, 
  fetchTasksCursor,
  createTask, 
  updateTask, 
  deleteTask 
} from '@/api/taskApi.js'

// Xử lý lỗi từ response API
const buildErrorPayload = (res, fallbackMessage) => {
  const status = res?.status ?? null
  const message = res?.error || fallbackMessage || 'Unexpected error'

  let type = 'unknown'
  if (status === 0) type = 'network'
  else if (status >= 500) type = 'server'
  else if (status >= 400) type = 'validation'

  return { message, status, type }
}

// Thunks
export const fetchTasksThunk = createAsyncThunk(
  'tasks/fetch',
  async ({ userId, limit = 50, offset = 0 } = {}, { rejectWithValue }) => {
    try {
      const res = await fetchTasks({ userId, limit, offset })
      if (!res?.ok) return rejectWithValue(buildErrorPayload(res, 'Fetch tasks failed'))
      return res.data
    } catch (err) {
      return rejectWithValue({
        message: err?.message || 'Network error while fetching tasks',
        status: 0,
        type: 'network',
      })
    }
  }
)

export const fetchTasksCursorThunk = createAsyncThunk(
  'tasks/fetchCursor',
  async ({ userId, limit = 20, cursor = null } = {}, { rejectWithValue }) => {
    try {
      const res = await fetchTasksCursor({ userId, limit, cursor })
      if (!res?.ok) {
        return rejectWithValue(buildErrorPayload(res, 'Fetch tasks (cursor) failed'))
      }

      const items = res.data || []

      return {
        items,
        nextCursor: res.nextCursor ?? null,
        hasMore: typeof res.hasMore === 'boolean'
          ? res.hasMore
          : items.length === limit,
      }
    } catch (err) {
      return rejectWithValue({
        message: err?.message || 'Network error while fetching tasks (cursor)',
        status: 0,
        type: 'network',
      })
    }
  }
)


export const createTaskThunk = createAsyncThunk(
  'tasks/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await createTask(payload)
      if (!res?.ok) return rejectWithValue(buildErrorPayload(res, 'Create task failed'))
      return Array.isArray(res.data) ? res.data[0] : res.data
    } catch (err) {
      return rejectWithValue({
        message: err?.message || 'Network error while creating task',
        status: 0,
        type: 'network',
      })
    }
  }
)

export const updateTaskThunk = createAsyncThunk(
  'tasks/update',
  async ({ taskId, updates }, { rejectWithValue }) => {
    try {
      const res = await updateTask(taskId, updates)
      if (!res?.ok) return rejectWithValue(buildErrorPayload(res, 'Update task failed'))
      return Array.isArray(res.data) ? res.data[0] : res.data
    } catch (err) {
      return rejectWithValue({
        message: err?.message || 'Network error while updating task',
        status: 0,
        type: 'network',
      })
    }
  }
)

export const deleteTaskThunk = createAsyncThunk(
  'tasks/delete',
  async (taskId, { rejectWithValue }) => {
    try {
      const res = await deleteTask(taskId)
      if (!res?.ok) return rejectWithValue(buildErrorPayload(res, 'Delete task failed'))
      return taskId
    } catch (err) {
      return rejectWithValue({
        message: err?.message || 'Network error while deleting task',
        status: 0,
        type: 'network',
      })
    }
  }
)

// Slice
const initialState = {
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
  optimisticBackup: {}, // lưu trữ bản backup khi optimistic update
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(state) {
      state.error = null
      state.errorType = null
      state.errorStatus = null
    },
    // Hỗ trợ optimistic update cho toggle status
    // (UI sẽ dispatch action này ngay khi user click checkbox,
    // sau đó mới dispatch updateTaskThunk để sync với server)
    optimisticToggleStatus(state, action) {
      const taskId = action.payload
      const idx = state.items.findIndex((t) => String(t.id) === String(taskId))
      if (idx === -1) return

      const current = state.items[idx]

      // Lưu backup lần đầu tiên toggle để có thể revert nếu API fail
      if (!state.optimisticBackup[taskId]) {
        state.optimisticBackup[taskId] = { ...current }
      }

      const nextStatus = current.status === 'done' ? 'todo' : 'done'
      state.items[idx] = { ...current, status: nextStatus }
    }
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTasksThunk.pending, (s) => {
        s.loading = true
        s.error = null
        s.errorType = null
        s.errorStatus = null
      })
      .addCase(fetchTasksThunk.fulfilled, (s, a) => {
        s.loading = false
        s.items = a.payload || []
      })
      .addCase(fetchTasksThunk.rejected, (s, a) => {
        s.loading = false
        const err = a.payload || {
          message: a.error?.message || 'Fetch tasks failed',
          type: 'unknown',
          status: null,
        }
        s.error = err.message
        s.errorType = err.type
        s.errorStatus = err.status
      })

      // fetch cursor
      .addCase(fetchTasksCursorThunk.fulfilled, (s, a) => {
        s.loading = false

        const {
          items = [],
          nextCursor = null,
          hasMore = false,
        } = a.payload || {}

        const argCursor = a.meta?.arg?.cursor ?? null
        const isFirstPage = !argCursor // nếu gọi với cursor = null → page đầu

        if (isFirstPage) {
          // Lần đầu: thay hẳn danh sách
          s.items = items
        } else {
          // Các lần sau: append, tránh trùng id
          const existingIds = new Set(s.items.map((t) => String(t.id)))
          const merged = items.filter((t) => !existingIds.has(String(t.id)))
          s.items.push(...merged)
        }

        s.cursor = nextCursor
        s.hasMore = hasMore
      })
      .addCase(fetchTasksCursorThunk.rejected, (s, a) => {
        s.loading = false
        const err = a.payload || {
          message: a.error?.message || 'Fetch tasks (cursor) failed',
          type: 'unknown',
          status: null,
        }
        s.error = err.message
        s.errorType = err.type
        s.errorStatus = err.status
      })

      // create
      .addCase(createTaskThunk.pending, (s) => {
        s.creating = true
        s.error = null
        s.errorType = null
        s.errorStatus = null
      })
      .addCase(createTaskThunk.fulfilled, (s, a) => {
        s.creating = false
        if (a.payload) s.items.unshift(a.payload)
      })
      .addCase(createTaskThunk.rejected, (s, a) => {
        s.creating = false
        const err = a.payload || {
          message: a.error?.message || 'Create task failed',
          type: 'unknown',
          status: null,
        }
        s.error = err.message
        s.errorType = err.type
        s.errorStatus = err.status
      })

      // update
      .addCase(updateTaskThunk.pending, (s) => {
        s.updating = true
        s.error = null
        s.errorType = null
        s.errorStatus = null
      })
      .addCase(updateTaskThunk.fulfilled, (s, a) => {
        s.updating = false
        const updated = a.payload
        if (!updated?.id) return
        const i = s.items.findIndex((t) => t.id === updated.id)
        if (i !== -1) {
          s.items[i] = updated
        }
        // Nếu update thành công, xoá backup optimistic (nếu có)
        if (s.optimisticBackup[updated.id]) {
          delete s.optimisticBackup[updated.id]
        }
      })
      .addCase(updateTaskThunk.rejected, (s, a) => {
        s.updating = false
        const err = a.payload || {
          message: a.error?.message || 'Update task failed',
          type: 'unknown',
          status: null,
        }
        s.error = err.message
        s.errorType = err.type
        s.errorStatus = err.status

        // Nếu là update của 1 task có backup optimistic, revert lại
        const taskId = a.meta?.arg?.taskId
        if (taskId && s.optimisticBackup[taskId]) {
          const original = s.optimisticBackup[taskId]
          const idx = s.items.findIndex((t) => String(t.id) === String(taskId))
          if (idx !== -1) {
            s.items[idx] = original
          }
          delete s.optimisticBackup[taskId]
        }
      })

      // delete
      .addCase(deleteTaskThunk.pending, (s) => {
        s.deleting = true
        s.error = null
        s.errorType = null
        s.errorStatus = null
      })
      .addCase(deleteTaskThunk.fulfilled, (s, a) => {
        s.deleting = false
        const taskId = a.payload
        s.items = s.items.filter((t) => t.id !== taskId)
        if (s.optimisticBackup[taskId]) {
          delete s.optimisticBackup[taskId]
        }
      })
      .addCase(deleteTaskThunk.rejected, (s, a) => {
        s.deleting = false
        const err = a.payload || {
          message: a.error?.message || 'Delete task failed',
          type: 'unknown',
          status: null,
        }
        s.error = err.message
        s.errorType = err.type
        s.errorStatus = err.status
      })
  }
})

export const {
  clearTasksError,
  optimisticToggleStatus,
} = tasksSlice.actions

export default tasksSlice.reducer
