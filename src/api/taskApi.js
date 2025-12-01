import { api } from '@/api/apiService.js'

/**
 * Task DTO pattern: { ok, status, data, error }
 */

export async function fetchTasks({ userId, limit = 50, offset = 0 } = {}) {
  const filter = userId ? `?user_id=eq.${userId}&select=*` : '?select=*'
  const res = await api.get(`/rest/v1/tasks${filter}&order=created_at.desc&limit=${limit}&offset=${offset}`)
  return res
}

export async function createTask(payload) {
  // payload should match tasks table columns
  return await api.post('/rest/v1/tasks', [payload], { headers: { Prefer: 'return=representation' } })
}

export async function updateTask(taskId, updates) {
  return await api.patch(`/rest/v1/tasks?id=eq.${taskId}`, updates, { headers: { Prefer: 'return=representation' } })
}

export async function deleteTask(taskId) {
  return await api.delete(`/rest/v1/tasks?id=eq.${taskId}`)
}

export async function fetchTasksCursor({
  userId,
  limit = 20,
  cursor = null, // created_at task cuối cùng hiện có
} = {}) {
  let query = userId
    ? `?user_id=eq.${userId}&select=*&order=created_at.desc`
    : '?select=*&order=created_at.desc'

  if (cursor) {
    const encodedCursor = encodeURIComponent(cursor)
    query += `&created_at=lt.${encodedCursor}`
  }

  query += `&limit=${limit}`

  const res = await api.get(`/rest/v1/tasks${query}`)
  if (!res?.ok) return res

  const items = res.data || []
  const last = items[items.length - 1] || null

  // Trạng thái còn dữ liệu để fetch thêm không
  const hasMore = items.length === limit

  return {
    ...res,
    data: items,
    nextCursor: hasMore ? last?.created_at ?? null : null,
    hasMore,
  }
}



