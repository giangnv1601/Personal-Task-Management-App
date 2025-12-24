import {
  Search,
  ChevronDown,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react"
import React, { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Link } from "react-router-dom"
import { List } from "react-window"
import { toast } from "sonner"

import PriorityTag from "@/components/ui/PriorityTag"
import useAuth from "@/hooks/useAuth"
import usePagination from "@/hooks/usePagination"
import useTask from "@/hooks/useTask"
import { formatDateTime } from "@/utils/date"

import "@/styles/TasksPage.css"

// Số item mỗi trang
const PAGE_SIZE = 10
// Chiều cao mỗi row trong react-window
const ROW_HEIGHT = 56
// Số row tối đa hiển thị trong react-window trước khi scroll
const MAX_VISIBLE_ROWS = 10
// Ngưỡng quyết định chuyển từ pagination sang infinite scroll
const TASKS_THRESHOLD = 30
// Limit cho lần fetch đầu tiên
const INITIAL_LIMIT = PAGE_SIZE

// Row dùng cho pagination
function TaskRow({ index, style, tasks, updating, togglingId, toggleDone }) {
  const t = tasks[index]
  if (!t) return null

  const isToggling = updating && togglingId === t.id

  return (
    <div style={style} className="tasks-row">
      <div className="tasks-row-main">
        <input
          type="checkbox"
          className="tasks-row-checkbox"
          checked={!!t.done}
          onChange={() => toggleDone(t.id)}
          disabled={!!isToggling}
          aria-label={`Hoàn thành task: ${t.title}`}
        />
        {isToggling && (
          <Loader2 className="size-4 animate-spin text-gray-400" />
        )}
        <span
          className={
            "tasks-row-title " + (t.done ? "tasks-row-title-done" : "")
          }
        >
          {t.title}
        </span>
      </div>

      <div className="tasks-row-priority">
        <PriorityTag priority={t.priority} showIcon={false} />
      </div>

      <div className="tasks-row-deadline">
        {t.deadline ? (
          formatDateTime(t.deadline)
        ) : (
          <span className="tasks-row-deadline-empty">—</span>
        )}
      </div>

      <div className="tasks-row-actions">
        <Link
          to={`/tasks/detail/${t.id}`}
          aria-label={`Xem chi tiết task ${t.title}`}
          className="tasks-row-link"
        >
          Xem
        </Link>
        <Link
          to={`/tasks/edit/${t.id}`}
          aria-label={`Sửa task ${t.title}`}
          className="tasks-row-link disabled:opacity-50"
        >
          Sửa
        </Link>
      </div>
    </div>
  )
}

// Row dùng cho infinite scroll
function InfiniteRow({
  index,
  style,
  tasks,
  updating,
  togglingId,
  toggleDone,
  hasMore,
  loading,
  onLoadMore,
}) {
  const isLoaderRow = hasMore && index === tasks.length

  // Loader row ở cuối list
  if (isLoaderRow) {
    if (!loading && typeof onLoadMore === "function") {
      onLoadMore()
    }

    return (
      <div style={style} className="tasks-row-loader">
        {loading ? "Đang tải thêm task..." : "Đang chờ tải thêm task..."}
      </div>
    )
  }

  // Row task bình thường
  return (
    <TaskRow
      index={index}
      style={style}
      tasks={tasks}
      updating={updating}
      togglingId={togglingId}
      toggleDone={toggleDone}
    />
  )
}

const TasksPage = () => {
  const { user } = useAuth()

  // State filter / search
  const [q, setQ] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deadlineFilter, setDeadlineFilter] = useState("")
  const [togglingId, setTogglingId] = useState(null)

  // buffer batch { [id]: { id, status } }
  const pendingBatchRef = useRef({})
  const batchTimerRef = useRef(null)
  // Throttle cho loadMore (tránh spam API)
  const loadingMoreRef = useRef(false)

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => clearTimeout(id)
  }, [q])

  const {
    items,
    itemsFiltered,
    loading,
    updating,
    error,
    fetchTasksCursor,
    batchToggleStatus,
    optimisticToggleStatus,
    isFiltering,
    isMutating,
    cursor,
    hasMore,
  } = useTask({
    searchText: debouncedQ,
    priorityFilter,
    statusFilter,
    deadlineFilter,
  })

  const totalLoaded = items?.length ?? 0

  // Xác định mode
  const mode = useMemo(
    () => (totalLoaded >= TASKS_THRESHOLD ? "infinite" : "paged"),
    [totalLoaded],
  )

  // Hàm load thêm bằng cursor API, có throttle (dùng cho infinite scroll & lazy page)
  const loadMore = useCallback(() => {
    if (!user?.id) return
    if (!hasMore) return
    if (!cursor) return
    if (loadingMoreRef.current) return

    loadingMoreRef.current = true

    fetchTasksCursor({
      userId: user.id,
      limit: PAGE_SIZE,
      cursor,
    }).finally(() => {
      loadingMoreRef.current = false
    })
  }, [user?.id, hasMore, cursor, fetchTasksCursor])

  // Fetch tasks lần đầu: lấy một page đầu tiên
  useEffect(() => {
    if (user?.id) {
      fetchTasksCursor({
        userId: user.id,
        limit: INITIAL_LIMIT,
        cursor: null,
      })
    }
  }, [user?.id, fetchTasksCursor])

  // Hiển thị error toast
  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  // Toggle checkbox với batch update
  const toggleDone = useCallback(
    (id) => {
      const task = itemsFiltered.find((t) => t.id === id)
      if (!task) return

      const nextStatus = task.done ? "todo" : "done"

      // Cập nhật UI ngay
      optimisticToggleStatus(id)
      setTogglingId(id)

      // Gom vào buffer batch
      pendingBatchRef.current[id] = { id, status: nextStatus }

      // Reset timer nếu đang có
      if (batchTimerRef.current) {
        clearTimeout(batchTimerRef.current)
      }

      // Đặt timer mới
      batchTimerRef.current = setTimeout(() => {
        const updates = Object.values(pendingBatchRef.current)

        // clear buffer & timer
        pendingBatchRef.current = {}
        batchTimerRef.current = null

        setTogglingId(null)

        // batchToggleStatus cho tất cả task vừa được click
        batchToggleStatus(updates)
        toast.success(`Đã cập nhật ${updates.length} task`)
      }, 250)
    },
    [itemsFiltered, optimisticToggleStatus, batchToggleStatus],
  )

  // Pagination chạy trên items đã lọc (chỉ dùng khi mode = paged)
  const {
    page,
    setPage,
    totalPages,
    pageItems,
    pageRange,
    goPrev,
    goNext,
    goTo,
    endIdx,
  } = usePagination(itemsFiltered, PAGE_SIZE, 1, "default", hasMore)

  // Reset về trang 1 khi đổi bộ lọc/tìm kiếm
  useEffect(() => {
    setPage(1)
  }, [debouncedQ, priorityFilter, statusFilter, deadlineFilter, setPage])

  // Lazy fetch theo trang (dùng cho paged mode)
  // Nếu chuyển sang trang có endIdx > số items đã load và hasMore = true → loadMore
  useEffect(() => {
    if (mode !== "paged") return
    if (!user?.id) return
    if (!hasMore) return
    if (!cursor) return
    if (loadingMoreRef.current) return

    const loadedCount = items?.length ?? 0
    if (endIdx > loadedCount) {
      loadMore()
    }
  }, [mode, user?.id, hasMore, cursor, items, endIdx, loadMore])

  // FetchTask cho filter/search (dùng cho paged mode)
  useEffect(() => {
    if (mode !== "paged") return
    if (!user?.id) return
    if (!hasMore) return // hết data rồi thì dừng
    if (!cursor) return
    if (loading || loadingMoreRef.current) return

    const currentPageItems = pageItems.length
    const isPageIncomplete =
      currentPageItems >= 0 && currentPageItems < PAGE_SIZE

    // FetchTask nếu trang hiện tại chưa đủ items hiển thị full page
    if (isPageIncomplete) {
      loadingMoreRef.current = true
      fetchTasksCursor({
        userId: user.id,
        limit: PAGE_SIZE,
        cursor,
      }).finally(() => {
        loadingMoreRef.current = false
      })
    }
  }, [
    mode,
    user?.id,
    hasMore,
    cursor,
    loading,
    pageItems.length,
    fetchTasksCursor,
  ])

  const handleRetry = () => {
    if (user?.id) {
      fetchTasksCursor({
        userId: user.id,
        limit: INITIAL_LIMIT,
        cursor: null,
      })
    }
  }

  // Các task trang hiện tại (dùng cho paged mode)
  const tasksForPagination = pageItems
  // Các task đã lọc (dùng cho infinite mode)
  const tasksForInfinite = itemsFiltered

  return (
    <div className="tasks-page-root">
      {/* Header */}
      <div className="tasks-header">
        <h1 className="tasks-header-title">Danh sách Task</h1>
        <Link to="/tasks/new" className="tasks-create-btn">
          <Plus size={16} /> Tạo mới task
        </Link>
      </div>

      <div className="tasks-card">
        {/* Toolbar */}
        <div className="tasks-toolbar">
          {/* Search */}
          <div className="tasks-search-wrapper">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tiêu đề"
              className="tasks-search-input"
            />
          </div>

          {/* Status filter */}
          <div className="tasks-select-wrapper">
            <select
              className="tasks-select"
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
          <div className="tasks-select-wrapper">
            <select
              className="tasks-select"
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
          <div className="tasks-deadline-wrapper">
            <input
              type="date"
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="tasks-deadline-input"
              aria-label="Lọc theo deadline (≤ ngày đã chọn)"
            />
            {deadlineFilter && (
              <button
                onClick={() => setDeadlineFilter("")}
                aria-label="Xóa lọc deadline"
                className="tasks-deadline-clear"
                title="Xóa lọc deadline"
              >
                <X size={14} aria-hidden="true" focusable="false" />
              </button>
            )}
          </div>
        </div>

        {/* Thông tin đang lọc/sort hoặc mutation */}
        {(isFiltering || isMutating) && !loading && (
          <p className="tasks-info-text">
            {isFiltering
              ? "Đang áp dụng bộ lọc / sắp xếp..."
              : "Đang cập nhật dữ liệu task..."}
          </p>
        )}

        {/* Error state UI */}
        {!loading && error && (
          <div
            role="alert"
            aria-live="polite"
            className="tasks-error"
          >
            <span>Đã xảy ra lỗi khi tải danh sách task.</span>
            <button
              type="button"
              onClick={handleRetry}
              aria-label="Thử lại tải danh sách task"
              className="tasks-error-retry"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="tasks-loading"
          >
            Đang tải tasks...
          </div>
        )}

        {/* Rows */}
        {!loading && (
          <div>
            {/* Empty state */}
            {((mode === "paged" && tasksForPagination.length === 0) ||
              (mode === "infinite" && tasksForInfinite.length === 0)) &&
              !error && (
                <div
                  role="status"
                  aria-live="polite"
                  className="tasks-empty"
                >
                  {(items?.length ?? 0) > 0
                    ? "Không có task phù hợp với bộ lọc hiện tại."
                    : "Chưa có task nào, hãy tạo task mới."}
                </div>
              )}

            {/* Paged mode: react-window + pagination */}
            {mode === "paged" && tasksForPagination.length > 0 && (
              <List
                rowComponent={TaskRow}
                rowCount={tasksForPagination.length}
                rowHeight={ROW_HEIGHT}
                rowProps={{
                  tasks: tasksForPagination,
                  updating,
                  togglingId,
                  toggleDone,
                }}
                style={{
                  width: "100%",
                  height:
                    Math.min(tasksForPagination.length, MAX_VISIBLE_ROWS) *
                    ROW_HEIGHT,
                }}
              />
            )}

            {/* Infinite mode: react-window + infinite scroll + loader row */}
            {mode === "infinite" && tasksForInfinite.length > 0 && (
              <List
                rowComponent={InfiniteRow}
                rowCount={tasksForInfinite.length + (hasMore ? 1 : 0)}
                rowHeight={ROW_HEIGHT}
                rowProps={{
                  tasks: tasksForInfinite,
                  updating,
                  togglingId,
                  toggleDone,
                  hasMore,
                  loading,
                  onLoadMore: loadMore,
                }}
                style={{
                  width: "100%",
                  height:
                    Math.min(
                      tasksForInfinite.length + (hasMore ? 1 : 0),
                      MAX_VISIBLE_ROWS,
                    ) * ROW_HEIGHT,
                }}
              />
            )}
          </div>
        )}

        {/* Pagination */}
        {mode === "paged" && totalPages > 1 && itemsFiltered.length > 0 && (
          <div className="tasks-pagination">
            <button
              onClick={goPrev}
              disabled={page === 1}
              className="tasks-pagination-btn"
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
                  className={
                    "tasks-pagination-page " +
                    (p === page
                      ? "tasks-pagination-page-active"
                      : "tasks-pagination-page-normal")
                  }
                >
                  {p}
                </button>
              ),
            )}

            <button
              onClick={goNext}
              disabled={page === totalPages}
              className="tasks-pagination-btn"
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
