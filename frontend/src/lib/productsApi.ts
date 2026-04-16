import { getApiBaseUrl, readErrorMessage, requestJson, type ApiResult } from './http'

export type ProductResponse = {
  id: string
  sellerId: string
  sellerName: string
  sellerRating?: number | null
  title: string
  description?: string | null
  price: number
  stockQty: number
  isActive: boolean
  averageRating?: number | null
  imageUrls: string[]
  createdAt: string
  updatedAt: string
}

export type CreateProductRequest = {
  sellerId: string
  title: string
  description?: string
  price: number
  stockQty: number
  imageUrls?: string[]
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
        `${getApiBaseUrl()}/api/products/${encodeURIComponent(id)}?sellerId=${encodeURIComponent(sellerId)}`,
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
