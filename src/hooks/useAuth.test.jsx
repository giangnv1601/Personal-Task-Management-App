import { renderHook, act } from '@testing-library/react'
import { useDispatch, useSelector } from 'react-redux'

import useAuth from './useAuth'

// Mock các thunk từ AuthSlice
import {
  registerThunk,
  loginThunk,
  logoutThunk,
  fetchUserProfileThunk,
  updateUserProfileThunk,
  changePasswordThunk,
} from '@/features/auth/AuthSlice.js'

// Jest mock module react-redux
jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

// Jest mock module AuthSlice
jest.mock('@/features/auth/AuthSlice.js', () => ({
  registerThunk: jest.fn(),
  loginThunk: jest.fn(),
  logoutThunk: jest.fn(),
  fetchUserProfileThunk: jest.fn(),
  // selector giả: đọc từ state.auth
  selectAuth: (state) => state.auth,
  selectAuthLoading: (state) => state.auth.loading,
  selectAuthError: (state) => state.auth.error,
  selectIsAuthenticated: (state) => !!state.auth.user,
}))

describe('useAuth hook (Unit)', () => {
  let mockDispatch

  beforeEach(() => {
    mockDispatch = jest.fn()

    // useDispatch trả về dispatch giả
    useDispatch.mockReturnValue(mockDispatch)

    // State giả cho selector
    const mockState = {
      auth: {
        user: { id: 'user-1', email: 'test@example.com' },
        loading: false,
        error: null,
        accessToken: 'token-123',
      },
    }

    // useSelector gọi selector với state giả
    useSelector.mockImplementation((selector) => selector(mockState))

    jest.clearAllMocks()
  })

  test('trả về auth state + cờ loading/error/isAuthenticated đúng', () => {
    const { result } = renderHook(() => useAuth())

    // các field lấy từ selectAuth (spread ...auth)
    expect(result.current.user).toEqual({
      id: 'user-1',
      email: 'test@example.com',
    })
    expect(result.current.accessToken).toBe('token-123')

    // các field lấy từ selectAuthLoading/selectAuthError/selectIsAuthenticated
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isAuthenticated).toBe(true)
  })

  test('register gọi dispatch(registerThunk(payload))', () => {
    const thunkResult = { type: 'auth/register/pending' }
    registerThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useAuth())

    const payload = { email: 'test@example.com', password: '123456' }

    act(() => {
      result.current.register(payload)
    })

    expect(registerThunk).toHaveBeenCalledWith(payload)
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('login gọi dispatch(loginThunk(payload))', () => {
    const thunkResult = { type: 'auth/login/pending' }
    loginThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useAuth())

    const payload = { email: 'test@example.com', password: '123456' }

    act(() => {
      result.current.login(payload)
    })

    expect(loginThunk).toHaveBeenCalledWith(payload)
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('logout gọi dispatch(logoutThunk())', () => {
    const thunkResult = { type: 'auth/logout/pending' }
    logoutThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.logout()
    })

    expect(logoutThunk).toHaveBeenCalled()
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })

  test('fetchProfile gọi dispatch(fetchUserProfileThunk(userId))', () => {
    const thunkResult = { type: 'auth/fetchProfile/pending' }
    fetchUserProfileThunk.mockReturnValue(thunkResult)

    const { result } = renderHook(() => useAuth())

    act(() => {
      result.current.fetchProfile('user-1')
    })

    expect(fetchUserProfileThunk).toHaveBeenCalledWith('user-1')
    expect(mockDispatch).toHaveBeenCalledWith(thunkResult)
  })
})
