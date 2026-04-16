export type ParsedProductDescription = {
  category: string
  condition: string
  location: string
  text: string
}

const DEFAULTS: ParsedProductDescription = {
  category: 'Не указана',
  condition: 'Не указано',
  location: 'Не указано',
  text: 'Описание пока не заполнено.',
}

export function parseProductDescription(description?: string | null): ParsedProductDescription {
  if (!description) return { ...DEFAULTS }

  const lines = description.split('\n').map((x) => x.trim())
  const categoryLine = lines.find((x) => x.toLowerCase().startsWith('категория:'))
  const conditionLine = lines.find((x) => x.toLowerCase().startsWith('состояние:'))
  const locationLine = lines.find((x) => x.toLowerCase().startsWith('расположение:'))
  const text = lines
    .filter(
      (x) =>
        x &&
        !x.toLowerCase().startsWith('категория:') &&
        !x.toLowerCase().startsWith('состояние:') &&
        !x.toLowerCase().startsWith('расположение:'),
    )
    .join('\n')

  return {
    category: categoryLine?.replace(/категория:\s*/i, '').trim() || DEFAULTS.category,
    condition: conditionLine?.replace(/состояние:\s*/i, '').trim() || DEFAULTS.condition,
    location: locationLine?.replace(/расположение:\s*/i, '').trim() || DEFAULTS.location,
    text: text || DEFAULTS.text,
  }
}

export function extractLocation(description?: string | null) {
  return parseProductDescription(description).location
}

export function extractCategory(description?: string | null) {
  return parseProductDescription(description).category
}

