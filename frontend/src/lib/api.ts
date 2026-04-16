import { getApiBaseUrl, readErrorMessage, type ApiResult } from './http'

async function postJson<TReq extends object, TRes>(
  path: string,
  body: TReq,
): Promise<ApiResult<TRes>> {
  const url = `${getApiBaseUrl()}${path}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    const data = (await res.json()) as TRes
    return { ok: true, data }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.toLowerCase().includes('failed to fetch')) {
      return {
        ok: false,
        error:
          `Не удалось подключиться к API. Проверьте, что backend запущен на ${getApiBaseUrl()}.`,
      }
    }
    return { ok: false, error: msg || 'Network error' }
  }
}

export type LoginRequest = { email: string; password: string }
export type RegisterRequest = { name: string; email: string; password: string }

export type AuthResponse = { token: string; userId: string; email: string; name: string }

export const api = {
  login: (req: LoginRequest) => postJson<LoginRequest, AuthResponse>('/api/users/login', req),
  register: (req: RegisterRequest) =>
    postJson<RegisterRequest, AuthResponse>('/api/users/register', req),
}

