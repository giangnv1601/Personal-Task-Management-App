// Dùng API wrapper thống nhất DTO: { ok, status, data, error }
import { api } from '@/api/apiService.js'

// Đăng ký
export async function signupUser({ email, password, options = {} } = {}) {
  const body = { email, password, ...options }
  return await api.post('/auth/v1/signup', body)
}

// Đăng nhập
export async function loginUser({ email, password }) {
  return await api.post("/auth/v1/token?grant_type=password", { email, password })
}

// Lấy user hiện tại bằng access_token (nếu cần)
export async function getMe(accessToken) {
  return await api.get('/auth/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

// Đăng xuất (yêu cầu access_token)
export async function logoutUser(accessToken) {
  return await api.post('/auth/v1/logout', null, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

/** REST bảng Users */
export async function createUserProfile(payload) {
  return await api.post('/rest/v1/users', [payload], {
    headers: { Prefer: 'return=representation' },
  })
}

export async function getUserProfile(userId) {
  const res = await api.get(`/rest/v1/users?id=eq.${userId}&select=*`)
  if (!res.ok) return res
  return { ...res, data: Array.isArray(res.data) ? res.data[0] ?? null : res.data }
}

export async function updateUserProfile(userId, updates) {
  return await api.patch(`/rest/v1/users?id=eq.${userId}`, updates, {
    headers: { Prefer: 'return=representation' },
  })
}

export async function deleteUserProfile(userId) {
  return await api.delete(`/rest/v1/users?id=eq.${userId}`)
}