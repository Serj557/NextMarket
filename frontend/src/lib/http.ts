import { readAuthToken } from './authSession'

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const DEFAULT_API_BASE_URL = 'http://localhost:5158'

export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
  return (envUrl && envUrl.trim()) || DEFAULT_API_BASE_URL
}

type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
  traceId?: string
  errors?: Record<string, string[]>
}

function prettifyFieldName(field: string) {
  const map: Record<string, string> = {
    Password: 'Пароль',
    Email: 'Email',
    Name: 'Имя',
    Title: 'Название',
    Price: 'Цена',
    StockQty: 'Количество',
    SellerId: 'Продавец',
    BuyerId: 'Покупатель',
  }
  return map[field] || field
}

function normalizeValidationMessage(message: string) {
  const msg = message.trim()

  // Keep already-human messages as-is.
  if (!msg) return msg

  // Common ASP.NET (DataAnnotations) patterns.
  // Example: "The field Password must be a string or array type with a minimum length of '6'."
  const minLen = msg.match(/minimum length of '(\d+)'/i)
  if (minLen) return `Минимальная длина — ${minLen[1]} символов.`

  const maxLen = msg.match(/maximum length of '(\d+)'/i)
  if (maxLen) return `Максимальная длина — ${maxLen[1]} символов.`

  // Example: "The Email field is required."
  if (/is required\./i.test(msg) || /field is required\./i.test(msg)) return 'Обязательное поле.'

  // Example: "The field Email is not a valid e-mail address."
  if (/not a valid e-?mail address/i.test(msg)) return 'Введите корректный email.'

  // Example: "The field Price must be between 0 and 100."
  const between = msg.match(/must be between\s+([0-9.,-]+)\s+and\s+([0-9.,-]+)/i)
  if (between) return `Значение должно быть между ${between[1]} и ${between[2]}.`

  // Example: "The value '' is invalid."
  if (/value .* is invalid\./i.test(msg)) return 'Некорректное значение.'

  // Generic fallback: strip noisy prefix.
  // Example: "The field Password ..." -> keep the tail.
  return msg.replace(/^The field\s+/i, '')
}

function formatValidationErrors(errors: Record<string, string[]>) {
  const lines: string[] = []
  for (const [field, messages] of Object.entries(errors)) {
    const clean = (messages || []).filter(Boolean)
    if (clean.length === 0) continue
    const label = prettifyFieldName(field)
    const normalized = clean.map(normalizeValidationMessage)
    if (normalized.length === 1) lines.push(`${label}: ${normalized[0]}`)
    else lines.push(`${label}: ${normalized.join(' ')}`)
  }
  return lines.join('\n')
}

export async function readErrorMessage(res: Response) {
  try {
    const contentType = res.headers.get('content-type') ?? ''
    if (contentType.includes('application/problem+json') || contentType.includes('application/json')) {
      const json = (await res.json()) as ProblemDetails & { message?: string; error?: string }

      if (json.errors && typeof json.errors === 'object') {
        const formatted = formatValidationErrors(json.errors)
        return formatted || json.title || `HTTP ${res.status}`
      }

      if (json.detail) return json.detail
      return json.message || json.error || json.title || `HTTP ${res.status}`
    }
    const text = await res.text()
    return text || `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status}`
  }
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const token = readAuthToken()
    const headers = new Headers(init?.headers)
    if (token && !headers.has('authorization')) {
      headers.set('authorization', `Bearer ${token}`)
    }

    const res = await fetch(`${getApiBaseUrl()}${path}`, { ...init, headers })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }

    // 204/205 or empty body: treat as "no data"
    if (res.status === 204 || res.status === 205) {
      return { ok: true, data: null as T }
    }

    const contentLength = res.headers.get('content-length')
    if (contentLength === '0') {
      return { ok: true, data: null as T }
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      // Successful, but not JSON (or empty). Caller can model as null/string if needed.
      const text = await res.text()
      return { ok: true, data: (text as unknown as T) }
    }

    const text = await res.text()
    if (!text.trim()) return { ok: true, data: null as T }
    return { ok: true, data: JSON.parse(text) as T }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

