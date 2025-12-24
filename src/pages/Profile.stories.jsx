import React, { useMemo } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import Profile from './Profile.jsx'

// Tạo fake Redux store
function createFakeStore({
  user = null,
  items = [],
  authLoading = false,
  tasksLoading = false,
  authError = null,
} = {}) {
  const state = {
    auth: {
      user,
      loading: authLoading,
      error: authError,
    },
    tasks: {
      items,
      loading: tasksLoading,
      creating: false,
      updating: false,
      deleting: false,
      error: null,
      errorType: null,
      errorStatus: null,
      cursor: null,
      hasMore: false,
      optimisticBackup: {},
    },
  }

  return {
    getState: () => state,
    dispatch: (action) => {
      console.log('[Storybook fake dispatch]', action)
      return action
    },
    subscribe: () => () => {},
  }
}

// Shell bọc Redux Provider + MemoryRouter
function StoryShell({
  user,
  items,
  authLoading = false,
  tasksLoading = false,
  authError = null,
}) {
  const store = useMemo(
    () =>
      createFakeStore({
        user,
        items,
        authLoading,
        tasksLoading,
        authError,
      }),
    [user, items, authLoading, tasksLoading, authError],
  )

  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/profile']}> {/* <--- Thêm Router */}
        <Profile />
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: 'Auth/Profile',
  component: Profile,
  tags: ['autodocs'],
  argTypes: {
    full_name: {
      control: { type: 'text' },
      description: 'Tên hiển thị của người dùng',
    },
    email: {
      control: { type: 'text' },
      description: 'Email người dùng',
    },
    created_at: {
      control: { type: 'text' },
      description: 'Ngày đăng ký (ISO string)',
    },
    avatar: {
      control: { type: 'text' },
      description: 'URL ảnh avatar (nếu rỗng sẽ dùng avatar mặc định)',
    },
    tasksCount: {
      control: { type: 'number' },
      description: 'Số lượng task để hiển thị thống kê',
    },
    authLoading: {
      control: { type: 'boolean' },
      description: 'Đang load thông tin user?',
    },
    tasksLoading: {
      control: { type: 'boolean' },
      description: 'Đang load danh sách task?',
    },
    authError: {
      control: { type: 'text' },
      description: 'Thông báo lỗi tải hồ sơ (nếu có)',
    },
  },
}

export default meta

// 1) Default
export const Default = {
  args: {
    full_name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    created_at: '2025-01-15T09:00:00.000Z',
    avatar: '',
    tasksCount: 12,
    authLoading: false,
    tasksLoading: false,
    authError: '',
  },
  render: (args) => {
    const {
      full_name,
      email,
      created_at,
      avatar,
      tasksCount,
      authLoading,
      tasksLoading,
      authError,
    } = args

    const user = {
      id: 'user-1',
      full_name,
      email,
      created_at,
      avatar: avatar || undefined,
    }

    const items = Array.from({ length: Number(tasksCount) || 0 }, (_, idx) => ({
      id: `task-${idx + 1}`,
      title: `Task demo #${idx + 1}`,
    }))

    return (
      <StoryShell
        user={user}
        items={items}
        authLoading={authLoading}
        tasksLoading={tasksLoading}
        authError={authError || null}
      />
    )
  },
}

// 2) Loading – đang tải hồ sơ & task
export const Loading = {
  render: () => {
    const user = {
      id: 'user-loading',
      full_name: '',
      email: '',
      created_at: null,
      avatar: '',
    }

    return (
      <StoryShell
        user={user}
        items={[]}
        authLoading={true}
        tasksLoading={true}
        authError={null}
      />
    )
  },
}

// 3) Error – lỗi tải hồ sơ
export const ErrorState = {
  render: () => {
    const user = null

    return (
      <StoryShell
        user={user}
        items={[]}
        authLoading={false}
        tasksLoading={false}
        authError="Không thể tải hồ sơ người dùng (mock error)"
      />
    )
  },
}

// 4) No Avatar – user không có ảnh đại diện
export const NoAvatar = {
  render: () => {
    const user = {
      id: 'user-2',
      full_name: 'Trần Thị B',
      email: 'tranthib@example.com',
      created_at: '2024-12-01T08:00:00.000Z',
      avatar: '',
    }

    return (
      <StoryShell
        user={user}
        items={Array.from({ length: 5 }, (_, i) => ({ id: `task-${i}`, title: `Task ${i}` }))}
        authLoading={false}
        tasksLoading={false}
        authError={null}
      />
    )
  },
}


