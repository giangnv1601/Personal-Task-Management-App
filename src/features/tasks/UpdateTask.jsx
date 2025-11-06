import React, { useMemo, useState } from "react"
import { toLocalInput } from "@/utils/date.js"

const FAKE_TASK = {
  id: "a3f61a47-29e9-4f52-9b23-d84dcb8e6b14",
  title: "Cải tiến giao diện Create/Update Task",
  description:
    "Refactor form, bổ sung checklist động (thêm/xoá/sửa) và mô phỏng cập nhật.",
  status: "in_progress",
  priority: "medium",
  deadline: "2025-11-10T09:00:00Z",
  attachment_url: "https://example.com/design-dashboard.png",
  checklist: [
    { id: crypto.randomUUID(), text: "Chuẩn hoá input", done: true },
    { id: crypto.randomUUID(), text: "Thêm nút thêm/xoá checklist", done: false },
  ],
}

const UpdateTask = () => {
  const init = useMemo(() => ({ ...FAKE_TASK }), [])
  const [form, setForm] = useState(init)
  const [creating, setCreating] = useState(false)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const toggleChecklist = (id) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((it) =>
        it.id === id ? { ...it, done: !it.done } : it
      ),
    }))
  }

  const changeChecklistText = (id, text) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.map((it) =>
        it.id === id ? { ...it, text } : it
      ),
    }))
  }

  const removeChecklist = (id) => {
    setForm((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((it) => it.id !== id),
    }))
  }

  const addChecklist = () => {
    setForm((prev) => ({
      ...prev,
      checklist: [...prev.checklist, { id: crypto.randomUUID(), text: "", done: false }],
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setCreating(true)
    setTimeout(() => {
      console.log("FAKE UPDATE PAYLOAD:", form)
      alert("Đã cập nhật (fake)!\nXem payload trong console.")
      setCreating(false)
    }, 700)
  }

  const handleCancel = () => setForm(init)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E1E5E8] p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-2xl font-semibold text-slate-800">Cập nhật Task</h2>

        <form className="space-y-4" noValidate onSubmit={handleSubmit}>
          {/* Trạng thái */}
          <div>
            <label className="text-sm font-medium mb-1">Trạng thái</label>
            <select
              className="w-full rounded-lg border px-3 py-2"
              value={form.status}
              onChange={handleChange("status")}
              disabled={creating}
            >
              <option value="todo">Chưa hoàn thành</option>
              <option value="in_progress">Đang làm</option>
              <option value="done">Đã hoàn thành</option>
            </select>
          </div>

          {/* Tên task */}
          <div>
            <label className="text-sm font-medium mb-1">Tên task</label>
            <input
              type="text"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Nhập tên task…"
              value={form.title}
              onChange={handleChange("title")}
              disabled={creating}
            />
          </div>

          {/* Mô tả */}
          <div>
            <label className="text-sm font-medium mb-1">Mô tả</label>
            <textarea
              rows={2}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Mô tả ngắn…"
              value={form.description}
              onChange={handleChange("description")}
              disabled={creating}
            />
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-4">
            <label className="w-28 text-sm font-medium mb-1">
              Deadline
            </label>
            <input
              type="datetime-local"
              step="60"
              className="ml-auto w-[260px] rounded-lg border px-3 py-2"
              value={toLocalInput(form.deadline)}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  deadline: new Date(e.target.value).toISOString(),
                }))
              }
              disabled={creating}
            />
          </div>

          {/* Ưu tiên */}
          <div className="flex items-center gap-4">
            <label className="w-28 text-sm font-medium mb-1">
              Ưu tiên
            </label>
            <select
              className="ml-auto w-[260px] rounded-lg border px-3 py-2"
              value={form.priority}
              onChange={handleChange("priority")}
              disabled={creating}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Checklist */}
          <div>
            <p className="text-sm font-medium mb-1">Checklist</p>
            {form.checklist.map((item) => (
              <div key={item.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleChecklist(item.id)}
                  disabled={creating}
                />
                <div className="flex-1">
                  <input
                    className="w-full rounded border px-2 py-1 text-sm"
                    value={item.text}
                    onChange={(e) => changeChecklistText(item.id, e.target.value)}
                    placeholder="Nội dung công việc…"
                    disabled={creating}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeChecklist(item.id)}
                  className="text-sm text-red-600"
                  disabled={creating}
                >
                  Xoá
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addChecklist}
              className="text-indigo-600 text-sm mt-1"
              disabled={creating}
            >
              + Thêm checklist
            </button>
          </div>

          {/* Đính kèm */}
          <div>
            <label className="block text-sm mb-1">Đính kèm (URL)</label>
            <input
              type="url"
              placeholder="https://…"
              className="w-full rounded-lg border px-3 py-2"
              value={form.attachment_url}
              onChange={handleChange("attachment_url")}
              disabled={creating}
            />
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-between items-center gap-3">
            {/* Cập nhật */}
            <button
              type="submit"
              disabled={creating}
              className="min-w-[110px] rounded-lg bg-blue-600 px-6 py-2.5 text-base font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {creating ? "Đang lưu…" : "Cập nhật"}
            </button>

            {/* Xoá task */}
            <button
              type="button"
              className="min-w-[110px] rounded-lg border-2 border-red-500 text-red-600 text-base font-medium px-6 py-2.5 hover:bg-red-50 transition-colors duration-200"
            >
              Xoá task
            </button>

            {/* Huỷ */}
            <button
              type="button"
              onClick={handleCancel}
              disabled={creating}
              className="min-w-[110px] rounded-lg border border-slate-300 bg-white text-slate-700 text-base font-medium px-6 py-2.5 hover:bg-slate-50 disabled:opacity-50 transition-colors"
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
