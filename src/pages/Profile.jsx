import React from 'react'
import { formatDate } from '@/utils/date'
import AvatarDefault from '@/assets/user.webp'

const fakeUser = {
  full_name: 'Nguyễn A',
  email: 'nguyenvanaa@gmail.com',
  created_at: '2025-10-10T06:30:20.444519+00:00',
  totalTasks: 15,
}

const Profile = () => {
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

        {/* Ảnh đại diện */}
        <div className="flex justify-center mb-4">
          <img
            src={ fakeUser.avatar || AvatarDefault}
            alt={`Ảnh đại diện của ${fakeUser.full_name}`}
            className="w-24 h-24 rounded-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Tên người dùng */}
        <p className="text-lg font-semibold mb-1">
          {fakeUser.full_name}
        </p>

        {/* Email + Ngày đăng ký + Số task đã tạo */}
        <dl className="text-sm text-slate-600 space-y-1 mb-6">
          <div>
            <dt className="font-medium inline">Email:&nbsp;</dt>
            <dd className="inline">{fakeUser.email}</dd>
          </div>
          <div>
            <dt className="font-medium inline">Ngày đăng ký:&nbsp;</dt>
            <dd className="inline">{formatDate(fakeUser.created_at)}</dd>
          </div>
          <div>
            <dt className="font-medium inline">Số task đã tạo:&nbsp;</dt>
            <dd className="inline">{fakeUser.totalTasks}</dd>
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
            className="px-4 py-2 rounded-lg border border-slate-800 text-sm font-medium text-slate-900 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-2"
          >
            Sửa thông tin
          </button>

          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Đổi mật khẩu
          </button>
        </div>
      </main>
    </div>
  )
}

export default Profile
