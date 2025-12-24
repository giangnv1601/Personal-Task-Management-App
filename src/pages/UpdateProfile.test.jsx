 
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

// Mock formatDate
jest.mock("@/utils/date", () => ({
  __esModule: true,
  formatDate: (iso) => (iso ? `FMT(${iso})` : "-"),
}))

// Mock AvatarDefault
jest.mock("@/assets/user.webp", () => "avatar-default.webp")

// Mock toast
jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
import { toast } from "sonner"

// Mock ConfirmDialog
jest.mock("@/components/ui/ConfirmDialog", () => ({
  __esModule: true,
  default: ({
    open,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
  }) => {
    if (!open) return null
    return (
      <div role="dialog" aria-label={title}>
        <h2>{title}</h2>
        <p>{message}</p>
        <button type="button" onClick={onConfirm}>
          {confirmText}
        </button>
        <button type="button" onClick={onCancel}>
          {cancelText}
        </button>
      </div>
    )
  },
}))

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  __esModule: true,
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

// Mock useAuth
jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useAuth from "@/hooks/useAuth"

// Component
import UpdateProfile from "@/pages/UpdateProfile.jsx"

describe("UpdateProfile Page", () => {
  const mockUpdateProfile = jest.fn()

  const defaultUser = {
    id: "user-1",
    full_name: "Nguyễn A",
    email: "a@example.com",
    created_at: "2025-02-02T10:00:00.000Z",
    avatar: "https://example.com/avatar.png",
  }

  const setup = (overrides = {}) => {
    useAuth.mockReturnValue({
      user: defaultUser,
      loading: false,
      error: null,
      updateProfile: mockUpdateProfile,
      ...overrides,
    })
    return render(<UpdateProfile />)
  }

  beforeEach(() => {
    jest.clearAllMocks()

    global.URL.createObjectURL = jest.fn(() => "blob:preview")
    global.URL.revokeObjectURL = jest.fn()
  })

  describe("Happy cases", () => {
    test("render_shouldPrefillFormFields_whenUserAvailable", async () => {
      setup()

      await waitFor(() => {
        expect(screen.getByLabelText("Họ tên")).toHaveValue("Nguyễn A")
        expect(screen.getByLabelText("Email")).toHaveValue("a@example.com")
      })

      expect(screen.getByLabelText("Email")).toHaveAttribute("readOnly")

      expect(screen.getByLabelText("Ngày đăng ký")).toHaveValue(
        "FMT(2025-02-02T10:00:00.000Z)"
      )

      const avatarImg = screen.getByAltText("Ảnh đại diện của Nguyễn A")
      expect(avatarImg).toHaveAttribute("src", "https://example.com/avatar.png")

      expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeDisabled()
    })

    test("avatarChange_shouldShowPreviewAndEnableSave_whenValidFileSelected", async () => {
      setup()

      const fileInput = document.querySelector('input[type="file"]')
      const file = new File([new Uint8Array(10)], "avatar.png", {
        type: "image/png",
      })

      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(URL.createObjectURL).toHaveBeenCalled()

      const img = screen.getByAltText("Ảnh đại diện của Nguyễn A")
      await waitFor(() => expect(img).toHaveAttribute("src", "blob:preview"))

      expect(screen.getByRole("button", { name: "Lưu thay đổi" })).toBeEnabled()
    })

    test("submit_shouldCallUpdateProfileAndNavigateToProfile_whenUpdateSucceeds", async () => {
      setup()

      const user = userEvent.setup()
      const fullNameInput = screen.getByLabelText("Họ tên")

      await user.clear(fullNameInput)
      await user.type(fullNameInput, "Nguyễn B")

      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }))

      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalledWith({
          userId: "user-1",
          updates: { full_name: "Nguyễn B" },
        })
      })

      expect(toast.success).toHaveBeenCalledWith("Cập nhật hồ sơ thành công!")
      expect(mockNavigate).toHaveBeenCalledWith("/profile")
    })

    test("submit_shouldIncludeAvatarFile_whenAvatarFileSelected", async () => {
      setup()

      const fileInput = document.querySelector('input[type="file"]')
      const file = new File([new Uint8Array(10)], "avatar.png", {
        type: "image/png",
      })

      fireEvent.change(fileInput, { target: { files: [file] } })
      await userEvent.click(screen.getByRole("button", { name: "Lưu thay đổi" }))

      await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalled())

      const arg = mockUpdateProfile.mock.calls[0][0]
      expect(arg).toEqual({
        userId: "user-1",
        updates: { full_name: "Nguyễn A", avatarFile: file },
      })
    })

    test("cancel_shouldNavigateBackImmediately_whenNoUnsavedChanges", async () => {
      setup()

      await userEvent.click(screen.getByRole("button", { name: "Hủy" }))

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })

  describe("Edge cases", () => {
    test("render_shouldShowLoadingState_whenLoadingTrue", () => {
      setup({ loading: true })
      expect(screen.getByText("Đang tải thông tin...")).toBeInTheDocument()
    })

    test("render_shouldShowErrorStateAndNavigateToProfile_whenUserMissingOrError", async () => {
      setup({ error: "boom", user: null })

      expect(
        screen.getByText("Không thể tải thông tin người dùng")
      ).toBeInTheDocument()

      await userEvent.click(screen.getByRole("button", { name: "Quay lại" }))
      expect(mockNavigate).toHaveBeenCalledWith("/profile")
    })

    test("render_shouldFallbackToDefaultAvatar_whenImageLoadFails", async () => {
      setup({
        user: { ...defaultUser, avatar: "https://broken.example.com/x.png" },
      })

      const img = await screen.findByAltText("Ảnh đại diện của Nguyễn A")
      fireEvent.error(img)

      expect(img).toHaveAttribute("src", "avatar-default.webp")
    })

    test("action_shouldTriggerHiddenFileInputClick_whenClickChangeAvatarButton", async () => {
      setup()

      const fileInput = document.querySelector('input[type="file"]')
      const spy = jest.spyOn(fileInput, "click")

      await userEvent.click(screen.getByRole("button", { name: "Thay ảnh" }))
      expect(spy).toHaveBeenCalled()
    })

    test("avatarChange_shouldShowToastError_whenFileTypeNotAllowed", () => {
      setup()

      const fileInput = document.querySelector('input[type="file"]')
      const badFile = { type: "application/pdf", size: 1000, name: "x.pdf" }

      fireEvent.change(fileInput, { target: { files: [badFile] } })

      expect(toast.error).toHaveBeenCalledWith(
        "Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP"
      )
      expect(URL.createObjectURL).not.toHaveBeenCalled()
    })

    test("avatarChange_shouldShowToastError_whenFileSizeExceedsLimit", () => {
      setup()

      const fileInput = document.querySelector('input[type="file"]')
      const bigFile = {
        type: "image/png",
        size: 5 * 1024 * 1024 + 1,
        name: "x.png",
      }

      fireEvent.change(fileInput, { target: { files: [bigFile] } })

      expect(toast.error).toHaveBeenCalledWith(
        "Kích thước ảnh không được vượt quá 5MB"
      )
      expect(URL.createObjectURL).not.toHaveBeenCalled()
    })

    test("cleanup_shouldRevokePreviewObjectUrl_whenComponentUnmountsAfterSelectingAvatar", async () => {
      const { unmount } = setup()

      const fileInput = document.querySelector('input[type="file"]')
      const file = new File([new Uint8Array(10)], "avatar.webp", {
        type: "image/webp",
      })

      fireEvent.change(fileInput, { target: { files: [file] } })
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled())

      unmount()
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview")
    })

    test("submit_shouldShowToastError_whenUpdateProfileRejects", async () => {
      mockUpdateProfile.mockRejectedValueOnce("fail")
      setup()

      const user = userEvent.setup()
      const fullNameInput = screen.getByLabelText("Họ tên")

      await user.clear(fullNameInput)
      await user.type(fullNameInput, "Nguyễn C")
      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }))

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("fail")
      })
    })

    test("submit_shouldShowToastErrorAndNotCallUpdateProfile_whenUserIdMissing", async () => {
      setup({
        user: {
          full_name: "X",
          email: "x@y.com",
          created_at: "2025-01-01T00:00:00Z",
        },
      })

      const user = userEvent.setup()
      await user.type(screen.getByLabelText("Họ tên"), "a")
      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }))

      expect(toast.error).toHaveBeenCalledWith("Không tìm thấy thông tin người dùng")
      expect(mockUpdateProfile).not.toHaveBeenCalled()
    })

    test("cancel_shouldOpenConfirmDialog_whenUnsavedChangesExist_andHandleConfirmOrCancel", async () => {
      setup()

      const user = userEvent.setup()

      await user.type(screen.getByLabelText("Họ tên"), "x")
      await user.click(screen.getByRole("button", { name: "Hủy" }))

      expect(
        screen.getByRole("dialog", { name: "Xác nhận hủy" })
      ).toBeInTheDocument()

      // Continue editing
      await user.click(screen.getByRole("button", { name: "Tiếp tục chỉnh sửa" }))
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      expect(mockNavigate).not.toHaveBeenCalledWith(-1)

      // Confirm cancel
      await user.click(screen.getByRole("button", { name: "Hủy" }))
      await user.click(screen.getByRole("button", { name: "Đồng ý" }))

      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })
  })
})
