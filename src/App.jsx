import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"

import MainLayout from "./components/layouts/MainLayout.jsx"
import LoginPage from "./features/auth/LoginPage.jsx"
import RegisterPage from "./features/auth/RegisterPage.jsx"
import TasksPage from "./features/tasks/TasksPage.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Profile from "./pages/Profile.jsx"

function App() {
  return (
    <>
      <Toaster richColors />
      <Routes>
        {/* Auth routes */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Main app routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-6">404 Not Found</div>} />
      </Routes>
    </>
  )
}

export default App
