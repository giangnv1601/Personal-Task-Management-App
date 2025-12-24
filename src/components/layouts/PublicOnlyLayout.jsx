import { Navigate, Outlet, useLocation } from "react-router-dom"

import useAuth from "@/hooks/useAuth"

export default function PublicOnlyLayout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (isAuthenticated) {
    const redirectTo = location.state?.from?.pathname || "/dashboard"
    return <Navigate to={redirectTo} replace />
  }
  return <Outlet />
}
