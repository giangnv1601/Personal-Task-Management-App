import { useDispatch, useSelector } from 'react-redux'

import {
  registerThunk,
  loginThunk,
  logoutThunk,
  selectAuth,
  selectAuthLoading,
  selectAuthError,        
  selectIsAuthenticated,
} from '@/features/auth/AuthSlice.js'

export default function useAuth() {
  const dispatch = useDispatch()

  // Đọc dữ liệu từ Redux store thông qua các selector
  const auth = useSelector(selectAuth)
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Hàm gọi các thunk (hành động bất đồng bộ)
  const register = (payload) => dispatch(registerThunk(payload))
  const login = (payload) => dispatch(loginThunk(payload))
  const logout = () => dispatch(logoutThunk())

  // Trả về cho component sử dụng
  return {
    ...auth,         // gồm: user, access_token, refresh_token, remember, isAuthenticated, loading, error (nếu slice có)
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
  }
}
