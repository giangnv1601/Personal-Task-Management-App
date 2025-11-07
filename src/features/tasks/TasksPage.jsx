import { Search, ChevronDown, Plus, X, ChevronLeft, ChevronRight } from "lucide-react"
import React, { useMemo, useState, useCallback, useEffect } from "react"
import { Link } from "react-router-dom"
import { toast } from "sonner"

import PriorityTag from "@/components/ui/PriorityTag"
import useAuth from "@/hooks/useAuth"
import usePagination from "@/hooks/usePagination"
import useTask from "@/hooks/useTask"
import { formatDate, isDeadlineBeforeOrEqual } from "@/utils/date"

const PAGE_SIZE = 10

const TasksPage = () => {
  // Hooks
  const { user } = useAuth()
  const { items, loading, updating, error, fetchTasks, updateTask } = useTask()

  // State
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(id)
  }, [q])

  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deadlineFilter, setDeadlineFilter] = useState("")

  // Fetch tasks
  useEffect(() => {
    if (user?.id) {
      fetchTasks({ userId: user.id })
    }
  }, [user?.id, fetchTasks])

  // Hiển thị error toast
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Map tasks từ API: thêm property "done" từ status
  const tasks = useMemo(() => {
    return (items || []).map(t => ({ ...t, done: t.status === "done" }))
  }, [items])

  // Toggle checkbox
  const toggleDone = useCallback(async (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const nextStatus = task.done ? "todo" : "done"
    const action = await updateTask(id, {
      status: nextStatus,
      updated_at: new Date().toISOString()
    })

    if (action?.meta?.requestStatus === "fulfilled") {
      toast.success("Cập nhật trạng thái task thành công!")
    }
  }, [tasks, updateTask])

  // Filter
  const filteredTasks = useMemo(() => {
    const term = debouncedQ.toLowerCase()
    const pf = priorityFilter.toLowerCase()
    const sf = statusFilter.toLowerCase()
    const df = deadlineFilter

    return tasks.filter(t => {
      const matchesQ = !term || (t.title || "").toLowerCase().includes(term)
      const matchesPriority = pf === "all" || String(t.priority).toLowerCase() === pf
      const matchesStatus = sf === "all" || String(t.status).toLowerCase() === sf
      const matchesDeadline = !df || (t.deadline && isDeadlineBeforeOrEqual(t.deadline, df))
      return matchesQ && matchesPriority && matchesStatus && matchesDeadline
    })
  }, [tasks, debouncedQ, priorityFilter, statusFilter, deadlineFilter])

  // Pagination
  const { page, setPage, totalPages, pageItems, pageRange, goPrev, goNext, goTo } =
    usePagination(filteredTasks, PAGE_SIZE)

  // Reset về trang 1 khi đổi bộ lọc/tìm kiếm
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, priorityFilter, statusFilter, deadlineFilter, setPage])

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Danh sách Task</h1>
        <Link
          to="/tasks/new"
          className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 font-medium text-gray-900 hover:bg-yellow-500"
        >
          <Plus size={16} /> Tạo mới task
        </Link>
      </div>

      {/* --- Task List Card --- */}
      <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm">

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap gap-3 pb-2">

          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề"
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 focus:border-gray-400 focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              className="appearance-none rounded-lg border border-gray-300 py-2 pl-3 pr-9 focus:border-gray-400 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Lọc theo trạng thái"
            >
              <option value="all">Trạng thái: Tất cả</option>
              <option value="in_progress">Đang làm</option>
              <option value="todo">Chưa hoàn thành</option>
              <option value="done">Đã hoàn thành</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <ChevronDown size={16} />
            </span>
          </div>

          {/* Priority filter */}
          <div className="relative">
            <select
              className="appearance-none rounded-lg border border-gray-300 py-2 pl-3 pr-9 focus:border-gray-400 focus:outline-none"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              aria-label="Lọc theo độ ưu tiên"
            >
              <option value="all">Ưu tiên: Tất cả</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <ChevronDown size={16} />
            </span>
          </div>

          {/* Deadline filter */}
          <div className="relative flex items-center gap-2">
            <input
              type="date"
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 pl-3 pr-3 focus:border-gray-400 focus:outline-none"
              aria-label="Lọc theo deadline (≤ ngày đã chọn)"
            />
            {deadlineFilter && (
              <button
                onClick={() => setDeadlineFilter("")}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                title="Xóa lọc deadline"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center text-gray-500 py-8">Đang tải tasks...</div>
        )}

        {/* Rows */}
        {!loading && (
          <div>
            {pageItems.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center px-3 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 w-1/2">
                  <input
                    type="checkbox"
                    className="size-4 cursor-pointer"
                    checked={!!t.done}
                    onChange={() => toggleDone(t.id)}
                    disabled={updating}
                    aria-label={`Hoàn thành task: ${t.title}`}
                  />
                  <span className={`text-gray-900 ${t.done ? "text-gray-500 line-through" : ""}`}>
                    {t.title}
                  </span>
                </div>

                <div className="w-[140px] text-center">
                  <PriorityTag priority={t.priority} />
                </div>

                <div className="w-[140px] text-center text-gray-700 font-mono text-sm">
                  {t.deadline ? formatDate(t.deadline) : <span className="text-gray-400">—</span>}
                </div>

                <div className="w-[90px] flex justify-center">
                  <Link
                    to={`/tasks/edit/${t.id}`}
                    aria-label={`Sửa task ${t.title}`}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    Sửa
                  </Link>
                </div>
              </div>
            ))}

            {pageItems.length === 0 && (
              <div className="text-center text-gray-500 py-8">Không có task phù hợp.</div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={goPrev}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40 transition-opacity"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {pageRange.map((p, idx) =>
              p === "…" ? (
                <span key={`gap-${idx}`} className="px-2 text-gray-400" aria-hidden="true">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                    p === page
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100 border border-transparent"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={goNext}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40 transition-opacity"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TasksPage
