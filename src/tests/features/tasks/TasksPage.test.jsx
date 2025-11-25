/* eslint-disable no-undef */
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { toast } from "sonner"

// Mock sonner
jest.mock("sonner", () => ({
  __esModule: true,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}))

// Mock useAuth
jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: () => ({ user: { id: "user-1", email: "test@gmail.com" } }),
}))

// Fake pagination hook
jest.mock("@/hooks/usePagination", () => ({
  __esModule: true,
  default: (tasks) => ({
    page: 1,
    setPage: jest.fn(),
    totalPages: 1,
    pageItems: tasks,
    pageRange: [1],
    goPrev: jest.fn(),
    goNext: jest.fn(),
    goTo: jest.fn(),
  }),
}))

// Mock useTask
const mockFetchTasks = jest.fn()
const mockUpdateTask = jest.fn()
const mockOptimisticToggleStatus = jest.fn()
let mockItems = []
let mockLoading = false
let mockUpdating = false
let mockError = null

jest.mock("@/hooks/useTask", () => {
  return {
    __esModule: true,
    default: () => ({
      get items() {
        return mockItems
      },
      get loading() {
        return mockLoading
      },
      get updating() {
        return mockUpdating
      },
      get error() {
        return mockError
      },
      fetchTasks: mockFetchTasks,
      updateTask: mockUpdateTask,
      optimisticToggleStatus: mockOptimisticToggleStatus,
    }),
  }
})

// Mock utils/date
jest.mock("@/utils/date", () => ({
  __esModule: true,
  formatDate: jest.fn((iso) => (iso ? new Date(iso).toLocaleDateString() : "")),
  formatDateTime: jest.fn((iso) => (iso ? new Date(iso).toLocaleString() : "")),
  toISODate: jest.fn((value) => {
    try {
      return value ? new Date(value).toISOString() : null
    } catch {
      return null
    }
  }),
  isDeadlineBeforeOrEqual: jest.fn((deadline, selected) => {
    if (!deadline || !selected) return false
    const d = new Date(deadline).getTime()
    const [y, m, day] = selected.split("-").map(Number)
    const endOfDayLocal = new Date(y, m - 1, day, 23, 59, 59, 999).getTime()
    return d <= endOfDayLocal
  })
}))

import TasksPage from "@/features/tasks/TasksPage"

afterEach(() => {
  jest.useRealTimers()
})

describe("TasksPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockItems = [
      { id: "1", title: "Task A", status: "todo",        priority: "high",   deadline: "2025-11-10T09:00:00Z" },
      { id: "2", title: "Task B", status: "done",        priority: "low",    deadline: null },
      { id: "3", title: "Task C", status: "in_progress", priority: "medium", deadline: "2025-11-05T09:00:00Z" },
      { id: "4", title: "Task D", status: "todo",        priority: "high",   deadline: null },
    ]
    mockLoading = false
    mockUpdating = false
    mockError = null
    mockUpdateTask.mockResolvedValue({ meta: { requestStatus: "fulfilled" } })
  })

  test("Hiển thị danh sách task mặc định", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )
    expect(await screen.findByText("Task A")).toBeInTheDocument()
    expect(await screen.findByText("Task B")).toBeInTheDocument()
  })

  test("Lọc task theo tiêu đề", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText("Tìm theo tiêu đề")
    await userEvent.type(searchInput, "Task A")

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument()
      expect(screen.queryByText("Task B")).not.toBeInTheDocument()
    })
  })

  test("Click checkbox trạng thái sẽ gọi updateTask", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const checkbox = screen.getAllByRole("checkbox")[0]
    await userEvent.click(checkbox)

    expect(mockUpdateTask).toHaveBeenCalledTimes(1)
    expect(mockUpdateTask).toHaveBeenCalledWith("1", expect.objectContaining({ status: "done" }))
  })

  test("Hiển thị trạng thái rỗng khi không có task", async () => {
    mockItems = []
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )
    expect(await screen.findByText("Không có task phù hợp.")).toBeInTheDocument()
  })

  test("Lọc task theo độ ưu tiên (priority)", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const prioritySelect = screen.getByLabelText("Lọc theo độ ưu tiên")
    await userEvent.selectOptions(prioritySelect, "high")

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument()
      expect(screen.getByText("Task D")).toBeInTheDocument()
      expect(screen.queryByText("Task B")).not.toBeInTheDocument()
      expect(screen.queryByText("Task C")).not.toBeInTheDocument()
    })
  })

  test("Lọc task theo trạng thái (status)", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const statusSelect = screen.getByLabelText("Lọc theo trạng thái")
    await userEvent.selectOptions(statusSelect, "done")

    await waitFor(() => {
      expect(screen.getByText("Task B")).toBeInTheDocument()
      expect(screen.queryByText("Task A")).not.toBeInTheDocument()
      expect(screen.queryByText("Task C")).not.toBeInTheDocument()
      expect(screen.queryByText("Task D")).not.toBeInTheDocument()
    })
  })

  test("Lọc task theo deadline (≤ ngày được chọn)", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const deadlineInput = screen.getByLabelText("Lọc theo deadline (≤ ngày đã chọn)")
    await userEvent.type(deadlineInput, "2025-11-10")

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument()
      expect(screen.getByText("Task C")).toBeInTheDocument()
      expect(screen.queryByText("Task B")).not.toBeInTheDocument()
      expect(screen.queryByText("Task D")).not.toBeInTheDocument()
    })
  })

  test("Xoá bộ lọc deadline khi bấm nút X", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const deadlineInput = screen.getByLabelText("Lọc theo deadline (≤ ngày đã chọn)")
    await userEvent.type(deadlineInput, "2025-11-10")

    await waitFor(() => {
      const clearButton = screen.getByTitle("Xóa lọc deadline")
      expect(clearButton).toBeInTheDocument()
    })

    const clearButton = screen.getByTitle("Xóa lọc deadline")
    await userEvent.click(clearButton)

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument()
      expect(screen.getByText("Task B")).toBeInTheDocument()
      expect(screen.getByText("Task C")).toBeInTheDocument()
      expect(screen.getByText("Task D")).toBeInTheDocument()
    })
  })

  test("Kết hợp nhiều bộ lọc (priority + status) cùng lúc", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const prioritySelect = screen.getByLabelText("Lọc theo độ ưu tiên")
    const statusSelect = screen.getByLabelText("Lọc theo trạng thái")

    await userEvent.selectOptions(prioritySelect, "high")
    await userEvent.selectOptions(statusSelect, "todo")

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument()
      expect(screen.getByText("Task D")).toBeInTheDocument()
      expect(screen.queryByText("Task B")).not.toBeInTheDocument()
      expect(screen.queryByText("Task C")).not.toBeInTheDocument()
    })
  })

  test("Hiển thị trạng thái loading khi đang tải tasks", async () => {
    mockItems = []
    mockLoading = true

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    expect(await screen.findByText("Đang tải tasks...")).toBeInTheDocument()
  })

  test("Hiển thị toast lỗi khi hook trả về error", async () => {
    mockItems = []
    mockError = "Lỗi kết nối mạng"

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Lỗi kết nối mạng")
    })
  })

  test("Hiển thị toast success khi cập nhật trạng thái task thành công", async () => {
    mockUpdateTask.mockResolvedValueOnce({
      meta: { requestStatus: "fulfilled" },
    })

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const checkbox = screen.getAllByRole("checkbox")[0]
    await userEvent.click(checkbox)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Cập nhật trạng thái task thành công!")
    })
  })

  test("Hiển thị link điều hướng tới trang tạo mới task", async () => {
    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const createLink = screen.getByRole("link", { name: /Tạo mới task/i })
    expect(createLink).toBeInTheDocument()
    expect(createLink).toHaveAttribute("href", "/tasks/new")
  })

  test("Debounce ô tìm kiếm tiêu đề hoạt động đúng", async () => {
    jest.useFakeTimers()

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    )

    const searchInput = screen.getByPlaceholderText("Tìm theo tiêu đề")

    // gõ nhưng chưa qua thời gian debounce
    fireEvent.change(searchInput, { target: { value: "Task A" } })
    expect(screen.getByText("Task A")).toBeInTheDocument()
    expect(screen.getByText("Task B")).toBeInTheDocument()

    // chạy timer qua 300ms để debounce có hiệu lực
    jest.advanceTimersByTime(350)

    await waitFor(() => {
      expect(screen.getByText("Task A")).toBeInTheDocument()
      expect(screen.queryByText("Task B")).not.toBeInTheDocument()
    })
  })
})
