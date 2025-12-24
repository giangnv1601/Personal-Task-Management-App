 
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

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

// Mock utils/date
jest.mock("@/utils/date", () => {
  const pad = (n) => String(n).padStart(2, "0")
  return {
    __esModule: true,
    toLocalInput: (d) => {
      if (!d) return ""
      const dt = typeof d === "string" ? new Date(d) : d
      if (isNaN(dt.getTime())) return ""
      return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(
        dt.getHours()
      )}:${pad(dt.getMinutes())}`
    },
    toUTCISOString: (localDatetime) => {
      if (!localDatetime) return null
      // parse local "YYYY-MM-DDTHH:mm" as local time and convert to ISO
      const ts = Date.parse(localDatetime)
      if (isNaN(ts)) return null
      return new Date(localDatetime).toISOString()
    },
  }
})

jest.mock("@/utils/validate", () => {
  return {
    __esModule: true,
    isValidUrl: (url) => {
      if (!url) return true
      return /^https?:\/\/.+/i.test(url)
    },
    validateDeadline: (v, { allowPast = false } = {}) => {
      if (!v) return "Chọn deadline"
      const ts = Date.parse(v)
      if (isNaN(ts)) return "Deadline không hợp lệ"
      if (!allowPast && ts <= Date.now()) return "Deadline phải ở tương lai"
      return true
    },
    validateText: (text, { min = 0, max = Infinity } = {}) => {
      const s = (text || "").trim()
      if (s.length < min) return `Vui lòng nhập ít nhất ${min} ký tự`
      if (s.length > max) return `Tối đa ${max} ký tự`
      return true
    },
  }
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

import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import CreateTask from "@/features/tasks/CreateTask"
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

  test("Render form và báo lỗi khi thiếu tiêu đề hoặc deadline", async () => {
    render(<CreateTask />)
    await userEvent.click(screen.getByRole("button", { name: /tạo mới/i }))
    expect(await screen.findByText(/vui lòng nhập/i)).toBeInTheDocument()
    expect(await screen.findByText(/chọn deadline/i)).toBeInTheDocument()
    expect(mockCreateTask).not.toHaveBeenCalled()
  })

  test("Validate deadline quá khứ: hiển thị lỗi và không submit", async () => {
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

  test("URL đính kèm không hợp lệ: hiển thị lỗi field và không gọi createTask", async () => {
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

  test("Submit thành công: gọi createTask với payload chuẩn và reset form", async () => {
    render(<CreateTask />)
    await userEvent.type(screen.getByPlaceholderText(/nhập tiêu đề/i), "   Task C   ")
    await userEvent.type(screen.getByPlaceholderText(/mô tả ngắn/i), "  desc  ")
    const future = makeLocalDT(120)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    await userEvent.type(deadline, future)
    // Thêm checklist: click "Thêm checklist" và gõ nội dung
    const addChecklistBtn = screen.getByRole("button", { name: /\+\s*thêm checklist/i })
    await userEvent.click(addChecklistBtn)
    const checklistInput = document.querySelector('input[name^="checklist."][name$=".text"]')
    expect(checklistInput).toBeTruthy()
    await userEvent.clear(checklistInput)
    await userEvent.type(checklistInput, "  item-1  ")
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

  test("createTask trả lỗi: hiển thị toast.error với message từ API", async () => {
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

  test("Click Huỷ: nếu truyền onCancel thì chỉ gọi onCancel, không navigate(-1)", async () => {
    const onCancel = jest.fn()
    render(<CreateTask onCancel={onCancel} />)
    await userEvent.click(screen.getByRole("button", { name: /huỷ/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(navigateMock).not.toHaveBeenCalled()
  })

  test("Click Huỷ: nếu không truyền onCancel thì điều hướng navigate(-1)", async () => {
    render(<CreateTask />)
    await userEvent.click(screen.getByRole("button", { name: /huỷ/i }))
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })

  test("Thiếu userId trong store: hiển thị toast.error và không gọi createTask", async () => {
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

  test("defaultValues.deadline (ISO) được chuẩn hoá sang input thông qua toLocalInput", async () => {
    const iso = new Date(Date.now() + 3600_000).toISOString() // +1h
    render(<CreateTask defaultValues={{ deadline: iso, title: "Has DV" }} />)
    const deadline = getDeadlineInput()
    expect(deadline).toBeTruthy()
    expect(deadline.value).not.toBe("")
    expect(screen.getByPlaceholderText(/nhập tiêu đề/i)).toHaveValue("Has DV")
  })

  test("Checklist: thêm và xoá item hoạt động đúng", async () => {
    render(<CreateTask />)
    // ban đầu chưa có checklist item
    const before = document.querySelectorAll('input[name^="checklist."][name$=".text"]')
    expect(before.length).toBe(0)

    // thêm 1 item
    await userEvent.click(screen.getByRole("button", { name: /\+\s*thêm checklist/i }))
    const afterAppend = document.querySelectorAll('input[name^="checklist."][name$=".text"]')
    expect(afterAppend.length).toBe(1)

    // xoá item vừa thêm
    const removeButtons = screen.getAllByRole("button", { name: /xóa/i })
    expect(removeButtons.length).toBeGreaterThan(0)
    await userEvent.click(removeButtons[removeButtons.length - 1])
    const afterRemove = document.querySelectorAll('input[name^="checklist."][name$=".text"]')
    expect(afterRemove.length).toBe(0)
  })

  test("Thiết lập priority/status và submit: payload mang đúng giá trị", async () => {
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
describe("utils/date – toLocalInput & toUTCISOString", () => {
  const localParts = (dateLike) => {
    const dt = typeof dateLike === "string" ? new Date(dateLike) : dateLike
    const pad2 = (n) => String(n).padStart(2, "0")
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}T${pad2(
      dt.getHours()
    )}:${pad2(dt.getMinutes())}`
  }

  test("toLocalInput trả định dạng đúng với Date object (không phụ thuộc timezone)", () => {
    const d = new Date("2025-01-02T03:04:05Z")
    const expected = localParts(d)
    expect(toLocalInput(d)).toBe(expected)
  })

  test("toLocalInput xử lý ISO string đúng (không phụ thuộc timezone)", () => {
    const iso = "2025-12-31T23:59:59Z"
    const expected = localParts(new Date(iso))
    expect(toLocalInput(iso)).toBe(expected)
  })

  test("toLocalInput trả chuỗi rỗng khi falsy hoặc không parse được", () => {
    expect(toLocalInput("")).toBe("")
    expect(toLocalInput(null)).toBe("")
    expect(toLocalInput(undefined)).toBe("")
    expect(toLocalInput("not-a-date")).toBe("")
  })

  test("toUTCISOString trả ISO string khi truyền local datetime (không phụ thuộc timezone)", () => {
    const local = "2025-01-02T03:04"
    const expected = new Date(local).toISOString()
    expect(toUTCISOString(local)).toBe(expected)
  })

  test("toUTCISOString trả null khi giá trị falsy hoặc không parse được", () => {
    expect(toUTCISOString("")).toBeNull()
    expect(toUTCISOString(null)).toBeNull()
    expect(toUTCISOString(undefined)).toBeNull()
    expect(toUTCISOString("invalid-datetime")).toBeNull()
  })
})

/* Test bổ sung: utils/validate  */
describe("utils/validate – isValidUrl & validateDeadline", () => {
  test("isValidUrl nhận diện đúng URL hợp lệ / không hợp lệ", () => {
    expect(isValidUrl("https://example.com")).toBe(true)
    expect(isValidUrl("http://localhost:3000/a?b=c")).toBe(true)
    expect(isValidUrl("not-a-url")).toBe(false)
    expect(isValidUrl("")).toBe(true)
  })

  test("validateDeadline: deadline quá khứ báo lỗi, tương lai hợp lệ, định dạng xấu báo lỗi", () => {
    const past = makeLocalDT(-5)
    const future = makeLocalDT(10)
    expect(validateDeadline(past)).toMatch(/tương lai/i)
    expect(validateDeadline(future)).toBe(true)
    expect(validateDeadline("invalid")).toMatch(/không hợp lệ/i)
  })
})
