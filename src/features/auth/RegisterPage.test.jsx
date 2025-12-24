 
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
// mock sonner toast
jest.mock('sonner', () => ({
  Toaster: () => null,
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
import { toast } from 'sonner'

// mock useAuth hook (we'll control mockAuth.register in tests)
const mockAuth = { register: jest.fn() }
jest.mock('@/hooks/useAuth.js', () => ({
  __esModule: true,
  default: () => mockAuth,
}))

// mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import RegisterPage from '@/features/auth/RegisterPage.jsx'

const renderUI = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )

beforeEach(() => {
  jest.clearAllMocks()
})

test('hiển thị form và đăng ký thành công → toast.success + điều hướng tới /login', async () => {
  mockAuth.register.mockResolvedValue({ meta: { requestStatus: 'fulfilled' }, payload: {} })

  renderUI()
  const u = userEvent.setup()

  await u.type(screen.getByLabelText(/Email/i), 'user@example.com')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password123!')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'Password123!')
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  await u.click(screen.getByRole('button', { name: /Đăng ký/i }))

  await waitFor(() => {
    expect(mockAuth.register).toHaveBeenCalledWith({ email: 'user@example.com', password: 'Password123!' })
  })
  expect(toast.success).toHaveBeenCalledWith('Đăng ký thành công! Vui lòng đăng nhập.')
  expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({
    replace: true,
    state: { notice: 'Đăng ký thành công!' },
  }))
})

test('email đã tồn tại → toast.error và không điều hướng', async () => {
  mockAuth.register.mockResolvedValue({ meta: { requestStatus: 'rejected' }, payload: 'User already registered' })

  renderUI()
  const u = userEvent.setup()

  await u.type(screen.getByLabelText(/Email/i), 'dup@example.com')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password123!')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'Password123!')
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  await u.click(screen.getByRole('button', { name: /Đăng ký/i }))

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('User already registered')
  })
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('hiển thị lỗi validate khi submit form rỗng', async () => {
  renderUI()
  const u = userEvent.setup()

  // tick agree để nút không bị disabled
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  await u.click(screen.getByRole('button', { name: /Đăng ký/i }))

  expect(await screen.findByText(/Email không được để trống/i)).toBeInTheDocument()
  expect(await screen.findByText(/Vui lòng nhập lại mật khẩu/i)).toBeInTheDocument()
})

test('hiển thị lỗi khi mật khẩu không đủ mạnh hoặc confirm không khớp', async () => {
  renderUI()
  const u = userEvent.setup()

  await u.type(screen.getByLabelText(/Email/i), 'valid@example.com')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'weak')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'different')
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  await u.click(screen.getByRole('button', { name: /Đăng ký/i }))

  expect(await screen.findByText(/Ít nhất 8 ký tự/i)).toBeInTheDocument()
  expect(await screen.findByText(/Mật khẩu không khớp/i)).toBeInTheDocument()
})

test('nút bị vô hiệu hoá khi chưa đồng ý và bị disable trong lúc gửi', async () => {
  renderUI()
  const u = userEvent.setup()
  const submitBtn = screen.getByRole('button', { name: /Đăng ký/i })

  // initially disabled because not agreed
  expect(submitBtn).toBeDisabled()

  // check agree -> enabled
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  expect(submitBtn).not.toBeDisabled()

  // prepare a pending promise for register to keep isSubmitting=true
  let resolveRegister
  const pending = new Promise((res) => { resolveRegister = res })
  mockAuth.register.mockReturnValue(pending)

  await u.type(screen.getByLabelText(/Email/i), 'submit@checking.test')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password123!')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'Password123!')

  await u.click(submitBtn)
  expect(submitBtn).toBeDisabled()

  // resolve and wait for success handling
  resolveRegister({ meta: { requestStatus: 'fulfilled' }, payload: {} })
  await waitFor(() => expect(toast.success).toHaveBeenCalled())
})

test('link "Đăng nhập" điều hướng tới /login bằng react-router Link', async () => {
  const u = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/login" element={<div data-testid="login-page">Login page</div>} />
      </Routes>
    </MemoryRouter>
  )

  const loginLink = screen.getByText(/Đăng nhập/i)
  await u.click(loginLink)
  expect(await screen.findByTestId('login-page')).toBeInTheDocument()
})

test('đăng ký bị lỗi (reject) → bắt lỗi và hiển thị toast', async () => {
  mockAuth.register.mockRejectedValue(new Error('Server error'))

  renderUI()
  const u = userEvent.setup()

  await u.type(screen.getByLabelText(/Email/i), 'err@example.com')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password123!')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'Password123!')
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  await u.click(screen.getByRole('button', { name: /Đăng ký/i }))

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Server error'))
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('bấm checkbox "Tôi đồng ý" sẽ bật nút gửi', async () => {
  renderUI()
  const u = userEvent.setup()
  const submitBtn = screen.getByRole('button', { name: /Đăng ký/i })

  // initially disabled
  expect(submitBtn).toBeDisabled()

  // click agree -> should enable submit
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  expect(submitBtn).not.toBeDisabled()
})
