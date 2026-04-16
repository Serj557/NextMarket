const DEFAULT_BASE_URL = 'http://localhost:5158'

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

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

export type FavoriteItemDto = {
  productId: string
  title: string
  price: number
  description?: string | null
  imageUrls: string[]
}

export async function getMyFavorites(buyerId: string): Promise<ApiResult<FavoriteItemDto[]>> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/favorites?buyerId=${encodeURIComponent(buyerId)}`)
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
    const res = await fetch(`${getBaseUrl()}/api/favorites/items`, {
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
      `${getBaseUrl()}/api/favorites/items/${encodeURIComponent(productId)}?buyerId=${encodeURIComponent(buyerId)}`,
      { method: 'DELETE' },
    )
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as FavoriteItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}
