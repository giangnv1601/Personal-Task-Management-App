import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"

jest.mock("@/utils/date", () => ({
  __esModule: true,
  formatDate: (iso) => (iso ? `FMT(${iso})` : "-"),
}))
jest.mock("@/assets/user.webp", () => "avatar-default.webp")
jest.mock("@/hooks/useAuth", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("@/hooks/useTask", () => ({ __esModule: true, default: jest.fn() }))

import useAuth from "@/hooks/useAuth"
import useTask from "@/hooks/useTask"
import Profile from "@/pages/Profile.jsx"

describe("Profile Page (happy + edge)", () => {
  const mockFetchProfile = jest.fn()
  const mockFetchTasks = jest.fn()

  const setup = ({ auth = {}, task = {} } = {}) => {
    useAuth.mockReturnValue({
      user: null,
      loading: false,
      error: null,
      fetchProfile: mockFetchProfile,
      ...auth,
    })

    useTask.mockReturnValue({
      items: [],
      loading: false,
      fetchTasks: mockFetchTasks,
      ...task,
    })

    return render(<Profile />)
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  //  ---------- Happy ----------
  test("effect_shouldCallFetchProfileAndTasks_whenUserIdPresent", async () => {
    setup({
      auth: { user: { id: "user-1", email: "a@b.com" } },
    })

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalledWith("user-1")
      expect(mockFetchTasks).toHaveBeenCalledWith({ userId: "user-1" })
    })
  })

  test("render_shouldShowFullProfileInfo_whenUserHasData", () => {
    setup({
      auth: {
        user: {
          id: "user-2",
          full_name: "Nguyễn B",
          email: "nguyenb@example.com",
          created_at: "2025-02-02T10:00:00.000Z",
          avatar: "https://example.com/avatar.png",
        },
      },
      task: { items: [{ id: 1 }, { id: 2 }, { id: 3 }] },
    })

    expect(screen.getByText("Nguyễn B")).toBeInTheDocument()
    expect(screen.getByAltText("Ảnh đại diện của Nguyễn B")).toHaveAttribute(
      "src",
      "https://example.com/avatar.png"
    )

    expect(screen.getByText(/Email:/i)).toBeInTheDocument()
    expect(screen.getByText("nguyenb@example.com")).toBeInTheDocument()

    expect(screen.getByText(/Ngày đăng ký:/i)).toBeInTheDocument()
    expect(screen.getByText("FMT(2025-02-02T10:00:00.000Z)")).toBeInTheDocument()

    const dl = screen.getByText(/Số task đã tạo:/i).closest("dl")
    expect(within(dl).getByText(/^3$/)).toBeInTheDocument()
  })

  // -----------Edge-----------
  test("render_shouldNotCallFetch_whenUserIdMissing", () => {
    setup({ auth: { user: null } })

    expect(mockFetchProfile).not.toHaveBeenCalled()
    expect(mockFetchTasks).not.toHaveBeenCalled()

    expect(screen.queryByAltText(/Ảnh đại diện của/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Email:/i)).not.toBeInTheDocument()
  })

  test("render_shouldFallbackDisplayName_whenFullNameMissing", () => {
    setup({
      auth: {
        user: { id: "user-3", email: "no_name@example.com" },
      },
    })

    expect(screen.getByText("no_name")).toBeInTheDocument()
    expect(screen.getByAltText("Ảnh đại diện của no_name")).toBeInTheDocument()
  })

  test("render_shouldShowTotalTasksAsZero_whenItemsIsNotArray", () => {
    setup({
      auth: { user: { id: "user-4", email: "x@y.com" } },
      task: { items: null },
    })

    const dl = screen.getByText(/Số task đã tạo:/i).closest("dl")
    expect(within(dl).getByText(/^0$/)).toBeInTheDocument()
  })
})
