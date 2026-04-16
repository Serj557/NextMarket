import { getApiBaseUrl, readErrorMessage, type ApiResult } from './http'

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
    const res = await fetch(`${getApiBaseUrl()}/api/cart?buyerId=${encodeURIComponent(buyerId)}`)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as CartItemDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function addToCartApi(payload: AddCartItemRequest): Promise<ApiResult<CartItemDto[]>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/cart/items`, {
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
      `${getApiBaseUrl()}/api/cart/items/${encodeURIComponent(productId)}?buyerId=${encodeURIComponent(buyerId)}`,
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
    const url = `${getApiBaseUrl()}/api/cart/items/${encodeURIComponent(productId)}`
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
        `${getApiBaseUrl()}/api/cart/items/${encodeURIComponent(productId)}?buyerId=${encodeURIComponent(buyerId)}`,
        { method: 'DELETE' },
      )
      if (!removeRes.ok) return { ok: false, error: await readErrorMessage(removeRes) }

      const addRes = await fetch(`${getApiBaseUrl()}/api/cart/items`, {
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
