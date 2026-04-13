export const marketplaceCategories = [
  'Авто',
  'Недвижимость',
  'Одежда',
  'Услуги',
  'Электроника',
  'Спорт',
  'Украшения',
  'Красота',
  'Музыка и инструменты',
] as const

export type MarketplaceCategory = (typeof marketplaceCategories)[number]
