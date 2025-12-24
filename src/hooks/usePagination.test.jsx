import { renderHook, act } from '@testing-library/react'

import usePagination from './usePagination'

describe('usePagination hook (Unit)', () => {
  test('khởi tạo đúng với list đơn giản (page=1)', () => {
    const list = Array.from({ length: 25 }, (_, i) => i + 1) // [1..25]

    const { result } = renderHook(() =>
      usePagination(list, 10 /* pageSize */, 1 /* windowSize */, 'default'),
    )

    expect(result.current.page).toBe(1)
    expect(result.current.total).toBe(25)
    expect(result.current.totalPages).toBe(3) // 25/10 → 3 pages

    expect(result.current.startIdx).toBe(0)
    expect(result.current.endIdx).toBe(10)

    expect(result.current.pageItems.length).toBe(10)
    expect(result.current.pageItems[0]).toBe(1)
    expect(result.current.pageItems[9]).toBe(10)
  })

  test('goNext / goPrev / goTo hoạt động và bị chặn ở biên', () => {
    const list = Array.from({ length: 25 }, (_, i) => i + 1)

    const { result } = renderHook(() =>
      usePagination(list, 10, 1, 'default'),
    )

    // page = 1 -> goPrev vẫn là 1
    act(() => {
      result.current.goPrev()
    })
    expect(result.current.page).toBe(1)

    // goNext -> page = 2
    act(() => {
      result.current.goNext()
    })
    expect(result.current.page).toBe(2)

    // goTo(3) -> page = 3
    act(() => {
      result.current.goTo(3)
    })
    expect(result.current.page).toBe(3)

    // goNext nữa cũng không vượt quá totalPages (3)
    act(() => {
      result.current.goNext()
    })
    expect(result.current.page).toBe(3)

    // goTo(99) bị clamp về totalPages
    act(() => {
      result.current.goTo(99)
    })
    expect(result.current.page).toBe(3)

    // goTo(0) bị clamp về 1
    act(() => {
      result.current.goTo(0)
    })
    expect(result.current.page).toBe(1)
  })

  test('rangeStyle="minimal" trả về pageRange rỗng', () => {
    const list = Array.from({ length: 30 }, (_, i) => i + 1)

    const { result } = renderHook(() =>
      usePagination(list, 10, 1, 'minimal'),
    )

    expect(result.current.pageRange).toEqual([])
  })

  test('rangeStyle="full" trả về đầy đủ các trang', () => {
    const list = Array.from({ length: 25 }, (_, i) => i + 1)

    const { result } = renderHook(() =>
      usePagination(list, 10, 1, 'full'),
    )

    // totalPages = 3
    expect(result.current.totalPages).toBe(3)
    expect(result.current.pageRange).toEqual([1, 2, 3])
  })

    test('rangeStyle="default" với nhiều trang tạo range hợp lý', () => {
      const list = Array.from({ length: 50 }, (_, i) => i + 1) // 5 pages

      const { result } = renderHook(() =>
        usePagination(list, 10, 1, 'default'),
      )

      // page=1 → [1,2,"…",5]
      expect(result.current.pageRange).toEqual([1, 2, '…', 5])

      // sang page=3
      act(() => {
        result.current.goTo(3)
      })

      // với code hiện tại: [1,2,3,4,5]
      expect(result.current.pageRange).toEqual([1, 2, 3, 4, 5])
    })


  test('hasMoreFromServer=true thêm 1 page ảo và pageRange có "…"', () => {
    const list = Array.from({ length: 30 }, (_, i) => i + 1) // baseTotalPages = 3

    const { result } = renderHook(() =>
      usePagination(
        list,
        10,
        1,
        'default',
        true, // hasMoreFromServer
      ),
    )

    // baseTotalPages = 3, hasMoreFromServer=true => totalPages = 4
    expect(result.current.totalPages).toBe(4)

    // page=1 → [1,2,"…"]
    expect(result.current.pageRange).toEqual([1, 2, '…'])

    // page=2 → [1,2,3,"…"]
    act(() => {
      result.current.goNext()
    })
    expect(result.current.page).toBe(2)
    expect(result.current.pageRange).toEqual([1, 2, 3, '…'])

    // page=3 → lúc này (page - 1 > 1) → set.add(page - 1) được chạy
    act(() => {
      result.current.goTo(3)
    })
    expect(result.current.page).toBe(3)

    // set = {1, page-1(2), page(3), page+1(4)} → [1,2,3,4,"…"]
    expect(result.current.pageRange).toEqual([1, 2, 3, 4, '…'])
  })

})
