import { extractLocation } from '../../lib/productDescription'
import { formatRub } from '../../lib/format'
import type { CartItemDto } from '../../lib/cartApi'
import type { FavoriteItemDto } from '../../lib/favoritesApi'
import type { OrderDto } from '../../lib/ordersApi'

export type CabinetCartItem = {
  id: string
  title: string
  unitPrice: number
  quantity: number
  stockQty: number
  isOutOfStock: boolean
  priceLabel: string
  place: string
  imageUrl: string | null
}

export type CabinetFavoriteItem = {
  id: string
  title: string
  priceLabel: string
  place: string
  imageUrl: string | null
}

export type CabinetOrderItem = {
  id: string
  status: string
  statusLabel: string
  createdAtLabel: string
  completedAtLabel: string | null
  itemsCount: number
  totalPriceLabel: string
  lines: Array<{
    lineId: string
    productId: string
    quantity: number
    unitPriceLabel: string
    lineTotalLabel: string
    rating: number | null
  }>
}

export function toCabinetCartItem(item: CartItemDto): CabinetCartItem {
  const isOutOfStock = item.stockQty <= 0
  return {
    id: item.productId,
    title: item.title,
    unitPrice: item.price,
    quantity: item.quantity,
    stockQty: item.stockQty,
    isOutOfStock,
    priceLabel: formatRub(item.price),
    place: extractLocation(item.description),
    imageUrl: item.imageUrls?.[0] ?? null,
  }
}

export function toCabinetFavoriteItem(item: FavoriteItemDto): CabinetFavoriteItem {
  return {
    id: item.productId,
    title: item.title,
    priceLabel: formatRub(item.price),
    place: extractLocation(item.description),
    imageUrl: item.imageUrls?.[0] ?? null,
  }
}

export function toCabinetOrderItem(order: OrderDto, ratingByLineId: Record<string, number>): CabinetOrderItem {
  const lines = order.items.map((x, index) => {
    const lineTotal = x.unitPrice * x.quantity
    const lineId = `${order.id}:${x.productId}:${index}`
    return {
      lineId,
      productId: x.productId,
      quantity: x.quantity,
      unitPriceLabel: formatRub(x.unitPrice),
      lineTotalLabel: formatRub(lineTotal),
      rating: ratingByLineId[lineId] ?? null,
    }
  })
  const total = order.items.reduce((sum, x) => sum + x.unitPrice * x.quantity, 0)
  return {
    id: order.id,
    status: order.status,
    statusLabel: order.status === 'completed' ? 'Доставлен' : 'Оформлен',
    createdAtLabel: new Date(order.createdAt).toLocaleString('ru-RU'),
    completedAtLabel: order.completedAt ? new Date(order.completedAt).toLocaleString('ru-RU') : null,
    itemsCount: order.items.reduce((sum, x) => sum + x.quantity, 0),
    totalPriceLabel: formatRub(total),
    lines,
  }
}

export async function filesToDataUrls(files: File[]) {
  const selected = files.slice(0, 6)
  const items = await Promise.all(
    selected.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result ?? ''))
          reader.onerror = () => reject(new Error('Не удалось прочитать изображение.'))
          reader.readAsDataURL(file)
        }),
    ),
  )
  return items.filter(Boolean)
}

