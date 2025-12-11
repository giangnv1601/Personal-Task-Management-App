/* eslint-disable no-undef */
import React from "react"
import { render, screen, waitFor } from "@testing-library/react"

// Mock formatDate
jest.mock("@/utils/date", () => ({
  __esModule: true,
  formatDate: (iso) => (iso ? `FMT(${iso})` : "-"),
}))

// Mock AvatarDefault
jest.mock("@/assets/user.webp", () => "avatar-default.webp")

// Mock useAuth
jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: jest.fn(),
}))

// Mock useTask
jest.mock("@/hooks/useTask", () => ({
  __esModule: true,
  default: jest.fn(),
}))

import useAuth from "@/hooks/useAuth"
import useTask from "@/hooks/useTask"
import Profile from "@/pages/Profile.jsx"

const renderUI = () => render(<Profile />)

describe("Profile Page", () => {
  const mockFetchProfile = jest.fn()
  const mockFetchTasks = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test("Không có user → không gọi fetchProfile/fetchTasks, không render avatar & info", () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    // Tiêu đề luôn có
    expect(
      screen.getByRole("heading", { name: "Hồ sơ cá nhân" })
    ).toBeInTheDocument()

    // Không gọi fetch
    expect(mockFetchProfile).not.toHaveBeenCalled()
    expect(mockFetchTasks).not.toHaveBeenCalled()

    // Không có avatar
    expect(
      screen.queryByAltText(/Ảnh đại diện của/i)
    ).not.toBeInTheDocument()

    // Không có label Email vì profile.id không tồn tại
    expect(screen.queryByText("Email:")).not.toBeInTheDocument()
  })

  test("Có user.id → gọi fetchProfile và fetchTasks đúng tham số", async () => {
    const user = {
      id: "user-1",
      full_name: "Nguyễn A",
      email: "nguyena@example.com",
      created_at: "2025-01-01T00:00:00.000Z",
    }

    useAuth.mockReturnValue({
      user,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalledWith("user-1")
      expect(mockFetchTasks).toHaveBeenCalledWith({ userId: "user-1" })
    })
  })

  test("Hiển thị thông tin đầy đủ: tên, email, ngày đăng ký, số task, avatar", () => {
    const user = {
      id: "user-2",
      full_name: "Nguyễn B",
      email: "nguyenb@example.com",
      created_at: "2025-02-02T10:00:00.000Z",
      avatar: "https://example.com/avatar.png",
    }

    useAuth.mockReturnValue({
      user,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    // Tiêu đề
    expect(
      screen.getByRole("heading", { name: "Hồ sơ cá nhân" })
    ).toBeInTheDocument()

    // Tên hiển thị
    expect(screen.getByText("Nguyễn B")).toBeInTheDocument()

    // Avatar dùng avatar của profile
    const img = screen.getByAltText("Ảnh đại diện của Nguyễn B")
    expect(img).toBeInTheDocument()
    expect(img.getAttribute("src")).toBe("https://example.com/avatar.png")

    // Email
    expect(screen.getByText("Email:")).toBeInTheDocument()
    expect(screen.getByText("nguyenb@example.com")).toBeInTheDocument()

    // Ngày đăng ký dùng formatDate mock
    expect(screen.getByText("Ngày đăng ký:")).toBeInTheDocument()
    expect(
      screen.getByText("FMT(2025-02-02T10:00:00.000Z)")
    ).toBeInTheDocument()

    // Tổng số task
    expect(screen.getByText("Số task đã tạo:")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()

    // Hai nút hành động
    expect(
      screen.getByRole("button", { name: "Sửa thông tin" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Đổi mật khẩu" })
    ).toBeInTheDocument()
  })

  test("displayName fallback: không có full_name → dùng phần trước @ của email", () => {
    const user = {
      id: "user-3",
      email: "no_name@example.com",
      created_at: "2025-03-03T00:00:00.000Z",
    }

    useAuth.mockReturnValue({
      user,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    // DisplayName = "no_name"
    expect(screen.getByText("no_name")).toBeInTheDocument()
    expect(
      screen.getByAltText("Ảnh đại diện của no_name")
    ).toBeInTheDocument()
  })

  test("displayName fallback: không có full_name & email → dùng 'Người dùng' và avatar default", () => {
    const user = {
      id: "user-4",
      created_at: "2025-04-04T00:00:00.000Z",
      avatar: "", // không có avatar
    }

    useAuth.mockReturnValue({
      user,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    expect(screen.getByText("Người dùng")).toBeInTheDocument()
    const img = screen.getByAltText("Ảnh đại diện của Người dùng")
    expect(img).toBeInTheDocument()
    // dùng AvatarDefault mock
    expect(img.getAttribute("src")).toBe("avatar-default.webp")
  })

  test("authError → hiển thị thông báo lỗi", () => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      error: "Token hết hạn",
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    expect(
      screen.getByText("Lỗi tải hồ sơ: Token hết hạn")
    ).toBeInTheDocument()
  })

  test("isLoading = true (authLoading) → hiển thị thông báo 'Đang tải hồ sơ và thống kê task...'", () => {
    const user = {
      id: "user-5",
      full_name: "User Loading",
      email: "loading@example.com",
    }

    useAuth.mockReturnValue({
      user,
      loading: true,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    expect(
      screen.getByText("Đang tải hồ sơ và thống kê task...")
    ).toBeInTheDocument()
  })

  test("tasksLoading = true → số task hiển thị kèm '(đang cập nhật...)'", () => {
    const user = {
      id: "user-6",
      full_name: "User Tasks",
      email: "tasks@example.com",
      created_at: "2025-05-05T00:00:00.000Z",
    }

    useAuth.mockReturnValue({
      user,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
    })

    useTask.mockReturnValue({
      items: [{ id: 1 }, { id: 2 }],
      loading: true, // tasksLoading = true
      fetchTasks: mockFetchTasks,
    })

    renderUI()

    // "2 (đang cập nhật...)"
    expect(
      screen.getByText(/2 \(đang cập nhật\.\.\.\)/)
    ).toBeInTheDocument()
  })
})
