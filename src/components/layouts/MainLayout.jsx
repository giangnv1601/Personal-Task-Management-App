import { LayoutDashboard, CircleChevronDown, User, LogOut } from "lucide-react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import IconSquare from "@/components/ui/IconSquare"
import useAuth from "@/hooks/useAuth.js"


const MainLayout = () => {
  const navigate = useNavigate()
  const { logout, loading } = useAuth()

  // Hàm đăng xuất
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
    <div className="flex min-h-screen bg-[#E1E5E8]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2f3b45] text-gray-200 flex flex-col rounded-r-2xl">
        {/* Logo */}
        <div className="px-5 py-5 flex">
          <IconSquare />
        </div>

        {/* NavBar */}
        <nav className="px-2 flex flex-col gap-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg ${
                isActive
                  ? "bg-[#5E7280] text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={22} /> Dashboard
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg ${
                isActive
                  ? "bg-[#5E7280] text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <CircleChevronDown size={22} /> Danh sách Task
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg ${
                isActive
                  ? "bg-[#5E7280] text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <User size={22} /> Hồ sơ cá nhân
          </NavLink>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg text-gray-300 hover:bg-gray-700 hover:text-white disabled:opacity-60"
          >
            <LogOut size={22} /> {loading ? "Đang thoát..." : "Đăng xuất"}
          </button>
        </nav>
      </aside>

      {/* Nội dung trang */}
      <main className="flex-1 px-5 py-2 bg-[#E1E5E8]">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout