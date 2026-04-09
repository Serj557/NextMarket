export type ProductItem = {
  id: string
  title: string
  price: string
  place: string
  badge: string
  description: string
  sellerName: string
  sellerRating: string
  address: string
  postedAt: string
  views: number
  fullDescription: string
}

export const mockProducts: ProductItem[] = [
  {
    id: 'wireless-headphones',
    title: 'Беспроводные наушники',
    price: '3 000 ₽',
    place: 'Новосибирск',
    badge: 'Хит недели',
    description:
      'Легкие наушники с чистым звучанием и стабильным Bluetooth. Подходят для повседневного использования, поездок и работы.',
    sellerName: 'SoundLab',
    sellerRating: '4.9',
    address: 'Новосибирск, Центральный район, ул. Ленина, 15',
    postedAt: 'Сегодня, 12:40',
    views: 182,
    fullDescription:
      'Наушники в отличном состоянии, использовались аккуратно. Хорошая шумоизоляция, уверенно держат соединение и подходят как для музыки, так и для звонков. Заряда хватает на полноценный день использования. В комплекте кейс, кабель и набор амбушюр.',
  },
  {
    id: 'kids-bicycle',
    title: 'Детский велосипед',
    price: '9 500 ₽',
    place: 'Бердск',
    badge: 'Быстрая доставка',
    description:
      'Надежный детский велосипед с регулируемым сиденьем и усиленной рамой. В отличном состоянии, готов к сезону.',
    sellerName: 'VeloPoint',
    sellerRating: '4.8',
    address: 'Бердск, мкр. Южный, ул. Горького, 8',
    postedAt: 'Вчера, 18:20',
    views: 97,
    fullDescription:
      'Велосипед полностью исправен и готов к использованию. Рама крепкая, колеса ровные, тормоза работают мягко. Подойдет для ребенка 5-8 лет. Есть небольшие следы эксплуатации, но технически все в порядке.',
  },
  {
    id: 'hair-dryer',
    title: 'Фен для волос',
    price: '1 000 ₽',
    place: 'Новосибирск',
    badge: 'Цена дня',
    description:
      'Компактный фен с двумя режимами нагрева и защитой от перегрева. Идеален для дома и поездок.',
    sellerName: 'HomeTech',
    sellerRating: '4.7',
    address: 'Новосибирск, Октябрьский район, ул. Кирова, 54',
    postedAt: 'Сегодня, 09:10',
    views: 63,
    fullDescription:
      'Фен удобный и легкий, с базовыми режимами, подходит для ежедневной укладки. Работает тихо для своей мощности, не перегревается. Использовался недолго, продаю из-за переезда.',
  },
  {
    id: 'coffee-machine',
    title: 'Кофемашина',
    price: '12 000 ₽',
    place: 'Кольцово',
    badge: 'Топ продавец',
    description:
      'Автоматическая кофемашина с режимами эспрессо и американо. Регулярно обслуживалась, работает без нареканий.',
    sellerName: 'CoffeeMood',
    sellerRating: '5.0',
    address: 'Кольцово, пр. Академика Сандрахчиева, 3',
    postedAt: '2 дня назад',
    views: 241,
    fullDescription:
      'Кофемашина обслуживалась регулярно, делает стабильный эспрессо и американо. Все основные функции работают корректно, чистка выполнялась по регламенту. Подойдет для дома или небольшого офиса.',
  },
]

export function getMockProductById(id: string) {
  return mockProducts.find((item) => item.id === id)
}
