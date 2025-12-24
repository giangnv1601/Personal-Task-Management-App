 
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"

// Mock toast
jest.mock("sonner", () => ({
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
import { toast } from "sonner"

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock("react-router-dom", () => ({
  __esModule: true,
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}))

// Mock useAuth
jest.mock("@/hooks/useAuth.js", () => ({
  __esModule: true,
  default: jest.fn(),
}))
import useAuth from "@/hooks/useAuth.js"

// Component
import ChangePassword from "@/pages/ChangePassword.jsx"

describe("ChangePassword Page", () => {
  const mockUnwrap = jest.fn()
  const mockChangePassword = jest.fn()

  const setup = ({ auth = {} } = {}) => {
    useAuth.mockReturnValue({
      changePassword: mockChangePassword,
      ...auth,
    })

    return render(<ChangePassword />)
  }

  const fillForm = async ({
    currentPassword = "OldPass!1",
    newPassword = "NewPass!1",
    confirmNewPassword = "NewPass!1",
  } = {}) => {
    const user = userEvent.setup()

    await user.type(
      screen.getByLabelText("Mật khẩu hiện tại"),
      currentPassword
    )
    await user.type(screen.getByLabelText("Mật khẩu mới"), newPassword)
    await user.type(
      screen.getByLabelText("Nhập lại mật khẩu mới"),
      confirmNewPassword
    )

    return user
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // default unwrap chain
    mockUnwrap.mockResolvedValue(undefined)
    mockChangePassword.mockReturnValue({ unwrap: mockUnwrap })
  })

  // ------HAPPY CASES------
  describe("Happy cases", () => {
    test("submit_shouldCallChangePasswordAndShowSuccessToast_whenValidData", async () => {
      setup()

      await fillForm({
        currentPassword: "OldPass!1",
        newPassword: "NewPass!1",
        confirmNewPassword: "NewPass!1",
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith({
          currentPassword: "OldPass!1",
          newPassword: "NewPass!1",
        })
        expect(mockUnwrap).toHaveBeenCalled()
      })

      expect(toast.success).toHaveBeenCalledWith("Đổi mật khẩu thành công")
    })

    test("cancel_shouldResetFormAndNavigateBack_whenClickCancel", async () => {
      setup()

      const user = userEvent.setup()

      // type something first
      await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass!1")

      await user.click(screen.getByRole("button", { name: "Hủy" }))

      expect(mockNavigate).toHaveBeenCalledWith(-1)
      // after reset -> input should be empty
      expect(screen.getByLabelText("Mật khẩu hiện tại")).toHaveValue("")
    })
  })

  // ------EDGE CASES------
  describe("Edge cases", () => {
    test("submit_shouldShowRequiredErrors_whenSubmitEmptyForm", async () => {
      setup()

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      expect(
        await screen.findByText("Vui lòng nhập mật khẩu hiện tại")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Vui lòng nhập mật khẩu mới")
      ).toBeInTheDocument()
      expect(
        screen.getByText("Vui lòng nhập lại mật khẩu mới")
      ).toBeInTheDocument()

      expect(mockChangePassword).not.toHaveBeenCalled()
    })

    test("submit_shouldShowPatternError_whenNewPasswordInvalid", async () => {
      setup()

      await fillForm({
        currentPassword: "OldPass!1",
        newPassword: "abc",
        confirmNewPassword: "abc",
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      expect(
        await screen.findByText(
          "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
        )
      ).toBeInTheDocument()

      expect(mockChangePassword).not.toHaveBeenCalled()
    })

    test("submit_shouldShowMismatchError_whenConfirmPasswordNotMatch", async () => {
      setup()

      await fillForm({
        currentPassword: "OldPass!1",
        newPassword: "NewPass!1",
        confirmNewPassword: "NewPass!2",
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      expect(
        await screen.findByText("Mật khẩu nhập lại không khớp")
      ).toBeInTheDocument()

      expect(mockChangePassword).not.toHaveBeenCalled()
    })

    test("submit_shouldSetErrorOnNewPassword_whenNewPasswordEqualsCurrentPassword", async () => {
      setup()

      await fillForm({
        currentPassword: "SamePass!1",
        newPassword: "SamePass!1",
        confirmNewPassword: "SamePass!1",
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      expect(
        await screen.findByText("Mật khẩu mới không được trùng mật khẩu hiện tại")
      ).toBeInTheDocument()

      expect(mockChangePassword).not.toHaveBeenCalled()
    })

    test("submit_shouldShowServerErrorOnCurrentPassword_whenServerSaysWrongCurrentPassword", async () => {
      // unwrap rejects with message
      mockUnwrap.mockRejectedValueOnce({ message: "Mật khẩu hiện tại không đúng" })
      setup()

      await fillForm({
        currentPassword: "WrongPass!1",
        newPassword: "NewPass!1",
        confirmNewPassword: "NewPass!1",
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      expect(
        await screen.findByText("Mật khẩu hiện tại không đúng")
      ).toBeInTheDocument()

      // should NOT toast.error for this special case (your code returns early)
      expect(toast.error).not.toHaveBeenCalled()
    })

    test("submit_shouldShowToastError_whenServerReturnsGenericError", async () => {
      mockUnwrap.mockRejectedValueOnce({ message: "Đổi mật khẩu thất bại" })
      setup()

      await fillForm({
        currentPassword: "OldPass!1",
        newPassword: "NewPass!1",
        confirmNewPassword: "NewPass!1",
      })

      await userEvent.click(
        screen.getByRole("button", { name: "Lưu mật khẩu mới" })
      )

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Đổi mật khẩu thất bại")
      })
    })

    test("form_shouldClearFieldError_whenUserTypesAgain", async () => {
      setup()

      const user = userEvent.setup()

      // submit empty -> show required error for current password
      await user.click(screen.getByRole("button", { name: "Lưu mật khẩu mới" }))
      expect(
        await screen.findByText("Vui lòng nhập mật khẩu hiện tại")
      ).toBeInTheDocument()

      // typing should clear error due to onChange: clearErrors("currentPassword")
      await user.type(screen.getByLabelText("Mật khẩu hiện tại"), "OldPass!1")

      await waitFor(() => {
        expect(
          screen.queryByText("Vui lòng nhập mật khẩu hiện tại")
        ).not.toBeInTheDocument()
      })
    })
  })
})
