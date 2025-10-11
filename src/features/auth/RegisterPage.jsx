import supabase from "../../api/supabaseClient.js"
import { useForm } from 'react-hook-form'
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm() 
  const navigate = useNavigate();

  const password = watch("password");
  
  const onSubmit = async ({ email, password }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Đăng ký thành công!')
    navigate('/login', {
      replace: true,
      state: { notice: 'Đăng ký thành công!' }
    })
  }
  
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <div className='w-full max-w-md bg-white shadow-lg p-8'>
        {/* Title */}
        <h1 className='text-2xl font-extrabold text-center mb-6'>Đăng kí tài khoản</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Nhập email"
              className='w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300'
              {...register("email", {
                required: "Email không được để trống",
                pattern: {
                  value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                  message: "Email không hợp lệ",
                }
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Nhập mật khẩu"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              {...register("password", {
                required: "Mật khẩu không được để trống",
                minLength: {
                  value: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                },
              })}
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm mt-1">
              {errors.password.message}
            </p>
          )}

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium mb-1">Nhập lại mật khẩu</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Nhập lại mật khẩu"
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              {...register("confirm", {
                required: "Vui lòng nhập lại mật khẩu",
                validate: (value) =>
                    value === password || "Mật khẩu không khớp",
              })}
            />
          </div>
          {errors.confirm && (
            <p className="text-red-500 text-sm mt-1">
              {errors.confirm.message}
            </p>
          )}

          {/* Agree to terms */}
          <div className="flex items-start space-x-2">
            <input
              id="agree"
              type="checkbox"
              className="mt-1 h-4 w-4"
              {...register("agree", { 
                required: "Bạn phải đồng ý với điều khoản"
              })}
            />
            <label htmlFor="agree" className="text-sm">
              Tôi đồng ý với <Link to="#" className="text-blue-600 hover:underline">Điều khoản &amp; Chính sách</Link>
            </label>
          </div>
          {errors.agree && (
            <p className="text-red-500 text-sm mt-1">{errors.agree.message}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium mt-2"
            disabled={!watch("agree") || isSubmitting}
          >
            Đăng ký
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