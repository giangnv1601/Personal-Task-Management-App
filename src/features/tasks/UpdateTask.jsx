import React, { useEffect, useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { toLocalInput, toUTCISOString } from "@/utils/date.js"
import { validateDeadline } from "@/utils/validate.js"
import useTask from "@/hooks/useTask"

const PRIORITIES = ["low", "medium", "high"]
const STATUSES = ["todo", "in_progress", "done"]

const UpdateTask = () => {
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
    []
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
    getValues,
    setValue,
    formState: { errors, isSubmitting, isDirty }
  } = useForm({
    defaultValues: init,
    mode: "onChange"
  })

  const { fields, append, remove } = useFieldArray({ control, name: "checklist" })
  const watchedChecklist = useWatch({ control, name: "checklist" })

  const [isDeleting, setIsDeleting] = useState(false)
  const busy = loading || isSubmitting || isDeleting

  const findLocalTask = (taskId) =>
    (items || []).find((it) => String(it.id) === String(taskId))

  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (!id) return

      const local = findLocalTask(id)
      if (local && mounted) {
        reset({ ...init, ...local }, { keepDirty: true, keepDirtyValues: true })
        return
      }

      try {
        const res = await fetchTasks?.()
        const list = res?.data || res || items || []
        const after = list.find?.((it) => String(it.id) === String(id)) || findLocalTask(id)
        if (after && mounted) {
          reset({ ...init, ...after }, { keepDirty: true, keepDirtyValues: true })
        } else if (mounted) {
          toast.error("Không tìm thấy task.")
        }
      } catch (err) {
        if (mounted) toast.error(err?.message || "Không thể tải task")
      }
    }
    load()
    return () => { mounted = false }
  }, [id, items, fetchTasks, reset, init])

  // Đồng bộ trạng thái theo checklist:
  // - Nếu tất cả checklist đều done => set status = 'done'
  // - Nếu có ít nhất 1 chưa xong và hiện tại là 'done' => hạ về 'in_progress'
  useEffect(() => {
    const list = Array.isArray(watchedChecklist) ? watchedChecklist : []
    if (list.length === 0) return

    const allDone = list.every((it) => !!it?.done)
    const current = getValues("status")

    if (allDone && current !== "done") {
      setValue("status", "done", { shouldDirty: true, shouldValidate: true })
    } else if (!allDone && current === "done") {
      setValue("status", "in_progress", { shouldDirty: true, shouldValidate: true })
    }
  }, [watchedChecklist, getValues, setValue])

  const onSubmit = async (data) => {
    if (!confirm("Bạn có chắc muốn cập nhật task này?")) return

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
        throw new Error(action?.payload || action?.error?.message || "Cập nhật thất bại")
      }
      toast.success("Cập nhật task thành công!")
      navigate("/tasks")
    } catch (err) {
      toast.error(err?.message || "Có lỗi khi cập nhật task")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa task này?")) return
    setIsDeleting(true)
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
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    if (isDirty && !confirm("Bạn có thay đổi chưa lưu. Rời trang?")) return
    navigate(-1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-slate-800">Cập nhật Task</h2>

        <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)} aria-busy={busy}>
          {/* Trạng thái */}
          <div>
            <label htmlFor="status" className="text-sm font-medium mb-1">Trạng thái</label>
            <select
              id="status"
              className="w-full rounded-lg border px-3 py-2"
              disabled={busy}
              {...register("status")}
              aria-invalid={!!errors.status || undefined}
            >
              <option value="todo">Chưa hoàn thành</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Đã hoàn thành</option>
            </select>
            {errors.status && <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>}
          </div>

          {/* Tên task */}
          <div>
            <label htmlFor="title" className="text-sm font-medium mb-1">Tên task</label>
            <input
              id="title"
              type="text"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Nhập tên task…"
              disabled={busy}
              {...register("title", { required: "Tên task là bắt buộc" })}
              aria-invalid={!!errors.title || undefined}
            />
            {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>}
          </div>

          {/* Mô tả */}
          <div>
            <label htmlFor="desc" className="text-sm font-medium mb-1">Mô tả</label>
            <textarea
              id="desc"
              rows={2}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Mô tả ngắn…"
              disabled={busy}
              {...register("description")}
            />
          </div>

          {/* Deadline + Ưu tiên trên cùng một hàng (giữ nguyên bố cục bạn đã làm) */}
          <div className="flex items-center gap-4">
            <label htmlFor="deadline" className="w-28 text-sm font-medium mb-1">Deadline</label>
            <Controller
              control={control}
              name="deadline"
              rules={{ validate: validateDeadline }}
              render={({ field: { value, onChange }, fieldState }) => (
                <>
                  <input
                    id="deadline"
                    type="datetime-local"
                    step="60"
                    className="ml-auto w-[260px] rounded-lg border px-3 py-2"
                    value={value ? toLocalInput(value) : ""}
                    onChange={(e) => {
                      const v = e.target.value
                      onChange(v ? toUTCISOString(v) : null)
                    }}
                    disabled={busy}
                    aria-invalid={!!fieldState.error || undefined}
                  />
                  {fieldState.error && (
                    <p className="text-sm text-red-600 mt-1">{fieldState.error.message}</p>
                  )}
                </>
              )}
            />
          </div>

          <div className="flex items-center gap-4">
            <label htmlFor="priority" className="w-28 text-sm font-medium mb-1">Ưu tiên</label>
            <select
              id="priority"
              className="ml-auto w-[260px] rounded-lg border px-3 py-2"
              disabled={busy}
              {...register("priority")}
              aria-invalid={!!errors.priority || undefined}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            {errors.priority && <p className="text-sm text-red-600 mt-1">{errors.priority.message}</p>}
          </div>

          {/* Checklist */}
          <div>
            <p className="text-sm font-medium mb-1">Checklist</p>
            {fields.map((f, idx) => (
              <div key={f.id} className="flex items-center gap-2 mb-1">
                <input type="hidden" {...register(`checklist.${idx}.id`)} defaultValue={f.id} />

                <input
                  type="checkbox"
                  aria-label="Đánh dấu hoàn thành"
                  disabled={busy}
                  {...register(`checklist.${idx}.done`)}
                />
                <div className="flex-1">
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    placeholder="Nội dung công việc…"
                    disabled={busy}
                    {...register(`checklist.${idx}.text`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="text-sm text-red-600"
                  disabled={busy}
                >
                  Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                append({
                  id: (globalThis.crypto?.randomUUID?.() || `${Date.now()}`),
                  text: "",
                  done: false,
                })
              }
              className="text-indigo-600 text-sm mt-1"
              disabled={busy}
            >
              + Thêm checklist
            </button>
          </div>

          {/* Đính kèm */}
          <div>
            <label htmlFor="attach" className="block text-sm mb-1">Đính kèm (URL)</label>
            <input
              id="attach"
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border px-3 py-2"
              disabled={busy}
              {...register("attachment_url", {
                validate: (v) =>
                  !v || /^https?:\/\/.+/i.test(v) || "Đính kèm phải là URL hợp lệ (http/https)"
              })}
              aria-invalid={!!errors.attachment_url || undefined}
            />
            {errors.attachment_url && (
              <p className="text-sm text-red-600 mt-1">{errors.attachment_url.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-between items-center gap-3">
            <button
              type="submit"
              disabled={busy || !isDirty}
              className="min-w-[120px] rounded-lg bg-blue-600 px-6 py-2.5 text-base font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Đang lưu…" : "Cập nhật"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={busy}
              className="min-w-[120px] rounded-lg border-2 border-red-500 text-red-600 text-base font-medium px-6 py-2.5 hover:bg-red-50 transition-colors"
            >
              {isDeleting ? "Đang xoá…" : "Xoá task"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={busy}
              className="min-w-[120px] rounded-lg border border-slate-300 bg-white text-slate-700 text-base font-medium px-6 py-2.5 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UpdateTask
