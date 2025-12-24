import {
  toLocalInput,
  toUTCISOString,
  formatDateTime,
  formatRelativeTime,
  isDeadlineBeforeOrEqual,
} from './date'

describe('toLocalInput', () => {
  test('trả về chuỗi rỗng khi input null/undefined/empty', () => {
    expect(toLocalInput(null)).toBe('')
    expect(toLocalInput(undefined)).toBe('')
    expect(toLocalInput('')).toBe('')
  })

  test('trả về chuỗi rỗng khi Date không hợp lệ', () => {
    expect(toLocalInput('invalid-date')).toBe('')
  })

  test('convert Date local -> "YYYY-MM-DDTHH:mm"', () => {
    // Tạo Date bằng constructor (year, month, day, hour, minute)
    // để tránh phụ thuộc timezone khi parse ISO string
    const d = new Date(2024, 0, 2, 3, 4) // 2024-01-02 03:04 local

    const result = toLocalInput(d)

    expect(result).toBe('2024-01-02T03:04')
  })
})

describe('toUTCISOString', () => {
  test('trả về null khi input falsy', () => {
    expect(toUTCISOString('')).toBeNull()
    expect(toUTCISOString(null)).toBeNull()
  })

  test('trả về null khi date string không hợp lệ', () => {
    expect(toUTCISOString('not-a-date')).toBeNull()
  })

  test('trả về ISO string hợp lệ khi input đúng định dạng local', () => {
    const iso = toUTCISOString('2024-01-02T10:30')

    // chỉ check format chung để tránh phụ thuộc timezone cụ thể
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00\.000Z$/)
  })
})

describe('formatDateTime', () => {
  test('trả về "—" khi input falsy hoặc không hợp lệ', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
    expect(formatDateTime('')).toBe('—')
    expect(formatDateTime('not-a-date')).toBe('—')
  })

  test('format Date thành "DD/MM/YYYY HH:mm"', () => {
    const d = new Date(2024, 0, 2, 3, 4) // 02/01/2024 03:04

    const result = formatDateTime(d)

    expect(result).toBe('02/01/2024 03:04')
  })
})

describe('formatRelativeTime', () => {
  // Dùng fake timers để "đóng băng" thời gian hiện tại
  beforeAll(() => {
    jest.useFakeTimers()
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  test('trả về "—" khi input falsy hoặc không hợp lệ', () => {
    expect(formatRelativeTime(null)).toBe('—')
    expect(formatRelativeTime(undefined)).toBe('—')
    expect(formatRelativeTime('')).toBe('—')
    expect(formatRelativeTime('not-a-date')).toBe('—')
  })

  test('trả về "vừa xong" khi thời gian gần như bằng nhau', () => {
    const now = new Date('2024-01-01T12:00:00.000Z')
    jest.setSystemTime(now)

    expect(formatRelativeTime('2024-01-01T12:00:00.000Z')).toBe('vừa xong')
  })

  test('trả về "x giây trước" khi trong vòng 1 phút', () => {
    const now = new Date('2024-01-01T12:00:00.000Z')
    jest.setSystemTime(now)

    // 30 giây trước
    expect(formatRelativeTime('2024-01-01T11:59:30.000Z')).toBe('30 giây trước')
  })

  test('trả về "x phút trước" khi trong vòng 1 giờ', () => {
    const now = new Date('2024-01-01T12:00:00.000Z')
    jest.setSystemTime(now)

    // 10 phút trước
    expect(formatRelativeTime('2024-01-01T11:50:00.000Z')).toBe('10 phút trước')
  })

  test('trả về "x giờ trước" khi trong vòng 24 giờ', () => {
    const now = new Date('2024-01-02T12:00:00.000Z')
    jest.setSystemTime(now)

    // 5 giờ trước
    expect(formatRelativeTime('2024-01-02T07:00:00.000Z')).toBe('5 giờ trước')
  })

  test('trả về "hôm qua" khi khác 1 ngày', () => {
    const now = new Date('2024-01-02T12:00:00.000Z')
    jest.setSystemTime(now)

    expect(formatRelativeTime('2024-01-01T10:00:00.000Z')).toBe('hôm qua')
  })

  test('trả về "x ngày trước" khi trong vòng 7 ngày', () => {
    const now = new Date('2024-01-08T12:00:00.000Z')
    jest.setSystemTime(now)

    // 3 ngày trước
    expect(formatRelativeTime('2024-01-05T12:00:00.000Z')).toBe('3 ngày trước')
  })

  test('hiện tại sẽ trả undefined nếu hơn 7 ngày trước (hành vi hiện tại của hàm)', () => {
    const now = new Date('2024-01-10T12:00:00.000Z')
    jest.setSystemTime(now)

    const result = formatRelativeTime('2023-12-20T12:00:00.000Z')
    expect(result).toBeUndefined() // thể hiện đúng behavior hiện tại (có thể sau này bạn muốn đổi thành "—")
  })

  test('trả về "trong vài giây" khi thời gian trong vài giây tới', () => {
    const now = new Date('2024-01-01T12:00:00.000Z')
    jest.setSystemTime(now)

    const future = '2024-01-01T12:00:05.000Z' // 5 giây sau
    const result = formatRelativeTime(future)

    expect(result).toBe('trong vài giây')
  })

  test('trả về "trong X phút" khi thời gian trong vòng 1 giờ tới', () => {
    const now = new Date('2024-01-01T12:00:00.000Z')
    jest.setSystemTime(now)

    const future = '2024-01-01T12:10:00.000Z' // 10 phút sau
    const result = formatRelativeTime(future)

    expect(result).toBe('trong 10 phút')
  })

  test('trả về "trong X giờ" khi thời gian trong vòng 24 giờ tới', () => {
    const now = new Date('2024-01-01T08:00:00.000Z')
    jest.setSystemTime(now)

    const future = '2024-01-01T11:00:00.000Z' // 3 giờ sau
    const result = formatRelativeTime(future)

    expect(result).toBe('trong 3 giờ')
  })

  test('trả về "trong X ngày" khi thời gian ở tương lai xa hơn 1 ngày', () => {
    const now = new Date('2024-01-01T12:00:00.000Z')
    jest.setSystemTime(now)

    const future = '2024-01-04T12:00:00.000Z' // 3 ngày sau
    const result = formatRelativeTime(future)

    expect(result).toBe('trong 3 ngày')
  })
})

describe('isDeadlineBeforeOrEqual', () => {
  test('false nếu thiếu deadline hoặc yyyyMmDd', () => {
    expect(isDeadlineBeforeOrEqual(null, '2024-01-01')).toBe(false)
    expect(isDeadlineBeforeOrEqual('2024-01-01T00:00:00.000Z', null)).toBe(false)
  })

  test('true khi deadline cùng ngày với yyyyMmDd', () => {
    const deadline = '2024-01-02T15:30:00.000Z'
    const dateStr = '2024-01-02'

    expect(isDeadlineBeforeOrEqual(deadline, dateStr)).toBe(true)
  })

  test('true khi deadline trước yyyyMmDd', () => {
    const deadline = '2024-01-01T23:59:59.000Z'
    const dateStr = '2024-01-02'

    expect(isDeadlineBeforeOrEqual(deadline, dateStr)).toBe(true)
  })

  test('false khi deadline sau yyyyMmDd', () => {
    const deadline = '2024-01-03T00:00:00.000Z'
    const dateStr = '2024-01-02'

    expect(isDeadlineBeforeOrEqual(deadline, dateStr)).toBe(false)
  })
})
