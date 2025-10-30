import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"

import MainLayout from "@/components/layouts/MainLayout.jsx"
import ProtectedLayout from "@/components/layouts/ProtectedLayout.jsx"
import PublicOnlyLayout from "@/components/layouts/PublicOnlyLayout.jsx"
import LoginPage from "@/features/auth/LoginPage.jsx"
import RegisterPage from "@/features/auth/RegisterPage.jsx"
import CreateTask from "@/features/tasks/CreateTask.jsx"
import TasksPage from "@/features/tasks/TasksPage.jsx"
import Dashboard from "@/pages/Dashboard.jsx"
import Profile from "@/pages/Profile.jsx"


export default function App() {
  return (
    <>
      <Toaster richColors />
      <Routes>
        <Route element={<PublicOnlyLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tasks/new" element={<CreateTask />} />
          </Route>
        </Route>

        <Route path="*" element={<div className="p-6">404 Not Found</div>} />
      </Routes>
    </>
  )
}
