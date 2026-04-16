type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const DEFAULT_BASE_URL = 'http://localhost:5158'

function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (envUrl && envUrl.trim()) || DEFAULT_BASE_URL
}

async function readErrorMessage(res: Response) {
  try {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/json')) {
      const json = (await res.json()) as { message?: string; error?: string }
      return json.message || json.error || `HTTP ${res.status}`
    }
    const text = await res.text()
    return text || `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status}`
  }
}

export type UserDto = {
  id: string
  email: string
  name: string
  createdAt: string
}

export async function getUserById(userId: string): Promise<ApiResult<UserDto>> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/users/${encodeURIComponent(userId)}`)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as UserDto }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

