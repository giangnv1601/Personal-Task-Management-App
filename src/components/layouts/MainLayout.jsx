import { NavLink, Outlet, useNavigate } from "react-router-dom"
import { LayoutDashboard, CircleChevronDown, User, LogOut } from 'lucide-react'
import supabase from "../../api/supabaseClient"
import IconSquare from "../ui/IconSquare.jsx"

const MainLayout = () => {
  const navigate = useNavigate()
  // const dispatch = useDispatch()

  const handleLogout = async () => {
    // await dispatch(logoutThunk())  // nếu dùng Redux
    await supabase.auth.signOut()
    navigate("/login", { replace: true })
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
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
                isActive ? "bg-[#5E7280] text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={22} /> Dashboard
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg ${
                isActive ? "bg-[#5E7280] text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <CircleChevronDown size={22} /> Danh sách Task
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg ${
                isActive ? "bg-[#5E7280] text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`
            }
          >
            <User size={22} /> Hồ sơ cá nhân
          </NavLink>

          <button
            onClick={handleLogout}
            className="text-left flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-lg text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <LogOut size={22} /> Đăng xuất
          </button>
        </nav>
      </aside>

      {/* Nội dung trang */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout