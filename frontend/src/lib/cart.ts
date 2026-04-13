export type CartItem = {
  id: string
  title: string
  price: string
  place: string
  quantity: number
  imageUrl?: string
}

const CART_KEY = 'nm_cart'

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function addToCart(item: Omit<CartItem, 'quantity'>) {
  const current = readCart()
  const existing = current.find((cartItem) => cartItem.id === item.id)
  if (existing) {
    const next = current.map((cartItem) =>
      cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
    )
    writeCart(next)
    return
  }
  writeCart([...current, { ...item, quantity: 1 }])
}

export function removeFromCart(id: string) {
  const current = readCart()
  const next = current.filter((item) => item.id !== id)
  writeCart(next)
  return next
}

export function parsePrice(price: string) {
  const clean = price.replace(/\s/g, '').replace('₽', '')
  const value = Number(clean)
  return Number.isFinite(value) ? value : 0
}
