import React, { Suspense, lazy } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "sonner"

import ProtectedLayout from "@/components/layouts/ProtectedLayout.jsx"
import PublicOnlyLayout from "@/components/layouts/PublicOnlyLayout.jsx"

const MainLayout = lazy(() => import("@/components/layouts/MainLayout.jsx"))

const LoginPage = lazy(() => import("@/features/auth/LoginPage.jsx"))
const RegisterPage = lazy(() => import("@/features/auth/RegisterPage.jsx"))

const Dashboard = lazy(() => import("@/pages/Dashboard.jsx"))
const TasksPage = lazy(() => import("@/features/tasks/TasksPage.jsx"))
const CreateTask = lazy(() => import("@/features/tasks/CreateTask.jsx"))
const UpdateTask = lazy(() => import("@/features/tasks/UpdateTask.jsx"))
const DetailTask = lazy(() => import("@/features/tasks/DetailTask.jsx"))
const Profile = lazy(() => import("@/pages/Profile.jsx"))
const UpdateProfile = lazy(() => import("@/pages/UpdateProfile.jsx"))

const LazyLoading = (
  <div className="p-6 text-center text-slate-600">
    Đang tải...
  </div>
)

export default function App() {
  return (
    <>
      <Toaster richColors />
      <Routes>
        {/* Public routes */}
        <Route
          element={
            <Suspense fallback={LazyLoading}>
              <PublicOnlyLayout />
            </Suspense>
          }
        >
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected routes */}
        <Route
          element={
            <Suspense fallback={LazyLoading}>
              <ProtectedLayout />
            </Suspense>
          }
        >
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/tasks/new" element={<CreateTask />} />
            <Route path="/tasks/edit/:id" element={<UpdateTask />} />
            <Route path="/tasks/detail/:id" element={<DetailTask />} />
            <Route path="/profile/edit/:id" element={<UpdateProfile />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<div className="p-6">404 Not Found</div>} />
      </Routes>
    </>
  )
}
