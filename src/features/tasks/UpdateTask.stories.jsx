import React, { useMemo } from "react"
import { Provider } from "react-redux"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import UpdateTask from "./UpdateTask.jsx"

// Fake Redux
function createFakeStore({
  loading = false,
  items = [],
  error = null,
} = {}) {
  const state = {
    auth: {
      user: {
        id: "storybook-user-1",
        email: "demo@example.com",
      },
    },
    tasks: {
      items,
      loading,
      creating: false,
      updating: false,
      deleting: false,
      error,
      errorType: error ? "server" : null,
      errorStatus: error ? 500 : null,
      cursor: null,
      hasMore: false,
      optimisticBackup: {},
    },
  }

  return {
    getState: () => state,
    dispatch: (action) => {
      console.log("[Storybook fake dispatch]", action)
      return action
    },
    subscribe: () => () => {},
  }
}

// Task mẫu cơ bản để render UI
const baseTask = {
  id: "task-1",
  title: "Cập nhật UI Storybook",
  description: "Chỉnh sửa task, checklist và deadline cho Storybook demo.",
  status: "in_progress",
  priority: "high",
  deadline: "2025-12-31T12:00:00.000Z",
  attachment_url: "https://example.com/spec.pdf",
  checklist: [
    { text: "Viết story cho Default", done: true },
    { text: "Thêm story Loading / Empty / Error", done: false },
  ],
}

// Shell bọc Redux + Router + Route có params :id
function StoryShell({ tasksState, initialPath = "/tasks/edit/task-1" }) {
  const store = useMemo(
    () => createFakeStore(tasksState),
    [tasksState],
  )

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/tasks/edit/:id" element={<UpdateTask />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: "Tasks/UpdateTask",
  component: UpdateTask,
  tags: ["autodocs"],
  // Một ít controls cơ bản để chỉnh UI trong Default story
  argTypes: {
    title: {
      control: { type: "text" },
      description: "Tiêu đề task",
    },
    description: {
      control: { type: "text" },
      description: "Mô tả task",
    },
    status: {
      control: { type: "select" },
      options: ["in_progress", "todo", "done"],
      description: "Trạng thái task",
    },
    priority: {
      control: { type: "select" },
      options: ["low", "medium", "high"],
      description: "Độ ưu tiên",
    },
    deadline: {
      control: { type: "text" },
      description: "Deadline (ISO string: 2099-12-31T12:00:00.000Z)",
    },
    showAttachment: {
      control: { type: "boolean" },
      description: "Có hiển thị file đính kèm không",
    },
    attachment_url: {
      control: { type: "text" },
      description: "URL file đính kèm",
    },
    showChecklist: {
      control: { type: "boolean" },
      description: "Có hiển thị checklist không",
    },
  },
}
export default meta

// 1) Default: có task, form đầy đủ
export const Default = {
  args: {
    title: baseTask.title,
    description: baseTask.description,
    status: baseTask.status,
    priority: baseTask.priority,
    deadline: baseTask.deadline,
    showAttachment: true,
    attachment_url: baseTask.attachment_url,
    showChecklist: true,
  },
  render: (args) => {
    const {
      title,
      description,
      status,
      priority,
      deadline,
      showAttachment,
      attachment_url,
      showChecklist,
    } = args

    const taskForStory = {
      ...baseTask,
      title,
      description,
      status,
      priority,
      deadline,
      attachment_url: showAttachment ? attachment_url : "",
      checklist: showChecklist ? baseTask.checklist : [],
    }

    return (
      <StoryShell
        tasksState={{
          loading: false,
          items: [taskForStory],
          error: null,
        }}
        initialPath="/tasks/edit/task-1"
      />
    )
  },
}

// 2) Loading: form đang ở trạng thái bận (busy)
export const Loading = {
  render: () => (
    <StoryShell
      tasksState={{
        loading: true,
        // vẫn có task để form fill data, nhưng mọi thứ disabled do busy = true
        items: [baseTask],
        error: null,
      }}
      initialPath="/tasks/edit/task-1"
    />
  ),
}

// 3) Empty: không tìm thấy task với id trong URL
export const Empty = {
  render: () => (
    <StoryShell
      tasksState={{
        loading: false,
        items: [], // không có task nào trong store
        error: null,
      }}
      // id "task-khong-ton-tai" không có trong items -> effect sẽ báo toast "Không tìm thấy task."
      initialPath="/tasks/edit/task-khong-ton-tai"
    />
  ),
}

// 4) Error: mô phỏng store đang có lỗi (ví dụ từ API)
export const Error = {
  render: () => (
    <StoryShell
      tasksState={{
        loading: false,
        items: [baseTask], // vẫn có data để form render
        error: "Mock lỗi từ tasks store: Không thể tải dữ liệu", // chỉ là thông tin để debug
      }}
      initialPath="/tasks/edit/task-1"
    />
  ),
}
