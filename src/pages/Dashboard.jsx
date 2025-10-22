import { Plus, CheckCircle2, Circle, AlertCircle } from "lucide-react"
import React from "react"

import IconSquare from "@/components/ui/IconSquare"

// Fake data
const TASKS = [
  { id: 1, title: "Quan trọng", priority: "high", deadline: "20/04/2024"},
  { id: 2, title: "Ít quan trọng", priority: "high", deadline: "21/04/2024"},
  { id: 3, title: "Quan trọng", priority: "low", deadline: "22/04/2024"},
  { id: 4, title: "Ít quan trọng", priority: "medium", deadline: "24/04/2024"},
  { id: 5, title: "Trễ hạn", priority: "low", deadline: "24/04/2024"},
]

function PriorityBadge({ level }) {
  const map = { "high": "text-red-600", "medium": "text-amber-600", "low": "text-emerald-600" }
  return <span className={`font-medium ${map[level] || "text-slate-600"}`}>{level}</span>
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
        <div className="absolute bg-white rounded-full" style={{ inset: ringWidth }}/>
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
          <button className="inline-flex items-center gap-1 bg-[#5E7280] text-white rounded-xl px-3 py-2 hover:bg-slate-700 transition">
            <Plus className="w-5 h-5" />
            Thêm Task
          </button>
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
                <tr key={t.id} className={`border-t ${idx === 0 ? "border-t-slate-300" : "border-slate-300"}`}>
                  <td className="pl-5 pr-2 py-3 flex items-center gap-2">
                    <input type="checkbox" className="accent-slate-700" />
                    <span className="text-slate-800">{t.title}</span>
                  </td>
                  <td className="px-2 py-3">
                    <PriorityBadge level={t.priority} />
                  </td>
                  <td className="px-2 py-3 text-slate-700">{t.deadline}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-slate-600 hover:text-slate-900 font-medium">Xem</button>
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
              <p className="text-2xl font-semibold mt-1">{done+inProgress+overdue}</p>
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
