import { api } from '@/api/apiService.js'

/**
 * Task DTO pattern: { ok, status, data, error }
 */

export async function fetchTasks({ userId, limit = 50, offset = 0 } = {}) {
  const filter = userId ? `?user_id=eq.${userId}&select=*` : '?select=*'
  const res = await api.get(`/rest/v1/tasks${filter}&limit=${limit}&offset=${offset}`)
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