import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { 
  loginUser, 
  logoutUser, 
  signupUser, 
  getUserProfile, 
  getMe,
  updateUserProfile,
  uploadAvatar,
  changePassword
 } from '@/api/userApi.js'

// Khối lưu phiên
const KS = { 
  AT: 'access_token', 
  RT: 'refresh_token', 
  USER: 'user', 
  REMEMBER: 'remember_login' 
}

const getStore = (remember) => (remember === 'local' ? localStorage : sessionStorage)

// Lưu token/user vào localStorage nếu “nhớ đăng nhập”, ngược lại sessionStorage
const persistSession = ({ remember, access_token, refresh_token, user }) => {
  const store = getStore(remember)
  if (remember) localStorage.setItem(KS.REMEMBER, remember)
  access_token ? store.setItem(KS.AT, access_token) : store.removeItem(KS.AT)
  refresh_token ? store.setItem(KS.RT, refresh_token) : store.removeItem(KS.RT)
  user ? store.setItem(KS.USER, JSON.stringify(user)) : store.removeItem(KS.USER)
}

// Xoá token/user ở cả hai kho → đảm bảo logout sạch
const clearAllSessions = () => {
  ;[localStorage, sessionStorage].forEach((s) => {
    s.removeItem(KS.AT); s.removeItem(KS.RT); s.removeItem(KS.USER)
  })
  localStorage.removeItem(KS.REMEMBER)
}

// Đọc lại phiên khi app mở (phục hồi user, token, remember, isAuthenticated)
const loadInitial = () => {
  const remembered = localStorage.getItem(KS.REMEMBER) // 'local' | 'session' | null
  const primary = remembered === 'session' ? sessionStorage : localStorage
  const fallback = remembered === 'session' ? localStorage : sessionStorage

  const at = primary.getItem(KS.AT) || fallback.getItem(KS.AT)
  const rt = primary.getItem(KS.RT) || fallback.getItem(KS.RT)
  const usrStr = primary.getItem(KS.USER) || fallback.getItem(KS.USER)

  let user = null
  try {
    user = usrStr ? JSON.parse(usrStr) : null
  } catch {
    user = null
  }


  return { user, access_token: at || null, refresh_token: rt || null,
           remember: remembered || (at ? (primary === localStorage ? 'local' : 'session') : null),
           isAuthenticated: !!at }
}

// Thunk gọi API
// payload: { email, password, remember (boolean) }
// Gọi loginUser. Thành công → trả dữ liệu + gắn remember: 'local' | 'session'.
export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password, remember }, { rejectWithValue }) => {
    const res = await loginUser({ email, password })
    if (!res.ok) return rejectWithValue(res.error || 'Đăng nhập thất bại')
    return { ...res.data, remember: remember ? 'local' : 'session' }
  }
)

// Gọi logoutUser(access_token). Dù server fail vẫn coi là thoát cục bộ.
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    const { auth } = getState()
    const token = auth?.access_token
    if (!token) return { ok: true }
    const res = await logoutUser(token)
    if (!res.ok) return rejectWithValue(res.error || 'Đăng xuất thất bại')
    return { ok: true }
  }
)

// Thunk đăng ký
export const registerThunk = createAsyncThunk(
  'auth/register',
  async ({ email, password, options }, { rejectWithValue }) => {
    const res = await signupUser({ email, password, options })
    if (!res.ok) return rejectWithValue(res.error || 'Đăng ký thất bại')

    const { user } = res.data || {}
    return { user }
  }
)

// Thunk lấy thông tin User
export const fetchUserProfileThunk = createAsyncThunk(
  'auth/fetchProfile',
  async (userId, { getState, rejectWithValue }) => {
    const state = getState()
    const token = state.auth.access_token
    const id = userId || state?.auth?.user?.id

    if (!id) return rejectWithValue('Không có userId để lấy profile')
    if (!token) return rejectWithValue('Không có token xác thực')

    try {
      const [authRes, profileRes] = await Promise.all([
        getMe(token),
        getUserProfile(id)
      ])

      if (!authRes.ok) {
        return rejectWithValue(authRes.error || 'Không lấy được thông tin Auth')
      }

      const authUser = authRes.data
      const publicProfile = (profileRes.ok && profileRes.data) ? profileRes.data : {}

      const finalUser = {
        id: publicProfile.id,
        email: publicProfile.email,
        full_name: publicProfile.full_name || '',
        created_at: publicProfile.created_at || authUser.created_at,
        avatar: authUser.user_metadata?.avatar_url || '',
        
        ...publicProfile
      }

      return finalUser

    } catch (error) {
      return rejectWithValue(error.message || 'Lỗi hệ thống khi lấy profile')
    }
  }
)

// Thunk cập nhập profile
export const updateUserProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async ({ userId, updates }, { getState, rejectWithValue }) => {
    const state = getState()
    const token = state.auth.access_token
    const refreshToken = state.auth.refresh_token
    const currentAvatar = state.auth?.user?.avatar || ''

    if (!userId) return rejectWithValue('Không có userId để cập nhật profile')
    if (!token) return rejectWithValue('Không có token xác thực')

    try {
      let newAvatarUrl = null

      // Upload Avatar (Storage) + update auth.user_metadata.avatar_url
      if (updates.avatarFile) {
        const uploadRes = await uploadAvatar(
          userId,
          updates.avatarFile,
          token,
          refreshToken
        )

        if (!uploadRes.ok) {
          return rejectWithValue(uploadRes.error || 'Lỗi khi upload ảnh đại diện')
        }

        newAvatarUrl = uploadRes.data
      }

      // Cập nhập full_name vào bảng users
      const dbUpdates = { ...updates }
      delete dbUpdates.avatarFile

      const updateRes = await updateUserProfile(userId, dbUpdates)
      if (!updateRes.ok) {
        return rejectWithValue(updateRes.error || 'Lỗi khi cập nhật thông tin người dùng')
      }

      // Trả về dữ liệu cho hiển thị (không overwrite avatar nếu không upload)
      return {
        ...updateRes.data,
        avatar: newAvatarUrl ?? currentAvatar,
      }
    } catch (error) {
      return rejectWithValue(error.message || 'Lỗi hệ thống khi cập nhật profile')
    }
  }
)

// Thunk đổi mật khẩu
export const changePasswordThunk = createAsyncThunk(
  "auth/changePassword",
  async ({ currentPassword, newPassword }, { getState, rejectWithValue }) => {
    const state = getState()
    const email = state.auth?.user?.email

    const res = await changePassword({ email, currentPassword, newPassword })
    if (!res.ok) return rejectWithValue(res.error || "Đổi mật khẩu thất bại")

    // trả token mới
    return { ...res.data }
  }
)


// Nạp state ban đầu từ loadInitial()
const init = loadInitial()
 
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: init.user,
    access_token: init.access_token,
    refresh_token: init.refresh_token,
    remember: init.remember, // 'local' | 'session' | null
    isAuthenticated: init.isAuthenticated,
    loading: false,
    error: null,
  },
  reducers: {
    // Đồng bộ lại từ storage khi cần
    hydrateFromStorage: (state) => { 
      const now = loadInitial()
      Object.assign(state, {
        user: now.user,
        access_token: now.access_token,
        refresh_token: now.refresh_token,
        remember: now.remember,
        isAuthenticated: now.isAuthenticated,
      })
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload?.user ?? null
        state.access_token = action.payload?.access_token ?? null
        state.refresh_token = action.payload?.refresh_token ?? null
        state.remember = action.payload?.remember // 'local' | 'session'
        state.isAuthenticated = !!state.access_token
        // Lưu vào localStorage hoặc sessionStorage tuỳ remember
        persistSession({
          remember: state.remember,
          access_token: state.access_token,
          refresh_token: state.refresh_token,
          user: state.user,
        })
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Đăng nhập thất bại'
      })

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.access_token = null
        state.refresh_token = null
        state.isAuthenticated = false
        state.remember = null
        clearAllSessions()
      })
      .addCase(logoutThunk.rejected, (state, action) => {
        state.loading = false
        state.user = null
        state.access_token = null
        state.refresh_token = null
        state.isAuthenticated = false
        state.remember = null
        clearAllSessions()
        state.error = action.payload || 'Đăng xuất thất bại (đã xoá phiên cục bộ)'
      })

    // Register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      // extraReducers trong AuthSlice.js
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload?.user ?? null
        state.access_token = null
        state.refresh_token = null
        state.isAuthenticated = false
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Đăng ký thất bại'
      })
      // Get User Profile
      .addCase(fetchUserProfileThunk.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchUserProfileThunk.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload ?? state.user
        // persist updated user to storage if authenticated
        persistSession({
          remember: state.remember,
          access_token: state.access_token,
          refresh_token: state.refresh_token,
          user: state.user,
        })
      })
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Không thể tải profile'
      })
    // Update User Profile
    builder
      .addCase(updateUserProfileThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserProfileThunk.fulfilled, (state, action) => {
        state.loading = false
        // merge vào user hiện tại
        state.user = { ...(state.user || {}), ...(action.payload || {}) }

        // persist lại storage (nếu đang authenticated)
        persistSession({
          remember: state.remember,
          access_token: state.access_token,
          refresh_token: state.refresh_token,
          user: state.user,
        })
      })
      .addCase(updateUserProfileThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Cập nhật profile thất bại'
      })
    // Change Password
    builder
      .addCase(changePasswordThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(changePasswordThunk.fulfilled, (state, action) => {
        state.loading = false

        // cập nhật token
        state.access_token = action.payload?.access_token ?? state.access_token
        state.refresh_token = action.payload?.refresh_token ?? state.refresh_token
        state.isAuthenticated = !!state.access_token

        persistSession({
          remember: state.remember,
          access_token: state.access_token,
          refresh_token: state.refresh_token,
          user: state.user,
        })
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || "Đổi mật khẩu thất bại"
      })
  },
})
 
export const { hydrateFromStorage } = authSlice.actions

// Selectors
export const selectAuth = (state) => state.auth
export const selectAuthUser = (state) => state.auth.user
export const selectAuthLoading = (state) => state.auth.loading
export const selectAuthError = (state) => state.auth.error
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated

// Export reducer để gắn vào store
export default authSlice.reducer
