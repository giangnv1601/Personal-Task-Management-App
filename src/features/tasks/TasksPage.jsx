import {
  Search,
  ChevronDown,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
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
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deadlineFilter, setDeadlineFilter] = useState("")
  const [togglingId, setTogglingId] = useState(null)

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(id)
  }, [q])

  // Fetch tasks
  useEffect(() => {
    if (user?.id) {
      fetchTasks({ userId: user.id })
    }
  }, [user?.id, fetchTasks])

  // Hiển thị error toast (ngoài UI error state)
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Map tasks từ API: thêm property "done" từ status
  const tasks = useMemo(
    () => (items || []).map((t) => ({ ...t, done: t.status === "done" })),
    [items]
  )

  // Toggle checkbox
  const toggleDone = useCallback(
    async (id) => {
      const task = tasks.find((t) => t.id === id)
      if (!task) return

      setTogglingId(id)

      try {
        const nextStatus = task.done ? "todo" : "done"
        const action = await updateTask(id, {
          status: nextStatus,
          updated_at: new Date().toISOString(),
        })

        if (action?.meta?.requestStatus === "fulfilled") {
          toast.success("Cập nhật trạng thái task thành công!")
        } else {
          toast.error("Cập nhật trạng thái task thất bại.")
        }
      } catch (err) {
        console.error(err)
        toast.error("Có lỗi xảy ra khi cập nhật trạng thái task.")
      } finally {
        setTogglingId(null)
      }
    },
    [tasks, updateTask]
  )

  // Filter
  const filteredTasks = useMemo(() => {
    const term = debouncedQ.toLowerCase()
    const pf = priorityFilter.toLowerCase()
    const sf = statusFilter.toLowerCase()
    const df = deadlineFilter

    return tasks.filter((t) => {
      const matchesQ =
        !term || (t.title || "").toLowerCase().includes(term)
      const matchesPriority =
        pf === "all" || String(t.priority).toLowerCase() === pf
      const matchesStatus =
        sf === "all" || String(t.status).toLowerCase() === sf
      const matchesDeadline =
        !df || (t.deadline && isDeadlineBeforeOrEqual(t.deadline, df))
      return (
        matchesQ && matchesPriority && matchesStatus && matchesDeadline
      )
    })
  }, [tasks, debouncedQ, priorityFilter, statusFilter, deadlineFilter])

  // Pagination
  const {
    page,
    setPage,
    totalPages,
    pageItems,
    pageRange,
    goPrev,
    goNext,
    goTo,
  } = usePagination(filteredTasks, PAGE_SIZE)

  // Reset về trang 1 khi đổi bộ lọc/tìm kiếm
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, priorityFilter, statusFilter, deadlineFilter, setPage])

  const handleRetry = () => {
    if (user?.id) {
      fetchTasks({ userId: user.id })
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Danh sách Task
        </h1>
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

        {/* Error state UI */}
        {!loading && error && (
          <div className="mb-3 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <span>Đã xảy ra lỗi khi tải danh sách task.</span>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="py-8 text-center text-gray-500">
            Đang tải tasks...
          </div>
        )}

        {/* Rows */}
        {!loading && (
          <div>
            {pageItems.map((t) => {
              const isToggling = updating && togglingId === t.id

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between border-b border-gray-200 px-3 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex w-1/2 items-center gap-3">
                    <input
                      type="checkbox"
                      className="size-4 cursor-pointer"
                      checked={!!t.done}
                      onChange={() => toggleDone(t.id)}
                      disabled={!!isToggling}
                      aria-label={`Hoàn thành task: ${t.title}`}
                    />
                    {isToggling && (
                      <Loader2 className="size-4 animate-spin text-gray-400" />
                    )}
                    <span
                      className={`text-gray-900 ${
                        t.done ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {t.title}
                    </span>
                  </div>

                  <div className="w-[140px] text-center">
                    <PriorityTag priority={t.priority} />
                  </div>

                  <div className="w-[140px] text-center font-mono text-sm text-gray-700">
                    {t.deadline ? (
                      formatDate(t.deadline)
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>

                  <div className="flex w-[180px] justify-center gap-2">
                    <Link
                      to={`/tasks/detail/${t.id}`}
                      aria-label={`Xem chi tiết task ${t.title}`}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      Xem
                    </Link>
                    <Link
                      to={`/tasks/edit/${t.id}`}
                      aria-label={`Sửa task ${t.title}`}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      Sửa
                    </Link>
                  </div>
                </div>
              )
            })}

            {pageItems.length === 0 && !error && (
              <div className="py-8 text-center text-gray-500">
                Không có task phù hợp.
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={goPrev}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-opacity enabled:hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            {pageRange.map((p, idx) =>
              p === "…" ? (
                <span
                  key={`gap-${idx}`}
                  className="px-2 text-gray-400"
                  aria-hidden="true"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                    p === page
                      ? "bg-gray-900 text-white"
                      : "border border-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={goNext}
              disabled={page === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-700 transition-opacity enabled:hover:bg-gray-50 disabled:opacity-40"
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
