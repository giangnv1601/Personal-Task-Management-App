/* eslint-disable no-undef */
import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"

// ---- Mocks chung ----
jest.mock("sonner", () => ({
  __esModule: true,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// mock date utils
jest.mock("@/utils/date", () => ({
  __esModule: true,
  toLocalInput: (iso) => {
    if (!iso) return ""
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  },
  toUTCISOString: (localStr) => (localStr ? new Date(localStr).toISOString() : null),
}))

// mock validate utils (để kiểm soát validateDeadline / validateText)
const mockValidateDeadline = jest.fn(() => true)
const mockValidateText = jest.fn(() => true)

jest.mock("@/utils/validate", () => ({
  __esModule: true,
  validateDeadline: (...args) => mockValidateDeadline(...args),
  validateText: (...args) => mockValidateText(...args),
}))

// mock ConfirmDialog thành dialog đơn giản dễ test
jest.mock("@/components/ui/ConfirmDialog", () => ({
  __esModule: true,
  default: ({ open, title, message, confirmText, cancelText, onConfirm, onCancel }) => {
    if (!open) return null
    return (
      <div role="dialog" aria-label={title}>
        <p>{message}</p>
        <button onClick={onCancel}>{cancelText}</button>
        <button onClick={onConfirm}>{confirmText}</button>
      </div>
    )
  },
}))

// mock navigate + params
const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "123" }),
  }
})

// mock useTask
const mockUpdateTask = jest.fn()
const mockDeleteTask = jest.fn()
const mockFetchTasks = jest.fn()
let mockItems = []
let mockLoading = false

jest.mock("@/hooks/useTask", () => ({
  __esModule: true,
  default: () => ({
    items: mockItems,
    loading: mockLoading,
    fetchTasks: mockFetchTasks,
    updateTask: mockUpdateTask,
    deleteTask: mockDeleteTask,
  }),
}))

import UpdateTask from "@/features/tasks/UpdateTask.jsx"

const setup = () =>
  render(
    <MemoryRouter>
      <UpdateTask />
    </MemoryRouter>
  )

// helpers
const findTitleInput = () =>
  screen.findByPlaceholderText(/nhập tên task/i)
const getDeadlineInput = () =>
  document.querySelector('input[type="datetime-local"]')
const getStatusSelect = () =>
  document.querySelector("select[name='status'], select[name='status']") ||
  document.querySelector("select") // fallback
const getPrioritySelect = () => {
  const selects = document.querySelectorAll("select")
  // priority là select thứ hai trong form
  return selects[1] || selects[0]
}

beforeEach(() => {
  jest.clearAllMocks()
  mockItems = []
  mockLoading = false
  mockValidateDeadline.mockClear()
  mockValidateText.mockClear()
})

describe("UpdateTask", () => {
  test("Trạng thái ban đầu: nút Cập nhật bị vô hiệu khi form chưa thay đổi", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task ban đầu",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    const submitBtn = await screen.findByRole("button", { name: /cập nhật/i })
    expect(submitBtn).toBeDisabled()
  })

  test("Load task từ store: hiển thị dữ liệu và không gọi fetchTasks", async () => {
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
      },
    ]

    setup()

    const title = await findTitleInput()
    expect(title).toHaveValue("Task từ store")
    expect(getStatusSelect().value).toBe("in_progress")
    expect(getPrioritySelect().value).toBe("high")
    expect(mockFetchTasks).not.toHaveBeenCalled()
  })

  test("Khi store rỗng: gọi fetchTasks và điền form từ res.data", async () => {
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
        },
      ],
    })

    setup()

    const title = await findTitleInput()
    await waitFor(() => expect(title).toHaveValue("Task từ fetch"))
    expect(mockFetchTasks).toHaveBeenCalled()
  })

  test("Submit: mở ConfirmDialog và xác nhận sẽ gọi updateTask và điều hướng về /tasks", async () => {
    mockItems = [
      {
        id: "123",
        title: "Old title",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    mockUpdateTask.mockResolvedValue({
      meta: { requestStatus: "fulfilled" },
    })

    setup()

    const title = await findTitleInput()
    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })

    // làm form dirty
    await userEvent.type(title, " X")
    expect(submitBtn).toBeEnabled()

    // click submit → mở dialog
    await userEvent.click(submitBtn)

    const dialog = await screen.findByRole("dialog", {
      name: /cập nhật task/i,
    })
    expect(dialog).toBeInTheDocument()

    const saveBtn = within(dialog).getByRole("button", { name: /lưu/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledTimes(1)
    })

    const [calledId, calledPayload] = mockUpdateTask.mock.calls[0]
    expect(String(calledId)).toBe("123")
    expect(calledPayload.title.trim()).toContain("Old title")
    expect(mockNavigate).toHaveBeenCalledWith("/tasks")
  })

  test("Xoá: mở ConfirmDialog và xác nhận sẽ gọi deleteTask và điều hướng về /tasks", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task delete",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    mockDeleteTask.mockResolvedValue({
      meta: { requestStatus: "fulfilled" },
    })

    setup()

    const deleteBtn = await screen.findByRole("button", { name: /xo[aá] task/i })
    await userEvent.click(deleteBtn)

    const dialog = await screen.findByRole("dialog", {
      name: /xóa task/i,
    })
    const confirmBtn = within(dialog).getByRole("button", { name: /^xóa$/i })
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith("123")
      expect(mockNavigate).toHaveBeenCalledWith("/tasks")
    })
  })

  test("Huỷ khi form chưa thay đổi: điều hướng -1 ngay, không mở dialog", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    const cancelBtn = await screen.findByRole("button", { name: /huỷ/i })
    await userEvent.click(cancelBtn)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  test("Huỷ khi form đã thay đổi: mở ConfirmDialog và xác nhận 'Rời trang' sẽ điều hướng -1", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    const title = await findTitleInput()
    await userEvent.type(title, " X") // dirty

    const cancelBtn = screen.getByRole("button", { name: /huỷ/i })
    await userEvent.click(cancelBtn)

    const dialog = await screen.findByRole("dialog", { name: /rời trang\?/i })
    const leaveBtn = within(dialog).getByRole("button", { name: /rời trang/i })
    await userEvent.click(leaveBtn)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test("Checkbox 'Cho phép deadline trong quá khứ' mặc định bật và toggle gọi validateDeadline với allowPast tương ứng", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    const checkbox = await screen.findByLabelText(/cho phép deadline trong quá khứ/i)
    // mặc định true
    expect(checkbox).toBeChecked()

    // initial validate may not run on mount -> clear to assert only toggle-triggered calls
    mockValidateDeadline.mockClear()

    // toggle sang false -> allowPast: false
    await userEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
    await waitFor(() => {
      expect(mockValidateDeadline).toHaveBeenCalled()
    })
    const firstCallOptions = mockValidateDeadline.mock.calls[0][1]
    expect(firstCallOptions).toMatchObject({ allowPast: false })

    mockValidateDeadline.mockClear()

    // toggle lại sang true -> allowPast: true
    await userEvent.click(checkbox)
    expect(checkbox).toBeChecked()
    await waitFor(() => {
      expect(mockValidateDeadline).toHaveBeenCalled()
    })
    const secondCallOptions = mockValidateDeadline.mock.calls[0][1]
    expect(secondCallOptions).toMatchObject({ allowPast: true })
  })

  test("Deadline input hiển thị đúng từ ISO và khi submit gửi giá trị dạng ISO string", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: "2025-11-10T09:30:00.000Z",
        attachment_url: "",
        checklist: [],
      },
    ]
    mockUpdateTask.mockResolvedValue({
      meta: { requestStatus: "fulfilled" },
    })

    setup()

    const deadlineInput = getDeadlineInput()
    expect(deadlineInput).toBeInTheDocument()
    // toLocalInput đã trả về dạng YYYY-MM-DDTHH:mm (không assert exact, chỉ cần có 'T')
    expect(deadlineInput.value).toMatch(/T\d{2}:\d{2}$/)

    const title = await findTitleInput()
    await userEvent.type(title, " X") // dirty

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)

    const dialog = await screen.findByRole("dialog", { name: /cập nhật task/i })
    const saveBtn = within(dialog).getByRole("button", { name: /lưu/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled()
    })

    const [, payload] = mockUpdateTask.mock.calls[0]
    expect(typeof payload.deadline === "string" || payload.deadline === null).toBe(true)
  })

  test("Submit thất bại (requestStatus !== 'fulfilled') sẽ hiển thị toast.error", async () => {
    const { toast } = require("sonner")

    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    mockUpdateTask.mockResolvedValue({
      meta: { requestStatus: "rejected" },
      error: { message: "Server says no" },
    })

    setup()

    const title = await findTitleInput()
    await userEvent.type(title, " X")

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)

    const dialog = await screen.findByRole("dialog", { name: /cập nhật task/i })
    const saveBtn = within(dialog).getByRole("button", { name: /lưu/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalled()
    })
  })

  test("fetchTasks ném lỗi sẽ hiển thị toast.error", async () => {
    const { toast } = require("sonner")

    mockItems = []
    mockFetchTasks.mockRejectedValue(new Error("boom"))

    setup()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  test("Thay đổi allowPastDeadline sẽ re-validate deadline khi có giá trị", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    const deadlineInput = getDeadlineInput()
    expect(deadlineInput).toBeInTheDocument()

    // set a local datetime value into the datetime-local input
    await userEvent.clear(deadlineInput)
    await userEvent.type(deadlineInput, "2025-11-10T10:00")

    const checkbox = await screen.findByLabelText(/cho phép deadline trong quá khứ/i)
    expect(checkbox).toBeInTheDocument()

    mockValidateDeadline.mockClear()
    // toggle off -> allowPast: false
    await userEvent.click(checkbox)
    await waitFor(() => {
      expect(mockValidateDeadline).toHaveBeenCalled()
    })
    const firstOpts = mockValidateDeadline.mock.calls[0][1]
    expect(firstOpts).toMatchObject({ allowPast: false })

    mockValidateDeadline.mockClear()
    // toggle on -> allowPast: true
    await userEvent.click(checkbox)
    await waitFor(() => {
      expect(mockValidateDeadline).toHaveBeenCalled()
    })
    const secondOpts = mockValidateDeadline.mock.calls[0][1]
    expect(secondOpts).toMatchObject({ allowPast: true })
  })

  test("Checklist: thêm và xoá item hoạt động đúng", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    // initially no checklist text inputs
    expect(screen.queryAllByPlaceholderText(/nội dung công việc/i).length).toBe(0)

    const addBtn = screen.getByRole("button", { name: /\+?\s*thêm checklist/i })
    await userEvent.click(addBtn)

    const afterOne = screen.getAllByPlaceholderText(/nội dung công việc/i)
    expect(afterOne.length).toBe(1)

    // append another
    await userEvent.click(addBtn)
    const afterTwo = screen.getAllByPlaceholderText(/nội dung công việc/i)
    expect(afterTwo.length).toBe(2)

    // remove the last appended item
    const lastInput = afterTwo[afterTwo.length - 1]
    const removeBtn = lastInput.closest("div")?.querySelector("button")
    expect(removeBtn).toBeTruthy()
    await userEvent.click(removeBtn)
    expect(screen.getAllByPlaceholderText(/nội dung công việc/i).length).toBe(1)
  })

  test("Attachment URL không hợp lệ sẽ hiển thị lỗi và không mở ConfirmDialog để submit", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task URL",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    // make form dirty
    const title = await findTitleInput()
    await userEvent.type(title, " X")

    // fill invalid url
    const attach = document.querySelector('input[name="attachment_url"]')
    expect(attach).toBeInTheDocument()
    await userEvent.type(attach, "nota-url")

    // try submit -> because field is invalid, ConfirmDialog should NOT open
    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)

    // dialog must not be present and updateTask must not be called
    expect(screen.queryByRole("dialog", { name: /cập nhật task/i })).toBeNull()

    await waitFor(() => {
      expect(mockUpdateTask).not.toHaveBeenCalled()
      expect(screen.getByText(/url không hợp lệ/i)).toBeInTheDocument()
    })
  })

  test("ConfirmDialog: nhấn Hủy sẽ đóng dialog và không thực hiện hành động", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task cancel",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]

    setup()

    const title = await findTitleInput()
    await userEvent.type(title, " dirty")

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)

    const dialog = await screen.findByRole("dialog", { name: /cập nhật task/i })
    const cancelBtn = within(dialog).getByRole("button", { name: /hủy/i })
    await userEvent.click(cancelBtn)

    // dialog should close and no update called
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(mockUpdateTask).not.toHaveBeenCalled()
  })

  test("Submit: payload gửi lên bao gồm đầy đủ checklist đã thêm", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task checklist",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    mockUpdateTask.mockResolvedValue({ meta: { requestStatus: "fulfilled" } })

    setup()

    // append two checklist items
    const addBtn = screen.getByRole("button", { name: /\+?\s*thêm checklist/i })
    await userEvent.click(addBtn)
    await userEvent.click(addBtn)

    const inputs = screen.getAllByPlaceholderText(/nội dung công việc/i)
    expect(inputs.length).toBeGreaterThanOrEqual(2)

    await userEvent.type(inputs[0], "First item")
    await userEvent.type(inputs[1], "Second item")

    // make form dirty (title)
    const title = await findTitleInput()
    await userEvent.type(title, " X")

    // submit -> confirm
    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)
    const dialog = await screen.findByRole("dialog", { name: /cập nhật task/i })
    const saveBtn = within(dialog).getByRole("button", { name: /lưu/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled()
    })

    const [, payload] = mockUpdateTask.mock.calls[0]
    expect(Array.isArray(payload.checklist)).toBe(true)
    const texts = payload.checklist.map((c) => (c && c.text ? String(c.text) : ""))
    expect(texts).toEqual(expect.arrayContaining(["First item", "Second item"]))
  })

  test("fetchTasks trả về không có task trùng id sẽ hiển thị toast.error 'Không tìm thấy task'", async () => {
    const { toast } = require("sonner")

    mockItems = []
    mockFetchTasks.mockResolvedValue({
      data: [
        {
          id: "999",
          title: "Other",
        },
      ],
    })

    setup()

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  test("Xoá task thất bại (requestStatus rejected) sẽ hiển thị toast.error với thông báo API", async () => {
    const { toast } = require("sonner")

    mockItems = [
      {
        id: "123",
        title: "Task delete fail",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    mockDeleteTask.mockResolvedValue({
      meta: { requestStatus: "rejected" },
      error: { message: "Invalid API key" },
    })

    setup()

    const deleteBtn = await screen.findByRole("button", { name: /xo[aá] task/i })
    await userEvent.click(deleteBtn)

    const dialog = await screen.findByRole("dialog", { name: /xóa task/i })
    const confirmBtn = within(dialog).getByRole("button", { name: /^xóa$/i })
    await userEvent.click(confirmBtn)

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalledWith("123")
      expect(toast.error).toHaveBeenCalled()
      const calls = toast.error.mock.calls.map((c) => String(c[0]).toLowerCase())
      expect(calls.some((c) => c.includes("invalid api key".toLowerCase()))).toBe(true)
    })
  })

  test("updateTask ném lỗi (reject) sẽ hiển thị toast.error với nội dung lỗi", async () => {
    const { toast } = require("sonner")

    mockItems = [
      {
        id: "123",
        title: "Task update fail",
        description: "",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    // simulate unexpected exception from hook
    mockUpdateTask.mockRejectedValue(new Error("network boom"))

    setup()

    const title = await findTitleInput()
    await userEvent.type(title, " X") // dirty

    const submitBtn = screen.getByRole("button", { name: /cập nhật/i })
    await userEvent.click(submitBtn)

    const dialog = await screen.findByRole("dialog", { name: /cập nhật task/i })
    const saveBtn = within(dialog).getByRole("button", { name: /lưu/i })
    await userEvent.click(saveBtn)

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled()
      expect(toast.error).toHaveBeenCalled()
      const calls = toast.error.mock.calls.map((c) => String(c[0]).toLowerCase())
      expect(calls.some((c) => c.includes("network boom"))).toBe(true)
    })
  })

  test("Khi loading=true: toàn bộ control trong form bị disable", async () => {
    mockItems = [
      {
        id: "123",
        title: "Task loading",
        description: "desc",
        status: "todo",
        priority: "medium",
        deadline: null,
        attachment_url: "",
        checklist: [],
      },
    ]
    mockLoading = true

    setup()

    const title = await findTitleInput()
    const deadline = getDeadlineInput()
    const status = getStatusSelect()
    const priority = getPrioritySelect()
    const addChecklistBtn = screen.getByRole("button", { name: /\+?\s*thêm checklist/i })
    const deleteBtn = screen.getByRole("button", { name: /xo[aá] task/i })
    const cancelBtn = screen.getByRole("button", { name: /huỷ/i })

    expect(title).toBeDisabled()
    if (deadline) expect(deadline).toBeDisabled()
    if (status) expect(status).toBeDisabled()
    if (priority) expect(priority).toBeDisabled()
    expect(addChecklistBtn).toBeDisabled()
    expect(deleteBtn).toBeDisabled()
    expect(cancelBtn).toBeDisabled()

    // reset loading cho test sau
    mockLoading = false
  })
})
