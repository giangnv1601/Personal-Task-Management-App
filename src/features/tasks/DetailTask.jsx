import React from "react"
import { useNavigate } from "react-router-dom"
import { formatDate } from "@/utils/date"

const demoTask = {
  id: "demo-1",
  title: "Viết UI đăng nhập",
  description: "Thiết kế & code form đăng nhập",
  deadline: "2025-11-10T09:00:00.000Z",
  priority: "easy",
  status: "in_progress",
  checklist: [
    { text: "Tạo wireframe", done: false },
    { text: "Gửi review cho Leader", done: true },
  ],
  attachment_url: "https://example.com/files/login-ui-design.pdf",
  created_at: "2025-04-01T08:00:00.000Z",
}

const PriorityBadge = ({ value }) => {
  const map = {
    high: "bg-red-500 text-white",
    medium: "bg-orange-500 text-white",
    low: "bg-slate-400 text-white",
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-sm ${map[value] || "bg-slate-300"}`}>
      {value ? value[0].toUpperCase() + value.slice(1) : "—"}
    </span>
  )
}

const StatusBadge = ({ value }) => {
  const label = value === "in_progress" ? "Đang làm" : value === "done" ? "Hoàn thành" : "Chưa làm"
  const map = {
    todo: "bg-slate-200 text-slate-800",
    in_progress: "bg-yellow-300 text-yellow-900",
    done: "bg-green-200 text-green-800",
  }
  return <span className={`inline-block rounded px-2 py-0.5 text-sm ${map[value] || "bg-slate-200"}`}>{label}</span>
}

const Row = ({ label, children }) => (
  <div className="flex items-start">
    <div className="w-25 shrink-0">{label}</div>
    <div>{children}</div>
  </div>
)

const DetailTask = ({ task: taskProp }) => {
  const navigate = useNavigate()
  const task = taskProp || demoTask

  const handleEdit = () => navigate(`/tasks/edit/${task.id}`)
  const handleDelete = () => {
    if (!confirm("Bạn có chắc muốn xóa task này?")) return
    // Gọi API xóa task ở đây
    navigate("/tasks")
  }
  const handleClose = () => navigate(-1)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Title */}
        <h2 className="text-2xl font-semibold mb-5 text-slate-800">Chi tiết Task</h2>

        {/* Thông tin task */}
        <div className="p-3 space-y-4 text-[15px] leading-6">
          <Row label="Tên task:">
            <div className="font-semibold">{task.title}</div>
          </Row>

          <Row label="Mô tả:">
            <div className="font-semibold">{task.description || "—"}</div>
          </Row>

          <Row label="Trạng thái:">
            <StatusBadge value={task.status} />
          </Row>

          <Row label="Ưu tiên:">
            <PriorityBadge value={task.priority} />
          </Row>

          <Row label="Deadline:">
            <div className="font-semibold">{formatDate(task.deadline)}</div>
          </Row>

          <Row label="Ngày tạo:">
            <div className="font-semibold">{formatDate(task.created_at)}</div>
          </Row>

          <Row label="Checklist:">
            <div className="mt-1">
              {Array.isArray(task.checklist) && task.checklist.length > 0 ? (
                <ul className="text-slate-700 list-disc">
                  {task.checklist.map((c, idx) => (
                    <li key={idx} className={c.done ? "line-through text-slate-500" : ""}>
                      {c.text}
                    </li>
                  ))}
                </ul>
              ) : (
                "—"
              )}
            </div>
          </Row>

          {task.attachment_url && (
            <Row label="File đính kèm:">
              <a
                className="text-indigo-600 underline"
                href={task.attachment_url}
                target="_blank"
                rel="noreferrer"
              >
                Mở tệp
              </a>
            </Row>
          )}
        </div>

        {/* Hành động */}
        <div className="border-t border-slate-300 pt-3 flex items-center justify-center gap-3">
          <button
            onClick={handleEdit}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Sửa
          </button>

          <button
            onClick={handleDelete}
            className="rounded-lg border border-rose-500 text-rose-600 px-6 py-3 hover:bg-rose-50"
          >
            Xóa
          </button>

          <button
            onClick={handleClose}
            className="rounded-lg border border-slate-300 px-6 py-3 bg-white text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default DetailTask