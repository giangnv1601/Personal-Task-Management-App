import supabaseApi from '@/api/supabaseClient.js'

const parseErrorMessage = (err) =>
  err?.response?.data?.message ||
  err?.response?.data?.error ||
  err?.response?.data ||
  err?.message ||
  String(err)

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
 * Generic request wrapper -> returns unified DTO:
 * { ok: boolean, status: number|null, data: any, error: string|null }
 */
export async function request(method, url, body = null, config = {}) {
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