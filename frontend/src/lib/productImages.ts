const PRODUCT_IMAGES_KEY = 'nm_product_images'

type ProductImagesMap = Record<string, string[]>

function readImagesMap(): ProductImagesMap {
  try {
    const raw = localStorage.getItem(PRODUCT_IMAGES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, string | string[]>
    if (!parsed || typeof parsed !== 'object') return {}
    const normalized: ProductImagesMap = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        normalized[key] = value.filter((x) => typeof x === 'string')
      } else if (typeof value === 'string' && value) {
        // Backward compatibility with old format: one string per product.
        normalized[key] = [value]
      }
    }
    return normalized
  } catch {
    return {}
  }
}

function writeImagesMap(map: ProductImagesMap) {
  localStorage.setItem(PRODUCT_IMAGES_KEY, JSON.stringify(map))
}

export function getProductImages(productId: string) {
  const map = readImagesMap()
  return map[productId] ?? []
}

export function getProductImage(productId: string) {
  const images = getProductImages(productId)
  return images[0] ?? null
}

export function saveProductImages(productId: string, imageDataUrls: string[]) {
  if (!imageDataUrls.length) return
  const map = readImagesMap()
  map[productId] = imageDataUrls.slice(0, 6)
  writeImagesMap(map)
}

export function removeProductImage(productId: string) {
  const map = readImagesMap()
  delete map[productId]
  writeImagesMap(map)
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения.'))
    reader.readAsDataURL(file)
  })
}

export async function filesToDataUrls(files: File[]) {
  const items = await Promise.all(files.slice(0, 6).map((file) => fileToDataUrl(file)))
  return items.filter(Boolean)
}
