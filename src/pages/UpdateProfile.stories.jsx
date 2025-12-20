import React from "react"
import { Provider } from "react-redux"
import { MemoryRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import UpdateProfile from "@/pages/UpdateProfile.jsx"

// Fake Redux Store
function createFakeStore(authOverrides = {}) {
  const defaultAuth = {
    user: {
      id: "story-user-1",
      full_name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      created_at: "2025-01-15T10:30:00.000Z",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    loading: false,
    error: null,
    access_token: "fake-token-123",
    refresh_token: "fake-refresh-456",
    ...authOverrides,
  }

  return {
    getState: () => ({
      auth: defaultAuth,
    }),
    subscribe: () => () => {},
    dispatch: (action) => {
      console.log("[Storybook] dispatch:", action)
      return action
    },
  }
}

// Hàm tạo fake auth state
function createFakeAuthState(userOverrides = {}, loadingOverrides = {}) {
  const mockUser =
    userOverrides !== null
      ? {
          id: "story-user-1",
          full_name: "Nguyễn Văn A",
          email: "nguyenvana@example.com",
          created_at: "2025-01-15T10:30:00.000Z",
          avatar: "https://i.pravatar.cc/150?img=1",
          ...userOverrides,
        }
      : null

  return {
    user: mockUser,
    loading: false,
    error: null,
    access_token: "fake-token-123",
    refresh_token: "fake-refresh-456",
    ...loadingOverrides,
  }
}

// Shell bọc Provider + Router + Toaster
function StoryShell({ authState, initialEntries = ["/profile/edit"] }) {
  const fakeStore = createFakeStore(authState)

  return (
    <Provider store={fakeStore}>
      <MemoryRouter initialEntries={initialEntries}>
        <Toaster richColors position="top-right" />
        <Routes>
          <Route path="/profile/edit" element={<UpdateProfile />} />
          <Route
            path="/profile"
            element={<div className="p-4">[Mock] Trang Profile</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

const meta = {
  title: "Auth/UpdateProfile",
  component: UpdateProfile,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Component UpdateProfile hiển thị form chỉnh sửa thông tin cá nhân (họ tên, avatar). Dữ liệu được load từ Redux store qua hook useAuth.",
      },
    },
  },
}
export default meta

// 1) Default: User đầy đủ thông tin
export const Default = {
  render: () => (
    <StoryShell
      authState={createFakeAuthState({
        id: "user-1",
        full_name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        created_at: "2025-01-15T10:30:00.000Z",
        avatar: "https://i.pravatar.cc/150?img=1",
      })}
    />
  ),
}

// 2) Loading: Đang tải thông tin user
export const LoadingState = {
  render: () => (
    <StoryShell
      authState={createFakeAuthState(null, {
        user: null,
        loading: true,
        error: null,
      })}
    />
  ),
}

// 3) Error: Lỗi khi tải thông tin user
export const ErrorState = {
  render: () => (
    <StoryShell
      authState={createFakeAuthState(null, {
        user: null,
        loading: false,
        error: "Không thể tải thông tin người dùng. Vui lòng thử lại sau.",
      })}
    />
  ),
}

// 4) No Avatar: User chưa có ảnh đại diện
export const NoAvatar = {
  render: () => (
    <StoryShell
      authState={createFakeAuthState({
        id: "user-2",
        full_name: "Trần Thị B",
        email: "tranthib@example.com",
        created_at: "2024-12-01T08:00:00.000Z",
        avatar: "",
      })}
    />
  ),
}

// 5) Minimal Info: User chỉ có thông tin tối thiểu
export const MinimalInfo = {
  render: () => (
    <StoryShell
      authState={createFakeAuthState({
        id: "user-6",
        full_name: "",
        email: "minimal@example.com",
        created_at: "2025-01-01T00:00:00.000Z",
        avatar: "",
      })}
    />
  ),
}