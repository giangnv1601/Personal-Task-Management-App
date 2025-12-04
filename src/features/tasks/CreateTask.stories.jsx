import React, { useMemo } from "react"
import { Provider } from "react-redux"
import { MemoryRouter } from "react-router-dom"

import CreateTask from "./CreateTask.jsx"

// Fake Redux store
function createFakeStore({ creating = false, error = null } = {}) {
  const state = {
    auth: {
      user: {
        id: "storybook-user-1",
        email: "demo@example.com",
      },
    },
    tasks: {
      items: [],
      loading: false,
      creating,          // điều khiển nút "Đang tạo…"
      updating: false,
      deleting: false,
      error,
      errorType: error ? "server" : null,
      errorStatus: error ? 500 : null,
      cursor: null,
      hasMore: true,
      optimisticBackup: {},
    },
  }

  return {
    getState: () => state,
    // dispatch chỉ log ra console cho vui, không làm gì
    dispatch: (action) => {
      console.log("[Storybook fake dispatch]", action)
      return action
    },
    subscribe: () => () => {},
  }
}

// Wrapper cung cấp Redux store & Router cho các story
function StoryWrapper({ children, creating = false, error = null }) {
  const store = useMemo(
    () => createFakeStore({ creating, error }),
    [creating, error],
  )

  return (
    <Provider store={store}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: "Tasks/CreateTask",
  component: CreateTask,
  tags: ["autodocs"],
}
export default meta

// Template dùng lại cho các story
const Template = ({ defaultValues, creating = false, error = null }) => (
  <StoryWrapper creating={creating} error={error}>
    <CreateTask defaultValues={defaultValues} />
  </StoryWrapper>
)

// 1) Default: form đã có chút dữ liệu mẫu
export const Default = {
  render: Template,
  args: {
    creating: false,
    error: null,
    defaultValues: {
      title: "Viết báo cáo tuần",
      description: "Hoàn thành báo cáo task & tiến độ dự án",
      priority: "medium",
      status: "in_progress",
      deadline: new Date().toISOString(),
      attachment_url: "",
      checklist: [
        { text: "Chuẩn bị nội dung", done: true },
        { text: "Rà soát lại task", done: false },
      ],
    },
  },
}

// 2) Empty: form trống (UI giống khi user vừa mở trang)
export const Empty = {
  render: Template,
  args: {
    creating: false,
    error: null,
    defaultValues: {
      title: "",
      description: "",
      priority: "low",
      status: "todo",
      deadline: "",
      attachment_url: "",
      checklist: [],
    },
  },
}

// 3) Loading: nút submit disabled + text "Đang tạo…"
export const Loading = {
  render: Template,
  args: {
    creating: true, // điều khiển state tạo
    error: null,
    defaultValues: {
      title: "Task đang tạo",
      description: "Minh họa trạng thái loading",
      priority: "high",
      status: "todo",
      deadline: new Date().toISOString(),
      attachment_url: "",
      checklist: [],
    },
  },
}

// 4) Error: về UI thì giống default,
// nhưng ta set error trong store để sau này nếu muốn hiển thị/toast thì có sẵn
export const Error = {
  render: Template,
  args: {
    creating: false,
    error: "Không thể tạo task (mock error từ store)",
    defaultValues: {
      title: "Task lỗi",
      description: "Minh họa trạng thái khi có lỗi",
      priority: "medium",
      status: "todo",
      deadline: new Date().toISOString(),
      attachment_url: "https://example.com",
      checklist: [],
    },
  },
}
