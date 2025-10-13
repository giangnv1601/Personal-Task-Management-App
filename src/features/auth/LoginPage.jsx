import React from "react"
import { useForm } from "react-hook-form"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import useAuth from "@/hooks/useAuth.js"

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
        const message = typeof rawMessage === "string" ? rawMessage : JSON.stringify(rawMessage)
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
      const message = typeof err?.message === "string" ? err.message : String(err)
      toast.error(message || "Không thể đăng nhập, vui lòng thử lại!")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-extrabold text-center mb-6">Đăng nhập tài khoản</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
          aria-busy={isSubmitting}
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Nhập email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              {...register("email", {
                required: "Email không được để trống",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
                  message: "Email không hợp lệ",
                },
              })}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Mật khẩu */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              {...register("password", { required: "Mật khẩu không được để trống" })}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Ghi nhớ và Quên mật khẩu */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-700">
              <input type="checkbox" {...register("remember")} className="h-4 w-4" disabled={isSubmitting} />
              <span>Nhớ đăng nhập</span>
            </label>
            <Link to="/forgot-password" className="text-blue-600 hover:underline font-medium">
              Quên mật khẩu?
            </Link>
          </div>

          {/* Nút gửi */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium mt-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang đăng nhập…
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>

          <div className="text-center text-sm text-gray-600 mt-3">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
