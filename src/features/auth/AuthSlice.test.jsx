import authReducer, {
  hydrateFromStorage,
  loginThunk,
  logoutThunk,
  registerThunk,
  fetchUserProfileThunk,
  selectAuth,
  selectAuthUser,
  selectAuthLoading,
  selectAuthError,
  selectIsAuthenticated,
} from '@/features/auth/AuthSlice.js'

import {
  loginUser,
  logoutUser,
  signupUser,
  getUserProfile,
} from '@/api/userApi.js'

// Mock toàn bộ API user
jest.mock('@/api/userApi.js', () => ({
  loginUser: jest.fn(),
  logoutUser: jest.fn(),
  signupUser: jest.fn(),
  getUserProfile: jest.fn(),
}))

// Tạo state ban đầu mẫu
const makeInitialState = () => ({
  user: null,
  access_token: null,
  refresh_token: null,
  remember: null,
  isAuthenticated: false,
  loading: false,
  error: null,
})

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

describe('authSlice – reducers & extraReducers', () => {
  test('initial state với storage rỗng', () => {
    const state = authReducer(undefined, { type: '@@INIT' })
    expect(state).toEqual(makeInitialState())
  })

  test('hydrateFromStorage đọc từ localStorage / sessionStorage (remember=session + JSON lỗi)', () => {
    // Giả lập: user đang nhớ đăng nhập bằng sessionStorage
    localStorage.setItem('remember_login', 'session')
    sessionStorage.setItem('access_token', 'session-token')
    sessionStorage.setItem('refresh_token', 'session-rt')
    // user bị hỏng JSON → rơi vào nhánh catch trong loadInitial
    sessionStorage.setItem('user', 'not-json')

    const prev = {
      ...makeInitialState(),
      user: { id: 'old' },
      access_token: 'old-token',
      refresh_token: 'old-rt',
      remember: 'local',
      isAuthenticated: true,
    }

    const next = authReducer(prev, hydrateFromStorage())

    expect(next.access_token).toBe('session-token')
    expect(next.refresh_token).toBe('session-rt')
    expect(next.remember).toBe('session')
    expect(next.isAuthenticated).toBe(true)
    // do JSON.parse lỗi nên user phải là null
    expect(next.user).toBeNull()
  })

  test('loginThunk.pending bật loading và clear error', () => {
    const prev = { ...makeInitialState(), loading: false, error: 'old error' }
    const next = authReducer(prev, { type: loginThunk.pending.type })

    expect(next.loading).toBe(true)
    expect(next.error).toBeNull()
  })

  test('loginThunk.fulfilled: set user, token, remember=local và persist vào localStorage', () => {
    const prev = makeInitialState()

    const payload = {
      user: { id: 'u1', email: 'test@example.com' },
      access_token: 'at-123',
      refresh_token: 'rt-123',
      remember: 'local',
    }

    const next = authReducer(prev, {
      type: loginThunk.fulfilled.type,
      payload,
    })

    expect(next.loading).toBe(false)
    expect(next.user).toEqual(payload.user)
    expect(next.access_token).toBe('at-123')
    expect(next.refresh_token).toBe('rt-123')
    expect(next.remember).toBe('local')
    expect(next.isAuthenticated).toBe(true)

    // kiểm tra persistSession: token/user nằm trong localStorage
    expect(localStorage.getItem('remember_login')).toBe('local')
    expect(localStorage.getItem('access_token')).toBe('at-123')
    expect(localStorage.getItem('refresh_token')).toBe('rt-123')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(payload.user)
    // sessionStorage không có token (chỉ dùng local)
    expect(sessionStorage.getItem('access_token')).toBeNull()
  })

  test('loginThunk.fulfilled: remember=session → token vào sessionStorage', () => {
    const prev = makeInitialState()

    const payload = {
      user: { id: 'u2', email: 'session@example.com' },
      access_token: 'sess-at',
      refresh_token: 'sess-rt',
      remember: 'session',
    }

    const next = authReducer(prev, {
      type: loginThunk.fulfilled.type,
      payload,
    })

    expect(next.remember).toBe('session')
    expect(next.isAuthenticated).toBe(true)

    // REMEMBER vẫn lưu ở localStorage
    expect(localStorage.getItem('remember_login')).toBe('session')
    // token lưu ở sessionStorage
    expect(sessionStorage.getItem('access_token')).toBe('sess-at')
    expect(sessionStorage.getItem('refresh_token')).toBe('sess-rt')
    expect(JSON.parse(sessionStorage.getItem('user'))).toEqual(payload.user)
  })

  test('loginThunk.rejected set error từ payload', () => {
    const prev = { ...makeInitialState(), loading: true }

    const next = authReducer(prev, {
      type: loginThunk.rejected.type,
      payload: 'Sai tài khoản hoặc mật khẩu',
    })

    expect(next.loading).toBe(false)
    expect(next.error).toBe('Sai tài khoản hoặc mật khẩu')
  })

  test('logoutThunk.pending bật loading và clear error', () => {
    const prev = { ...makeInitialState(), error: 'old', loading: false }
    const next = authReducer(prev, { type: logoutThunk.pending.type })

    expect(next.loading).toBe(true)
    expect(next.error).toBeNull()
  })

  test('logoutThunk.fulfilled reset state & clearAllSessions', () => {
    // setup storage có value
    localStorage.setItem('access_token', 'old-at')
    sessionStorage.setItem('access_token', 'old-at-2')

    const prev = {
      user: { id: 'u1' },
      access_token: 'token',
      refresh_token: 'rt',
      remember: 'local',
      isAuthenticated: true,
      loading: true,
      error: null,
    }

    const next = authReducer(prev, { type: logoutThunk.fulfilled.type })

    expect(next.loading).toBe(false)
    expect(next.user).toBeNull()
    expect(next.access_token).toBeNull()
    expect(next.refresh_token).toBeNull()
    expect(next.isAuthenticated).toBe(false)
    expect(next.remember).toBeNull()

    // clearAllSessions phải xoá token ở cả 2 kho + remember_login
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('remember_login')).toBeNull()
  })

  test('logoutThunk.rejected reset state, clearAllSessions và set error default khi không có payload', () => {
    localStorage.setItem('access_token', 'old-at')
    sessionStorage.setItem('user', JSON.stringify({ id: 'u1' }))

    const prev = {
      user: { id: 'u1' },
      access_token: 'token',
      refresh_token: 'rt',
      remember: 'local',
      isAuthenticated: true,
      loading: true,
      error: null,
    }

    const next = authReducer(prev, {
      type: logoutThunk.rejected.type,
      payload: undefined,
      error: { message: 'ignored' },
    })

    expect(next.user).toBeNull()
    expect(next.access_token).toBeNull()
    expect(next.refresh_token).toBeNull()
    expect(next.isAuthenticated).toBe(false)
    expect(next.remember).toBeNull()
    expect(next.error).toBe('Đăng xuất thất bại (đã xoá phiên cục bộ)')

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(sessionStorage.getItem('user')).toBeNull()
  })

  test('registerThunk.pending bật loading & clear error', () => {
    const prev = { ...makeInitialState(), error: 'old' }
    const next = authReducer(prev, { type: registerThunk.pending.type })

    expect(next.loading).toBe(true)
    expect(next.error).toBeNull()
  })

  test('registerThunk.fulfilled set user, nhưng isAuthenticated=false và token null', () => {
    const prev = { ...makeInitialState(), loading: true }

    const payload = {
      user: { id: 'u-reg', email: 'reg@example.com' },
    }

    const next = authReducer(prev, {
      type: registerThunk.fulfilled.type,
      payload,
    })

    expect(next.loading).toBe(false)
    expect(next.user).toEqual(payload.user)
    expect(next.access_token).toBeNull()
    expect(next.refresh_token).toBeNull()
    expect(next.isAuthenticated).toBe(false)
  })

  test('registerThunk.rejected set error từ payload', () => {
    const prev = { ...makeInitialState(), loading: true }

    const next = authReducer(prev, {
      type: registerThunk.rejected.type,
      payload: 'Email đã tồn tại',
      error: { message: 'ignored' },
    })

    expect(next.loading).toBe(false)
    expect(next.error).toBe('Email đã tồn tại')
  })

  test('fetchUserProfileThunk.pending bật loading & clear error', () => {
    const prev = { ...makeInitialState(), error: 'old' }
    const next = authReducer(prev, {
      type: fetchUserProfileThunk.pending.type,
    })

    expect(next.loading).toBe(true)
    expect(next.error).toBeNull()
  })

  test('fetchUserProfileThunk.fulfilled cập nhật user và persistSession khi đã authenticated', () => {
    const prev = {
      ...makeInitialState(),
      user: { id: 'u1', name: 'Old' },
      access_token: 'at-xyz',
      refresh_token: 'rt-xyz',
      remember: 'local',
      isAuthenticated: true,
    }

    const payload = { id: 'u1', name: 'New Name' }

    const next = authReducer(prev, {
      type: fetchUserProfileThunk.fulfilled.type,
      payload,
    })

    expect(next.loading).toBe(false)
    expect(next.user).toEqual(payload)

    // persistSession phải lưu user mới vào đúng kho (remember=local)
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(payload)
    expect(localStorage.getItem('access_token')).toBe('at-xyz')
  })

  test('fetchUserProfileThunk.rejected set error từ payload', () => {
    const prev = { ...makeInitialState(), loading: true }

    const next = authReducer(prev, {
      type: fetchUserProfileThunk.rejected.type,
      payload: 'Không thể tải profile',
      error: { message: 'ignored' },
    })

    expect(next.loading).toBe(false)
    expect(next.error).toBe('Không thể tải profile')
  })
})

describe('authSlice – selectors', () => {
  test('selectors lấy đúng dữ liệu', () => {
    const rootState = {
      auth: {
        user: { id: 'u1' },
        access_token: 'token',
        refresh_token: 'rt',
        remember: 'local',
        isAuthenticated: true,
        loading: false,
        error: 'err',
      },
    }

    expect(selectAuth(rootState)).toBe(rootState.auth)
    expect(selectAuthUser(rootState)).toEqual({ id: 'u1' })
    expect(selectAuthLoading(rootState)).toBe(false)
    expect(selectAuthError(rootState)).toBe('err')
    expect(selectIsAuthenticated(rootState)).toBe(true)
  })
})

describe('authSlice – thunks logic (mock API)', () => {
  test('loginThunk thành công: map remember=true → "local"', async () => {
    loginUser.mockResolvedValue({
      ok: true,
      data: {
        user: { id: 'u1' },
        access_token: 'tok',
        refresh_token: 'rt',
      },
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await loginThunk({
      email: 'a@a.com',
      password: '123456',
      remember: true,
    })(dispatch, getState, undefined)

    expect(loginUser).toHaveBeenCalledWith({
      email: 'a@a.com',
      password: '123456',
    })

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(loginThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual({
      user: { id: 'u1' },
      access_token: 'tok',
      refresh_token: 'rt',
      remember: 'local',
    })
  })

  test('loginThunk thành công: remember=false → "session"', async () => {
    loginUser.mockResolvedValue({
      ok: true,
      data: {
        user: { id: 'u2' },
        access_token: 'tok2',
        refresh_token: 'rt2',
      },
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await loginThunk({
      email: 'b@b.com',
      password: '123456',
      remember: false,
    })(dispatch, getState, undefined)

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.payload.remember).toBe('session')
  })

  test('loginThunk rejected khi ok=false với message từ res.error', async () => {
    loginUser.mockResolvedValue({
      ok: false,
      error: 'Sai thông tin đăng nhập',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await loginThunk({
      email: 'x@x.com',
      password: 'wrong',
      remember: true,
    })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(loginThunk.rejected.type)
    expect(rejected.payload).toBe('Sai thông tin đăng nhập')
  })

  test('loginThunk rejected với fallback message khi không có res.error', async () => {
    loginUser.mockResolvedValue({
      ok: false,
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await loginThunk({
      email: 'x@x.com',
      password: 'wrong',
      remember: true,
    })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.payload).toBe('Đăng nhập thất bại')
  })

  test('logoutThunk: không có token → không gọi logoutUser, trả {ok:true}', async () => {
    const dispatch = jest.fn()
    const getState = () => ({
      auth: { access_token: null },
    })

    await logoutThunk()(dispatch, getState, undefined)

    // pending + fulfilled
    expect(dispatch).toHaveBeenCalledTimes(2)
    expect(logoutUser).not.toHaveBeenCalled()

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(logoutThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual({ ok: true })
  })

  test('logoutThunk: có token & API ok=true → dispatch fulfilled', async () => {
    logoutUser.mockResolvedValue({
      ok: true,
      status: 200,
    })

    const dispatch = jest.fn()
    const getState = () => ({
      auth: { access_token: 'token-123' },
    })

    await logoutThunk()(dispatch, getState, undefined)

    expect(logoutUser).toHaveBeenCalledWith('token-123')

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(logoutThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual({ ok: true })
  })

  test('logoutThunk: API trả ok=false → rejectedWithValue', async () => {
    logoutUser.mockResolvedValue({
      ok: false,
      error: 'Server error',
    })

    const dispatch = jest.fn()
    const getState = () => ({
      auth: { access_token: 'token-err' },
    })

    await logoutThunk()(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(logoutThunk.rejected.type)
    expect(rejected.payload).toBe('Server error')
  })

  test('registerThunk thành công khi signupUser ok=true', async () => {
    signupUser.mockResolvedValue({
      ok: true,
      data: { user: { id: 'u-reg' } },
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await registerThunk({
      email: 'reg@x.com',
      password: '123456',
      options: { data: { name: 'Reg' } },
    })(dispatch, getState, undefined)

    expect(signupUser).toHaveBeenCalledWith({
      email: 'reg@x.com',
      password: '123456',
      options: { data: { name: 'Reg' } },
    })

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(registerThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual({ user: { id: 'u-reg' } })
  })

  test('registerThunk rejected khi ok=false với message từ res.error', async () => {
    signupUser.mockResolvedValue({
      ok: false,
      error: 'Email đã được sử dụng',
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await registerThunk({
      email: 'dup@x.com',
      password: '123456',
      options: {},
    })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(registerThunk.rejected.type)
    expect(rejected.payload).toBe('Email đã được sử dụng')
  })

  test('registerThunk rejected với fallback khi không có error', async () => {
    signupUser.mockResolvedValue({
      ok: false,
    })

    const dispatch = jest.fn()
    const getState = () => ({})

    await registerThunk({
      email: 'dup@x.com',
      password: '123456',
      options: {},
    })(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.payload).toBe('Đăng ký thất bại')
  })

  test('fetchUserProfileThunk: truyền userId trực tiếp, API ok=true', async () => {
    getUserProfile.mockResolvedValue({
      ok: true,
      data: { id: 'u1', name: 'From API' },
    })

    const dispatch = jest.fn()
    const getState = () => ({
      auth: { user: { id: 'ignored' } },
    })

    await fetchUserProfileThunk('u1')(dispatch, getState, undefined)

    expect(getUserProfile).toHaveBeenCalledWith('u1')

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(fetchUserProfileThunk.fulfilled.type)
    expect(fulfilled.payload).toEqual({ id: 'u1', name: 'From API' })
  })

  test('fetchUserProfileThunk: không truyền userId nhưng lấy từ state.auth.user.id', async () => {
    getUserProfile.mockResolvedValue({
      ok: true,
      data: { id: 'u-state', name: 'State User' },
    })

    const dispatch = jest.fn()
    const getState = () => ({
      auth: { user: { id: 'u-state' } },
    })

    await fetchUserProfileThunk(undefined)(dispatch, getState, undefined)

    expect(getUserProfile).toHaveBeenCalledWith('u-state')

    const fulfilled = dispatch.mock.calls[1][0]
    expect(fulfilled.type).toBe(fetchUserProfileThunk.fulfilled.type)
  })

  test('fetchUserProfileThunk: không có id ở param và state → reject "Không có userId để lấy profile"', async () => {
    const dispatch = jest.fn()
    const getState = () => ({
      auth: { user: null },
    })

    await fetchUserProfileThunk(undefined)(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(fetchUserProfileThunk.rejected.type)
    expect(rejected.payload).toBe('Không có userId để lấy profile')
  })

  test('fetchUserProfileThunk: API ok=false → rejectedWithValue', async () => {
    getUserProfile.mockResolvedValue({
      ok: false,
      error: 'User not found',
    })

    const dispatch = jest.fn()
    const getState = () => ({
      auth: { user: { id: 'u-missing' } },
    })

    await fetchUserProfileThunk(undefined)(dispatch, getState, undefined)

    const rejected = dispatch.mock.calls[1][0]
    expect(rejected.type).toBe(fetchUserProfileThunk.rejected.type)
    expect(rejected.payload).toBe('User not found')
  })
})
