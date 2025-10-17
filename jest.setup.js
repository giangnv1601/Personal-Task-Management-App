/* eslint-disable no-undef */
import '@testing-library/jest-dom'

afterEach(() => {
  // xóa lịch sử call/spies giữa các test
  jest.clearAllMocks()      
})
