import supabaseApi from '@/api/supabaseClient.js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/constants.js'

const isTestEnv = process.env.NODE_ENV === 'test'

const parseErrorMessage = (err) => {
  const data = err?.response?.data
  const candidate =
    data?.message ?? data?.error ?? data ?? err?.message ?? String(err)

  if (typeof candidate === 'string') return candidate

  try {
    if (data && typeof data === 'object') {
      if (data.msg) return String(data.msg)
      if (data.error_code) {
        return `${data.error_code}: ${
          data.msg ?? JSON.stringify(data)
        }`
      }
    }
    return JSON.stringify(candidate)
  } catch {
    return String(candidate)
  }
}

const okResponse = (res) => ({
  ok: true,
  status: res?.status ?? 200,
  data: res?.data ?? null,
  error: null,
})

const errorResponse = (err) => {
  if (err?.response) {
    return {
      ok: false,
      status: err.response.status,
      data: err.response.data ?? null,
      error: parseErrorMessage(err),
    }
  }
  return {
    ok: false,
    status: null,
    data: null,
    error: parseErrorMessage(err),
  }
}

/**
 * Dùng fetch – chỉ chạy trong môi trường test (Jest + MSW)
 */
async function requestWithFetch(method, url, body = null, config = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...(config.headers || {}),
  }

  const init = {
    method: method.toUpperCase(),
    headers,
    ...config,
  }

  if (body !== null && body !== undefined) {
    init.body = JSON.stringify(body)
  }

  const res = await fetch(`${SUPABASE_URL}${url}`, init)

  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }

  const error =
    res.ok
      ? null
      : (data && (data.message || data.error)) || res.statusText

  return {
    ok: res.ok,
    status: res.status,
    data,
    error,
  }
}

/**
 * Generic request wrapper -> unified DTO:
 * { ok, status, data, error }
 */
export async function request(method, url, body = null, config = {}) {
  // Khi chạy test: dùng fetch để đi qua MSW/node
  if (isTestEnv) {
    return requestWithFetch(method, url, body, config)
  }

  // Dev/Prod: dùng axios client thật
  try {
    const res = await supabaseApi.request({
      method,
      url,
      data: body,
      ...config,
    })
    return okResponse(res)
  } catch (err) {
    return errorResponse(err)
  }
}

export const api = {
  get: (url, config) => request('get', url, null, config),
  post: (url, body, config) => request('post', url, body, config),
  patch: (url, body, config) => request('patch', url, body, config),
  delete: (url, config) => request('delete', url, null, config),
}
