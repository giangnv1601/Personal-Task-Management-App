// Dùng API wrapper thống nhất DTO: { ok, status, data, error }
import { api } from '@/api/apiService.js'
import { supabase } from '@/api/supabaseClient.js'

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

// Lấy thông tin người dùng từ bảng users
export async function getUserProfile(userId) {
  const res = await api.get(`/rest/v1/users?id=eq.${userId}&select=*`)
  if (!res.ok) return res
  return { ...res, data: Array.isArray(res.data) ? res.data[0] ?? null : res.data }
}

// Cập nhật thông tin người dùng trong bảng users
export async function updateUserProfile(userId, updates) {
  const res = await api.patch(`/rest/v1/users?id=eq.${userId}`, updates, {
    headers: { Prefer: 'return=representation' },
  })
  if (!res.ok) return res
  return { ...res, data: Array.isArray(res.data) ? res.data[0] ?? null : res.data }
}

// Upload ảnh lên Supabase Storage và cập nhật URL trong bảng Auth
export async function uploadAvatar(userId, file, accessToken, refreshToken) {
  try {
    if (!file) return { ok: false, data: null, error: 'Không có file được chọn' }
    if (!userId) return { ok: false, data: null, error: 'Thiếu userId' }
    if (!accessToken || !refreshToken) {
      return { ok: false, data: null, error: 'Thiếu access_token/refresh_token để upload avatar' }
    }

    // 1) Set session để supabase-js có quyền (storage + updateUser)
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (sessionError) throw sessionError

    // 2) Tạo path
    const fileExt = (file.name?.split('.').pop() || 'png').toLowerCase()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // 3) Upload file lên bucket avatars
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })

    if (uploadError) throw uploadError

    // 4) Lấy public url
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const publicUrl = urlData?.publicUrl
    if (!publicUrl) throw new Error('Không lấy được public url')

    // 5) Update metadata trong auth.users
    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    })
    if (authError) throw authError

    return { ok: true, data: publicUrl, error: null }
  } catch (error) {
    return { ok: false, data: null, error: error?.message || 'Lỗi upload ảnh' }
  }
}
