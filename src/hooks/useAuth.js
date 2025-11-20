import { useDispatch, useSelector } from 'react-redux'
import {
  registerThunk,
  loginThunk,
  logoutThunk,
  fetchUserProfileThunk,
  selectAuth,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '@/features/auth/AuthSlice.js'

export default function useAuth() {
  const dispatch = useDispatch()

  const auth = useSelector(selectAuth)
  const loading = useSelector(selectAuthLoading)
  const error = useSelector(selectAuthError)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  const register = (payload) => dispatch(registerThunk(payload))
  const login = (payload) => dispatch(loginThunk(payload))
  const logout = () => dispatch(logoutThunk())
  const fetchProfile = (userId) => dispatch(fetchUserProfileThunk(userId))

  return {
    ...auth,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    fetchProfile,
  }
}
