import "./MainLayout.css"

import { LayoutDashboard, CircleChevronDown, User, LogOut } from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import IconSquare from "@/components/ui/IconSquare"
import useAuth from "@/hooks/useAuth.js"

const MainLayout = () => {
  const navigate = useNavigate()
  const { logout, loading } = useAuth()

  const handleLogout = async () => {
    try {
      const res = await logout()
      if (res.meta.requestStatus === "rejected") {
        toast.error(res.payload || "Đăng xuất thất bại (đã xoá phiên cục bộ)")
      } else {
        toast.success("Đã đăng xuất.")
      }
      navigate("/login", { replace: true })
    } catch (err) {
      console.error("Logout error:", err)
      toast.error("Không thể đăng xuất, vui lòng thử lại!")
    }
  }

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="main-layout__sidebar">
        {/* Logo */}
        <div className="main-layout__logo">
          <IconSquare />
        </div>

        {/* NavBar */}
        <nav className="main-layout__nav">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item--active" : "nav-item--inactive"}`
            }
          >
            <LayoutDashboard size={22} /> Dashboard
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item--active" : "nav-item--inactive"}`
            }
          >
            <CircleChevronDown size={22} /> Danh sách Task
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item--active" : "nav-item--inactive"}`
            }
          >
            <User size={22} /> Hồ sơ cá nhân
          </NavLink>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="nav-item nav-item--inactive logout-btn"
          >
            <LogOut size={22} /> {loading ? "Đang thoát..." : "Đăng xuất"}
          </button>
        </nav>
      </aside>

      {/* Nội dung trang */}
      <main className="main-layout__content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
