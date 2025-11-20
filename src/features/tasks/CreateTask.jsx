import React, { useMemo, useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"
import useTask from "@/hooks/useTask"
import { toLocalInput, toUTCISOString } from "@/utils/date"
import { isValidUrl, validateDeadline } from "@/utils/validate"

const PRIORITIES = ["low", "medium", "high"]
const STATUSES = ["todo", "in_progress", "done"]

function CreateTask({ defaultValues, onCancel, onSuccess }) {
  const { createTask, creating } = useTask()
  const userId = useSelector((s) => s.auth?.user?.id)
  const navigate = useNavigate()

  const [allowPastDeadline, setAllowPastDeadline] = useState(false)

  const normalizedDefaults = useMemo(() => {
    const dv = defaultValues || {}
    return {
      title: "",
      description: "",
      priority: "low",
      status: "todo",
      attachment_url: "",
      checklist: [],
      ...dv,
      deadline: toLocalInput(dv.deadline || ""),
    }
  }, [defaultValues])

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: normalizedDefaults })

  useEffect(() => reset(normalizedDefaults), [normalizedDefaults, reset])

  const { fields, append, remove } = useFieldArray({ control, name: "checklist" })

  const onSubmit = async (data) => {
    if (!userId) return toast.error("Thiếu user đăng nhập")

    if (data.attachment_url && !isValidUrl(data.attachment_url)) {
      return toast.error("URL không hợp lệ")
    }

    const payload = {
      ...data,
      user_id: userId,
      title: data.title.trim(),
      description: (data.description || "").trim(),
      deadline: toUTCISOString(data.deadline),
      checklist: (data.checklist || []).map((c) => ({
        text: c.text.trim(),
        done: !!c.done,
      })),
    }

    const action = await createTask(payload)
    if (action?.meta?.requestStatus === "fulfilled") {
      toast.success("Tạo task thành công!")
      reset()
      onSuccess?.(action.payload)
    } else toast.error(action?.error?.message || "Không thể tạo task")
  }

  const handleCancel = () => {
    if (typeof onCancel === "function") return onCancel()
    navigate(-1)
  }

  const nowLocalMin = toLocalInput(new Date())

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-slate-800">Tạo mới Task</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Title */}
          <div>
            <label className="block text-sm mb-1">Tên task</label>
            <input
              {...register("title", { required: "Vui lòng nhập tên task" })}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Nhập tiêu đề…"
              disabled={creating}
            />
            {errors.title && <p className="text-xs text-rose-600">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm mb-1">Mô tả</label>
            <textarea
              {...register("description")}
              rows={2}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Mô tả ngắn…"
              disabled={creating}
            />
          </div>

          {/* Priority + Deadline */}
          <div>
            <label className="block text-sm mb-1">Ưu tiên & Deadline</label>
            <div className="flex gap-2">
              <select
                {...register("priority")}
                className="w-28 rounded-lg border px-3 py-2"
                disabled={creating}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                step="60"
                min={allowPastDeadline ? undefined : nowLocalMin}
                {...register("deadline", {
                  required: "Chọn deadline",
                  validate: allowPastDeadline ? undefined : validateDeadline,
                })}
                className="flex-1 rounded-lg border px-3 py-2"
                disabled={creating}
              />
            </div>
            {errors.deadline && (
              <p className="text-xs text-rose-600">{errors.deadline.message}</p>
            )}

            <div className="flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                id="allowPastDeadline"
                checked={allowPastDeadline}
                onChange={(e) => setAllowPastDeadline(e.target.checked)}
                className="rounded border"
                disabled={creating}
              />
              <label htmlFor="allowPastDeadline" className="text-sm text-gray-600">
                Cho phép deadline trong quá khứ
              </label>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm mb-1">Trạng thái</label>
            <select
              {...register("status")}
              className="w-full rounded-lg border px-3 py-2"
              disabled={creating}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "in_progress" ? "In progress" : s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist */}
          <div>
            <p className="text-sm font-medium mb-1">Checklist</p>
            {fields.map((item, i) => (
              <div key={item.id} className="flex items-center gap-2 mb-1">
                <input type="checkbox" {...register(`checklist.${i}.done`)} disabled={creating} />
                <div className="flex-1">
                  <input
                    {...register(`checklist.${i}.text`, { required: "Không để trống" })}
                    className="w-full rounded border px-2 py-1 text-sm"
                    disabled={creating}
                  />
                  {errors?.checklist?.[i]?.text && (
                    <p className="text-xs text-rose-600 mt-1">
                      {errors.checklist[i].text.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-sm text-red-600"
                  disabled={creating}
                >
                  Xóa
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ text: "", done: false })}
              className="text-indigo-600 text-sm"
              disabled={creating}
            >
              + Thêm checklist
            </button>
          </div>

          {/* Attachment URL */}
          <div>
            <label className="block text-sm mb-1">Đính kèm (URL)</label>
            <input
              type="url"
              {...register("attachment_url", {
                validate: (v) =>
                  !v || isValidUrl(v) || "URL không hợp lệ",
              })}
              placeholder="https://…"
              className="w-full rounded-lg border px-3 py-2"
              disabled={creating}
            />
            {errors.attachment_url && (
              <p className="text-xs text-rose-600">{errors.attachment_url.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-white disabled:opacity-50 hover:bg-indigo-500"
            >
              {creating ? "Đang tạo…" : "Tạo mới"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border px-5 py-2.5 bg-white hover:bg-slate-50"
              disabled={creating}
            >
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTask
