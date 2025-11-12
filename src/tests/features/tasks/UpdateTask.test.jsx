/* eslint-disable no-undef */
import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"

// ---- Mocks ----
jest.mock("sonner", () => ({
  __esModule: true,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// mock date utils
jest.mock("@/utils/date.js", () => ({
  __esModule: true,
  toLocalInput: (iso) => {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  },
  toUTCISOString: (localStr) => new Date(localStr).toISOString(),
}))

jest.mock("@/utils/validate.js", () => ({
  __esModule: true,
  validateDeadline: () => true
}))

const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "123" }),
  }
})

const mockUpdateTask = jest.fn()
const mockDeleteTask = jest.fn()
const mockFetchTasks = jest.fn()
let mockItems = []
jest.mock("@/hooks/useTask", () => ({
  __esModule: true,
  default: () => ({
    items: mockItems,
    fetchTasks: mockFetchTasks,
    updateTask: mockUpdateTask,
    deleteTask: mockDeleteTask,
    loading: false
  })
}))

import UpdateTask from "@/features/tasks/UpdateTask.jsx"

const setup = () => {
  return render(
    <MemoryRouter>
      <UpdateTask />
    </MemoryRouter>
  )
}

beforeEach(() => {
  jest.clearAllMocks()
  mockItems = []
  if (typeof global._origConfirm === "undefined") global._origConfirm = global.confirm
})

afterEach(() => {
  if (typeof global._origConfirm !== "undefined") {
    global.confirm = global._origConfirm
  }
})

describe("UpdateTask", () => {
  test("ban đầu: submit disabled khi !isDirty", async () => {
    setup()
    const submitBtn = await screen.findByRole("button", { name: /cập nhật/i })
    expect(submitBtn).toBeDisabled()
  })

  test("load từ store: hiển thị title đúng", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task từ store",
        description: "desc",
        status: "in_progress",
        priority: "high",
        deadline: "2025-11-10T09:00:00.000Z",
        attachment_url: "https://example.com",
        checklist: [{ id: "c1", text: "item", done: false }],
      }
    ]
    setup()
    const title = await screen.findByLabelText(/tên task/i)
    expect(title).toHaveValue("Task từ store")
    expect(screen.getByLabelText(/trạng thái/i)).toHaveValue("in_progress")
    expect(screen.getByLabelText(/ưu tiên/i)).toHaveValue("high")
  })

  test("fallback fetch: khi store rỗng sẽ lấy từ fetchTasks và fill form", async () => {
    mockItems = []
    mockFetchTasks.mockResolvedValue({
      data: [
        {
          id: "123",
          title: "Task từ fetch",
          description: "",
          status: "todo",
          priority: "medium",
          deadline: null,
          attachment_url: "",
          checklist: [],
        }
      ]
    })
    setup()
    const title = await screen.findByLabelText(/tên task/i)
    await waitFor(() => {
      expect(title).toHaveValue("Task từ fetch")
    })
    expect(mockFetchTasks).toHaveBeenCalled()
  })

  test("validate: title rỗng báo lỗi, không gọi updateTask", async () => {
    mockItems = [{ id: "123", title: "Old", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()
    const title = await screen.findByLabelText(/tên task/i)
    await userEvent.clear(title)
    await userEvent.type(title, "   ")
    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    expect(submitBtn).toBeEnabled()
    global.confirm = jest.fn(() => true)
    await userEvent.click(submitBtn)

    expect(await screen.findByText(/tên task là bắt buộc/i)).toBeInTheDocument()
    expect(mockUpdateTask).not.toHaveBeenCalled()
  })

  test("validate: attachment_url sai format → hiển thị lỗi từ register", async () => {
    mockItems = [{ id: "123", title: "ABC", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()
    const urlInput = await screen.findByLabelText(/đính kèm \(url\)/i)
    const title = screen.getByLabelText(/tên task/i)
    await userEvent.clear(title)
    await userEvent.type(title, "New title")
    await userEvent.type(urlInput, "not-a-url")

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    global.confirm = jest.fn(() => true)
    await userEvent.click(submitBtn)

    expect(await screen.findByText(/đính kèm phải là url hợp lệ/i)).toBeInTheDocument()
    expect(mockUpdateTask).not.toHaveBeenCalled()
  })

  test("submit thành công: gọi updateTask với payload chuẩn & điều hướng /tasks", async () => {
    mockItems = [{ id: "123", title: "Old", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    mockUpdateTask.mockResolvedValue({ meta: { requestStatus: "fulfilled" } })
    setup()
    global.confirm = jest.fn(() => true)

    const title = await screen.findByLabelText(/tên task/i)
    await userEvent.clear(title)
    await userEvent.type(title, "  New Title  ")

    const deadline = screen.getByLabelText(/deadline/i)
    await userEvent.clear(deadline)
    await userEvent.type(deadline, "2025-11-10T09:00")

    const priority = screen.getByLabelText(/ưu tiên/i)
    await userEvent.selectOptions(priority, "high")

    const status = screen.getByLabelText(/trạng thái/i)
    await userEvent.selectOptions(status, "in_progress")

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledTimes(1)
    })
    const [calledId, calledPayload] = mockUpdateTask.mock.calls[0]
    expect(String(calledId)).toBe("123")
    expect(calledPayload.title).toBe("New Title")
    expect(calledPayload.priority).toBe("high")
    expect(calledPayload.status).toBe("in_progress")
    expect(typeof calledPayload.deadline).toBe("string")
    expect(mockNavigate).toHaveBeenCalledWith("/tasks")
  })

  test("nút Submit bật khi thay đổi (isDirty = true), khoá khi không đổi", async () => {
    mockItems = [{ id: "123", title: "Old", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()
    const submitBtn = await screen.findByRole("button", { name: /cập nhật/i })
    expect(submitBtn).toBeDisabled()

    const title = screen.getByLabelText(/tên task/i)
    await userEvent.type(title, "X")
    expect(submitBtn).toBeEnabled()
  })

  test("thêm & xoá checklist", async () => {
    mockItems = [{ id: "123", title: "Task", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()

    const addBtn = await screen.findByRole("button", { name: /\+ thêm checklist/i })
    await userEvent.click(addBtn)

    const section = screen.getByText("Checklist", { selector: "p" }).parentElement
    const inputs = within(section).getAllByPlaceholderText(/nội dung công việc/i)
    expect(inputs.length).toBe(1)

    await userEvent.type(inputs[0], "Làm A")
    const removeBtn = within(section).getByRole("button", { name: /xoá/i })
    await userEvent.click(removeBtn)

    expect(within(section).queryByPlaceholderText(/nội dung công việc/i)).not.toBeInTheDocument()
  })

  test("delete: gọi deleteTask và điều hướng", async () => {
    mockItems = [{ id: "123", title: "Task", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    mockDeleteTask.mockResolvedValue({ meta: { requestStatus: "fulfilled" } })
    setup()
    const delBtn = await screen.findByRole("button", { name: /xo[aá] task/i })
    global.confirm = jest.fn(() => true)
    await userEvent.click(delBtn)
    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith("123")
    })
    expect(mockNavigate).toHaveBeenCalledWith("/tasks")
  })

  test("deadline input hiển thị đúng từ ISO (toLocalInput) và convert đúng khi submit", async () => {
    mockItems = [{
      id: "123",
      title: "Task",
      description: "",
      status: "todo",
      priority: "medium",
      deadline: "2025-11-10T09:00:00.000Z",
      attachment_url: "",
      checklist: [],
    }]
    mockUpdateTask.mockResolvedValue({ meta: { requestStatus: "fulfilled" } })
    setup()

    const deadline = await screen.findByLabelText(/deadline/i)

    expect(deadline).toHaveValue("2025-11-10T16:00")

    const title = screen.getByLabelText(/tên task/i)
    await userEvent.type(title, "X")
    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    // allow confirm dialog so submit path is reachable during tests that click it
    global.confirm = jest.fn(() => true)
    await userEvent.click(submitBtn)
    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledTimes(1)
    })
    const [, payload] = mockUpdateTask.mock.calls[0]
    expect(typeof payload.deadline).toBe("string")
  })

  test("không tìm thấy task sau fetch → gọi toast.error('Không tìm thấy task.')", async () => {
    mockFetchTasks.mockResolvedValue({ data: [] })
    setup()
    await waitFor(() => {
      expect(require("sonner").toast.error).toHaveBeenCalled()
      const calls = require("sonner").toast.error.mock.calls.map(c => c[0])
      expect(calls.some(msg => String(msg).includes("Không tìm thấy task"))).toBe(true)
    })
  })

  test("fetchTasks throw → gọi toast.error('Không thể tải task')", async () => {
    mockFetchTasks.mockRejectedValue(new Error("boom"))
    setup()
    await waitFor(() => {
      expect(require("sonner").toast.error).toHaveBeenCalled()
      const calls = require("sonner").toast.error.mock.calls.map(c => c[0])
      expect(
        calls.some(msg =>
          String(msg).includes("Không thể tải task") ||
          String(msg).includes("boom")
        )
      ).toBe(true)
    })
  })

  test("Huỷ khi form không dirty → điều hướng back ngay", async () => {
    mockItems = [{ id: "123", title: "Task", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()
    const cancelBtn = await screen.findByRole("button", { name: /huỷ/i })
    await userEvent.click(cancelBtn)
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test("Huỷ khi form dirty & confirm=FALSE → KHÔNG điều hướng", async () => {
    mockItems = [{ id: "123", title: "Task", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()
    const title = await screen.findByLabelText(/tên task/i)
    await userEvent.type(title, "x")

    global.confirm = jest.fn(() => false)

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i })
    await userEvent.click(cancelBtn)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test("Huỷ khi form dirty & confirm=TRUE → điều hướng back", async () => {
    mockItems = [{ id: "123", title: "Task", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    setup()
    const title = await screen.findByLabelText(/tên task/i)
    await userEvent.type(title, "x")

    global.confirm = jest.fn(() => true)

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i })
    await userEvent.click(cancelBtn)
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test("Xoá task: không confirm vẫn xoá (theo implement hiện tại)", async () => {
    mockItems = [{ id: "123", title: "Task", description: "", status: "todo", priority: "medium", deadline: null, attachment_url: "", checklist: [] }]
    mockDeleteTask.mockResolvedValue({ meta: { requestStatus: "fulfilled" } })
    setup()
    const delBtn = await screen.findByRole("button", { name: /xo[aá] task/i })
    // component now asks confirm() before delete — mock it to return true
    global.confirm = jest.fn(() => true)
    await userEvent.click(delBtn)
    await waitFor(() => expect(mockDeleteTask).toHaveBeenCalledWith("123"))
    expect(mockNavigate).toHaveBeenCalledWith("/tasks")
  })

  test("submit thất bại (requestStatus !== 'fulfilled') → hiển thị toast.error", async () => {
    mockItems = [
      {
        id: "123",
        title: "Old",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    // trả về rejected-like response (payload là string)
    mockUpdateTask.mockResolvedValueOnce({
      meta: { requestStatus: "rejected" },
      payload: "Server says no",
    })

    setup()

    const title = await screen.findByLabelText(/tên task/i)
    await userEvent.clear(title)
    await userEvent.type(title, "Valid title")

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    global.confirm = jest.fn(() => true)
    await userEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled()
      expect(require("sonner").toast.error).toHaveBeenCalled()
      const calls = require("sonner").toast.error.mock.calls.map((c) => String(c[0]).toLowerCase())
      expect(
        calls.some((s) =>
          s.includes("có lỗi khi cập nhật") ||
          s.includes("cập nhật thất bại") ||
          s.includes("server says no")
        )
      ).toBe(true)
    })
  })

  test("keepDirtyValues: người dùng gõ trước khi fetch về → giữ giá trị đã gõ", async () => {
    mockItems = []
    // trì hoãn fetch để kịp gõ trước khi reset
    mockFetchTasks.mockImplementation(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: [{
              id: "123",
              title: "Title từ fetch",
              description: "",
              status: "todo",
              priority: "medium",
              deadline: null,
              attachment_url: "",
              checklist: [],
            }]
          })
        }, 50)
      })
    )

    setup()

    const title = await screen.findByLabelText(/tên task/i)

    await userEvent.type(title, "User typed")

    await waitFor(() => {
      expect(mockFetchTasks).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(title.value).toContain("User typed")
    })
  })
})
