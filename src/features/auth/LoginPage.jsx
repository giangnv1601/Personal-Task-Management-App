import React from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import useAuth from "@/hooks/useAuth.js"
import "@/styles/LoginPage.css"

const LoginPage = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({ defaultValues: { remember: false } })

  const navigate = useNavigate()
  const { state } = useLocation()
  const remember = watch("remember", false)

  // Dùng hook Auth đã tách logic Redux
  const { login } = useAuth()

  const onSubmit = async ({ email, password }) => {
    try {
      // Gọi thunk login thông qua hook
      const res = await login({ email, password, remember })
      // Redux Toolkit action có meta.requestStatus
      if (res.meta.requestStatus === "rejected") {
        const rawMessage = res.payload || "Đăng nhập thất bại"
        const message =
          typeof rawMessage === "string"
            ? rawMessage
            : JSON.stringify(rawMessage)
        // Gán lỗi hiển thị ngay dưới input
        setError("email", { type: "server", message })
        setError("password", { type: "server", message })
        throw new Error(message)
      }

      toast.success("Đăng nhập thành công!")
      // Điều hướng về trang trước (nếu có) hoặc /dashboard
      const redirectTo = state?.from?.pathname || "/dashboard"
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const message =
        typeof err?.message === "string" ? err.message : String(err)
      toast.error(message || "Không thể đăng nhập, vui lòng thử lại!")
    }
  }

  return (
    <div className="login-page-root">
      <div className="login-page-card">
        <h1 className="login-page-title">Đăng nhập tài khoản</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="login-page-form"
          noValidate
          aria-busy={isSubmitting}
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="login-page-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Nhập email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              className="login-page-input"
              {...register("email", {
                required: "Email không được để trống",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
                  message: "Email không hợp lệ",
                },
              })}
            />
            {errors.email && (
              <p className="login-page-error">{errors.email.message}</p>
            )}
          </div>

          {/* Mật khẩu */}
          <div>
            <label htmlFor="password" className="login-page-label">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              className="login-page-input"
              {...register("password", {
                required: "Mật khẩu không được để trống",
              })}
            />
            {errors.password && (
              <p className="login-page-error">{errors.password.message}</p>
            )}
          </div>

          {/* Ghi nhớ + Quên mật khẩu */}
          <div className="login-page-remember-row">
            <label className="login-page-remember-label">
              <input
                type="checkbox"
                {...register("remember")}
                className="login-page-remember-checkbox"
                disabled={isSubmitting}
              />
              <span>Nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="login-page-link">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút gửi */}
          <button
            type="submit"
            className="login-page-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="login-page-spinner" />
                Đang đăng nhập…
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>

          <div className="login-page-footer">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="login-page-link">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
