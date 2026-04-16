import { getApiBaseUrl, readErrorMessage, type ApiResult } from './http'

export type FavoriteItemDto = {
  productId: string
  title: string
  price: number
  description?: string | null
  imageUrls: string[]
}

export async function getMyFavorites(buyerId: string): Promise<ApiResult<FavoriteItemDto[]>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/favorites?buyerId=${encodeURIComponent(buyerId)}`)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as FavoriteItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function addFavorite(
  buyerId: string,
  productId: string,
): Promise<ApiResult<FavoriteItemDto[]>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/favorites/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ buyerId, productId }),
    })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as FavoriteItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function removeFavorite(
  buyerId: string,
  productId: string,
): Promise<ApiResult<FavoriteItemDto[]>> {
  try {
    const res = await fetch(
      `${getApiBaseUrl()}/api/favorites/items/${encodeURIComponent(productId)}?buyerId=${encodeURIComponent(buyerId)}`,
      { method: 'DELETE' },
    )
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as FavoriteItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}
