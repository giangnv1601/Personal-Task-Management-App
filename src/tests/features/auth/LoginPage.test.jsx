/* eslint-disable no-undef */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
// mock sonner toast
jest.mock('sonner', () => ({
  Toaster: () => null,
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
import { toast } from 'sonner'

// mock useAuth hook
const mockAuth = { login: jest.fn() }
jest.mock('@/hooks/useAuth.js', () => ({
  __esModule: true,
  default: () => mockAuth,
}))

// mock react-router hooks (useNavigate / useLocation)
const mockNavigate = jest.fn()
const mockLocation = { state: undefined }
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

import LoginPage from '@/features/auth/LoginPage.jsx'

beforeEach(() => {
  jest.clearAllMocks()
  // reset location state default
  mockLocation.state = undefined
})

test('hiển thị form và đăng nhập thành công → toast + điều hướng tới /dashboard', async () => {
  mockAuth.login.mockResolvedValue({ meta: { requestStatus: 'fulfilled' }, payload: {} })

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'user@example.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'Password123!')
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  await waitFor(() => expect(mockAuth.login).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'Password123!',
    remember: false,
  }))

  expect(toast.success).toHaveBeenCalledWith('Đăng nhập thành công!')
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
})

test('điều hướng về trang trước nếu có location.state.from', async () => {
  mockAuth.login.mockResolvedValue({ meta: { requestStatus: 'fulfilled' }, payload: {} })
  mockLocation.state = { from: { pathname: '/tasks' } }

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'a@b.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'Password123!')
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/tasks', { replace: true }))
})

test('hiển thị lỗi server khi đăng nhập bị từ chối và hiện lỗi trường', async () => {
  mockAuth.login.mockResolvedValue({ meta: { requestStatus: 'rejected' }, payload: 'Invalid credentials' })

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'bad@x.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'badpass')
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  // toast.error called with message (component catches and toasts)
  await waitFor(() => expect(toast.error).toHaveBeenCalled())

  // setError should render message under email/password inputs
  expect(await screen.findAllByText(/Invalid credentials/i)).not.toHaveLength(0)
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('validate: các trường bắt buộc', async () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  expect(await screen.findByText(/Email không được để trống/i)).toBeInTheDocument()
  expect(await screen.findByText(/Mật khẩu không được để trống/i)).toBeInTheDocument()
})

test('nút gửi bị vô hiệu hoá khi đang gửi (isSubmitting)', async () => {
  let resolveLogin
  const pending = new Promise((res) => { resolveLogin = res })
  mockAuth.login.mockReturnValue(pending)

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'wait@x.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'Password123!')
  const btn = screen.getByRole('button', { name: /Đăng nhập/i })

  await u.click(btn)
  expect(btn).toBeDisabled()

  // resolve pending login
  resolveLogin({ meta: { requestStatus: 'fulfilled' }, payload: {} })
  await waitFor(() => expect(toast.success).toHaveBeenCalled())
})

test('server trả object lỗi → hiển thị lỗi stringify và không điều hướng', async () => {
  mockAuth.login.mockResolvedValue({
    meta: { requestStatus: 'rejected' },
    payload: { code: 'AUTH_FAILED', msg: 'Invalid credentials', detail: 'bad' },
  })

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'obj@x.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'badpass')
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  // toast.error is called (component catches and toasts)
  await waitFor(() => expect(toast.error).toHaveBeenCalled())
  // the component stringifies object payload -> check for substring from payload
  expect(toast.error.mock.calls[0][0]).toEqual(expect.stringContaining('AUTH_FAILED'))
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('đăng nhập bị lỗi (reject) → bắt lỗi và hiển thị toast', async () => {
  mockAuth.login.mockRejectedValue(new Error('Network failure'))

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'throw@x.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'badpass')
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Network failure'))
  expect(mockNavigate).not.toHaveBeenCalled()
})

test('checkbox "Nhớ đăng nhập" được chọn → login được gọi với remember: true', async () => {
  mockAuth.login.mockResolvedValue({ meta: { requestStatus: 'fulfilled' }, payload: {} })

  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

  const u = userEvent.setup()
  await u.type(screen.getByLabelText(/Email/i), 'remember@x.com')
  await u.type(screen.getByLabelText(/Mật khẩu/i), 'Password123!')
  // check remember
  await u.click(screen.getByRole('checkbox'))
  await u.click(screen.getByRole('button', { name: /Đăng nhập/i }))

  await waitFor(() =>
    expect(mockAuth.login).toHaveBeenCalledWith({
      email: 'remember@x.com',
      password: 'Password123!',
      remember: true,
    })
  )
})