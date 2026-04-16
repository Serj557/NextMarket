import { getApiBaseUrl, readErrorMessage, type ApiResult } from './http'

export type CreateOrderItemRequest = {
  productId: string
  quantity: number
}

export type CreateOrderRequest = {
  buyerId: string
  items: CreateOrderItemRequest[]
}

export type OrderItemDto = {
  productId: string
  quantity: number
  unitPrice: number
}

export type OrderDto = {
  id: string
  buyerId: string
  status: string
  createdAt: string
  completedAt?: string | null
  items: OrderItemDto[]
}

export async function createOrder(payload: CreateOrderRequest): Promise<ApiResult<OrderDto>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/orders`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as OrderDto }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function getMyOrders(buyerId: string): Promise<ApiResult<OrderDto[]>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/orders?buyerId=${encodeURIComponent(buyerId)}`)
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: (await res.json()) as OrderDto[] }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

export async function markOrderCompleted(orderId: string, buyerId: string): Promise<ApiResult<null>> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/orders/${encodeURIComponent(orderId)}/complete`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ buyerId }),
    })
    if (!res.ok) return { ok: false, error: await readErrorMessage(res) }
    return { ok: true, data: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg || 'Network error' }
  }
}

