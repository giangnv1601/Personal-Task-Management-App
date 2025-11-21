/* eslint-disable no-undef */
import { configureStore } from '@reduxjs/toolkit'

// Mock taskApi
jest.mock('@/api/taskApi.js', () => ({
  __esModule: true,
  fetchTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}))

import tasksReducer, {
  fetchTasksThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
} from '@/features/tasks/TasksSlice.js'

// Tạo store test chỉ với slice tasks
const createTestStore = () =>
  configureStore({
    reducer: {
      tasks: tasksReducer,
    },
  })

describe('Task integration flow (Redux state): fetch → create → edit → delete', () => {
  it('should go through full flow and update state correctly', () => {
    const store = createTestStore()

    // STEP 1: load danh sách ban đầu
    const initialTasks = [
      {
        id: 'task-1',
        user_id: 'user-1',
        title: 'Task ban đầu',
        description: 'Mô tả ban đầu',
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        priority: 'medium',
        status: 'todo',
        checklist: [],
        attachment_url: null,
      },
    ]

    // Giả lập fetchTasksThunk.fulfilled (API trả về danh sách)
    store.dispatch(
      fetchTasksThunk.fulfilled(initialTasks, 'req-fetch-1', {
        userId: 'user-1',
        limit: 50,
        offset: 0,
      })
    )

    let state = store.getState().tasks
    expect(state.items).toHaveLength(1)
    expect(state.items[0].title).toBe('Task ban đầu')
    expect(state.loading).toBe(false)
    expect(state.error).toBeNull()

    // STEP 2: tạo task mới
    const createPayload = {
      user_id: 'user-1',
      title: 'Task mới',
      description: 'Mô tả task mới',
      deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      priority: 'high',
      status: 'todo',
      checklist: [],
      attachment_url: null,
    }

    const createdTask = {
      id: 'task-2',
      ...createPayload,
    }

    // Giả lập createTaskThunk.fulfilled (API tạo và trả về task mới)
    store.dispatch(
      createTaskThunk.fulfilled(createdTask, 'req-create-1', createPayload)
    )

    state = store.getState().tasks
    // createTaskThunk.fulfilled → unshift payload
    expect(state.items).toHaveLength(2)
    expect(state.items[0].title).toBe('Task mới')
    expect(state.items[1].title).toBe('Task ban đầu')
    const createdId = state.items[0].id
    expect(createdId).toBe('task-2')

    // STEP 3: sửa task
    const updates = {
      title: 'Task đã sửa',
      status: 'in_progress',
    }

    const updatedTask = {
      ...createdTask,
      ...updates,
    }

    // Giả lập updateTaskThunk.fulfilled
    store.dispatch(
      updateTaskThunk.fulfilled(updatedTask, 'req-update-1', {
        taskId: createdId,
        updates,
      })
    )

    state = store.getState().tasks
    const foundUpdated = state.items.find((t) => t.id === createdId)
    expect(foundUpdated).toBeTruthy()
    expect(foundUpdated.title).toBe('Task đã sửa')
    expect(foundUpdated.status).toBe('in_progress')

    // Task ban đầu vẫn giữ nguyên
    const stillInitial = state.items.find((t) => t.id === 'task-1')
    expect(stillInitial).toBeTruthy()
    expect(stillInitial.title).toBe('Task ban đầu')

    // STEP 4: xóa task
    store.dispatch(
      deleteTaskThunk.fulfilled(createdId, 'req-delete-1', createdId)
    )

    state = store.getState().tasks
    const existsAfterDelete = state.items.some((t) => t.id === createdId)
    expect(existsAfterDelete).toBe(false)

    const stillHaveInitial = state.items.some(
      (t) => t.title === 'Task ban đầu'
    )
    expect(stillHaveInitial).toBe(true)
  })
})
