import React from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import useAuth from "@/hooks/useAuth.js"
import "@/styles/RegisterPage.css"

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/

const RegisterPage = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { agree: false } })

  const navigate = useNavigate()
  const password = watch("password", "")
  const agreed = watch("agree", false)

  const { register: doRegister } = useAuth()

  const onSubmit = async ({ email, password }) => {
    try {
      const res = await doRegister({ email, password })
      if (res.meta.requestStatus === "rejected") {
        const msg =
          typeof res.payload === "string"
            ? res.payload
            : "Đăng ký thất bại"
        toast.error(msg)
        return
      }
      toast.success("Đăng ký thành công! Vui lòng đăng nhập.")
      navigate("/login", {
        replace: true,
        state: { notice: "Đăng ký thành công!" },
      })
    } catch (err) {
      console.error(err)
      toast.error(err?.message || "Không thể đăng ký, vui lòng thử lại!")
    }
  }

  return (
    <div className="register-page-root">
      <div className="register-page-card">
        <h1 className="register-page-title">Đăng ký tài khoản</h1>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="register-page-form"
          noValidate
          aria-busy={isSubmitting}
        >
          {/* Email */}
          <div>
            <label htmlFor="email" className="register-page-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="Nhập email"
              autoComplete="email"
              disabled={isSubmitting}
              aria-invalid={!!errors.email}
              className="register-page-input"
              {...register("email", {
                required: "Email không được để trống",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
                  message: "Email không hợp lệ",
                },
              })}
            />
            {errors.email && (
              <p className="register-page-error">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="register-page-label">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              className="register-page-input"
              {...register("password", {
                required: "Mật khẩu không được để trống",
                validate: (v) =>
                  PASSWORD_RULE.test(v) ||
                  "Ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
              })}
            />
            {errors.password && (
              <p className="register-page-error">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="register-page-label">
              Nhập lại mật khẩu
            </label>
            <input
              id="confirm"
              type="password"
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.confirm}
              className="register-page-input"
              {...register("confirm", {
                required: "Vui lòng nhập lại mật khẩu",
                validate: (v) => v === password || "Mật khẩu không khớp",
              })}
            />
            {errors.confirm && (
              <p className="register-page-error">
                {errors.confirm.message}
              </p>
            )}
          </div>

          {/* Agree to terms */}
          <div className="register-page-agree-row">
            <input
              id="agree"
              type="checkbox"
              className="register-page-agree-checkbox"
              disabled={isSubmitting}
              aria-invalid={!!errors.agree}
              {...register("agree", {
                validate: (v) =>
                  v === true || "Bạn phải đồng ý với điều khoản",
              })}
              onChange={(e) => {
                setValue("agree", e.target.checked, { shouldValidate: true })
                if (e.target.checked) clearErrors("agree")
              }}
            />
            <label
              htmlFor="agree"
              className="register-page-agree-label"
            >
              Tôi đồng ý với{" "}
              <Link to="#" className="register-page-link">
                Điều khoản &amp; Chính sách
              </Link>
            </label>
          </div>
          {errors.agree && (
            <p className="register-page-error">{errors.agree.message}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!agreed || isSubmitting}
            className="register-page-submit-btn"
          >
            {isSubmitting ? (
              <>
                <span className="register-page-spinner" />
                Đang đăng ký…
              </>
            ) : (
              "Đăng ký"
            )}
          </button>

          <p className="register-page-footer">
            Đã có tài khoản?{" "}
            <Link to="/login" className="register-page-link">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default RegisterPage
