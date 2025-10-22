import React, { useMemo, useState, useEffect } from "react"
import { useSelector } from "react-redux"
import { toast } from "sonner"
import useTask from "@/hooks/useTask"

const PRIORITIES = ["low", "medium", "high"]
const STATUSES = ["todo", "in_progress", "done"]

const CreateTask = ({ defaultValues, onCancel, onSuccess }) => {
  const { createTask, creating, error, clearError } = useTask()
  const userId = useSelector((s) => s.auth?.user?.id)

  const init = useMemo(
    () => ({
      title: "",
      description: "",
      deadline: "",
      priority: "low",
      status: "todo",
      checklist: [
        { id: crypto.randomUUID(), text: "Item 1", done: false },
        { id: crypto.randomUUID(), text: "Item 2", done: false },
      ],
      attachment_url: "",
      ...(defaultValues || {}),
    }),
    [defaultValues]
  )

  const [form, setForm] = useState(init)
  const [errors, setErrors] = useState({})

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const addChecklist = () =>
    setForm((s) => ({
      ...s,
      checklist: [
        ...s.checklist,
        { id: crypto.randomUUID(), text: `Item ${s.checklist.length + 1}`, done: false },
      ],
    }))
  const removeChecklist = (id) =>
    setForm((s) => ({ ...s, checklist: s.checklist.filter((c) => c.id !== id) }))
  const updateChecklist = (id, changes) =>
    setForm((s) => ({
      ...s,
      checklist: s.checklist.map((c) => (c.id === id ? { ...c, ...changes } : c)),
    }))

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = "Vui lòng nhập tên task"
    if (!form.deadline) e.deadline = "Chọn deadline"
    return e
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError?.()
    const e2 = validate()
    setErrors(e2)
    if (Object.keys(e2).length) return

    const payload = {
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim(),
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      priority: form.priority,
      status: form.status,
      checklist: form.checklist.map(({ text, done }) => ({ text, done })),
      attachment_url: form.attachment_url?.trim() || "",
    }

    const action = await createTask(payload)
    if (action.meta.requestStatus === "fulfilled") {
      toast.success("Tạo task thành công!")
      setForm(init)
      onSuccess?.(action.payload)
    } else {
      const msg =
        action.payload ||
        action.error?.message ||
        "Không thể tạo task, vui lòng thử lại"
      toast.error(msg)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-6">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-slate-800">Tạo mới Task</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="mb-1 block text-sm">
              Tên task
            </label>
            <input
              id="title"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              type="text"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-400"
              placeholder="Nhập tiêu đề…"
            />
            {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm">
              Mô tả
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-400 resize-none"
              placeholder="Mô tả ngắn…"
            />
          </div>

          {/* Deadline + Priority */}
          <div>
            <label htmlFor="deadline" className="mb-1 block text-sm text-slate-600">
              Deadline
            </label>
            <div className="flex gap-2">
              <select
                id="priority"
                value={form.priority}
                onChange={(e) => setField("priority", e.target.value)}
                className="w-28 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>

              <input
                id="deadline"
                value={form.deadline}
                onChange={(e) => setField("deadline", e.target.value)}
                type="datetime-local"
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-400"
              />
            </div>
            {errors.deadline && <p className="mt-1 text-xs text-rose-600">{errors.deadline}</p>}
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="mb-1 block text-sm">
              Trạng thái
            </label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-400"
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
            <p className="mb-1 block text-sm font-medium text-slate-700">Checklist</p>
            <ul className="space-y-2">
              {form.checklist.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={c.done}
                      onChange={(e) => updateChecklist(c.id, { done: e.target.checked })}
                      className="accent-slate-700"
                    />
                    <input
                      value={c.text}
                      onChange={(e) => updateChecklist(c.id, { text: e.target.value })}
                      className="w-48 rounded-md border border-slate-300 px-2 py-1 text-sm outline-none focus:border-slate-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeChecklist(c.id)}
                    className="rounded-md px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    Xoá
                  </button>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={addChecklist}
              className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
            >
              <span className="text-base leading-none">＋</span> Thêm checklist
            </button>
          </div>

          {/* Attachment URL */}
          <div>
            <label htmlFor="attachment_url" className="mb-1 block text-sm text-slate-600">
              Đính kèm (URL)
            </label>
            <input
              id="attachment_url"
              value={form.attachment_url || ""}
              onChange={(e) => setField("attachment_url", e.target.value)}
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-400"
            />
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
              onClick={onCancel}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
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
