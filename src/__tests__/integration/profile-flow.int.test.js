import { configureStore } from "@reduxjs/toolkit"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { Provider } from "react-redux"
import { MemoryRouter, Routes, Route } from "react-router-dom"

import authReducer from "@/features/auth/AuthSlice.js"
import tasksReducer from "@/features/tasks/TasksSlice.js"
import ChangePassword from "@/pages/ChangePassword.jsx"
import Profile from "@/pages/Profile.jsx"
import UpdateProfile from "@/pages/UpdateProfile.jsx"

// Tạo store test với reducer thật
function createTestStore() {
  const authInitial = authReducer(undefined, { type: "@@INIT" })
  const tasksInitial = tasksReducer(undefined, { type: "@@INIT" })

  return configureStore({
    reducer: {
      auth: authReducer,
      tasks: tasksReducer,
    },
    preloadedState: {
      auth: {
        ...authInitial,
        user: {
          id: "user-123",
          email: "test@example.com",
          full_name: "Test User",
          created_at: "2024-01-01T00:00:00Z",
          avatar: "https://example.com/avatar.jpg",
        },
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        remember: "local",
        isAuthenticated: true,
      },
      tasks: tasksInitial,
    },
  })
}

// Render component với store và router
function renderWithStore(store, initialRoute = "/profile") {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit/:id" element={<UpdateProfile />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

test(
  "view profile -> update profile -> change password",
  async () => {
    const store = createTestStore()
    const user = userEvent.setup()

    // ==== RENDER PROFILE ====
    renderWithStore(store, "/profile")

    // Chờ profile load xong
    await waitFor(() => {
      expect(screen.getByText("Test User")).toBeInTheDocument()
    })

    expect(screen.getByText("test@example.com")).toBeInTheDocument()
    
    // Verify số task
    expect(screen.getByText("Số task đã tạo:")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()

    // ==== CLICK "Sửa thông tin" ====
    const editButton = screen.getByRole("button", {
      name: /sửa thông tin/i,
    })
    await user.click(editButton)

    // Chờ trang UpdateProfile load
    await screen.findByText("Sửa thông tin cá nhân")

    // ==== CẬP NHẬT FULL NAME ====
    const fullNameInput = screen.getByPlaceholderText(/nhập họ tên/i)
    
    await user.clear(fullNameInput)
    await user.type(fullNameInput, "Updated User")

    // Click nút "Lưu thay đổi"
    const saveButton = screen.getByRole("button", {
      name: /lưu thay đổi/i,
    })
    await user.click(saveButton)

    // Đợi navigate về /profile và verify tên mới
    await waitFor(() => {
      expect(screen.getByText("Updated User")).toBeInTheDocument()
    })

    expect(
      screen.queryByText("Test User"),
    ).not.toBeInTheDocument()

    // ==== CLICK "Đổi mật khẩu" ====
    const changePasswordButton = screen.getByRole("button", {
      name: /đổi mật khẩu/i,
    })
    await user.click(changePasswordButton)

    // Chờ trang ChangePassword load
    await screen.findByText("Đổi mật khẩu")

    // ==== ĐIỀN FORM ĐỔI MẬT KHẨU ====
    const currentPasswordInput = screen.getByPlaceholderText(
      /nhập mật khẩu hiện tại/i,
    )
    const newPasswordInput = screen.getByPlaceholderText(
      /^nhập mật khẩu mới$/i,
    )
    const confirmPasswordInput = screen.getByPlaceholderText(
      /nhập lại mật khẩu mới/i,
    )

    await user.type(currentPasswordInput, "password123")
    await user.type(newPasswordInput, "NewPassword123!")
    await user.type(confirmPasswordInput, "NewPassword123!")

    // Click nút "Lưu mật khẩu mới"
    const submitPasswordButton = screen.getByRole("button", {
      name: /lưu mật khẩu mới/i,
    })
    await user.click(submitPasswordButton)

    // Đợi form reset (các input rỗng)
    await waitFor(() => {
      expect(currentPasswordInput.value).toBe("")
      expect(newPasswordInput.value).toBe("")
      expect(confirmPasswordInput.value).toBe("")
    })
  },
  20000,
)
