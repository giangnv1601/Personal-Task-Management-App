import React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import useAuth from "@/hooks/useAuth.js"

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/

const ChangePassword = () => {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    clearErrors,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    mode: "onBlur",
    reValidateMode: "onChange",
  })

  const onCancel = () => {
    reset()
    navigate(-1)
  }

  // Focus field lỗi đầu tiên khi submit fail
  const onInvalid = (formErrors) => {
    const first =
      (formErrors.currentPassword && "currentPassword") ||
      (formErrors.newPassword && "newPassword") ||
      (formErrors.confirmNewPassword && "confirmNewPassword")

    if (first) setFocus(first)
  }

  const { changePassword } = useAuth()

  const onSubmit = async (values) => {
    if (values.currentPassword === values.newPassword) {
      setError("newPassword", {
        type: "validate",
        message: "Mật khẩu mới không được trùng mật khẩu hiện tại",
      })
      setFocus("newPassword")
      return
    }

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap()

      toast.success("Đổi mật khẩu thành công")
      reset()
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Đổi mật khẩu thất bại"

      if (msg === "Mật khẩu hiện tại không đúng") {
        setError("currentPassword", { type: "server", message: msg })
        setFocus("currentPassword")
        return
      }

      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-4">
      <main className="bg-white rounded-2xl shadow-md w-full max-w-sm px-6 py-8">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Đổi mật khẩu
        </h1>

        <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
          {/* Mật khẩu hiện tại */}
          <div className="mb-5">
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Mật khẩu hiện tại
            </label>

            <input
              type="password"
              id="currentPassword"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu hiện tại"
              {...register("currentPassword", {
                required: "Vui lòng nhập mật khẩu hiện tại",
                onChange: () => clearErrors("currentPassword"),
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                errors.currentPassword ? "border-red-500" : "border-slate-300"
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.currentPassword ? "true" : undefined}
              aria-describedby={
                errors.currentPassword ? "currentPassword-error" : undefined
              }
            />

            {errors.currentPassword && (
              <p
                id="currentPassword-error"
                role="alert"
                className="text-red-500 text-sm mt-1"
              >
                {errors.currentPassword.message}
              </p>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div className="mb-5">
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Mật khẩu mới
            </label>

            <input
              type="password"
              id="newPassword"
              autoComplete="new-password"
              placeholder="Nhập mật khẩu mới"
              {...register("newPassword", {
                required: "Vui lòng nhập mật khẩu mới",
                pattern: {
                  value: PASSWORD_RULE,
                  message:
                    "Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
                },
                onChange: () => clearErrors("newPassword"),
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                errors.newPassword ? "border-red-500" : "border-slate-300"
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.newPassword ? "true" : undefined}
              aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
            />

            {errors.newPassword && (
              <p
                id="newPassword-error"
                role="alert"
                className="text-red-500 text-sm mt-1"
              >
                {errors.newPassword.message}
              </p>
            )}
          </div>

          {/* Nhập lại mật khẩu mới */}
          <div className="mb-7">
            <label
              htmlFor="confirmNewPassword"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Nhập lại mật khẩu mới
            </label>

            <input
              type="password"
              id="confirmNewPassword"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              {...register("confirmNewPassword", {
                required: "Vui lòng nhập lại mật khẩu mới",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Mật khẩu nhập lại không khớp",
                onChange: () => clearErrors("confirmNewPassword"),
              })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${
                errors.confirmNewPassword
                  ? "border-red-500"
                  : "border-slate-300"
              }`}
              disabled={isSubmitting}
              aria-invalid={errors.confirmNewPassword ? "true" : undefined}
              aria-describedby={
                errors.confirmNewPassword ? "confirmNewPassword-error" : undefined
              }
            />

            {errors.confirmNewPassword && (
              <p
                id="confirmNewPassword-error"
                role="alert"
                className="text-red-500 text-sm mt-1"
              >
                {errors.confirmNewPassword.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="col-span-1 h-11 rounded-lg text-sm font-semibold
                         bg-white border border-slate-300 text-slate-800
                         hover:bg-slate-50
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="col-span-2 h-11 rounded-lg text-sm font-semibold
                         text-white bg-blue-600 hover:bg-blue-700
                         disabled:opacity-60 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang lưu..." : "Lưu mật khẩu mới"}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default ChangePassword
