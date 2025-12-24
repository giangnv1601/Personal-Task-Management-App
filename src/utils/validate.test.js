import { validateText, validateDeadline, isValidUrl } from './validate'

describe('validateText', () => {
  test('trả về true khi không có min/max (mặc định)', () => {
    expect(validateText('abc')).toBe(true)
    expect(validateText('   abc   ')).toBe(true)
  })

  test('trả về lỗi khi ngắn hơn min', () => {
    const result = validateText('ab', { min: 3 })
    expect(result).toBe('Tối thiểu 3 ký tự')
  })

  test('trả về lỗi khi dài hơn max', () => {
    const result = validateText('abcdef', { max: 5 })
    expect(result).toBe('Tối đa 5 ký tự')
  })

  test('trim text trước khi tính length', () => {
    const result = validateText('  ab  ', { min: 3 })
    expect(result).toBe('Tối thiểu 3 ký tự')
  })

  test('trả về true khi trong khoảng min/max', () => {
    const result = validateText('abcd', { min: 2, max: 5 })
    expect(result).toBe(true)
  })
})

describe('validateDeadline', () => {
  const REAL_DATE_NOW = Date.now

  afterEach(() => {
    // reset Date.now sau mỗi test
    Date.now = REAL_DATE_NOW
  })

  test('trả về lỗi khi không có giá trị', () => {
    expect(validateDeadline(null)).toBe('Vui lòng chọn deadline')
    expect(validateDeadline('')).toBe('Vui lòng chọn deadline')
  })

  test('trả về lỗi khi date không hợp lệ', () => {
    expect(validateDeadline('not-a-date')).toBe('Định dạng deadline không hợp lệ')
  })

  test('trả về lỗi khi deadline ở quá khứ và không cho phép allowPast', () => {
    // Đóng băng "hiện tại"
    Date.now = () => new Date('2024-01-02T12:00:00.000Z').getTime()

    const past = '2024-01-01T12:00:00.000Z'
    const result = validateDeadline(past, { allowPast: false })

    expect(result).toBe('Deadline phải ở tương lai')
  })

  test('trả về true khi deadline ở quá khứ nhưng allowPast = true', () => {
    Date.now = () => new Date('2024-01-02T12:00:00.000Z').getTime()

    const past = '2024-01-01T12:00:00.000Z'
    const result = validateDeadline(past, { allowPast: true })

    expect(result).toBe(true)
  })

  test('trả về true khi deadline ở tương lai', () => {
    Date.now = () => new Date('2024-01-01T12:00:00.000Z').getTime()

    const future = '2024-01-02T12:00:00.000Z'
    const result = validateDeadline(future)

    expect(result).toBe(true)
  })
})

describe('isValidUrl', () => {
  test('trả về true nếu chuỗi rỗng hoặc chỉ whitespace', () => {
    expect(isValidUrl('')).toBe(true)
    expect(isValidUrl('   ')).toBe(true)
    expect(isValidUrl(null)).toBe(true)
    expect(isValidUrl(undefined)).toBe(true)
  })

  test('trả về true cho URL hợp lệ', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://localhost:3000/path?query=1')).toBe(true)
  })

  test('trả về lỗi cho URL không hợp lệ', () => {
    expect(isValidUrl('not-a-url')).toBe('URL không hợp lệ')
    expect(isValidUrl('ht!tp://bad')).toBe('URL không hợp lệ')
  })
})
