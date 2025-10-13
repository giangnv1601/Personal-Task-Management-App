import { useDispatch, useSelector } from 'react-redux'

import {
  loginThunk,              // Thunk đăng nhập
  logoutThunk,             // Thunk đăng xuất
  selectAuth,              // Selector: toàn bộ nhánh auth
  selectAuthLoading,       // Selector: cờ loading
  selectAuthError,         // Selector: thông báo lỗi
  selectIsAuthenticated,   // Selector: đã đăng nhập hay chưa
} from '@/features/auth/AuthSlice.js'

export default function useAuth() {
  const dispatch = useDispatch()

  // Đọc dữ liệu từ Redux store thông qua các selector
  const auth = useSelector(selectAuth)
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  // Hàm gọi các thunk (hành động bất đồng bộ)
  const login = (payload) => dispatch(loginThunk(payload))  // payload: { email, password, remember }
  const logout = () => dispatch(logoutThunk())

  // Trả về cho component sử dụng
  return {
    ...auth,         // gồm: user, access_token, refresh_token, remember, isAuthenticated, loading, error (nếu slice có)
    loading,
    error,
    isAuthenticated,
    login,
    logout,
  }
}
