 
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'

// ---- Mock sonner toast (chỉ để không lỗi, không test logic riêng nó) ----
jest.mock('sonner', () => ({
  Toaster: () => null,
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
import { toast } from 'sonner'

// ---- Mock useAuth: chỉ cần user.id cho TasksPage dùng ----
jest.mock('@/hooks/useAuth', () => ({
  __esModule: true,
  default: () => ({ user: { id: 'user-1', email: 'user@example.com' } }),
}))

// ---- Mock PriorityTag: render span đơn giản ----
jest.mock('@/components/ui/PriorityTag', () => ({
  __esModule: true,
  default: ({ priority }) => <span>Priority: {priority}</span>,
}))

// ---- Mock formatDateTime: trả chuỗi đơn giản ----
jest.mock('@/utils/date', () => ({
  __esModule: true,
  formatDateTime: (iso) => `formatted(${iso})`,
}))

// ---- Mock react-window/List: render tất cả rows bình thường ----
jest.mock('react-window', () => ({
  List: ({ rowComponent: RowComponent, rowCount, rowProps }) => (
    <div data-testid="virtual-list">
      {Array.from({ length: rowCount }).map((_, index) => (
        <div key={index} data-testid="row">
          <RowComponent index={index} style={{}} {...rowProps} />
        </div>
      ))}
    </div>
  ),
}))

// ---- Mock useTask: chúng ta sẽ điều chỉnh return theo từng test ----
const mockUseTask = jest.fn()
jest.mock('@/hooks/useTask', () => ({
  __esModule: true,
  default: (...args) => mockUseTask(...args),
}))

// ---- Mock usePagination: tương tự ----
const mockUsePagination = jest.fn()
jest.mock('@/hooks/usePagination', () => ({
  __esModule: true,
  default: (...args) => mockUsePagination(...args),
}))

// ---- Import component cần test ----
import TasksPage from '@/features/tasks/TasksPage.jsx'

// helper state useTask
const makeTaskState = (overrides = {}) => ({
  items: [],
  itemsFiltered: [],
  loading: false,
  updating: false,
  deleting: false,
  error: null,
  fetchTasksCursor: jest.fn(), // để TasksPage gọi
  batchToggleStatus: jest.fn(),
  optimisticToggleStatus: jest.fn(),
  isFiltering: false,
  isMutating: false,
  cursor: null,
  hasMore: false,
  ...overrides,
})

// helper state usePagination
const makePaginationState = (overrides = {}) => ({
  page: 1,
  setPage: jest.fn(),
  totalPages: 1,
  pageItems: [],
  pageRange: [1],
  goPrev: jest.fn(),
  goNext: jest.fn(),
  goTo: jest.fn(),
  endIdx: 10,
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('TasksPage (component test)', () => {
  test('hiển thị header và nút "Tạo mới task"', () => {
    mockUseTask.mockReturnValue(makeTaskState())
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: /Danh sách Task/i }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /Tạo mới task/i }),
    ).toBeInTheDocument()
  })

  test('hiển thị danh sách task ở chế độ paged (TaskRow, PriorityTag, deadline)', () => {
    const tasks = [
      {
        id: 't1',
        title: 'Task 1',
        priority: 'high',
        status: 'todo',
        done: false,
        deadline: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 't2',
        title: 'Task 2',
        priority: 'medium',
        status: 'done',
        done: true,
        deadline: null,
      },
    ]

    mockUseTask.mockReturnValue(
      makeTaskState({
        items: tasks,
        itemsFiltered: tasks,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        pageItems: tasks,
        totalPages: 1,
        pageRange: [1],
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    // title
    expect(screen.getByText('Task 1')).toBeInTheDocument()
    expect(screen.getByText('Task 2')).toBeInTheDocument()

    // priority
    expect(screen.getByText(/Priority: high/i)).toBeInTheDocument()
    expect(screen.getByText(/Priority: medium/i)).toBeInTheDocument()

    // deadline task 1 dùng formatDateTime
    expect(
      screen.getByText(/formatted\(2025-01-01T00:00:00.000Z\)/i),
    ).toBeInTheDocument()
    // deadline null -> dấu "—"
    expect(screen.getAllByText(/—/i).length).toBeGreaterThan(0)

    // link Xem / Sửa
    expect(
      screen.getByRole('link', { name: /Xem chi tiết task Task 1/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Sửa task Task 1/i }),
    ).toBeInTheDocument()
  })

  test('loading = true → hiển thị text "Đang tải tasks..."', () => {
    mockUseTask.mockReturnValue(
      makeTaskState({
        loading: true,
      }),
    )
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Đang tải tasks.../i)).toBeInTheDocument()
  })

  test('empty state: chưa có task nào', () => {
    mockUseTask.mockReturnValue(makeTaskState({ items: [], itemsFiltered: [] }))
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/Chưa có task nào, hãy tạo task mới./i),
    ).toBeInTheDocument()
  })

  test('empty state: có items nhưng filter không match → "Không có task phù hợp..."', () => {
    const allItems = [
      { id: '1', title: 'A', done: false },
      { id: '2', title: 'B', done: false },
    ]

    mockUseTask.mockReturnValue(
      makeTaskState({
        items: allItems,
        itemsFiltered: [],
      }),
    )
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/Không có task phù hợp với bộ lọc hiện tại./i),
    ).toBeInTheDocument()
  })

  test('isFiltering / isMutating message hiển thị đúng', () => {
    // Case 1: isFiltering = true
    mockUseTask.mockReturnValue(
      makeTaskState({
        isFiltering: true,
        isMutating: false,
      }),
    )
    mockUsePagination.mockReturnValue(makePaginationState())

    const { rerender } = render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/Đang áp dụng bộ lọc \/ sắp xếp.../i),
    ).toBeInTheDocument()

    // Case 2: isMutating = true
    mockUseTask.mockReturnValue(
      makeTaskState({
        isFiltering: false,
        isMutating: true,
      }),
    )
    mockUsePagination.mockReturnValue(makePaginationState())

    rerender(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(
      screen.getByText(/Đang cập nhật dữ liệu task.../i),
    ).toBeInTheDocument()
  })

  test('error UI + toast.error + nút "Thử lại" gọi fetchTasksCursor', async () => {
    const fetchTasksCursor = jest.fn()

    mockUseTask.mockReturnValue(
      makeTaskState({
        error: 'Lỗi khi tải',
        fetchTasksCursor,
      }),
    )
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    // UI error
    expect(
      screen.getByText(/Đã xảy ra lỗi khi tải danh sách task./i),
    ).toBeInTheDocument()

    // effect toast.error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Lỗi khi tải')
    })

    const btn = screen.getByRole('button', {
      name: /Thử lại tải danh sách task/i,
    })
    const user = userEvent.setup()
    await user.click(btn)

    await waitFor(() => {
      expect(fetchTasksCursor).toHaveBeenCalledWith({
        userId: 'user-1',
        limit: 10, // INITIAL_LIMIT = PAGE_SIZE
        cursor: null,
      })
    })
  })

  test('search input + debounce: gọi useTask với searchText đã trim', async () => {
    jest.useFakeTimers()

    mockUseTask.mockReturnValue(makeTaskState())
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const input = screen.getByPlaceholderText(/Tìm theo tiêu đề/i)
    fireEvent.change(input, { target: { value: '   hello  ' } })

    // clear lịch sử trước khi debounce chạy
    mockUseTask.mockClear()

    act(() => {
      jest.advanceTimersByTime(300)
    })

    await waitFor(() => {
      expect(mockUseTask).toHaveBeenCalled()
    })

    const lastCallArgs =
      mockUseTask.mock.calls[mockUseTask.mock.calls.length - 1][0]
    expect(lastCallArgs.searchText).toBe('hello')

    jest.useRealTimers()
  })

  test('thay đổi filter reset về trang 1 (setPage(1))', async () => {
    const setPage = jest.fn()

    mockUseTask.mockReturnValue(makeTaskState())
    mockUsePagination.mockReturnValue(
      makePaginationState({
        setPage,
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const statusSelect = screen.getByLabelText(/Lọc theo trạng thái/i)
    const user = userEvent.setup()
    await user.selectOptions(statusSelect, 'done')

    await waitFor(() => {
      expect(setPage).toHaveBeenCalledWith(1)
    })
  })

  test('deadline filter + nút clear hoạt động', async () => {
    mockUseTask.mockReturnValue(makeTaskState())
    mockUsePagination.mockReturnValue(makePaginationState())

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const inputDate = screen.getByLabelText(
      /Lọc theo deadline \(≤ ngày đã chọn\)/i,
    )
    const user = userEvent.setup()

    await user.type(inputDate, '2025-01-10')

    // vì input type="date", value thay đổi
    expect(inputDate).toHaveValue('2025-01-10')

    const clearBtn = screen.getByRole('button', { name: /Xóa lọc deadline/i })
    await user.click(clearBtn)

    expect(inputDate).toHaveValue('')
  })

  test('pagination UI: Prev/Next/page button gọi goPrev/goNext/goTo', async () => {
    const tasks = Array.from({ length: 15 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `Task ${i + 1}`,
      done: false,
    }))

    const goPrev = jest.fn()
    const goNext = jest.fn()
    const goTo = jest.fn()

    mockUseTask.mockReturnValue(
      makeTaskState({
        items: tasks,
        itemsFiltered: tasks,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        page: 2,
        totalPages: 3,
        pageItems: tasks.slice(10),
        pageRange: [1, 2, 3],
        goPrev,
        goNext,
        goTo,
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const btnPrev = screen.getByRole('button', { name: /Prev/i })
    const btnNext = screen.getByRole('button', { name: /Next/i })
    const btnPage3 = screen.getByRole('button', { name: '3' })

    const user = userEvent.setup()
    await user.click(btnPrev)
    await user.click(btnNext)
    await user.click(btnPage3)

    expect(goPrev).toHaveBeenCalled()
    expect(goNext).toHaveBeenCalled()
    expect(goTo).toHaveBeenCalledWith(3)
  })

  test('infinite mode: loader row gọi loadMore → fetchTasksCursor được gọi', async () => {
    const tasks = Array.from({ length: 35 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `Task ${i + 1}`,
      done: false,
    }))
    const fetchTasksCursor = jest.fn().mockResolvedValue({})

    // totalLoaded >= 30 => mode = "infinite"
    mockUseTask.mockReturnValue(
      makeTaskState({
        items: tasks,
        itemsFiltered: tasks,
        hasMore: true,
        cursor: 'cursor-1',
        fetchTasksCursor,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        pageItems: [], // paged mode không dùng
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    // InfiniteRow index = tasks.length sẽ là loader row và tự gọi loadMore
    await waitFor(() => {
      expect(fetchTasksCursor).toHaveBeenCalledWith({
        userId: 'user-1',
        limit: 10,
        cursor: 'cursor-1',
      })
    })
  })

  test('paged mode lazy load: endIdx > items.length và hasMore=true → fetchTasksCursor được gọi', async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `Task ${i + 1}`,
      done: false,
    }))
    const fetchTasksCursor = jest.fn().mockResolvedValue({})

    mockUseTask.mockReturnValue(
      makeTaskState({
        items,
        itemsFiltered: items,
        hasMore: true,
        cursor: 'cursor-1',
        fetchTasksCursor,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        endIdx: 10, // > items.length -> trigger lazy load
        pageItems: items,
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchTasksCursor).toHaveBeenCalledWith({
        userId: 'user-1',
        limit: 10,
        cursor: 'cursor-1',
      })
    })
  })

  test('paged mode filter/search lazy load: pageItems < PAGE_SIZE & hasMore=true → fetchTasksCursor được gọi', async () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: `t${i + 1}`,
      title: `Task ${i + 1}`,
      done: false,
    }))
    const fetchTasksCursor = jest.fn().mockResolvedValue({})

    // mode = paged (totalLoaded < 30)
    mockUseTask.mockReturnValue(
      makeTaskState({
        items,
        itemsFiltered: items,
        hasMore: true,
        cursor: 'cursor-1',
        fetchTasksCursor,
      }),
    )

    // pageItems.length < PAGE_SIZE (10) -> trigger effect filter/search lazy load
    mockUsePagination.mockReturnValue(
      makePaginationState({
        pageItems: items.slice(0, 5),
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(fetchTasksCursor).toHaveBeenCalledWith({
        userId: 'user-1',
        limit: 10,
        cursor: 'cursor-1',
      })
    })
  })

  test('toggleDone: optimisticToggleStatus gọi ngay và batchToggleStatus được gọi sau debounce, toast thành công', async () => {
    jest.useFakeTimers()

    const batchToggleStatus = jest.fn()
    const optimisticToggleStatus = jest.fn()

    const tasks = [
      {
        id: 't1',
        title: 'Task toggle',
        priority: 'high',
        status: 'todo',
        done: false,
        deadline: null,
      },
    ]

    mockUseTask.mockReturnValue(
      makeTaskState({
        items: tasks,
        itemsFiltered: tasks,
        batchToggleStatus,
        optimisticToggleStatus,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        pageItems: tasks,
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const checkbox = screen.getByRole('checkbox', {
      name: /Hoàn thành task: Task toggle/i,
    })

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    await user.click(checkbox)

    // optimistic update ngay
    expect(optimisticToggleStatus).toHaveBeenCalledWith('t1')

    // Sau 250ms debounce: gọi batchToggleStatus với 1 update
    act(() => {
      jest.advanceTimersByTime(250)
    })

    await waitFor(() => {
      expect(batchToggleStatus).toHaveBeenCalledTimes(1)
      expect(batchToggleStatus).toHaveBeenCalledWith([
        { id: 't1', status: 'done' },
      ])
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đã cập nhật 1 task')
    })

    jest.useRealTimers()
  })

  test('toggleDone: batch nhiều task trong một lần debounce', async () => {
    jest.useFakeTimers()

    const batchToggleStatus = jest.fn()
    const optimisticToggleStatus = jest.fn()

    const tasks = [
      {
        id: 't1',
        title: 'Task 1',
        priority: 'high',
        status: 'todo',
        done: false,
        deadline: null,
      },
      {
        id: 't2',
        title: 'Task 2',
        priority: 'medium',
        status: 'todo',
        done: false,
        deadline: null,
      },
    ]

    mockUseTask.mockReturnValue(
      makeTaskState({
        items: tasks,
        itemsFiltered: tasks,
        batchToggleStatus,
        optimisticToggleStatus,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        pageItems: tasks,
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    const checkbox1 = screen.getByRole('checkbox', {
      name: /Hoàn thành task: Task 1/i,
    })
    const checkbox2 = screen.getByRole('checkbox', {
      name: /Hoàn thành task: Task 2/i,
    })

    await user.click(checkbox1)
    await user.click(checkbox2)

    act(() => {
      jest.advanceTimersByTime(250)
    })

    await waitFor(() => {
      expect(batchToggleStatus).toHaveBeenCalledTimes(1)
      const updates = batchToggleStatus.mock.calls[0][0]
      expect(updates).toEqual(
        expect.arrayContaining([
          { id: 't1', status: 'done' },
          { id: 't2', status: 'done' },
        ]),
      )
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đã cập nhật 2 task')
    })

    jest.useRealTimers()
  })

  test('toggleDone: nhiều lần click cùng một task trong window debounce → chỉ batch một lần cho task đó', async () => {
    jest.useFakeTimers()

    const batchToggleStatus = jest.fn()
    const optimisticToggleStatus = jest.fn()

    const tasks = [
      {
        id: 't1',
        title: 'Task toggle',
        priority: 'high',
        status: 'todo',
        done: false,
        deadline: null,
      },
    ]

    mockUseTask.mockReturnValue(
      makeTaskState({
        items: tasks,
        itemsFiltered: tasks,
        batchToggleStatus,
        optimisticToggleStatus,
      }),
    )

    mockUsePagination.mockReturnValue(
      makePaginationState({
        pageItems: tasks,
      }),
    )

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const checkbox = screen.getByRole('checkbox', {
      name: /Hoàn thành task: Task toggle/i,
    })

    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    // click 2 lần nhanh trên cùng 1 task
    await user.click(checkbox)
    await user.click(checkbox)

    act(() => {
      jest.advanceTimersByTime(250)
    })

    await waitFor(() => {
      expect(batchToggleStatus).toHaveBeenCalledTimes(1)
      expect(batchToggleStatus).toHaveBeenCalledWith([
        { id: 't1', status: 'done' },
      ])
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Đã cập nhật 1 task')
    })

    jest.useRealTimers()
  })
})
