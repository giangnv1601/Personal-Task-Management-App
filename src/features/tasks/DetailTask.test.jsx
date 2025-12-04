/* eslint-disable no-undef */
import React from "react"
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react"
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

// mock utils/date mới: formatDateTime + formatRelativeTime
jest.mock("@/utils/date", () => ({
  __esModule: true,
  formatDateTime: (iso) => (iso ? `FMT(${iso})` : "—"),
  formatRelativeTime: (iso) => (iso ? `REL(${iso})` : ""),
}))

// mock ConfirmDialog thành dialog đơn giản để dễ click nút trong test
jest.mock("@/components/ui/ConfirmDialog", () => ({
  __esModule: true,
  default: ({ open, title, message, confirmText, cancelText, onConfirm, onCancel }) => {
    if (!open) return null
    return (
      <div role="dialog" aria-label={title}>
        <p>{message}</p>
        <button onClick={onCancel}>{cancelText}</button>
        <button onClick={onConfirm} aria-label={confirmText}>
          {confirmText}
        </button>
      </div>
    )
  },
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

// helper to find a button by aria-label or text (accent-insensitive by checking simplified forms)
const findButtonLike = (candidates) => {
  const btns = screen.getAllByRole("button")
  const normalize = (s = "") =>
    s
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  return btns.find((b) => {
    const attr = b.getAttribute("aria-label")
    const hay = normalize(attr || b.textContent)
    return candidates.some((c) => hay.includes(normalize(c)))
  })
}

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
    expect(
      screen.getByRole("button", { name: /Quay về danh sách/i })
    ).toBeInTheDocument()
  })

  test("Render chi tiết task đúng dữ liệu", () => {
    renderUI()

    expect(screen.getByText("Chi tiết Task")).toBeInTheDocument()
    expect(screen.getByText(baseTask.title)).toBeInTheDocument()
    expect(screen.getByText(baseTask.description)).toBeInTheDocument()

    // Trạng thái (StatusBadge)
    expect(screen.getByText("Đang làm")).toBeInTheDocument()

    // Ưu tiên (PriorityBadge)
    expect(screen.getByText("High")).toBeInTheDocument()

    // Deadline + Ngày tạo dùng formatDateTime mock = FMT(...)
    expect(screen.getByText(`FMT(${baseTask.deadline})`)).toBeInTheDocument()
    expect(screen.getByText(`FMT(${baseTask.created_at})`)).toBeInTheDocument()

    // Checklist
    expect(screen.getByText("Tạo wireframe")).toBeInTheDocument()
    expect(screen.getByText("Gửi review cho Leader")).toBeInTheDocument()

    // Link tệp đính kèm
    const link = screen.getByRole("link", { name: /Mở tệp/i })
    expect(link).toHaveAttribute("href", baseTask.attachment_url)
  })

  test("Nút 'Sửa' điều hướng đúng route edit", () => {
    renderUI()
    const editBtn = findButtonLike(["Sửa task", "Sua task", "Sửa"])
    expect(editBtn).toBeDefined()
    fireEvent.click(editBtn)
    expect(mockNavigate).toHaveBeenCalledWith(`/tasks/edit/${baseTask.id}`)
  })

  test("Xoá: bấm Hủy trong ConfirmDialog → không gọi deleteTask", async () => {
    renderUI()

    const deleteBtn = findButtonLike(["Xoá task", "Xoa task", "Xoa", "Xóa"])
    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn)

    // ConfirmDialog mở
    const dialog = await screen.findByRole("dialog")
    const cancelBtn = within(dialog).getAllByRole("button").find((b) =>
      /huy|hủy|huy/i.test(
        (b.getAttribute("aria-label") || b.textContent || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      )
    )
    expect(cancelBtn).toBeDefined()
    fireEvent.click(cancelBtn)

    expect(mockDeleteTask).not.toHaveBeenCalled()
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  test("Xoá: thành công → toast.success và điều hướng /tasks", async () => {
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

    const deleteBtn = findButtonLike(["Xoá task", "Xoa task", "Xoa", "Xóa"])
    fireEvent.click(deleteBtn)

    const dialog = await screen.findByRole("dialog")
    const confirmBtn = within(dialog).getAllByRole("button").find((b) =>
      /(xoa|xóa|xo)/i.test((b.getAttribute("aria-label") || b.textContent || ""))
    )
    expect(confirmBtn).toBeDefined()
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(baseTask.id)
      expect(toast.success).toHaveBeenCalledWith("Xóa task thành công")
      expect(mockNavigate).toHaveBeenCalledWith("/tasks")
    })
  })

  test("Xoá: thất bại → toast.error với message từ action.payload", async () => {
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

    const deleteBtn = findButtonLike(["Xoá task", "Xoa task", "Xoa", "Xóa"])
    fireEvent.click(deleteBtn)

    const dialog = await screen.findByRole("dialog")
    const confirmBtn = within(dialog).getAllByRole("button").find((b) =>
      /(xoa|xóa|xo)/i.test((b.getAttribute("aria-label") || b.textContent || ""))
    )
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith(baseTask.id)
      expect(toast.error).toHaveBeenCalledWith("Xóa thất bại")
    })
  })

  test("Nút 'Đóng' quay lại trang trước", () => {
    renderUI()
    const closeBtn = findButtonLike(["Đóng chi tiết task", "Dong chi tiet", "Đóng"])
    expect(closeBtn).toBeDefined()
    fireEvent.click(closeBtn)
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test("loading=true nhưng đã có task → cuối cùng hiển thị chi tiết, không hiển thị Loading", async () => {
    useTask.mockReturnValue({
      items: [baseTask],
      fetchTasks: mockFetchTasks,
      deleteTask: mockDeleteTask,
      loading: true,
    })

    renderUI()

    // ban đầu có thể có "Đang tải...", nhưng sau khi useEffect setTask thì phải là màn chi tiết
    await waitFor(() => {
      expect(screen.queryByText("Đang tải...")).not.toBeInTheDocument()
      expect(screen.getByText("Chi tiết Task")).toBeInTheDocument()
      expect(screen.getByText(baseTask.title)).toBeInTheDocument()
    })
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
    expect(screen.getAllByText("—").length).toBeGreaterThan(0)

    // Không có link 'Mở tệp'
    expect(
      screen.queryByRole("link", { name: /Mở tệp/i })
    ).not.toBeInTheDocument()
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
    // vẫn check className nếu PriorityBadge giữ mapping cũ
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

  test("fetchTasks ném lỗi → hiển thị toast lỗi với message từ Error", async () => {
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
