import { getApiBaseUrl, readErrorMessage, type ApiResult } from './http'

export async function rateProduct(productId: string, userId: string, rating: number): Promise<ApiResult<null>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/products/${encodeURIComponent(productId)}/ratings`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId, rating }),
    })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

