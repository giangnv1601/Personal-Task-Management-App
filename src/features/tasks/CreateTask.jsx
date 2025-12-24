import React, { useMemo, useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

import {
  PRIORITIES,
  STATUSES,
  PRIORITY_LABEL,
  STATUS_LABEL,
} from "@/constants/task"
import useTask from "@/hooks/useTask"
import { toLocalInput, toUTCISOString } from "@/utils/date"
import { isValidUrl, validateDeadline, validateText } from "@/utils/validate"

import "@/styles/CreateTask.css"

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

  useEffect(() => {
    reset(normalizedDefaults)
  }, [normalizedDefaults, reset])

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
    } else {
      toast.error(action?.error?.message || "Không thể tạo task")
    }
  }

  const handleCancel = () => {
    if (typeof onCancel === "function") return onCancel()
    navigate(-1)
  }

  const nowLocalMin = toLocalInput(new Date())

  return (
    <div className="create-task-page">
      <div className="create-task-card">
        <h2 className="create-task-title">Tạo mới Task</h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="create-task-form"
          noValidate
        >
          {/* Title */}
          <div>
            <label
              htmlFor="taskTitle"
              className="create-task-label"
            >
              Tên task
            </label>
            <input
              id="taskTitle"
              {...register("title", {
                validate: (v) => validateText(v, { min: 1, max: 255 }),
              })}
              className="create-task-input"
              placeholder="Nhập tiêu đề…"
              disabled={creating}
            />
            {errors.title && (
              <p
                role="alert"
                aria-live="polite"
                className="create-task-error"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="taskDescription"
              className="create-task-label"
            >
              Mô tả
            </label>
            <textarea
              id="taskDescription"
              {...register("description", {
                validate: (v) => validateText(v, { max: 2000 }),
              })}
              rows={2}
              className="create-task-textarea"
              placeholder="Mô tả ngắn…"
              disabled={creating}
            />
          </div>

          {/* Priority + Deadline */}
          <div>
            <label className="create-task-label">Ưu tiên &amp; Deadline</label>
            <div className="flex gap-2">
              <select
                {...register("priority")}
                className="create-task-select w-28"
                disabled={creating}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p] ?? (p[0].toUpperCase() + p.slice(1))}
                  </option>
                ))}
              </select>

              <input
                type="datetime-local"
                step="60"
                min={allowPastDeadline ? undefined : nowLocalMin}
                {...register("deadline", {
                  required: "Chọn deadline",
                  validate: (v) =>
                    validateDeadline(v, { allowPast: allowPastDeadline }),
                })}
                className="create-task-input flex-1"
                disabled={creating}
              />
            </div>
            {errors.deadline && (
              <p
                role="alert"
                aria-live="polite"
                className="create-task-error"
              >
                {errors.deadline.message}
              </p>
            )}

            <div className="mt-1 flex items-center gap-2">
              <input
                type="checkbox"
                id="allowPastDeadline"
                checked={allowPastDeadline}
                onChange={(e) => setAllowPastDeadline(e.target.checked)}
                className="rounded border"
                disabled={creating}
              />
              <label
                htmlFor="allowPastDeadline"
                className="text-sm text-gray-600"
              >
                Cho phép deadline trong quá khứ
              </label>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="create-task-label">Trạng thái</label>
            <select
              {...register("status")}
              className="create-task-select w-full"
              disabled={creating}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s] ?? (s[0].toUpperCase() + s.slice(1))}
                </option>
              ))}
            </select>
          </div>

          {/* Checklist */}
          <div>
            <p className="create-task-label">Checklist</p>
            {fields.map((item, i) => (
              <div key={item.id} className="create-task-checklist-row">
                <input
                  type="checkbox"
                  {...register(`checklist.${i}.done`)}
                  disabled={creating}
                />
                <div className="flex-1">
                  <input
                    {...register(`checklist.${i}.text`, {
                      required: "Không để trống",
                    })}
                    className="create-task-checklist-input"
                    disabled={creating}
                  />
                  {errors?.checklist?.[i]?.text && (
                    <p
                      role="alert"
                      aria-live="polite"
                      className="create-task-error mt-1"
                    >
                      {errors.checklist[i].text.message}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="create-task-checklist-remove"
                  disabled={creating}
                >
                  Xóa
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ text: "", done: false })}
              className="create-task-add-checklist-btn"
              disabled={creating}
            >
              + Thêm checklist
            </button>
          </div>

          {/* Attachment URL */}
          <div>
            <label
              htmlFor="attachmentUrl"
              className="create-task-label"
            >
              Đính kèm (URL)
            </label>
            <input
              id="attachmentUrl"
              type="url"
              {...register("attachment_url", {
                validate: (v) =>
                  !v || isValidUrl(v) || "URL không hợp lệ",
              })}
              placeholder="https://…"
              className="create-task-input"
              disabled={creating}
            />
            {errors.attachment_url && (
              <p
                role="alert"
                aria-live="polite"
                className="create-task-error"
              >
                {errors.attachment_url.message}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="create-task-buttons">
            <button
              type="submit"
              disabled={creating}
              className="create-task-btn-primary"
            >
              {creating ? "Đang tạo…" : "Tạo mới"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="create-task-btn-secondary"
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
