import axios from 'axios'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/constants.js'

let attachedStore = null

export const attachStore = (store) => {
  attachedStore = store
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const msg = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY.'
  console.error(msg, { SUPABASE_URL, SUPABASE_ANON_KEY })
  throw new Error(msg)
}

const supabaseApi = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Lấy token từ Redux hoặc localStorage
function getAccessToken() {
  try {
    // Lấy từ store gắn ngoài 
    const state = attachedStore?.getState?.()
    const tokenFromRedux =
      state?.auth?.session?.access_token ||
      state?.auth?.access_token ||
      state?.auth?.user?.access_token

    if (tokenFromRedux) return tokenFromRedux

    // Hoặc lấy từ localStorage (fallback)
    const raw = localStorage.getItem('sb-session')
    const tokenFromLS = raw ? JSON.parse(raw)?.access_token : null
    return tokenFromLS || null
  } catch {
    return null
  }
}

supabaseApi.interceptors.request.use((config) => {
  const userToken = getAccessToken()
  // Nếu có token user → dùng token user; nếu không → fallback anon
  config.headers.Authorization = `Bearer ${userToken || SUPABASE_ANON_KEY}`
  return config
})

export default supabaseApi
