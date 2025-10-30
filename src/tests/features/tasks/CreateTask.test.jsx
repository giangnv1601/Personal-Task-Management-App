/* eslint-disable no-undef */
import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

// ---- Mocks ----
jest.mock("react-redux", () => ({
  useSelector: jest.fn(),
}))

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
  }
})

// Dùng real helpers
jest.mock("@/utils/date", () => {
  const real = jest.requireActual("@/utils/date")
  return { ...real }
})
jest.mock("@/utils/validate", () => {
  const real = jest.requireActual("@/utils/validate")
  return { ...real }
})

// Mock useTask hook
const mockCreateTask = jest.fn()
jest.mock("@/hooks/useTask", () => ({
  __esModule: true,
  default: () => ({
    createTask: mockCreateTask,
    creating: false,
  }),
}))

// ---- Imports sau khi mock ----
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import CreateTask from "@/features/tasks/CreateTask"

// Thêm import trực tiếp các utils
import { toLocalInput, toUTCISOString } from "@/utils/date"
import { isValidUrl, validateDeadline } from "@/utils/validate"

// Utils cho test
const pad = (n) => String(n).padStart(2, "0")
const makeLocalDT = (offsetMinFromNow = 60) => {
  const d = new Date(Date.now() + offsetMinFromNow * 60 * 1000)
  const yyyy = d.getFullYear()
  const MM = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mm = pad(d.getMinutes())
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`
}

const getDeadlineInput = () =>
  document.querySelector('input[name="deadline"]')

describe("CreateTask (RHF version)", () => {
  const navigateMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateTask.mockReset()
    useSelector.mockImplementation(() => "user-123")
    useNavigate.mockReturnValue(navigateMock)
  })

  test("render form và validate thiếu title/deadline", async () => {
    render(<CreateTask />)
    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))
    expect(await screen.findByText(/vui lòng nhập tên task/i)).toBeInTheDocument()
    expect(await screen.findByText(/chọn deadline/i)).toBeInTheDocument()
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  test("validate deadline quá khứ", async () => {
    render(<CreateTask />)
    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "  Task A  ")
    const past = makeLocalDT(-10)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    await userEvent.clear(deadline)
    await userEvent.type(deadline, past)
    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))
    expect(await screen.findByText(/deadline phải ở tương lai/i)).toBeInTheDocument()
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  test("URL không hợp lệ -> hiển thị lỗi field và không submit", async () => {
    render(<CreateTask />)
    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "Task B")
    const future = makeLocalDT(90)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    await userEvent.type(deadline, future)
    await userEvent.type(screen.getByPlaceholderText(/https:\/\//i), "not-a-url")
    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))
    expect(await screen.findByText(/url không hợp lệ/i)).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  test("submit thành công: gọi createTask với payload đúng và reset form", async () => {
    render(<CreateTask />)
    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "   Task C   ")
    await userEvent.type(screen.getByPlaceholderText(/mô tả ngắn/i), "  desc  ")
    const future = makeLocalDT(120)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    await userEvent.type(deadline, future)
    const textInputs = screen.getAllByRole("textbox")
    const checklistTextInputs = textInputs.filter((el) => el.className?.includes("text-sm"))
    if (checklistTextInputs.length > 0) {
      await userEvent.clear(checklistTextInputs[0])
      await userEvent.type(checklistTextInputs[0], "  item-1  ")
    }
    await userEvent.type(
      screen.getByPlaceholderText(/https:\/\//i),
      "https://example.com/file.pdf"
    )
    mockCreateTask.mockResolvedValue({
      meta: { requestStatus: "fulfilled" },
      payload: { id: "task-1" },
    })
    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))
    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledTimes(1)
    })
    const calledWith = mockCreateTask.mock.calls[0][0]
    expect(calledWith.user_id).toBe("user-123")
    expect(calledWith.title).toBe("Task C")
    expect(calledWith.description).toBe("desc")
    const expectedISO = new Date(future).toISOString()
    expect(calledWith.deadline).toBe(expectedISO)
    expect(Array.isArray(calledWith.checklist)).toBe(true)
    expect(calledWith.checklist[0]).toHaveProperty("text", "item-1")
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Tạo task thành công!")
    })
    expect(screen.getByPlaceholderText(/nhập tiêu đề/i)).toHaveValue("")
  })

  test("submit lỗi từ createTask -> hiện toast.error", async () => {
    render(<CreateTask />)
    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "Task D")
    const future = makeLocalDT(45)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    await userEvent.type(deadline, future)
    mockCreateTask.mockResolvedValue({
      meta: { requestStatus: "rejected" },
      error: { message: "Server down" },
    })
    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server down")
    })
  })

  test("onCancel được gọi nếu truyền prop, không gọi navigate(-1)", async () => {
    const onCancel = jest.fn()
    render(<CreateTask onCancel={onCancel} />)
    await userEvent.click(screen.getByRole("button", { name: /huỷ/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  test("không có onCancel -> click Huỷ sẽ navigate(-1)", async () => {
    render(<CreateTask />)
    await userEvent.click(screen.getByRole("button", { name: /huỷ/i }))
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })

  test("không có userId -> toast.error và không submit", async () => {
    // ép MỌI lần gọi trong test này trả null
    useSelector.mockImplementation(() => null)

    render(<CreateTask />)

    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "Task E")
    const future = makeLocalDT(30)
    const deadline = getDeadlineInput()
    await userEvent.type(deadline, future)

    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Thiếu user đăng nhập")
    })
    expect(mockCreateTask).not.toHaveBeenCalled()

    // khôi phục cho test sau
    useSelector.mockImplementation(() => "user-123")
  })

  test("defaultValues.deadline (ISO) được chuẩn hoá vào input (toLocalInput)", async () => {
    const iso = new Date(Date.now() + 3600_000).toISOString() // +1h
    render(<CreateTask defaultValues={{ deadline: iso, title: "Has DV" }} />)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    expect(deadline.value).not.toBe("")
    expect(screen.getByPlaceholderText(/nhập tiêu đề/i)).toHaveValue("Has DV")
  })

  test("thêm & xoá checklist: append/remove hoạt động", async () => {
    render(<CreateTask />)
    const before = document.querySelectorAll('input[name^="checklist."][name$=".text"]')
    expect(before.length).toBe(2)
    await userEvent.click(screen.getByRole("button", { name: /\+\s*thêm checklist/i }))
    const afterAppend = document.querySelectorAll('input[name^="checklist."][name$=".text"]')
    expect(afterAppend.length).toBe(3)
    const removeButtons = screen.getAllByRole("button", { name: /xóa/i })
    await userEvent.click(removeButtons[removeButtons.length - 1])
    const afterRemove = document.querySelectorAll('input[name^="checklist."][name$=".text"]')
    expect(afterRemove.length).toBe(2)
  })

  test("set priority/status và submit -> payload mang đúng giá trị", async () => {
    render(<CreateTask />)

    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "Task F")
    const future = makeLocalDT(75)
    const deadline = getDeadlineInput()
    await userEvent.type(deadline, future)

    // Lấy cả 2 combobox và chọn theo index
    const selects = screen.getAllByRole("combobox")
    await userEvent.selectOptions(selects[0], "high") // priority
    await userEvent.selectOptions(selects[1], "done") // status

    mockCreateTask.mockResolvedValue({
      meta: { requestStatus: "fulfilled" },
      payload: { id: "task-2" },
    })

    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledTimes(1)
    })
    const calledWith = mockCreateTask.mock.calls[0][0]
    expect(calledWith.priority).toBe("high")
    expect(calledWith.status).toBe("done")
  })
})

/* Test bổ sung (múi giờ an toàn): utils/date */
describe("utils/date", () => {
  const localParts = (dateLike) => {
    const dt = typeof dateLike === "string" ? new Date(dateLike) : dateLike
    const pad2 = (n) => String(n).padStart(2, "0")
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(
      dt.getHours()
    )}:${pad2(dt.getMinutes())}`
  }

  test("toLocalInput trả đúng định dạng với Date object (không phụ thuộc timezone)", () => {
    const d = new Date("2025-01-02T03:04:05Z")
    const expected = localParts(d)
    expect(toLocalInput(d)).toBe(expected)
  })

  test("toLocalInput xử lý ISO string (không phụ thuộc timezone)", () => {
    const iso = "2025-12-31T23:59:59Z"
    const expected = localParts(new Date(iso))
    expect(toLocalInput(iso)).toBe(expected)
  })

  test("toLocalInput trả '' khi falsy hoặc không parse được", () => {
    expect(toLocalInput("")).toBe("")
    expect(toLocalInput(null)).toBe("")
    expect(toLocalInput(undefined)).toBe("")
    expect(toLocalInput("not-a-date")).toBe("")
  })

  test("toUTCISOString trả đúng ISO khi truyền local datetime (không phụ thuộc timezone)", () => {
    const local = "2025-01-02T03:04"
    const expected = new Date(local).toISOString()
    expect(toUTCISOString(local)).toBe(expected)
  })

  test("toUTCISOString trả null khi falsy hoặc không parse được", () => {
    expect(toUTCISOString("")).toBeNull()
    expect(toUTCISOString(null)).toBeNull()
    expect(toUTCISOString(undefined)).toBeNull()
    expect(toUTCISOString("invalid-datetime")).toBeNull()
  })
})

/* Test bổ sung: utils/validate  */
describe("utils/validate", () => {
  test("isValidUrl nhận diện URL hợp lệ/không hợp lệ", () => {
    expect(isValidUrl("https://example.com")).toBe(true)
    expect(isValidUrl("http://localhost:3000/a?b=c")).toBe(true)
    expect(isValidUrl("not-a-url")).toBe(false)
    expect(isValidUrl("")).toBe(true)
  })

  test("validateDeadline: quá khứ -> lỗi; tương lai -> true; định dạng xấu -> lỗi", () => {
    const past = makeLocalDT(-5)
    const future = makeLocalDT(10)
    expect(validateDeadline(past)).toMatch(/tương lai/i)
    expect(validateDeadline(future)).toBe(true)
    expect(validateDeadline("invalid")).toMatch(/không hợp lệ/i)
  })
})
