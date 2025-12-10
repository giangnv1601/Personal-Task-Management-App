import React, { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

import useTask from "@/hooks/useTask"
import { formatDateTime, formatRelativeTime } from "@/utils/date"
import ConfirmDialog from "@/components/ui/ConfirmDialog"
import PriorityBadge from "@/components/ui/PriorityBadge"
import StatusBadge from "@/components/ui/StatusBadge"

import "@/styles/DetailTask.css"

const Row = ({ label, children }) => (
  <div className="detail-task-row">
    <div className="detail-task-row-label">{label}</div>
    <div className="detail-task-row-value">{children}</div>
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
      <div className="detail-task-page-top">
        <div className="detail-task-card-muted-border">
          Đang tải...
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="detail-task-page-top">
        <div className="detail-task-card-muted-border">
          Không tìm thấy task.
          <div>
            <button
              onClick={() => navigate("/tasks")}
              className="detail-task-back-btn"
            >
              Quay về danh sách
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-task-page">
      <div className="detail-task-card">
        {/* Title */}
        <h2 className="detail-task-title">Chi tiết Task</h2>

        {/* Thông tin task */}
        <div className="detail-task-body">
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
            <div className="detail-task-deadline-text">
              {formatDateTime(task.deadline)}{" "}
              <span className="detail-task-deadline-sub">
                {formatRelativeTime(task.deadline)}
              </span>
            </div>
          </Row>

          <Row label="Ngày tạo:">
            <div className="detail-task-deadline-text">
              {formatDateTime(task.created_at)}{" "}
              <span className="detail-task-deadline-sub">
                {formatRelativeTime(task.created_at)}
              </span>
            </div>
          </Row>

          <Row label="Checklist:">
            <div className="mt-1">
              {Array.isArray(task.checklist) && task.checklist.length > 0 ? (
                <ul className="detail-task-checklist-list">
                  {task.checklist.map((c, idx) => (
                    <li
                      key={idx}
                      className={c.done ? "detail-task-checklist-item-done" : ""}
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
                className="detail-task-attachment-link"
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
        <div className="detail-task-actions">
          <button
            onClick={handleEdit}
            aria-label="Sửa task"
            disabled={busy}
            className="detail-task-btn-primary"
          >
            Sửa
          </button>

          <button
            onClick={handleDeleteClick}
            aria-label="Xoá task"
            disabled={busy}
            className="detail-task-btn-danger"
          >
            {busy ? "Đang xoá…" : "Xoá"}
          </button>

          <button
            onClick={handleClose}
            aria-label="Đóng chi tiết task"
            className="detail-task-btn-secondary"
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
