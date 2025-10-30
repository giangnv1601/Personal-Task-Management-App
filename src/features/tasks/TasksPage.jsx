import { Search, ChevronDown, Plus, X, ChevronLeft, ChevronRight } from "lucide-react"
import React, { useMemo, useState, useCallback, useEffect } from "react"

const toLocalInput = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  const offset = d.getTimezoneOffset() * 60000;
  const localTime = new Date(d.getTime() - offset);
  return localTime.toISOString().slice(0, 16);
};

const toUTCISOString = (localInput) => {
  if (!localInput) return "";
  const d = new Date(localInput);
  return d.toISOString();
};


export const fakeTasks = [
  {
    id: "a3f61a47-29e9-4f52-9b23-d84dcb8e6b14-1",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Thiết kế giao diện trang Dashboard (Lần 1)",
    description: "Tạo layout tổng quan với thống kê số task theo trạng thái.",
    deadline: "2025-11-10T09:00:00Z",
    priority: "high",
    status: "in_progress",
    checklist: [{ text: "Vẽ wireframe", done: true }, { text: "Tạo component biểu đồ", done: false }],
    attachment_url: "https://example.com/design-dashboard.png",
    created_at: "2025-10-20T07:00:00Z",
    updated_at: "2025-10-28T09:30:00Z",
  },
  {
    id: "ef92cc6e-62be-4b7c-89b3-12d2320f9ab2-1",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Kết nối API Supabase cho Task (Lần 1)",
    description: "Tạo API gọi đến Supabase REST để CRUD task.",
    deadline: "2025-11-05T15:00:00Z",
    priority: "medium",
    status: "todo",
    checklist: [{ text: "Viết hàm fetchTask", done: true }, { text: "Viết hàm createTask", done: false }, { text: "Test với Postman", done: false }],
    attachment_url: "",
    created_at: "2025-10-25T04:00:00Z",
    updated_at: "2025-10-26T12:00:00Z",
  },
  {
    id: "c7512aa8-1a29-44e7-8a3d-bd3d9f48ce55-1",
    user_id: "b9c8f1a2-0911-4f2f-951e-0cf8d0845db9",
    title: "Viết unit test cho CreateTask (Lần 1)",
    description: "Dùng Jest và React Testing Library để test form.",
    deadline: "2025-11-02T09:00:00Z",
    priority: "low",
    status: "done",
    checklist: [{ text: "Mock useTask hook", done: true }, { text: "Test validate title", done: true }, { text: "Test submit success", done: true }],
    attachment_url: "https://example.com/test-result.txt",
    created_at: "2025-10-18T06:00:00Z",
    updated_at: "2025-10-22T18:00:00Z",
  },
  {
    id: "61e1f97b-4201-4ff4-8701-881f4e05f912-1",
    user_id: "b9c8f1a2-0911-4f2f-951e-0cf8d0845db9",
    title: "Cấu hình CI/CD với GitHub Actions (Lần 1)",
    description: "Tự động deploy frontend mỗi khi merge branch main.",
    deadline: "2025-11-15T08:00:00Z",
    priority: "high",
    status: "todo",
    checklist: [{ text: "Tạo file .github/workflows/deploy.yml", done: true }, { text: "Thêm secret VITE_SUPABASE_URL", done: true }, { text: "Test deploy", done: false }],
    attachment_url: "",
    created_at: "2025-10-27T11:00:00Z",
    updated_at: "2025-10-29T14:00:00Z",
  },
  {
    id: "b70ccab0-0560-48e8-9073-f041804197c3-1", 
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Họp demo sprint 2 với team (Lần 1)",
    description: "Chuẩn bị slide trình bày chức năng Create Task và Dashboard.",
    deadline: "2025-10-31T03:00:00Z",
    priority: "low",
    status: "done",
    checklist: [{ text: "Hoàn thiện slide", done: true }, { text: "Demo với backend", done: true }, { text: "Ghi nhận feedback", done: true }],
    attachment_url: "https://example.com/demo-slide.pdf",
    created_at: "2025-10-15T09:00:00Z",
    updated_at: "2025-10-30T03:30:00Z",
  },
  {
    id: "a3f61a47-29e9-4f52-9b23-d84dcb8e6b14-2", 
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Thiết kế giao diện trang Dashboard (Lần 2)",
    description: "Tạo layout tổng quan với thống kê số task theo trạng thái.",
    deadline: "2025-11-10T09:00:00Z",
    priority: "high",
    status: "in_progress",
    checklist: [{ text: "Vẽ wireframe", done: true }, { text: "Tạo component biểu đồ", done: false }],
    attachment_url: "https://example.com/design-dashboard.png",
    created_at: "2025-10-20T07:00:00Z",
    updated_at: "2025-10-28T09:30:00Z",
  },
  {
    id: "ef92cc6e-62be-4b7c-89b3-12d2320f9ab2-2", 
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Kết nối API Supabase cho Task (Lần 2)",
    description: "Tạo API gọi đến Supabase REST để CRUD task.",
    deadline: "2025-11-05T15:00:00Z",
    priority: "medium",
    status: "todo",
    checklist: [{ text: "Viết hàm fetchTask", done: true }, { text: "Viết hàm createTask", done: false }, { text: "Test với Postman", done: false }],
    attachment_url: "",
    created_at: "2025-10-25T04:00:00Z",
    updated_at: "2025-10-26T12:00:00Z",
  },
  {
    id: "c7512aa8-1a29-44e7-8a3d-bd3d9f48ce55-2", 
    user_id: "b9c8f1a2-0911-4f2f-951e-0cf8d0845db9",
    title: "Viết unit test cho CreateTask (Lần 2)",
    description: "Dùng Jest và React Testing Library để test form.",
    deadline: "2025-11-02T09:00:00Z",
    priority: "low",
    status: "done",
    checklist: [{ text: "Mock useTask hook", done: true }, { text: "Test validate title", done: true }, { text: "Test submit success", done: true }],
    attachment_url: "https://example.com/test-result.txt",
    created_at: "2025-10-18T06:00:00Z",
    updated_at: "2025-10-22T18:00:00Z",
  },
  {
    id: "61e1f97b-4201-4ff4-8701-881f4e05f912-2",
    user_id: "b9c8f1a2-0911-4f2f-951e-0cf8d0845db9",
    title: "Cấu hình CI/CD với GitHub Actions (Lần 2)",
    description: "Tự động deploy frontend mỗi khi merge branch main.",
    deadline: "2025-11-15T08:00:00Z",
    priority: "high",
    status: "todo",
    checklist: [{ text: "Tạo file .github/workflows/deploy.yml", done: true }, { text: "Thêm secret VITE_SUPABASE_URL", done: true }, { text: "Test deploy", done: false }],
    attachment_url: "",
    created_at: "2025-10-27T11:00:00Z",
    updated_at: "2025-10-29T14:00:00Z",
  },
  {
    id: "b70ccab0-0560-48e8-9073-f041804197c3-2",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Họp demo sprint 2 với team (Lần 2)",
    description: "Chuẩn bị slide trình bày chức năng Create Task và Dashboard.",
    deadline: "2025-10-31T03:00:00Z",
    priority: "low",
    status: "done",
    checklist: [{ text: "Hoàn thiện slide", done: true }, { text: "Demo với backend", done: true }, { text: "Ghi nhận feedback", done: true }],
    attachment_url: "https://example.com/demo-slide.pdf",
    created_at: "2025-10-15T09:00:00Z",
    updated_at: "2025-10-30T03:30:00Z",
  },
  {
    id: "a3f61a47-29e9-4f52-9b23-d84dcb8e6b14-3",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Thiết kế giao diện trang Dashboard (Lần 3)",
    description: "Tạo layout tổng quan với thống kê số task theo trạng thái.",
    deadline: "2025-11-10T09:00:00Z",
    priority: "high",
    status: "in_progress",
    checklist: [{ text: "Vẽ wireframe", done: true }, { text: "Tạo component biểu đồ", done: false }],
    attachment_url: "https://example.com/design-dashboard.png",
    created_at: "2025-10-20T07:00:00Z",
    updated_at: "2025-10-28T09:30:00Z",
  },
  {
    id: "ef92cc6e-62be-4b7c-89b3-12d2320f9ab2-3",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Kết nối API Supabase cho Task (Lần 3)",
    description: "Tạo API gọi đến Supabase REST để CRUD task.",
    deadline: "2025-11-05T15:00:00Z",
    priority: "medium",
    status: "todo",
    checklist: [{ text: "Viết hàm fetchTask", done: true }, { text: "Viết hàm createTask", done: false }, { text: "Test với Postman", done: false }],
    attachment_url: "",
    created_at: "2025-10-25T04:00:00Z",
    updated_at: "2025-10-26T12:00:00Z",
  },
  {
    id: "c7512aa8-1a29-44e7-8a3d-bd3d9f48ce55-3",
    user_id: "b9c8f1a2-0911-4f2f-951e-0cf8d0845db9",
    title: "Viết unit test cho CreateTask (Lần 3)",
    description: "Dùng Jest và React Testing Library để test form.",
    deadline: "2025-11-02T09:00:00Z",
    priority: "low",
    status: "done",
    checklist: [{ text: "Mock useTask hook", done: true }, { text: "Test validate title", done: true }, { text: "Test submit success", done: true }],
    attachment_url: "https://example.com/test-result.txt",
    created_at: "2025-10-18T06:00:00Z",
    updated_at: "2025-10-22T18:00:00Z",
  },
  {
    id: "61e1f97b-4201-4ff4-8701-881f4e05f912-3",
    user_id: "b9c8f1a2-0911-4f2f-951e-0cf8d0845db9",
    title: "Cấu hình CI/CD với GitHub Actions (Lần 3)",
    description: "Tự động deploy frontend mỗi khi merge branch main.",
    deadline: "2025-11-15T08:00:00Z",
    priority: "high",
    status: "todo",
    checklist: [{ text: "Tạo file .github/workflows/deploy.yml", done: true }, { text: "Thêm secret VITE_SUPABASE_URL", done: true }, { text: "Test deploy", done: false }],
    attachment_url: "",
    created_at: "2025-10-27T11:00:00Z",
    updated_at: "2025-10-29T14:00:00Z",
  },
  {
    id: "b70ccab0-0560-48e8-9073-f041804197c3-3",
    user_id: "5e1f08c0-87ac-4c2f-8df6-9b6d0f35a1d1",
    title: "Họp demo sprint 2 với team (Lần 3)",
    description: "Chuẩn bị slide trình bày chức năng Create Task và Dashboard.",
    deadline: "2025-10-31T03:00:00Z",
    priority: "low",
    status: "done",
    checklist: [{ text: "Hoàn thiện slide", done: true }, { text: "Demo với backend", done: true }, { text: "Ghi nhận feedback", done: true }],
    attachment_url: "https://example.com/demo-slide.pdf",
    created_at: "2025-10-15T09:00:00Z",
    updated_at: "2025-10-30T03:30:00Z",
  },
]

// ===== Helpers & Components nhỏ =====

const formatDate = (iso) => {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString("vi-VN")
}

// So sánh deadline (UTC ISO) <= ngày chọn (local yyyy-mm-dd), theo NGÀY (bỏ giờ)
const isDeadlineBeforeOrEqual = (deadlineISO, yyyyMmDd) => {
  if (!deadlineISO || !yyyyMmDd) return false
  const d1 = new Date(deadlineISO) // UTC ISO
  const d2 = new Date(yyyyMmDd)    // local from <input type="date">
  
  // Dùng Date.parse để so sánh Epoch Time
  // Đặt về 0h local cho cả hai ngày
  d1.setHours(0, 0, 0, 0)
  d2.setHours(0, 0, 0, 0)
  
  return d1.getTime() <= d2.getTime()
}

// Component tách biệt cho Priority Tag (cải thiện khả năng đọc)
const PriorityTag = ({ priority }) => {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium"
  const val = String(priority || "").toLowerCase()
  if (val === "high") return <span className={`${base} bg-red-100 text-red-700`}>High</span>
  if (val === "medium") return <span className={`${base} bg-amber-100 text-amber-700`}>Medium</span>
  if (val === "low") return <span className={`${base} bg-green-100 text-green-700`}>Low</span>
  return <span className="text-gray-500">—</span>
}

const PAGE_SIZE = 10

const TasksPage = () => {
  // State & derived
  const [tasks, setTasks] = useState(() => 
    // Khởi tạo state: map status "done" về property "done"
    fakeTasks.map(t => ({ ...t, done: t.status === "done" }))
  )
  const [q, setQ] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [deadlineFilter, setDeadlineFilter] = useState("") 

  // Edit modal
  const [editing, setEditing] = useState(null)

  // Pagination
  const [page, setPage] = useState(1)

  // Hàm toggleDone đã được sửa để dùng ID duy nhất
  const toggleDone = useCallback((id) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== id) return t
        const nextDone = !t.done
        return {
          ...t,
          done: nextDone,
          status: nextDone ? "done" : "todo", 
          updated_at: new Date().toISOString()
        }
      })
    )
  }, [])
  
  const filteredTasks = useMemo(() => {
    const term = q.trim().toLowerCase()
    const pf = priorityFilter.toLowerCase()
    const sf = statusFilter.toLowerCase()
    const df = deadlineFilter

    return tasks.filter(t => {
      const matchesQ =
        !term ||
        t.title.toLowerCase().includes(term) ||
        (t.description || "").toLowerCase().includes(term)

      const matchesPriority =
        pf === "all" || String(t.priority).toLowerCase() === pf

      const matchesStatus =
        sf === "all" || String(t.status).toLowerCase() === sf

      const matchesDeadline =
        !df || (t.deadline && isDeadlineBeforeOrEqual(t.deadline, df))

      return matchesQ && matchesPriority && matchesStatus && matchesDeadline
    })
  }, [tasks, q, priorityFilter, statusFilter, deadlineFilter])

  // Reset về trang 1 khi đổi bộ lọc/tìm kiếm
  useEffect(() => {
    setPage(1)
  }, [q, priorityFilter, statusFilter, deadlineFilter])

  // ==== Pagination math (Dùng useMemo cho giá trị derived) ====
  const { total, totalPages, startIdx, pageItems } = useMemo(() => {
    const total = filteredTasks.length
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const startIdx = (page - 1) * PAGE_SIZE
    const endIdx = startIdx + PAGE_SIZE
    const pageItems = filteredTasks.slice(startIdx, endIdx)
    return { total, totalPages, startIdx, pageItems }
  }, [filteredTasks, page])
  
  // Clamp page nếu lọc làm giảm số trang
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [totalPages, page])

  const goPrev = useCallback(() => setPage(p => Math.max(1, p - 1)), [])
  const goNext = useCallback(() => setPage(p => Math.min(totalPages, p + 1)), [totalPages])
  const goTo = useCallback((p) => setPage(() => Math.min(Math.max(1, p), totalPages)), [totalPages])

  // Build dải số trang gọn (Dùng useMemo để tối ưu)
  const pageRange = useMemo(() => {
    const range = []
    const window = 1
    const total = totalPages
    const add = (p) => range.push(p)

    if (total === 0) return []

    add(1)
    let left = Math.max(2, page - window)
    let right = Math.min(total - 1, page + window)
    
    // Xử lý khoảng cách bên trái
    if (left > 2) range.push("…")
    
    // Thêm các trang ở giữa
    for (let p = left; p <= right; p++) {
        if (p !== 1 && p !== total) add(p)
    }
    
    // Xử lý khoảng cách bên phải
    if (right < total - 1) range.push("…")
    
    // Thêm trang cuối (nếu chưa có)
    if (total > 1 && total !== range[range.length - 1]) add(total)
    
    return range
  }, [page, totalPages])


  // ----- Edit handlers -----
  const openEdit = (task) => setEditing({ ...task })
  const closeEdit = () => setEditing(null)
  const handleEditChange = (k, v) => setEditing(prev => ({ ...prev, [k]: v }))
  
  const saveEdit = (e) => {
    e.preventDefault()
    if (!editing) return
    
    setTasks(prev =>
      prev.map(t =>
        t.id === editing.id
          ? {
              ...t,
              title: editing.title,
              description: editing.description,
              priority: editing.priority,
              status: editing.status,
              // Chuyển local input date time về UTC ISO String để lưu
              deadline: editing.deadline, 
              done: editing.status === "done",
              updated_at: new Date().toISOString(),
            }
          : t
      )
    )
    closeEdit()
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">Danh sách Task</h1>
        <button className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 font-medium text-gray-900 hover:bg-yellow-500">
          <Plus size={16} /> Tạo mới task
        </button>
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
              placeholder="Tìm kiếm task"
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

        {/* Rows */}
        <div>
          {pageItems.map((t) => (
            <div
              // Key đã được sửa để dùng ID duy nhất
              key={t.id} 
              className="flex justify-between items-center px-3 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 w-1/2">
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer"
                  checked={!!t.done}
                  onChange={() => toggleDone(t.id)}
                  aria-label={`Hoàn thành task: ${t.title}`}
                />
                <span className={`text-gray-900 ${t.done ? "text-gray-500 line-through" : ""}`}>
                  {t.title}
                </span>
              </div>
              
              {/* Sử dụng Component PriorityTag đã tách biệt */}
              <div className="w-[140px] text-center"><PriorityTag priority={t.priority} /></div>
              
              <div className="w-[140px] text-center text-gray-700 font-mono text-sm">{formatDate(t.deadline)}</div>
              
              <div className="w-[90px] flex justify-center">
                <button
                  onClick={() => openEdit(t)}
                  className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  Sửa
                </button>
              </div>
            </div>
          ))}

          {pageItems.length === 0 && (
            <div className="text-center text-gray-500 py-8">Không có task phù hợp.</div>
          )}
        </div>

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

            {/* Dùng pageRange đã được tính bằng useMemo */}
            {pageRange.map((p, idx) =>
              p === "…" ? (
                // Đã thêm key cho dấu "..."
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

      {/* --- Edit modal --- */}
      {editing && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={closeEdit} />
          <div className="fixed left-1/2 top-1/2 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl border p-6 z-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Sửa Task: {editing.title.substring(0, 30)}...</h2>
              <button onClick={closeEdit} className="rounded-full p-2 hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  value={editing.title}
                  onChange={(e) => handleEditChange("title", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  rows={3}
                  value={editing.description}
                  onChange={(e) => handleEditChange("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ưu tiên</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    value={editing.priority}
                    onChange={(e) => handleEditChange("priority", e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Trạng thái</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    value={editing.status}
                    onChange={(e) => handleEditChange("status", e.target.value)}
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Hạn</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  // Chuyển UTC ISO String thành local input format
                  value={toLocalInput(editing.deadline)} 
                  // Chuyển local input format thành UTC ISO String để lưu vào state
                  onChange={(e) => handleEditChange("deadline", toUTCISOString(e.target.value))} 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeEdit} className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button type="submit" className="rounded-lg bg-gray-900 text-white px-4 py-2 hover:bg-black transition-colors">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default TasksPage