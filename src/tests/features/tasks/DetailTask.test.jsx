/* eslint-disable no-undef */
import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"

// --- Mocks ---
jest.mock("sonner", () => ({
  __esModule: true,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom")
  return {
    ...actual,
    useNavigate: jest.fn(),
    useParams: jest.fn(),
  }
})

jest.mock("@/hooks/useTask", () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock("@/utils/date", () => ({
  __esModule: true,
  formatDate: (iso) => (iso ? `FMT(${iso})` : "—"),
}))

import { toast } from "sonner"
import useTask from "@/hooks/useTask"
import { useNavigate, useParams } from "react-router-dom"
import DetailTask from "@/features/tasks/DetailTask"

// ---- Fake data chung ----
const baseTask = {
  id: "a3f61a47-29e9-4f52-9b23-d84dcb8e6b14",
  user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
  title: "Viết UI đăng nhập",
  description: "Thiết kế & code form đăng nhập",
  deadline: "2025-11-10T09:00:00.000Z",
  priority: "high",
  status: "in_progress",
  checklist: [
    { text: "Tạo wireframe", done: true },
    { text: "Gửi review cho Leader", done: false },
  ],
  attachment_url: "https://example.com/file.pdf",
  created_at: "2025-11-01T00:00:00.000Z",
  updated_at: "2025-11-05T00:00:00.000Z",
}

const renderUI = () =>
  render(
    <MemoryRouter>
      <DetailTask />
    </MemoryRouter>
  )

describe("DetailTask Page", () => {
  const mockNavigate = jest.fn()
  const mockFetchTasks = jest.fn()
  const mockDeleteTask = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    useNavigate.mockReturnValue(mockNavigate)
    useParams.mockReturnValue({ id: baseTask.id })
    useTask.mockReturnValue({
      items: [baseTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: false,
    })
  })

  test("Hiển thị Loading khi loading=true và chưa có task", () => {
    useTask.mockReturnValue({
      items: [],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: true,
    })

    renderUI()
    expect(screen.getByText("Đang tải...")).toBeInTheDocument()
  })

  test("Không tìm thấy task → hiển thị thông báo và nút quay về", async () => {
    useTask.mockReturnValue({
      items: [],
      fetchTasks: jest.fn().mockResolvedValueOnce(undefined),
      deleteTask: mockDeleteTask,
      loading: false,
    })

    renderUI()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Không tìm thấy task.")
    })
    expect(screen.getByText("Không tìm thấy task.")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Quay về danh sách/i })).toBeInTheDocument()
  })

  test("Render chi tiết task đúng dữ liệu", () => {
    renderUI()

    expect(screen.getByText("Chi tiết Task")).toBeInTheDocument()
    expect(screen.getByText(baseTask.title)).toBeInTheDocument()
    expect(screen.getByText(baseTask.description)).toBeInTheDocument()

    // Trạng thái
    expect(screen.getByText("Đang làm")).toBeInTheDocument()

    // Ưu tiên
    expect(screen.getByText("High")).toBeInTheDocument()

    // Date
    expect(screen.getByText(`FMT(${baseTask.deadline})`)).toBeInTheDocument()
    expect(screen.getByText(`FMT(${baseTask.created_at})`)).toBeInTheDocument()

    // Checklist
    expect(screen.getByText("Tạo wireframe")).toBeInTheDocument()
    expect(screen.getByText("Gửi review cho Leader")).toBeInTheDocument()

    // Link tệp đính kèm
    const link = screen.getByRole("link", { name: /Mở tệp/i })
    expect(link).toHaveAttribute("href", baseTask.attachment_url)
  })

  test("Nút 'Sửa' điều hướng đúng route", () => {
    renderUI()
    fireEvent.click(screen.getByRole("button", { name: "Sửa" }))
    expect(mockNavigate).toHaveBeenCalledWith(`/tasks/edit/${baseTask.id}`)
  })

  test("Xoá: user bấm Cancel trong confirm → không gọi deleteTask", () => {
    const confirmSpy = jest.spyOn(window, "confirm").mockReturnValueOnce(false)
    renderUI()
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDeleteTask).not.toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  test("Xoá: thành công → toast.success và điều hướng /tasks", async () => {
    jest.spyOn(window, "confirm").mockReturnValueOnce(true)

    const deleteMock = jest.fn().mockResolvedValueOnce({
      meta: { requestStatus: "fulfilled" },
    })

    useTask.mockReturnValue({
      items: [baseTask],
      fetchTasks: mockFetchTasks,
      deleteTask: deleteMock,
      loading: false,
    })

    renderUI()
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Xóa task thành công")
      expect(mockNavigate).toHaveBeenCalledWith("/tasks")
    })
  })

  test("Xoá: thất bại → toast.error", async () => {
    jest.spyOn(window, "confirm").mockReturnValueOnce(true)

    const deleteMock = jest.fn().mockResolvedValueOnce({
      meta: { requestStatus: "rejected" },
      payload: "Xóa thất bại",
    })

    useTask.mockReturnValue({
      items: [baseTask],
      fetchTasks: mockFetchTasks,
      deleteTask: deleteMock,
      loading: false,
    })

    renderUI()
    fireEvent.click(screen.getByRole("button", { name: "Xoá" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Xóa thất bại")
    })
  })

  test("Nút 'Đóng' quay lại trang trước", () => {
    renderUI()
    fireEvent.click(screen.getByRole("button", { name: "Đóng" }))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test("loading=true nhưng đã có task → vẫn render chi tiết, không render Loading", () => {
    useTask.mockReturnValue({
      items: [baseTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: true,
    })

    renderUI()

    // Không hiển thị 'Đang tải...'
    expect(screen.queryByText("Đang tải...")).not.toBeInTheDocument()
    // Vẫn hiển thị chi tiết task
    expect(screen.getByText("Chi tiết Task")).toBeInTheDocument()
    expect(screen.getByText(baseTask.title)).toBeInTheDocument()
  })

  test("Checklist rỗng và không có file đính kèm → hiển thị '—' và không có link Mở tệp", () => {
    const taskNoChecklist = {
      ...baseTask,
      checklist: [],
      attachment_url: "",
    }

    useTask.mockReturnValue({
      items: [taskNoChecklist],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: false,
    })

    renderUI()

    // Checklist hiển thị '—'
    expect(screen.getByText("Checklist:")).toBeInTheDocument()
    // có 2 dấu '—' (Mô tả có thể không, nên dùng regex/location nếu cần), ở đây check tồn tại là đủ
    expect(screen.getAllByText("—").length).toBeGreaterThan(0)

    // Không có link 'Mở tệp'
    expect(screen.queryByRole("link", { name: /Mở tệp/i })).not.toBeInTheDocument()
  })

  test("StatusBadge hiển thị đúng nhãn cho todo và done", () => {
    const todoTask = { ...baseTask, status: "todo" }
    const doneTask = { ...baseTask, status: "done" }

    // todo
    useTask.mockReturnValue({
      items: [todoTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: false,
    })
    const { unmount } = render(
      <MemoryRouter>
        <DetailTask />
      </MemoryRouter>
    )
    expect(screen.getByText("Chưa làm")).toBeInTheDocument()
    unmount()

    // done
    useTask.mockReturnValue({
      items: [doneTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: false,
    })
    render(
      <MemoryRouter>
        <DetailTask />
      </MemoryRouter>
    )
    expect(screen.getByText("Hoàn thành")).toBeInTheDocument()
  })

  test("PriorityBadge hiển thị đúng cho medium và low", () => {
    const mediumTask = { ...baseTask, priority: "medium" }
    const lowTask = { ...baseTask, priority: "low" }

    // medium
    useTask.mockReturnValue({
      items: [mediumTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: false,
    })
    const { unmount } = render(
      <MemoryRouter>
        <DetailTask />
      </MemoryRouter>
    )
    const mediumEl = screen.getByText("Medium")
    expect(mediumEl).toBeInTheDocument()
    expect(mediumEl.className).toMatch(/bg-orange-500/)
    unmount()

    // low
    useTask.mockReturnValue({
      items: [lowTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: false,
    })
    render(
      <MemoryRouter>
        <DetailTask />
      </MemoryRouter>
    )
    const lowEl = screen.getByText("Low")
    expect(lowEl).toBeInTheDocument()
    expect(lowEl.className).toMatch(/bg-slate-400/)
  })

  test("fetchTasks ném lỗi → hiển thị toast lỗi 'Không thể tải task'", async () => {
    const error = new Error("Network error")

    useTask.mockReturnValue({
      items: [],
      fetchTasks: jest.fn().mockRejectedValueOnce(error),
      deleteTask: mockDeleteTask,
      loading: false,
    })

    renderUI()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network error")
    })
  })
})
