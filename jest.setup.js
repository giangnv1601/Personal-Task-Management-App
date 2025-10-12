/* eslint-disable no-undef */
import '@testing-library/jest-dom'

// Chạy 1 lần trước toàn bộ các test
beforeAll(() => {
  // Ví dụ mock fetch toàn cục nếu cần
  global.fetch = jest.fn()
  // Ghi đè console.error, warn, log cho toàn bộ test
  console.error = jest.fn()
  console.warn = jest.fn()
  console.log = jest.fn()
})

// Chạy sau mỗi test
afterEach(() => {
  // reset mỗi test để tránh ảnh hưởng lẫn nhau
  if (global.fetch && typeof global.fetch.mockReset === 'function') {
    global.fetch.mockReset()
  }
  // Xóa lịch sử call mock
  jest.clearAllMocks()
  // Reset cache của module require/import
  jest.resetModules()
  // Restore tất cả mock (bao gồm mock function, mock class)
  jest.restoreAllMocks()
})