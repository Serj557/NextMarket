import { requestJson, type ApiResult } from './http'

export type MyRatingDto = {
  productId: string
  rating: number
  createdAt: string
}

export async function rateProduct(productId: string, rating: number): Promise<ApiResult<null>> {
  const res = await requestJson<null>(`/api/products/${encodeURIComponent(productId)}/ratings`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rating }),
  })
  return res.ok ? { ok: true, data: null } : res
}

export async function getMyRatings(): Promise<ApiResult<MyRatingDto[]>> {
  return requestJson<MyRatingDto[]>('/api/ratings/me')
}

