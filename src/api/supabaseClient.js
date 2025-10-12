import axios from 'axios'

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/constants.js'

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const msg = 'Missing SUPABASE_URL or SUPABASE_ANON_KEY.'
  console.error(msg, { SUPABASE_URL, SUPABASE_ANON_KEY })
  throw new Error(msg)
}

// axios instance dùng cho Supabase REST + Auth endpoints
const supabaseApi = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

export default supabaseApi