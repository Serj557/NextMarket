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

async function requestJson<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, init)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    const data = (await res.json()) as T
    return { ok: true, data }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export type ProductResponse = {
  id: string
  sellerId: string
  title: string
  description?: string | null
  price: number
  stockQty: number
  isActive: boolean
  averageRating?: number | null
  createdAt: string
  updatedAt: string
}

export type CreateProductRequest = {
  sellerId: string
  title: string
  description?: string
  price: number
  stockQty: number
}

export type UpdateProductRequest = CreateProductRequest & { isActive: boolean }

export const productsApi = {
  getAll: () => requestJson<ProductResponse[]>('/api/products'),

  getById: (id: string) => requestJson<ProductResponse>(`/api/products/${encodeURIComponent(id)}`),

  getMyProducts: (sellerId: string) =>
    requestJson<ProductResponse[]>(`/api/products/my?sellerId=${encodeURIComponent(sellerId)}`),

  getMyProductById: (id: string, sellerId: string) =>
    requestJson<ProductResponse>(
      `/api/products/my/${encodeURIComponent(id)}?sellerId=${encodeURIComponent(sellerId)}`,
    ),

  create: (payload: CreateProductRequest) =>
    requestJson<ProductResponse>('/api/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateProductRequest) =>
    requestJson<ProductResponse>(`/api/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),

  remove: async (id: string, sellerId: string): Promise<ApiResult<null>> => {
    try {
      const res = await fetch(
        `${getBaseUrl()}/api/products/${encodeURIComponent(id)}?sellerId=${encodeURIComponent(sellerId)}`,
        { method: 'DELETE' },
      )
      if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
      return { ok: true, data: null }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { ok: false, error: msg || 'Network error' }
    }
  },
}
