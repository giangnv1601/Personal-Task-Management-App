import React, { useMemo } from "react"
import { Provider } from "react-redux"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import TasksPage from "./TasksPage.jsx"

// Fake Rudex
function createFakeStore(tasksStateOverrides = {}, authOverrides = {}) {
  const state = {
    auth: {
      user: {
        id: "storybook-user-1",
        email: "demo@example.com",
        ...authOverrides,
      },
    },
    tasks: {
      items: [],
      loading: false,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
      errorType: null,
      errorStatus: null,
      cursor: null,
      hasMore: false,
      optimisticBackup: {},
      ...tasksStateOverrides,
    },
  }

  return {
    getState: () => state,
    dispatch: (action) => {
      // Trong Storybook chỉ log ra cho vui, không update state
      console.log("[Storybook fake dispatch]", action)
      return action
    },
    subscribe: () => () => {},
  }
}

// Helper tạo list task giả
function makeTasks(count, { startId = 1 } = {}) {
  const priorities = ["low", "medium", "high"]
  const result = []

  for (let i = 0; i < count; i++) {
    const id = String(startId + i)
    const priority = priorities[i % priorities.length]
    const done = i % 3 === 0
    result.push({
      id,
      title: `Task #${id} - ${done ? "Done" : "Todo"}`,
      description: `Mô tả ngắn cho task #${id}`,
      priority,
      status: done ? "done" : "todo",
      done,
      deadline: "2025-12-31T12:00:00.000Z",
      created_at: "2025-01-01T10:00:00.000Z",
      user_id: "storybook-user-1",
      checklist: [],
    })
  }

  return result
}

// Shell bọc Provider + Router
function StoryShell({
  tasksState,
  authState,
  initialEntries = ["/tasks"],
}) {
  const store = useMemo(
    () => createFakeStore(tasksState, authState),
    [tasksState, authState],
  )

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/tasks" element={<TasksPage />} />
          {/* Các route con để Link hoạt động, nhưng chỉ render text placeholder */}
          <Route
            path="/tasks/new"
            element={<div className="p-4">[Mock] Trang tạo task mới</div>}
          />
          <Route
            path="/tasks/detail/:id"
            element={<div className="p-4">[Mock] Trang chi tiết task</div>}
          />
          <Route
            path="/tasks/edit/:id"
            element={<div className="p-4">[Mock] Trang sửa task</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: "Tasks/TasksPage",
  component: TasksPage,
  tags: ["autodocs"],
}
export default meta

//1) Default: vài task, mode paged, 1 page
export const Default = {
  render: () => (
    <StoryShell
      tasksState={{
        items: makeTasks(6), // < 10 → 1 page, chưa chạm threshold infinite
        loading: false,
        error: null,
        cursor: null,
        hasMore: false,
      }}
    />
  ),
}

// 2) Loading: đang tải
export const Loading = {
  render: () => (
    <StoryShell
      tasksState={{
        items: [], // chưa có gì
        loading: true,
        error: null,
        cursor: null,
        hasMore: true,
      }}
    />
  ),
}

// 3) Empty: không có task nào
export const Empty = {
  render: () => (
    <StoryShell
      tasksState={{
        items: [], // không có task
        loading: false,
        error: null,
        cursor: null,
        hasMore: false,
      }}
    />
  ),
}

// 4) Error: banner lỗi + nút "Thử lại"
export const Error = {
  render: () => (
    <StoryShell
      tasksState={{
        items: [],
        loading: false,
        error: "Mock lỗi khi tải tasks từ server",
        errorType: "server",
        errorStatus: 500,
        cursor: null,
        hasMore: false,
      }}
    />
  ),
}

// 5) Paged: Nhiều task nhưng chưa chạm ngưỡng
export const Paged = {
  render: () => (
    <StoryShell
      tasksState={{
        // 25 task → < 30 nên vẫn mode "paged"
        items: makeTasks(25),
        loading: false,
        error: null,
        cursor: null,
        hasMore: false, // giả sử đã load hết
      }}
    />
  ),
}

// 6) Infinite: Nhiều task hơn ngưỡng
export const Infinite = {
  render: () => (
    <StoryShell
      tasksState={{
        // 40 task → >= TASKS_THRESHOLD (30) → mode "infinite"
        items: makeTasks(40),
        loading: false,
        error: null,
        cursor: "cursor-mock", // có cursor & hasMore → hiển thị loader row ở cuối
        hasMore: true,
      }}
    />
  ),
}
