import React, { useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import AvatarDefault from '@/assets/user.webp'
import { formatDate } from '@/utils/date'

// Fake data
const fakeProfile = {
  full_name: '',
  email: 'nguyenvanna@example.com',
  created_at: '2024-06-01T08:00:00.000Z',
  // avatar:
  //   'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
}

const UpdateProfile = () => {
  const fileInputRef = useRef(null)
  const avatarObjectUrlRef = useRef(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      full_name: fakeProfile.full_name || '',
      email: fakeProfile.email,
      created_at: fakeProfile.created_at,
      avatar: fakeProfile.avatar,
    },
    mode: 'onBlur',
  })

  // Lấy ra avatar / created_at / full_name để hiển thị
  const avatarUrl = watch('avatar')
  const createdAt = watch('created_at')
  const fullName = watch('full_name')
  const displayDate = formatDate(createdAt)

  // Fake chọn ảnh: chỉ preview local, chưa upload server
  const handleClickChangeAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Hủy URL cũ nếu có (tránh leak nhỏ)
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current)
    }

    const url = URL.createObjectURL(file)
    avatarObjectUrlRef.current = url

    // Lưu url preview vào form (field avatar)
    setValue('avatar', url, { shouldDirty: true })
  }

  const onSubmit = async (data) => {
    console.log('Fake submit profile (react-hook-form):', data)
    // giả lập submit async
    await new Promise((resolve) => setTimeout(resolve, 500))
    alert('Fake: Lưu thay đổi (chưa gọi API).')
  }

  const handleCancel = () => {
    // Reset form về dữ liệu ban đầu
    reset({
      full_name: fakeProfile.full_name || '',
      email: fakeProfile.email,
      created_at: fakeProfile.created_at,
      avatar: fakeProfile.avatar,
    })

    navigate(-1)
  }

  // Cleanup URL khi unmount
  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-4">
      <main className="bg-white rounded-2xl shadow-md px-6 py-8 w-full max-w-sm">
        {/* Tiêu đề */}
        <h1 className="text-2xl font-semibold text-center mb-8">
          Sửa thông tin cá nhân
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Status cho screen reader */}
          <p className="sr-only" aria-live="polite">
            {isSubmitting ? 'Đang lưu thay đổi hồ sơ...' : ''}
          </p>

          {/* Ảnh + Nút thay ảnh */}
          <div className="flex items-center justify-center gap-5 mb-8">
            <img
              src={avatarUrl || AvatarDefault}
              alt={`Ảnh đại diện của ${fullName || 'người dùng'}`}
              className="w-24 h-24 rounded-full object-cover"
            />

            <button
              type="button"
              onClick={handleClickChangeAvatar}
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span>Thay ảnh</span>
            </button>

            {/* input file ẩn cho thay ảnh */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Các trường thông tin */}
          <div className="space-y-4 mb-6">
            {/* Họ tên */}
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Họ tên
              </label>
              <input
                id="full_name"
                type="text"
                placeholder="Nhập họ tên"
                className={`block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.full_name ? 'border-red-500' : 'border-slate-300'
                }`}
                aria-invalid={errors.full_name ? 'true' : undefined}
                aria-describedby={
                  errors.full_name ? 'full_name-error' : undefined
                }
                {...register('full_name', {
                  setValueAs: (v) =>
                    typeof v === 'string' ? v.trim() : v,
                  required: 'Họ tên không được để trống',
                  maxLength: {
                    value: 256,
                    message: 'Họ tên không được quá 256 ký tự',
                  },
                })}
              />

              {errors.full_name && (
                <p
                  id="full_name-error"
                  className="mt-1 text-xs text-red-600"
                >
                  {errors.full_name.message}
                </p>
              )}
            </div>

            {/* Email – readonly */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                readOnly
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-100 cursor-not-allowed"
                {...register('email')}
              />
            </div>

            {/* Ngày đăng ký – readonly */}
            <div>
              <label
                htmlFor="created_at_display"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Ngày đăng ký
              </label>
              <input
                id="created_at_display"
                type="text"
                value={displayDate}
                readOnly
                className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-100 cursor-not-allowed"
              />
              {/* Field hidden để giữ nguyên created_at (ISO) trong form data */}
              <input type="hidden" {...register('created_at')} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              aria-disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
            >
              {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
            >
              Hủy
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

export default UpdateProfile
