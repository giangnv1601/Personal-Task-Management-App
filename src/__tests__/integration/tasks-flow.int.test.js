import React from "react"
import { Provider } from "react-redux"
import { configureStore } from "@reduxjs/toolkit"
import {
  MemoryRouter,
  Routes,
  Route,
} from "react-router-dom"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import authReducer from "@/features/auth/AuthSlice.js"
import tasksReducer from "@/features/tasks/TasksSlice.js"

import TasksPage from "@/features/tasks/TasksPage.jsx"
import CreateTask from "@/features/tasks/CreateTask.jsx"
import UpdateTask from "@/features/tasks/UpdateTask.jsx"

// Tạo store test dùng reducer thật
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
function renderWithStore(store, initialRoute = "/tasks") {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/new" element={<CreateTask />} />
          <Route path="/tasks/edit/:id" element={<UpdateTask />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  )
}

describe(
  "Tasks flow (create → edit → delete)",
  () => {
    it(
      "cho phép user tạo, sửa và xoá task qua UI (integration)",
      async () => {
        const store = createTestStore()
        const user = userEvent.setup()

        // ========== 1. RENDER TRANG TẠO TASK ==========
        const createRender = renderWithStore(store, "/tasks/new")

        const titleInput = await screen.findByPlaceholderText(/nhập tiêu đề/i)
        const descInput = screen.getByPlaceholderText(/mô tả ngắn/i)
        const deadlineInput = createRender.container.querySelector(
          'input[type="datetime-local"]',
        )
        const submitButton = screen.getByRole("button", { name: /tạo mới/i })

        await user.type(titleInput, "Integration Task")
        await user.type(
          descInput,
          "Flow: create → edit → delete",
        )
        await user.type(deadlineInput, "2099-12-31T12:00")

        await user.click(submitButton)

        // Đợi thunk createTask chạy xong (button hết disabled)
        await waitFor(() => {
          expect(submitButton).not.toBeDisabled()
        })

        // Unmount trang tạo
        createRender.unmount()

        // ========== 2. RENDER LẠI LIST /tasks VỚI CÙNG STORE ==========
        renderWithStore(store, "/tasks")

        // Chờ list load xong & hiển thị task mới
        const createdTask = await screen.findByText("Integration Task")
        expect(createdTask).toBeInTheDocument()

        // ========== 3. EDIT – click Sửa để vào UpdateTask ==========
        await user.click(
          screen.getByRole("link", {
            name: /sửa task integration task/i,
          }),
        )

        const updateTitleInput = await screen.findByPlaceholderText(
          /nhập tên task/i,
        )

        await user.clear(updateTitleInput)
        await user.type(
          updateTitleInput,
          "Integration Task (edited)",
        )

        await user.click(
          screen.getByRole("button", { name: /cập nhật/i }),
        )

        // Dialog hỏi "Lưu" → confirm
        await user.click(
          await screen.findByRole("button", { name: /lưu/i }),
        )

        // Sau khi lưu và navigate về /tasks, task mới phải có tên sửa
        await screen.findByText("Integration Task (edited)")
        expect(
          screen.queryByText("Integration Task"),
        ).not.toBeInTheDocument()

        // ========== 4. DELETE – mở lại UpdateTask và xoá ==========
        await user.click(
          screen.getByRole("link", {
            name: /sửa task integration task \(edited\)/i,
          }),
        )

        await user.click(
          await screen.findByRole("button", { name: /xoá task/i }),
        )

        await user.click(
          await screen.findByRole("button", { name: /^xóa$/i }),
        )

        await waitFor(() => {
          expect(
            screen.queryByText(/integration task \(edited\)/i),
          ).not.toBeInTheDocument()
        })
      },
      20000,
    )
  },
)
