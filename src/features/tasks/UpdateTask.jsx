import React, { useEffect, useMemo, useState } from "react"
import { useForm, Controller, useFieldArray } from "react-hook-form"
import { useParams, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import ConfirmDialog from "@/components/ui/ConfirmDialog"
import {
  PRIORITIES,
  STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from "@/constants/task"
import useTask from "@/hooks/useTask"
import { toLocalInput, toUTCISOString } from "@/utils/date"
import { validateDeadline, validateText } from "@/utils/validate"

import "@/styles/UpdateTask.css"

export default function UpdateTask() {
  const init = useMemo(
    () => ({
      id: "",
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      deadline: null,
      attachment_url: "",
      checklist: [],
    }),
    [],
  )

  const { id } = useParams()
  const navigate = useNavigate()
  const { items, fetchTasks, updateTask, deleteTask, loading } = useTask()

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
    trigger,
  } = useForm({
    defaultValues: init,
    mode: "onChange",
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "checklist",
  })

  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmType, setConfirmType] = useState(null)
  const [allowPastDeadline, setAllowPastDeadline] = useState(true)

  const busy = loading || isSubmitting || isDeleting

  const findLocalTask = (taskId) =>
    (items || []).find((it) => String(it.id) === String(taskId))

  useEffect(() => {
    let mounted = true

    const load = async () => {
      if (!id) return

      const local = findLocalTask(id)
      if (local && mounted) {
        reset({ ...init, ...local })
        return
      }

      try {
        const res = await fetchTasks?.()
        const list = res?.data || res || items || []
        const after =
          list.find?.((it) => String(it.id) === String(id)) || findLocalTask(id)

        if (after && mounted) {
          reset({ ...init, ...after })
        } else if (mounted && !isDeleting) {
          toast.error("Không tìm thấy task.")
        }
      } catch (err) {
        if (mounted && !isDeleting) {
          toast.error(err?.message || "Không thể tải task")
        }
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id, fetchTasks, items, reset, init, isDeleting])

  // Cảnh báo khi reload tab khi có thay đổi
  useEffect(() => {
    if (!isDirty) return
    const handle = (e) => {
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handle)
    return () => window.removeEventListener("beforeunload", handle)
  }, [isDirty])

  // Khi bật/tắt "cho phép deadline quá khứ" → re-validate deadline
  useEffect(() => {
    trigger("deadline")
  }, [allowPastDeadline, trigger])

  // Submit thực
  const onSubmitReal = async (data) => {
    try {
      if (!data.title?.trim()) {
        setError("title", { message: "Tên task là bắt buộc" })
        return
      }
      if (!STATUSES.includes(data.status)) {
        setError("status", { message: "Trạng thái không hợp lệ" })
        return
      }
      if (!PRIORITIES.includes(data.priority)) {
        setError("priority", { message: "Ưu tiên không hợp lệ" })
        return
      }

      const payload = {
        ...data,
        title: data.title.trim(),
        description: data.description || "",
        deadline: data.deadline || null,
        checklist: data.checklist || [],
      }

      const action = await updateTask(data.id || id, payload)
      if (action?.meta?.requestStatus !== "fulfilled") {
        throw new Error(action?.error?.message || "Cập nhật thất bại")
      }

      toast.success("Cập nhật task thành công!")
      navigate("/tasks")
    } catch (err) {
      toast.error(err?.message || "Có lỗi khi cập nhật task")
    }
  }

  // Xóa thực
  const deleteReal = async () => {
    setIsDeleting(true)
    try {
      const action = await deleteTask(id)
      if (action?.meta?.requestStatus !== "fulfilled") {
        throw new Error(action?.error?.message || "Xóa thất bại")
      }
      toast.success("Đã xóa task")
      navigate("/tasks")
    } catch (err) {
      toast.error(err?.message || "Lỗi khi xóa task")
    } finally {
      setIsDeleting(false)
    }
  }

  // Khi bấm submit → mở dialog
  const onSubmit = () => setConfirmType("update")

  // Khi bấm xóa → mở dialog
  const onDelete = () => setConfirmType("delete")

  // Khi bấm hủy → nếu dirty thì confirm
  const onCancel = () => {
    if (isDirty) setConfirmType("cancel")
    else navigate(-1)
  }

  // Xử lý confirm của dialog
  const handleDialogConfirm = async () => {
    const type = confirmType
    setConfirmType(null)

    if (type === "update") {
      await handleSubmit(onSubmitReal)()
    }

    if (type === "delete") {
      await deleteReal()
    }

    if (type === "cancel") {
      navigate(-1)
    }
  }

  return (
    <div className="update-task-page">
      <div className="update-task-card">
        <h2 className="update-task-title">Cập nhật Task</h2>

        <form
          className="update-task-form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          aria-busy={busy}
        >
          {/* Status */}
          <div>
            <label className="update-task-label">Trạng thái</label>
            <select
              className="update-task-select"
              disabled={busy}
              {...register("status")}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s] ?? s}
                </option>
              ))}
            </select>
            {errors.status && (
              <p
                role="alert"
                aria-live="polite"
                className="update-task-error"
              >
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="updateTaskTitle"
              className="update-task-label"
            >
              Tên task
            </label>
            <input
              id="updateTaskTitle"
              className="update-task-input"
              placeholder="Nhập tên task…"
              disabled={busy}
              {...register("title", {
                validate: (v) => validateText(v, { min: 1, max: 255 }),
              })}
            />
            {errors.title && (
              <p
                role="alert"
                aria-live="polite"
                className="update-task-error"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="updateTaskDescription"
              className="update-task-label"
            >
              Mô tả
            </label>
            <textarea
              id="updateTaskDescription"
              rows={2}
              className="update-task-textarea"
              placeholder="Mô tả ngắn…"
              disabled={busy}
              {...register("description", {
                validate: (v) => validateText(v, { max: 2000 }),
              })}
            />
          </div>

          {/* Deadline */}
          <div>
            <div className="update-task-deadline-container">
              <label className="update-task-inline-label">Deadline</label>
              <Controller
                control={control}
                name="deadline"
                rules={{
                  validate: (v) =>
                    validateDeadline(v, { allowPast: allowPastDeadline }),
                }}
                render={({ field: { value, onChange }, fieldState }) => (
                  <>
                    <input
                      type="datetime-local"
                      step="60"
                      className="update-task-inline-input"
                      value={value ? toLocalInput(value) : ""}
                      onChange={(e) =>
                        onChange(
                          e.target.value
                            ? toUTCISOString(e.target.value)
                            : null,
                        )
                      }
                      disabled={busy}
                    />
                    {fieldState.error && (
                      <p
                        role="alert"
                        aria-live="polite"
                        className="update-task-error"
                      >
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />
            </div>

            <div className="update-task-deadline-checkbox-row">
              <input
                type="checkbox"
                id="allowPastDeadlineUpdate"
                checked={allowPastDeadline}
                onChange={(e) => setAllowPastDeadline(e.target.checked)}
                className="rounded border"
                disabled={busy}
              />
              <label
                htmlFor="allowPastDeadlineUpdate"
                className="update-task-deadline-checkbox-label"
              >
                Cho phép deadline trong quá khứ
              </label>
            </div>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-4">
            <label className="update-task-inline-label">Ưu tiên</label>
            <select
              className="update-task-inline-input"
              disabled={busy}
              {...register("priority")}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p] ?? p}
                </option>
              ))}
            </select>
            {errors.priority && (
              <p
                role="alert"
                aria-live="polite"
                className="update-task-error"
              >
                {errors.priority.message}
              </p>
            )}
          </div>

          {/* Checklist */}
          <div>
            <p className="update-task-label">Checklist</p>

            {fields.map((f, idx) => (
              <div key={f.id} className="update-task-checklist-row">
                <input
                  type="checkbox"
                  disabled={busy}
                  {...register(`checklist.${idx}.done`)}
                />
                <input
                  className="update-task-checklist-input"
                  disabled={busy}
                  placeholder="Nội dung công việc…"
                  {...register(`checklist.${idx}.text`)}
                />
                <button
                  type="button"
                  className="update-task-checklist-remove"
                  disabled={busy}
                  onClick={() => remove(idx)}
                >
                  Xoá
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={busy}
              className="update-task-add-checklist"
              onClick={() =>
                append({
                  id:
                    globalThis.crypto?.randomUUID?.() ||
                    `${Date.now()}-${Math.random()}`,
                  text: "",
                  done: false,
                })
              }
            >
              + Thêm checklist
            </button>
          </div>

          {/* Attachment */}
          <div>
            <label className="update-task-label">Đính kèm (URL)</label>
            <input
              type="url"
              className="update-task-input"
              placeholder="https://…"
              disabled={busy}
              {...register("attachment_url", {
                validate: (v) =>
                  !v || /^https?:\/\/.+/i.test(v) || "URL không hợp lệ",
              })}
            />
            {errors.attachment_url && (
              <p
                role="alert"
                aria-live="polite"
                className="update-task-error"
              >
                {errors.attachment_url.message}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="update-task-buttons">
            <button
              type="submit"
              disabled={busy || !isDirty}
              className="update-task-btn-primary"
            >
              {isSubmitting ? "Đang lưu…" : "Cập nhật"}
            </button>

            <button
              type="button"
              disabled={busy}
              className="update-task-btn-danger"
              onClick={onDelete}
            >
              {isDeleting ? "Đang xoá…" : "Xoá task"}
            </button>

            <button
              type="button"
              disabled={busy}
              className="update-task-btn-secondary"
              onClick={onCancel}
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={!!confirmType}
        title={
          confirmType === "delete"
            ? "Xóa task"
            : confirmType === "cancel"
            ? "Rời trang?"
            : "Cập nhật task"
        }
        message={
          confirmType === "delete"
            ? "Bạn có chắc muốn xóa task này? Hành động này không thể hoàn tác."
            : confirmType === "cancel"
            ? "Bạn có thay đổi chưa lưu. Bạn có chắc muốn rời trang?"
            : "Bạn có muốn lưu thay đổi?"
        }
        confirmText={
          confirmType === "delete"
            ? "Xóa"
            : confirmType === "cancel"
            ? "Rời trang"
            : "Lưu"
        }
        cancelText="Hủy"
        onCancel={() => setConfirmType(null)}
        onConfirm={handleDialogConfirm}
      />
    </div>
  )
}
