/* eslint-disable no-undef */
import { formatDate, isDeadlineBeforeOrEqual, toLocalInput, toUTCISOString } from "@/utils/date"

describe("utils/date", () => {
  test("formatDate trả về chuỗi ngày hợp lệ (vi-VN)", () => {
    const iso = "2025-11-10T09:00:00Z"
    const result = formatDate(iso)
    // dd/mm/yyyy
    expect(result).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
  })

  test("formatDate trả về '—' khi không có input hoặc không hợp lệ", () => {
    expect(formatDate(null)).toBe("—")
    expect(formatDate(undefined)).toBe("—")
    expect(formatDate("not-a-date")).toBe("—")
  })

  test("isDeadlineBeforeOrEqual bỏ qua phần giờ (cùng NGÀY local vẫn tính <=)", () => {
   // 12:34Z = 19:34 cùng ngày 10/11 giờ VN
    const d1 = "2025-11-10T12:34:56Z"
    const d2 = "2025-11-10"
    expect(isDeadlineBeforeOrEqual(d1, d2)).toBe(true)
  })

  test("isDeadlineBeforeOrEqual sai khi deadline > ngày chọn (so sánh theo NGÀY)", () => {
    const d1 = "2025-11-12"
    const d2 = "2025-11-11"
    expect(isDeadlineBeforeOrEqual(d1, d2)).toBe(false)
  })

  test("toLocalInput chuyển ISO sang dạng datetime-local (YYYY-MM-DDTHH:mm) theo local", () => {
    const iso = "2025-11-10T09:00:00Z"
    const result = toLocalInput(iso)
    // 09:00Z ở VN +07 = 16:00 cùng ngày, vẫn 2025-11-10
    expect(result).toMatch(/^2025-11-10T\d{2}:\d{2}$/)
  })

  test("toUTCISOString chuyển local sang ISO UTC", () => {
    const local = "2025-11-10T09:00"
    const result = toUTCISOString(local)
    expect(result).toMatch(/Z$/)
  })

  test("toLocalInput trả về '' khi input trống/không hợp lệ", () => {
    expect(toLocalInput("")).toBe("")
    expect(toLocalInput("not-a-date")).toBe("")
  })

  test("toUTCISOString trả về null khi input trống/không hợp lệ", () => {
    expect(toUTCISOString("")).toBeNull()
    expect(toUTCISOString("not-a-date")).toBeNull()
  })
})
