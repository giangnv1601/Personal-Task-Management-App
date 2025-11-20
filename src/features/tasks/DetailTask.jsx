import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import useTask from "@/hooks/useTask"
import { formatDate } from "@/utils/date"
import ConfirmDialog from "@/components/ui/ConfirmDialog"

const PriorityBadge = ({ value }) => {
  const map = {
    high: "bg-red-500 text-white",
    medium: "bg-orange-500 text-white",
    low: "bg-slate-400 text-white",
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-sm ${map[value]}`}>
      {value ? value[0].toUpperCase() + value.slice(1) : "—"}
    </span>
  )
}

const StatusBadge = ({ value }) => {
  const label =
    value === "in_progress"
      ? "Đang làm"
      : value === "done"
      ? "Hoàn thành"
      : "Chưa làm"
  const map = {
    todo: "bg-slate-200 text-slate-800",
    in_progress: "bg-yellow-300 text-yellow-900",
    done: "bg-green-200 text-green-800",
  }
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-sm ${map[value]}`}>
      {label}
    </span>
  )
}

const Row = ({ label, children }) => (
  <div className="flex items-start gap-1">
    <div className="w-24 shrink-0 text-slate-600">{label}</div>
    <div className="text-slate-900">{children}</div>
  </div>
)

const DetailTask = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { items, fetchTasks, deleteTask, loading } = useTask()

  const [task, setTask] = useState(null)
  const [busy, setBusy] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  // Tìm task trong store trước, nếu chưa có thì mới fetch
  useEffect(() => {
    let mounted = true
    if (!id) return

    const local = (items || []).find((it) => String(it.id) === String(id))
    if (local && mounted) {
      setTask(local)
      return
    }

    const load = async () => {
      try {
        const res = await fetchTasks?.()
        const list = res?.data || res || []
        const after =
          list.find?.((it) => String(it.id) === String(id)) ||
          (items || []).find((it) => String(it.id) === String(id))

        if (!mounted) return

        if (after) setTask(after)
        else toast.error("Không tìm thấy task.")
      } catch (err) {
        if (mounted) toast.error(err?.message || "Không thể tải task")
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [id, items, fetchTasks])

  const handleEdit = () => navigate(`/tasks/edit/${id}`)

  // Nút xóa -> mở dialog confirm
  const handleDeleteClick = () => {
    setConfirmDeleteOpen(true)
  }

  // Xóa thực
  const handleConfirmDelete = async () => {
    setConfirmDeleteOpen(false)
    setBusy(true)
    try {
      const action = await deleteTask(id)
      if (action?.meta?.requestStatus !== "fulfilled") {
        throw new Error(action?.payload || action?.error?.message || "Xóa thất bại")
      }
      toast.success("Xóa task thành công")
      navigate("/tasks")
    } catch (err) {
      toast.error(err?.message || "Lỗi khi xóa task")
    } finally {
      setBusy(false)
    }
  }

  const handleClose = () => navigate(-1)

  if (loading && !task) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-[#E1E5E8] p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
          Đang tải...
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-[#E1E5E8] p-6">
        <div className="max-w-md w-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm text-center">
          Không tìm thấy task.
          <div className="mt-4">
            <button
              onClick={() => navigate("/tasks")}
              className="rounded-lg border px-4 py-2"
            >
              Quay về danh sách
            </button>
          </div>
        </div>
      </div>
    )
  }

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
            <div className="font-semibold">
              {task.deadline ? formatDate(task.deadline) : "—"}
            </div>
          </Row>

          <Row label="Ngày tạo:">
            <div className="font-semibold">
              {task.created_at ? formatDate(task.created_at) : "—"}
            </div>
          </Row>

          <Row label="Checklist:">
            <div className="mt-1">
              {Array.isArray(task.checklist) && task.checklist.length > 0 ? (
                <ul className="list-disc ml-5 space-y-1 text-slate-700">
                  {task.checklist.map((c, idx) => (
                    <li
                      key={idx}
                      className={c.done ? "line-through text-slate-500" : ""}
                    >
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
            aria-label="Sửa task"
            disabled={busy}
            className="min-w-[100px] rounded-lg bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            Sửa
          </button>

          <button
            onClick={handleDeleteClick}
            aria-label="Xoá task"
            disabled={busy}
            className="min-w-[100px] rounded-lg border border-rose-500 text-rose-600 px-6 py-3 hover:bg-rose-50 disabled:opacity-50"
          >
            {busy ? "Đang xoá…" : "Xoá"}
          </button>

          <button
            onClick={handleClose}
            aria-label="Đóng chi tiết task"
            className="min-w-[100px] rounded-lg border border-slate-300 px-6 py-3 bg-white text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Xóa task"
        message="Bạn có chắc muốn xóa task này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default DetailTask
