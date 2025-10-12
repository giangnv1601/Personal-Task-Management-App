/* eslint-disable no-undef */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
jest.mock('../../../api/supabaseClient.js', () => ({
  __esModule: true,
  default: {
    auth: {
      signUp: jest.fn(),
    },
  },
}))
import supabase from '../../../api/supabaseClient.js'
import RegisterPage from '../../../features/auth/RegisterPage.jsx'

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
