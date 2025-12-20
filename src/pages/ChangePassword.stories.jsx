import React, { useMemo } from "react"
import { Provider } from "react-redux"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import ChangePassword from "./ChangePassword.jsx"

// Fake Redux Store
function createFakeStore(authOverrides = {}) {
  const defaultAuth = {
    user: {
      id: "story-user-1",
      email: "demo@example.com",
      full_name: "Demo User",
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
          email: "demo@example.com",
          full_name: "Demo User",
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

// Shell bọc Provider + Router
function StoryShell({ authState, initialEntries = ["/change-password"] }) {
  const fakeStore = useMemo(() => createFakeStore(authState), [authState])

  return (
    <Provider store={fakeStore}>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/change-password" element={<ChangePassword />} />
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
  title: "Auth/ChangePassword",
  component: ChangePassword,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Component ChangePassword cho phép người dùng đổi mật khẩu. Validate form bao gồm: mật khẩu hiện tại, mật khẩu mới (phải đủ mạnh), và xác nhận mật khẩu mới.",
      },
    },
  },
}
export default meta

// Giao diện mặc định
export const Default = {
  render: () => (
    <StoryShell
      authState={createFakeAuthState({
        id: "user-1",
        email: "demo@example.com",
        full_name: "Demo User",
      })}
    />
  ),
}
