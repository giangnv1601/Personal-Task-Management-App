import { Plus, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"

import { formatDate } from "@/utils/date"
import IconSquare from "@/components/ui/IconSquare"

// Fake data
const TASKS = [
  {
    id: "a3f61a47-29e9-4f52-9b23-d84dcb8e6b14",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Thiết kế giao diện trang Dashboard",
    description: "Tạo layout tổng quan với thống kê số task theo trạng thái.",
    deadline: "2025-11-10T09:00:00Z",
    priority: "high",
    status: "in_progress",
    checklist: [
      { text: "Vẽ wireframe", done: true },
      { text: "Tạo component biểu đồ", done: false },
    ],
    attachment_url: "https://example.com/design-dashboard.png",
    created_at: "2025-11-01T03:00:00Z",
    updated_at: "2025-11-03T07:15:00Z",
  },
  {
    id: "b7ce0c8e-2f0e-4c1e-bf7e-4e1bbd4e9210",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Hoàn thiện form tạo Task",
    description: "Thêm validate, UX cho form tạo Task mới.",
    deadline: "2025-11-12T15:30:00Z",
    priority: "medium",
    status: "todo",
    checklist: [
      { text: "Validate bắt buộc", done: true },
      { text: "Hiển thị lỗi thân thiện", done: false },
    ],
    attachment_url: "",
    created_at: "2025-11-02T02:10:00Z",
    updated_at: "2025-11-04T10:20:00Z",
  },
  {
    id: "c94b6f56-4d8d-4c1a-97f3-219f3fbb1a23",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Kết nối Supabase cho Task",
    description: "Gọi API CRUD task, mapping dữ liệu về frontend.",
    deadline: "2025-11-08T08:00:00Z",
    priority: "high",
    status: "done",
    checklist: [
      { text: "Tạo bảng tasks", done: true },
      { text: "Viết taskApi.js", done: true },
      { text: "Tích hợp Redux", done: false },
    ],
    attachment_url: "https://example.com/task-api-docs.pdf",
    created_at: "2025-11-01T05:00:00Z",
    updated_at: "2025-11-05T09:45:00Z",
  },
  {
    id: "d1b0f7bb-0a6f-4e4c-9a43-148b4e9a6d9f",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Thêm checklist cho Task",
    description: "UI thêm/xoá dòng checklist trong form Task.",
    deadline: "2025-11-15T13:00:00Z",
    priority: "low",
    status: "in_progress",
    checklist: [
      { text: "Thiết kế UI checklist", done: true },
      { text: "Xử lý state thêm/xoá", done: false },
    ],
    attachment_url: "",
    created_at: "2025-11-03T01:30:00Z",
    updated_at: "2025-11-06T11:00:00Z",
  },
  {
    id: "e2f3c4d5-6a7b-8c9d-0e1f-223344556677",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Refactor Dashboard thống kê",
    description: "Tối ưu component DonutChart, tách constants.",
    deadline: "2025-11-05T18:00:00Z",
    priority: "medium",
    status: "todo",
    checklist: [
      { text: "Tách DonutChart riêng", done: true },
      { text: "Nhận dữ liệu động từ Redux", done: false },
    ],
    attachment_url: "",
    created_at: "2025-11-02T07:20:00Z",
    updated_at: "2025-11-02T07:20:00Z",
  },
]

function PriorityBadge({ level }) {
  const map = {
    high: "text-red-600",
    medium: "text-amber-600",
    low: "text-emerald-600",
  }

  const label = level
    ? level.charAt(0).toUpperCase() + level.slice(1)
    : ""

  return (
    <span className={`font-medium ${map[level] || "text-slate-600"}`}>
      {label}
    </span>
  )
}


function DonutChart({
  values = [3, 5, 2],
  labels = ["Đã hoàn thành", "Đang làm", "Trễ hạn"],
  size = 160,
  ringWidth = 40,
}) {
  const total = values.reduce((a, b) => a + b, 0)
  const percents = values.map((v) => (v / (total || 1)) * 100)
  const colors = ["#2f8e86", "#345873", "#e57373"]
  const bg = `conic-gradient(${colors[0]} 0% ${percents[0]}%, ${colors[1]} ${percents[0]}% ${
    percents[0] + percents[1]
  }%, ${colors[2]} ${percents[0] + percents[1]}% 100%)`

  return (
    <div className="flex items-center gap-6">
      <div className="rounded-full relative" style={{ width: size, height: size, background: bg }}>
        <div className="absolute bg-white rounded-full" style={{ inset: ringWidth }} />
      </div>
      <ul className="space-y-2 text-sm">
        {labels.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colors[i] }} />
            <span className="text-slate-600">{label}</span>
            <span className="ml-2 font-semibold">{values[i]}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const Dashboard = () => {
  const done = 3
  const inProgress = 5
  const overdue = 2

  return (
    <div className="space-y-6 bg-[#E1E5E8]">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <IconSquare size={44} />
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        </div>

        {/* User */}
        <div className="flex items-center gap-3">
          <p className="text-slate-700">Nguyễn Văn A</p>
          <img
            src="https://t4.ftcdn.net/jpg/07/03/86/11/360_F_703861114_7YxIPnoH8NfmbyEffOziaXy0EO1NpRHD.jpg"
            alt="Avatar"
            className="w-10 h-10 rounded-full bg-slate-200"
          />
        </div>
      </div>

      {/* Danh sách Task */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
        {/* Title + Button */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Danh sách Task</h2>
          <Link
            to="/tasks/new"
            className="inline-flex items-center gap-1 bg-[#5E7280] text-white rounded-xl px-3 py-2 hover:bg-slate-700 transition"
          >
            <Plus className="w-5 h-5" />
            Thêm Task
          </Link>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="w-[50%] px-5 py-3">Tên</th>
                <th className="w-[20%] px-2 py-3">Ưu tiên</th>
                <th className="w-[20%] px-2 py-3">Deadline</th>
                <th className="w-[10%] px-2 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {TASKS.map((t, idx) => (
                <tr
                  key={t.id}
                  className={`border-t ${idx === 0 ? "border-t-slate-300" : "border-slate-300"}`}
                >
                  <td className="pl-5 pr-2 py-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="accent-slate-700"
                      checked={t.status === "done"}
                      readOnly
                    />
                    <span
                      className={`text-slate-800 ${
                        t.status === "done" ? "line-through text-slate-400" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                  </td>
                  <td className="px-2 py-3">
                    <PriorityBadge level={t.priority} />
                  </td>
                  <td className="px-2 py-3 text-slate-700">
                    {formatDate(t.deadline)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-slate-600 hover:text-slate-900 font-medium">
                      Xem
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thống kê nhanh */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Dashboard thống kê nhanh</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ô số liệu */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Tổng số Task</p>
              <p className="text-2xl font-semibold mt-1">{done + inProgress + overdue}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Đã hoàn thành</p>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-2xl font-semibold">{done}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Đang làm</p>
              <div className="flex items-center gap-2 mt-1">
                <Circle className="w-4 h-4 text-sky-700" />
                <p className="text-2xl font-semibold">{inProgress}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-slate-500 text-sm">Trễ hạn</p>
              <div className="flex items-center gap-2 mt-1">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <p className="text-2xl font-semibold">{overdue}</p>
              </div>
            </div>
          </div>

          {/* Donut */}
          <div className="flex items-center justify-center">
            <DonutChart values={[done, inProgress, overdue]} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
