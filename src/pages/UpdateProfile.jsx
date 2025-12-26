import React, { useRef, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import AvatarDefault from '@/assets/user.webp'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import useAuth from '@/hooks/useAuth'
import { formatDate } from '@/utils/date'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

const UpdateProfile = () => {
  const fileInputRef = useRef(null)
  const avatarObjectUrlRef = useRef(null)
  const navigate = useNavigate()
  
  const { user, loading, error, updateProfile } = useAuth()
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      created_at: '',
      avatar: '',
    },
    mode: 'onBlur',
  })

  // Reset form khi user thay đổi
  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        created_at: user.created_at || user.createdAt || '',
        avatar: user.avatar || '',
      })
      setSelectedFile(null)
    }
  }, [user, reset])

  const avatarUrl = watch('avatar')
  const createdAt = watch('created_at')
  const fullName = watch('full_name')
  const displayDate = createdAt ? formatDate(createdAt) : '-'

  const hasChanges = isDirty || selectedFile !== null

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
      }
    }
  }, [])

  const handleClickChangeAvatar = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    
    if (!file) return

    // Validation file
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WebP')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    // Revoke URL cũ để tránh memory leak
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current)
    }

    const url = URL.createObjectURL(file)
    avatarObjectUrlRef.current = url
    setValue('avatar', url, { shouldDirty: true })
    setSelectedFile(file)
  }

  const onSubmit = async (data) => {
    if (!user?.id) {
      toast.error('Không tìm thấy thông tin người dùng')
      return
    }

    try {
      const updates = {
        full_name: data.full_name,
        ...(selectedFile && { avatarFile: selectedFile }),
      }

      await updateProfile({ userId: user.id, updates })

      toast.success('Cập nhật hồ sơ thành công!')
      navigate('/profile')
    } catch (error) {
      console.error('Update failed:', error)
      toast.error(typeof error === 'string' ? error : 'Cập nhật thất bại')
    }
  }

  // Hiện thị dialog khi hủy với thay đổi chưa lưu
  const handleCancelClick = () => {
    if (hasChanges) {
      setShowConfirmDialog(true)
    } else {
      performCancel()
    }
  }

  // Hàm thực hiện hủy khi confirm
  const handleConfirmCancel = () => {
    setShowConfirmDialog(false)
    performCancel()
  }

  // Hàm đóng dialog khi không confirm
  const handleCloseDialog = () => {
    setShowConfirmDialog(false)
  }

  // Logic cleanup và reset form
  const performCancel = () => {
    // Revoke URL preview nếu có
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current)
      avatarObjectUrlRef.current = null
    }

    // Reset form về dữ liệu gốc
    if (user) {
      reset({
        full_name: user.full_name || '',
        email: user.email || '',
        created_at: user.created_at || '',
        avatar: user.avatar || '',
      })
      setSelectedFile(null)
    }
    
    navigate(-1)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-sm text-slate-600">Đang tải thông tin...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-4">
        <div className="bg-white rounded-2xl shadow-md px-6 py-8 w-full max-w-sm text-center">
          <p className="text-red-600 mb-4">Không thể tải thông tin người dùng</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
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
                className="w-24 h-24 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.src = AvatarDefault
                }}
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
                accept="image/jpeg,image/png,image/webp,image/jpg"
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
                disabled={isSubmitting || !hasChanges}
                aria-disabled={isSubmitting || !hasChanges}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
              >
                Hủy
              </button>
            </div>
          </form>
        </main>
      </div>

      {/* Component ConfirmDialog */}
      <ConfirmDialog
        open={showConfirmDialog}
        title="Xác nhận hủy"
        message="Bạn có thay đổi chưa lưu. Bạn có chắc muốn hủy?"
        confirmText="Đồng ý"
        cancelText="Tiếp tục chỉnh sửa"
        onConfirm={handleConfirmCancel}
        onCancel={handleCloseDialog}
      />
    </>
  )
}

export default UpdateProfile
