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

export type CartItemDto = {
  productId: string
  title: string
  price: number
  description?: string | null
  quantity: number
  stockQty: number
  imageUrls: string[]
}

type AddCartItemRequest = {
  buyerId: string
  productId: string
  quantity: number
}

type UpdateCartItemQuantityRequest = {
  buyerId: string
  quantity: number
}

export async function getMyCart(buyerId: string): Promise<ApiResult<CartItemDto[]>> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/cart?buyerId=${encodeURIComponent(buyerId)}`)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as CartItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function addToCartApi(payload: AddCartItemRequest): Promise<ApiResult<CartItemDto[]>> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/cart/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as CartItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function removeFromCartApi(
  buyerId: string,
  productId: string,
): Promise<ApiResult<CartItemDto[]>> {
  try {
    const res = await fetch(
      `${getBaseUrl()}/api/cart/items/${encodeURIComponent(productId)}?buyerId=${encodeURIComponent(buyerId)}`,
      { method: 'DELETE' },
    )
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as CartItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function updateCartItemQuantityApi(
  buyerId: string,
  productId: string,
  quantity: number,
): Promise<ApiResult<CartItemDto[]>> {
  const payload: UpdateCartItemQuantityRequest = { buyerId, quantity }
  try {
    const url = `${getBaseUrl()}/api/cart/items/${encodeURIComponent(productId)}`
    let res = await fetch(url, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.status === 405) {
      res = await fetch(url, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    if (res.status === 405) {
      // Backward-compatible fallback for servers without PATCH/PUT quantity update:
      // recreate cart item with the desired quantity via existing DELETE + POST endpoints.
      const removeRes = await fetch(
        `${getBaseUrl()}/api/cart/items/${encodeURIComponent(productId)}?buyerId=${encodeURIComponent(buyerId)}`,
        { method: 'DELETE' },
      )
      if (!removeRes.ok) return { ok: false, error: await readErrorMessage(removeRes) }

      const addRes = await fetch(`${getBaseUrl()}/api/cart/items`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ buyerId, productId, quantity }),
      })
      if (!addRes.ok) return { ok: false, error: await readErrorMessage(addRes) }
      return { ok: true, data: (await addRes.json()) as CartItemDto[] }
    }
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as CartItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}
