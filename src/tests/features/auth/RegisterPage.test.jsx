/* eslint-disable no-undef */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
// Mock sonner toast
jest.mock('sonner', () => ({
  Toaster: () => null,
  toast: Object.assign(jest.fn(), {
    success: jest.fn(),
    error: jest.fn(),
  }),
}))
import { toast } from 'sonner'

// Mock supabase client
jest.mock('@/api/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    auth: {
      signUp: jest.fn(),
    },
  },
}))
import supabase from '@/api/supabaseClient.js'
import LoginPage from '@/features/auth/LoginPage.jsx'
import RegisterPage from '@/features/auth/RegisterPage.jsx'



// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const renderUI = () =>
  render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  )

beforeEach(() => {
  jest.clearAllMocks()
})

test('render form & submit thành công -> toast.success + navigate /login', async () => {
  supabase.auth.signUp.mockResolvedValue({ data: {}, error: null })

  renderUI()
  const u = userEvent.setup()

  // ACTIONS
  await u.type(screen.getByLabelText(/Email/i), 'user@example.com')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password123!')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'Password123!')
  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  await u.click(screen.getByRole('button', { name: /Đăng ký/i }))

  // ASSERTIONS
  await waitFor(() => {
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'Password123!',
    })
  })
  expect(toast.success).toHaveBeenCalledWith('Đăng ký thành công!')
  expect(mockNavigate).toHaveBeenCalledWith('/login', expect.objectContaining({
    replace: true,
    state: { notice: 'Đăng ký thành công!' }
  }))
})

test('email đã tồn tại -> toast.error, không điều hướng', async () => {
  supabase.auth.signUp.mockResolvedValue({
    data: {},
    error: { status: 400, message: 'User already registered' }
  })

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

  expect(submitBtn).toBeDisabled()

  await u.click(screen.getByLabelText(/Tôi đồng ý/i))
  expect(submitBtn).not.toBeDisabled()

  // Giả lập promise signUp chưa hoàn tất để kiểm tra trạng thái loading
  let resolveSignUp
  const signUpPromise = new Promise((res) => { resolveSignUp = res })
  supabase.auth.signUp.mockReturnValue(signUpPromise)

  await u.type(screen.getByLabelText(/Email/i), 'submit@checking.test')
  await u.type(screen.getByLabelText(/^Mật khẩu$/i), 'Password123!')
  await u.type(screen.getByLabelText(/Nhập lại mật khẩu/i), 'Password123!')

  await u.click(submitBtn)
  expect(submitBtn).toBeDisabled()

  // Giả lập hoàn tất gửi
  resolveSignUp({ data: {}, error: null })
  await waitFor(() => expect(toast.success).toHaveBeenCalled())
})

test('link Đăng nhập điều hướng tới /login bằng react-router Link', async () => {
  const u = userEvent.setup()

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </MemoryRouter>
  )

  const loginLink = screen.getByText(/Đăng nhập/i)
  await u.click(loginLink)
  expect(await screen.findByText(/Login|Đăng nhập/i)).toBeInTheDocument()
})
