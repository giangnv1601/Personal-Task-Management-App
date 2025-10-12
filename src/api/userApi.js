import { api } from '@/api/apiService.js'

/**
 * signupUser -> returns unified DTO from apiService
 * usage:
 *   const res = await signupUser({ email, password })
 *   if (!res.ok) throw new Error(res.error)
 *   // res.data contains payload from supabase
 */
export async function signupUser({ email, password, options = {} } = {}) {
  const body = { email, password, ...options }
  return await api.post('/auth/v1/signup', body)
}

// createUserProfile -> creates a row in users table and returns DTO
export async function createUserProfile(payload) {
  // Supabase REST expects array body for insert; Prefer return representation
  return await api.post('/rest/v1/users', [payload], {
    headers: { Prefer: 'return=representation' },
  })
}

// getUserProfile -> returns single row DTO
export async function getUserProfile(userId) {
  const res = await api.get(`/rest/v1/users?id=eq.${userId}&select=*`)
  // normalize data to single object for convenience
  if (!res.ok) return res
  return { ...res, data: Array.isArray(res.data) ? res.data[0] ?? null : res.data }
}

// updateUserProfile -> returns updated row DTO
export async function updateUserProfile(userId, updates) {
  return await api.patch(`/rest/v1/users?id=eq.${userId}`, updates, {
    headers: { Prefer: 'return=representation' },
  })
}

// deleteUserProfile -> returns DTO { ok, status, data, error }
export async function deleteUserProfile(userId) {
  return await api.delete(`/rest/v1/users?id=eq.${userId}`)
}