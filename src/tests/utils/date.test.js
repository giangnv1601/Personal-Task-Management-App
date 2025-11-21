/* eslint-disable no-undef */
import {
  toLocalInput,
  toUTCISOString,
  formatDateTime,
  formatRelativeTime,
  isDeadlineBeforeOrEqual,
} from "@/utils/date"

describe("utils/date (updated)", () => {
  afterEach(() => {
    // restore real timers if tests changed them
    try {
      jest.useRealTimers()
    } catch (e) {}
  })

  test("toLocalInput: valid ISO -> YYYY-MM-DDTHH:mm and parsable", () => {
    const iso = "2025-11-10T09:00:00Z"
    const out = toLocalInput(iso)
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
    expect(new Date(out).toString()).not.toMatch(/Invalid Date/)
  })

  test("toLocalInput: empty/invalid -> empty string", () => {
    expect(toLocalInput("")).toBe("")
    expect(toLocalInput(null)).toBe("")
    expect(toLocalInput("not-a-date")).toBe("")
  })

  test("toUTCISOString: local datetime -> ISO Z", () => {
    const local = "2025-11-10T09:00"
    const iso = toUTCISOString(local)
    expect(typeof iso).toBe("string")
    expect(iso).toMatch(/Z$/)
    expect(new Date(iso).toString()).not.toMatch(/Invalid Date/)
  })

  test("toUTCISOString: invalid/empty -> null", () => {
    expect(toUTCISOString("")).toBeNull()
    expect(toUTCISOString("not-a-date")).toBeNull()
  })

  test("formatDateTime: valid ISO -> DD/MM/YYYY HH:mm format", () => {
    const iso = "2025-11-10T09:00:00Z"
    const out = formatDateTime(iso)
    // function pads to two digits for day/month/hour/minute
    expect(out).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  test("formatDateTime: invalid/null -> '—'", () => {
    expect(formatDateTime(null)).toBe("—")
    expect(formatDateTime("invalid")).toBe("—")
  })

  describe("formatRelativeTime deterministic cases", () => {
    const base = new Date("2025-11-15T12:00:00Z")

    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(base)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    test("recent past <5s -> 'vừa xong'", () => {
      const past = new Date(base.getTime() - 2 * 1000).toISOString()
      expect(formatRelativeTime(past)).toBe("vừa xong")
    })

    test("seconds, minutes, hours, yesterday, days and far past", () => {
      const sec30 = new Date(base.getTime() - 30 * 1000).toISOString()
      expect(formatRelativeTime(sec30)).toMatch(/giây trước|vừa xong/)

      const min3 = new Date(base.getTime() - 3 * 60 * 1000).toISOString()
      expect(formatRelativeTime(min3)).toMatch(/3 phút trước/)

      const hour5 = new Date(base.getTime() - 5 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(hour5)).toMatch(/5 giờ trước/)

      const day1 = new Date(base.getTime() - 24 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(day1)).toBe("hôm qua")

      const day3 = new Date(base.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(day3)).toMatch(/3 ngày trước/)

      const day10 = new Date(base.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
      // implementation returns undefined for >= 7 days
      expect(formatRelativeTime(day10)).toBeUndefined()
    })

    test("future times produce 'trong ...' messages", () => {
      const fut30s = new Date(base.getTime() + 30 * 1000).toISOString()
      expect(formatRelativeTime(fut30s)).toMatch(/trong/)

      const fut3h = new Date(base.getTime() + 3 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(fut3h)).toMatch(/trong 3 giờ/)
    })
  })

  test("isDeadlineBeforeOrEqual: same day (different times) -> true; different day -> false; invalid -> false", () => {
    const d1 = "2025-11-10T12:34:56Z"
    const sameDay = "2025-11-10"
    expect(isDeadlineBeforeOrEqual(d1, sameDay)).toBe(true)

    const later = "2025-11-12"
    const before = "2025-11-11"
    expect(isDeadlineBeforeOrEqual(later, before)).toBe(false)

    expect(isDeadlineBeforeOrEqual(null, "2025-11-10")).toBe(false)
    expect(isDeadlineBeforeOrEqual("2025-11-10", null)).toBe(false)
  })
})
