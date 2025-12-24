import React, { useMemo } from "react"
import { Provider } from "react-redux"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import DetailTask from "./DetailTask.jsx"

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

// Task mẫu
const baseTask = {
  id: "task-1",
  title: "Ôn tập React & Redux",
  description: "Xem lại hook, redux-toolkit, integration test",
  status: "in_progress",
  priority: "high",
  deadline: "2025-12-31T12:00:00.000Z",
  created_at: "2025-12-01T09:00:00.000Z",
  attachment_url: "https://example.com/spec.pdf",
  checklist: [
    { text: "Ôn lại useEffect", done: true },
    { text: "Viết test cho slice", done: false },
  ],
}

// Shell bọc Redux + Router + Route có params :id
function StoryShell({ tasksState, initialPath = "/tasks/detail/task-1" }) {
  const store = useMemo(
    () => createFakeStore(tasksState),
    [tasksState],
  )

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/tasks/detail/:id" element={<DetailTask />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: "Tasks/DetailTask",
  component: DetailTask,
  tags: ["autodocs"],
  argTypes: {
    // Controls để chỉnh props của task
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
      description: "Độ ưu tiên task",
    },
    deadline: {
      control: { type: "text" },
      description: "Deadline (ISO string)",
    },
    created_at: {
      control: { type: "text" },
      description: "Thời điểm tạo (ISO string)",
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
    checklistDoneFirst: {
      control: { type: "boolean" },
      description: "Checklist item 1 đã xong?",
    },
    checklistDoneSecond: {
      control: { type: "boolean" },
      description: "Checklist item 2 đã xong?",
    },
  },
}
export default meta

// 1) Default – dùng Controls tùy chỉnh task
export const Default = {
  args: {
    title: baseTask.title,
    description: baseTask.description,
    status: baseTask.status,
    priority: baseTask.priority,
    deadline: baseTask.deadline,
    created_at: baseTask.created_at,
    showAttachment: true,
    attachment_url: baseTask.attachment_url,
    showChecklist: true,
    checklistDoneFirst: true,
    checklistDoneSecond: false,
  },
  render: (args) => {
    const {
      title,
      description,
      status,
      priority,
      deadline,
      created_at,
      showAttachment,
      attachment_url,
      showChecklist,
      checklistDoneFirst,
      checklistDoneSecond,
    } = args

    const taskForStory = {
      ...baseTask,
      title,
      description,
      status,
      priority,
      deadline,
      created_at,
      attachment_url: showAttachment ? attachment_url : "",
      checklist: showChecklist
        ? [
            { text: "Ôn lại useEffect", done: checklistDoneFirst },
            { text: "Viết test cho slice", done: checklistDoneSecond },
          ]
        : [],
    }

    return (
      <StoryShell
        tasksState={{
          loading: false,
          items: [taskForStory],
          error: null,
        }}
        initialPath="/tasks/detail/task-1"
      />
    )
  },
}

// 2) Loading – state loading & chưa có task
export const Loading = {
  render: () => (
    <StoryShell
      tasksState={{
        loading: true,
        items: [],
        error: null,
      }}
      initialPath="/tasks/detail/task-loading"
    />
  ),
}

// 3) Empty – không có task phù hợp id
export const Empty = {
  render: () => (
    <StoryShell
      tasksState={{
        loading: false,
        items: [],
        error: null,
      }}
      initialPath="/tasks/detail/task-khong-ton-tai"
    />
  ),
}

// 4) Error – mock error trong store
export const Error = {
  render: () => (
    <StoryShell
      tasksState={{
        loading: false,
        items: [],
        error: "Không thể tải dữ liệu task (mock error từ store)",
      }}
      initialPath="/tasks/detail/task-error"
    />
  ),
}
