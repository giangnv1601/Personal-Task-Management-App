// src/features/tasks/TasksSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { fetchTasks, createTask, updateTask, deleteTask } from '@/api/taskApi.js'

// ===== Thunks =====
export const fetchTasksThunk = createAsyncThunk(
  'tasks/fetch',
  async ({ userId, limit = 50, offset = 0 } = {}, { rejectWithValue }) => {
    const res = await fetchTasks({ userId, limit, offset })
    if (!res.ok) return rejectWithValue(res.error || 'Fetch tasks failed')
    return res.data // mảng tasks
  }
)

export const createTaskThunk = createAsyncThunk(
  'tasks/create',
  async (payload, { rejectWithValue }) => {
    const res = await createTask(payload) // Supabase trả về mảng record mới
    if (!res.ok) return rejectWithValue(res.error || 'Create task failed')
    return Array.isArray(res.data) ? res.data[0] : res.data
  }
)

export const updateTaskThunk = createAsyncThunk(
  'tasks/update',
  async ({ taskId, updates }, { rejectWithValue }) => {
    const res = await updateTask(taskId, updates) // trả mảng record
    if (!res.ok) return rejectWithValue(res.error || 'Update task failed')
    return Array.isArray(res.data) ? res.data[0] : res.data
  }
)

export const deleteTaskThunk = createAsyncThunk(
  'tasks/delete',
  async (taskId, { rejectWithValue }) => {
    const res = await deleteTask(taskId) // 204 No Content khi ok
    if (!res.ok) return rejectWithValue(res.error || 'Delete task failed')
    return taskId
  }
)

// ===== Slice =====
const initialState = {
  items: [],
  loading: false,
  creating: false,
  updating: false,
  deleting: false,
  error: null
}

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasksError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchTasksThunk.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchTasksThunk.fulfilled, (s, a) => { s.loading = false; s.items = a.payload || [] })
      .addCase(fetchTasksThunk.rejected, (s, a) => { s.loading = false; s.error = a.payload || String(a.error?.message) })

      // create
      .addCase(createTaskThunk.pending, (s) => { s.creating = true; s.error = null })
      .addCase(createTaskThunk.fulfilled, (s, a) => {
        s.creating = false
        if (a.payload) s.items.unshift(a.payload)
      })
      .addCase(createTaskThunk.rejected, (s, a) => { s.creating = false; s.error = a.payload || String(a.error?.message) })

      // update
      .addCase(updateTaskThunk.pending, (s) => { s.updating = true; s.error = null })
      .addCase(updateTaskThunk.fulfilled, (s, a) => {
        s.updating = false
        const i = s.items.findIndex(t => t.id === a.payload?.id)
        if (i !== -1) s.items[i] = a.payload
      })
      .addCase(updateTaskThunk.rejected, (s, a) => { s.updating = false; s.error = a.payload || String(a.error?.message) })

      // delete
      .addCase(deleteTaskThunk.pending, (s) => { s.deleting = true; s.error = null })
      .addCase(deleteTaskThunk.fulfilled, (s, a) => {
        s.deleting = false
        s.items = s.items.filter(t => t.id !== a.payload)
      })
      .addCase(deleteTaskThunk.rejected, (s, a) => { s.deleting = false; s.error = a.payload || String(a.error?.message) })
  }
})

export const { clearTasksError } = tasksSlice.actions
export default tasksSlice.reducer
