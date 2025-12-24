import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import AvatarDefault from '@/assets/user.webp'
import useAuth from '@/hooks/useAuth'
import useTask from '@/hooks/useTask'
import { formatDate } from '@/utils/date'

const Profile = () => {
  const navigate = useNavigate()
  const {
    user,
    loading: authLoading,
    error: authError,
    fetchProfile,
  } = useAuth()

  const {
    items,
    loading: tasksLoading,
    fetchTasks,
  } = useTask()

  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!user?.id || initialized) return
    fetchProfile(user.id)
    fetchTasks({ userId: user.id })
    setInitialized(true)
  }, [user?.id, initialized, fetchProfile, fetchTasks])

  const isLoading = authLoading || tasksLoading

  const profile = user || {}

  const displayName = profile.full_name || 'No name'
  const createdAt = profile.created_at || profile.createdAt || null
  const totalTasks = useMemo(
    () => (Array.isArray(items) ? items.length : 0),
    [items]
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-6">
      <main
        className="bg-white rounded-2xl shadow-md px-6 py-8 max-w-sm w-full text-center"
        aria-labelledby="profile-heading"
      >
        {/* Tiêu đề */}
        <h1 id="profile-heading" className="text-2xl font-semibold mb-6">
          Hồ sơ cá nhân
        </h1>

        {/* Loading / Error */}
        {isLoading && (
          <p className="text-sm text-slate-500 mb-4">
            Đang tải hồ sơ và thống kê task...
          </p>
        )}

        {authError && (
          <p className="text-sm text-red-600 mb-4">
            Lỗi tải hồ sơ: {String(authError)}
          </p>
        )}

        {profile?.id && (
          <>
            {/* Ảnh đại diện */}
            <div className="flex justify-center mb-4">
              <img
                src={profile.avatar || AvatarDefault}
                alt={`Ảnh đại diện của ${displayName}`}
                className="w-24 h-24 rounded-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Tên người dùng */}
            <p className="text-lg font-semibold mb-1">
              {displayName}
            </p>

            {/* Email + Ngày đăng ký + Số task đã tạo */}
            <dl className="text-sm text-slate-600 space-y-1 mb-6">
              <div>
                <dt className="font-medium inline">Email:&nbsp;</dt>
                <dd className="inline">{profile.email || '-'}</dd>
              </div>
              <div>
                <dt className="font-medium inline">Ngày đăng ký:&nbsp;</dt>
                <dd className="inline">
                  {createdAt ? formatDate(createdAt) : '-'}
                </dd>
              </div>
              <div>
                <dt className="font-medium inline">Số task đã tạo:&nbsp;</dt>
                <dd className="inline">
                  {totalTasks}
                  {tasksLoading && ' (đang cập nhật...)'}
                </dd>
              </div>
            </dl>

            {/* Hai nút hành động */}
            <div
              className="flex gap-3 justify-center"
              role="group"
              aria-label="Hành động quản lý tài khoản"
            >
              <button
                type="button"
                onClick={() => navigate(`/profile/edit/${profile.id}`)}
                className="px-4 py-2 rounded-lg border border-slate-800 text-sm font-medium text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2"
              >
                Sửa thông tin
              </button>

              <button
                type="button"
                onClick={() => navigate('/change-password')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                Đổi mật khẩu
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default Profile
