import { getApiBaseUrl, readErrorMessage, type ApiResult } from './http'

export type UserDto = {
  id: string
  email: string
  name: string
  createdAt: string
}

export async function getUserById(userId: string): Promise<ApiResult<UserDto>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/users/${encodeURIComponent(userId)}`)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as UserDto }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

