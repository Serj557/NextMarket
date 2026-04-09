import { type FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { readFavorites, toFavoriteProduct, writeFavorites } from '../lib/favorites'

type CategoryItem = {
  title: string
  emoji: string
}

type ProductItem = {
  title: string
  price: string
  place: string
}

const topLinks: string[] = ['Для бизнеса', 'Помощь', 'Каталоги']

const categories: CategoryItem[] = [
  { title: 'Авто', emoji: '🚗' },
  { title: 'Недвижимость', emoji: '🏢' },
  { title: 'Работа', emoji: '💼' },
  { title: 'Одежда', emoji: '👕' },
  { title: 'Хобби', emoji: '🎯' },
  { title: 'Животные', emoji: '🐶' },
  { title: 'Услуги', emoji: '🧰' },
  { title: 'Электроника', emoji: '📱' },
  { title: 'Красота', emoji: '💄' },
  { title: 'Товары для дома', emoji: '🏠' },
  { title: 'Детские товары', emoji: '🧸' },
  { title: 'Спорт и отдых', emoji: '⚽' },
  { title: 'Книги и учеба', emoji: '📚' },
  { title: 'Музыка и инструменты', emoji: '🎸' },
  { title: 'Строительство', emoji: '🛠️' },
  { title: 'Сад и огород', emoji: '🌿' },
  { title: 'Техника для кухни', emoji: '🍳' },
  { title: 'Смартфоны', emoji: '📲' },
  { title: 'Компьютеры', emoji: '💻' },
  { title: 'Игры и приставки', emoji: '🎮' },
  { title: 'Часы и украшения', emoji: '⌚' },
  { title: 'Обувь', emoji: '👟' },
  { title: 'Сумки', emoji: '👜' },
  { title: 'Туризм', emoji: '🏕️' },
  { title: 'Фото и видео', emoji: '📷' },
  { title: 'Здоровье', emoji: '💊' },
]

const quickFilters: string[] = ['Хиты продаж', 'Со скидкой', 'Новинки', 'Рядом с вами', 'Рейтинг 4+']

const products: ProductItem[] = [
  { title: 'Беспроводные наушники', price: '3 000 ₽', place: 'Новосибирск' },
  { title: 'Детский велосипед', price: '9 500 ₽', place: 'Бердск' },
  { title: 'Фен для волос', price: '1 000 ₽', place: 'Новосибирск' },
  { title: 'Кофемашина', price: '12 000 ₽', place: 'Кольцово' },
]

export function HomePage() {
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [adTitle, setAdTitle] = useState('')
  const [adPrice, setAdPrice] = useState('')
  const [adPlace, setAdPlace] = useState('')
  const [formError, setFormError] = useState('')
  const [myAds, setMyAds] = useState<ProductItem[]>([])
  const [favorites, setFavorites] = useState(() => readFavorites())
  const visibleCategories = useMemo(
    () => (showAllCategories ? categories : categories.slice(0, 9)),
    [showAllCategories],
  )
  const allProducts = useMemo(() => [...myAds, ...products], [myAds])

  function toggleFavorite(item: ProductItem) {
    const favoriteItem = toFavoriteProduct(item)
    const exists = favorites.some((fav) => fav.id === favoriteItem.id)
    const next = exists
      ? favorites.filter((fav) => fav.id !== favoriteItem.id)
      : [...favorites, favoriteItem]
    setFavorites(next)
    writeFavorites(next)
  }

  function onCreateAd(e: FormEvent) {
    e.preventDefault()
    setFormError('')

    const cleanTitle = adTitle.trim()
    const cleanPlace = adPlace.trim()
    const priceNumber = Number(adPrice)

    if (cleanTitle.length < 3) {
      setFormError('Название должно быть минимум 3 символа.')
      return
    }
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      setFormError('Цена должна быть больше 0.')
      return
    }
    if (cleanPlace.length < 2) {
      setFormError('Укажите город или район.')
      return
    }

    setMyAds((prev) => [{ title: cleanTitle, price: `${priceNumber} ₽`, place: cleanPlace }, ...prev])
    setAdTitle('')
    setAdPrice('')
    setAdPlace('')
    setShowCreateForm(false)
  }

  return (
    <main className="marketHome">
      <header className="marketHeader">
        <div className="marketTopRow">
          <div className="marketTopLinks">
            {topLinks.map((item) => (
              item === 'Помощь' ? (
                <Link key={item} className="topLinkBtn topLinkAnchor" to="/help">
                  {item}
                </Link>
              ) : (
                <button key={item} className="topLinkBtn" type="button">
                  {item}
                </button>
              )
            ))}
          </div>
          <div className="accountActions">
            <Link className="profileBtn" to="/login">
              Вход и регистрация
            </Link>
            <Link className="profileBtn" to="/favorites">
              Избранное
            </Link>
            <Link className="profileBtn" to="/cart">
              Корзина
            </Link>
            <Link className="profileBtn" to="/login">
              Личный кабинет
            </Link>
          </div>
        </div>

        <div className="searchRow">
          <button
            className={`catalogBtn ${showAllCategories ? 'catalogBtnActive' : ''}`}
            type="button"
            onClick={() => setShowAllCategories((prev) => !prev)}
          >
            {showAllCategories ? 'Скрыть категории' : 'Все категории'}
          </button>
          <input className="searchInput" placeholder="Поиск по объявлениям" />
          <button className="searchBtn" type="button">
            Найти
          </button>
        </div>
      </header>

      <div className="homeLayout">
        <div className="homeMain">
          <section className="categoryGrid" aria-label="Категории">
            {visibleCategories.map((item) => (
              <button key={item.title} className="categoryCard" type="button">
                <span className="categoryEmoji">{item.emoji}</span>
                <span>{item.title}</span>
              </button>
            ))}
          </section>

          <section className="filterRow" aria-label="Фильтры">
            {quickFilters.map((filter) => (
              <button key={filter} className="chipBtn chipBtnSoft" type="button">
                {filter}
              </button>
            ))}
          </section>

          <section className="productsBlock">
            <h2 className="homeSectionTitle">Рекомендации для вас</h2>
            <div className="productGrid">
              {allProducts.map((item, index) => {
                const favoriteId = toFavoriteProduct(item).id
                const isFavorite = favorites.some((fav) => fav.id === favoriteId)
                return (
                <article key={`${item.title}-${item.price}-${item.place}-${index}`} className="offerBtn">
                  <button
                    className={`favoriteBtn ${isFavorite ? 'favoriteBtnActive' : ''}`}
                    type="button"
                    onClick={() => toggleFavorite(item)}
                    aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    {isFavorite ? '❤' : '♡'}
                  </button>
                  <div className="productImage" />
                  <span className="offerBtnTitle">{item.title}</span>
                  <span className="offerBtnText productPrice">{item.price}</span>
                  <span className="offerBtnText">{item.place}</span>
                </article>
                )
              })}
            </div>
          </section>
        </div>

        <aside className="rightSidebar">
          <section className="homeBlock">
            <h2 className="homeSectionTitle">Сервисы</h2>
            <div className="chipColumn">
              <button className="chipBtn chipBtnWide" type="button">
                Доставка
              </button>
              <button className="chipBtn chipBtnWide" type="button">
                Безопасная сделка
              </button>
              <Link className="chipBtn chipBtnWide sideLinkBtn" to="/help">
                Помощь
              </Link>
            </div>
          </section>

          <section className="homeBlock">
            <h2 className="homeSectionTitle">Быстрые действия</h2>
            <div className="chipColumn">
              <button
                className="chipBtn chipBtnSoft chipBtnWide"
                type="button"
                onClick={() => setShowCreateForm((prev) => !prev)}
              >
                Разместить объявление
              </button>
              <button className="chipBtn chipBtnSoft chipBtnWide" type="button">
                Подобрать по рейтингу
              </button>
            </div>
            {showCreateForm ? (
              <form className="createAdForm" onSubmit={onCreateAd}>
                <input
                  className="input"
                  placeholder="Название товара"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Цена, ₽"
                  value={adPrice}
                  onChange={(e) => setAdPrice(e.target.value)}
                />
                <input
                  className="input"
                  placeholder="Город"
                  value={adPlace}
                  onChange={(e) => setAdPlace(e.target.value)}
                />
                {formError ? <div className="alert alertWarn">{formError}</div> : null}
                <button className="chipBtn chipBtnWide" type="submit">
                  Опубликовать
                </button>
              </form>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  )
}

