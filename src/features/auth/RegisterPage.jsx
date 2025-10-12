import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import supabase from "../../api/supabaseClient.js"

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/

const RegisterPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm({ defaultValues: { agree: false }})

  const navigate = useNavigate()
  const password = watch("password", "")
  const agreed = watch("agree", false)

  const onSubmit = async ({ email, password }) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) throw error
      toast.success("Đăng ký thành công!")
      navigate("/login", { replace: true, state: { notice: "Đăng ký thành công!" } })
    } catch (err) {
      toast.error(err?.message || "Không thể đăng ký, vui lòng thử lại!")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white shadow-lg p-8 rounded-xl">
        <h1 className="text-2xl font-extrabold text-center mb-6">Đăng ký tài khoản</h1>

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
              placeholder="Nhập email"
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              {...register("email", {
                required: "Email không được để trống",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
                  message: "Email không hợp lệ"
                }
              })}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              {...register("password", {
                required: "Mật khẩu không được để trống",
                validate: (v) =>
                  PASSWORD_RULE.test(v) ||
                  "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt"
              })}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1">Nhập lại mật khẩu</label>
            <input
              id="confirm"
              type="password"
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.confirm}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-60"
              {...register("confirm", {
                required: "Vui lòng nhập lại mật khẩu",
                validate: (v) => v === password || "Mật khẩu không khớp"
              })}
            />
            {errors.confirm && <p className="text-red-500 text-sm mt-1">{errors.confirm.message}</p>}
          </div>

          {/* Agree to terms */}
          <div className="flex items-start gap-2">
            <input
              id="agree"
              type="checkbox"
              className="mt-1 h-4 w-4"
              disabled={isSubmitting}
              aria-invalid={!!errors.agree}
              {...register("agree", {
                validate: (v) => v === true || "Bạn phải đồng ý với điều khoản"
              })}
              onChange={(e) => {
                setValue("agree", e.target.checked, { shouldValidate: true })
                if (e.target.checked) clearErrors("agree")
              }}
            />
            <label htmlFor="agree" className="text-sm">
              Tôi đồng ý với{" "}
              <Link to="#" className="text-blue-600 hover:underline">Điều khoản &amp; Chính sách</Link>
            </label>
          </div>
          {errors.agree && <p className="text-red-500 text-sm mt-1">{errors.agree.message}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium mt-2 flex items-center justify-center gap-2 disabled:bg-blue-400"
            disabled={!agreed || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang đăng ký…
              </>
            ) : (
              "Đăng ký"
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
