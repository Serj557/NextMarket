export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const DEFAULT_BASE_URL = 'http://localhost:5000'

function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (envUrl && envUrl.trim()) || DEFAULT_BASE_URL
}

async function readErrorMessage(res: Response) {
  const contentType = res.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      const json = (await res.json()) as { message?: string; error?: string }
      return json.message || json.error || `HTTP ${res.status}`
    } catch {
      return `HTTP ${res.status}`
    }
  }
  try {
    const text = await res.text()
    return text || `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status}`
  }
}

async function postJson<TReq extends object, TRes>(
  path: string,
  body: TReq,
): Promise<ApiResult<TRes>> {
  const url = `${getBaseUrl()}${path}`
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
    return { ok: false, error: msg || 'Network error' }
  }
}

export type LoginRequest = { email: string; password: string }
export type RegisterRequest = { name: string; email: string; password: string }

// Под ваш ASP.NET можно подстроить ответы. Сейчас типы максимально простые.
export type AuthResponse = { token: string; userId?: number; email?: string; name?: string }

export const api = {
  login: (req: LoginRequest) => postJson<LoginRequest, AuthResponse>('/api/auth/login', req),
  register: (req: RegisterRequest) =>
    postJson<RegisterRequest, AuthResponse>('/api/auth/register', req),
}

