export type FavoriteProduct = {
  id: string
  title: string
  price: string
  place: string
}

const FAVORITES_KEY = 'nm_favorites'

function makeId(title: string, price: string, place: string) {
  return `${title}__${price}__${place}`
}

export function toFavoriteProduct(item: { title: string; price: string; place: string }): FavoriteProduct {
  return {
    id: makeId(item.title, item.price, item.place),
    title: item.title,
    price: item.price,
    place: item.place,
  }
}

export function readFavorites(): FavoriteProduct[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as FavoriteProduct[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeFavorites(items: FavoriteProduct[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(items))
}

