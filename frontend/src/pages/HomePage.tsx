import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clearAuthSession, readCurrentUser } from '../lib/authSession'
import { readFavorites, toFavoriteProduct, writeFavorites } from '../lib/favorites'
import { mockProducts, type ProductItem } from '../lib/mockProducts'

type CategoryItem = {
  title: string
  emoji: string
}

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

export function HomePage() {
  const location = useLocation()
  const cloudCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => readCurrentUser())
  const [favorites, setFavorites] = useState(() => readFavorites())
  const allProducts = useMemo(() => [...mockProducts], [])

  function toggleFavorite(item: ProductItem) {
    const favoriteItem = toFavoriteProduct(item)
    const exists = favorites.some((fav) => fav.id === favoriteItem.id)
    const next = exists
      ? favorites.filter((fav) => fav.id !== favoriteItem.id)
      : [...favorites, favoriteItem]
    setFavorites(next)
    writeFavorites(next)
  }

  function onLogout() {
    clearAuthSession()
    setCurrentUser(null)
  }

  useEffect(() => {
    const canvas = cloudCanvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const FRAME_COUNT = 192
    const SCROLL_SPEED_FACTOR = 0.28
    const images: Array<HTMLImageElement | null> = new Array(FRAME_COUNT).fill(null)
    let rafId = 0
    let currentFrameIndex = 0
    let targetFrameIndex = 0

    const getFrameSrc = (index: number) => {
      const frameNumber = String(index + 1).padStart(5, '0')
      return `/cloud-frames/frame_${frameNumber}.jpg`
    }

    const drawCover = (img: HTMLImageElement) => {
      const width = canvas.width
      const height = canvas.height
      const scale = Math.max(width / img.width, height / img.height)
      const drawWidth = img.width * scale
      const drawHeight = img.height * scale
      const dx = (width - drawWidth) / 2
      const dy = (height - drawHeight) / 2

      ctx.clearRect(0, 0, width, height)
      ctx.globalAlpha = 0.26
      ctx.drawImage(img, dx, dy, drawWidth, drawHeight)
      ctx.globalAlpha = 1
    }

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = window.innerWidth
      const height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const frame = images[currentFrameIndex]
      if (frame && frame.complete) drawCover(frame)
    }

    const drawCurrentFrame = () => {
      const frame = images[currentFrameIndex]
      if (frame && frame.complete) drawCover(frame)
    }

    const animateToTargetFrame = () => {
      if (currentFrameIndex === targetFrameIndex) {
        rafId = 0
        return
      }
      currentFrameIndex += currentFrameIndex < targetFrameIndex ? 1 : -1
      drawCurrentFrame()
      rafId = window.requestAnimationFrame(animateToTargetFrame)
    }

    const renderFromScroll = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
      const slowedProgress = Math.min(progress * SCROLL_SPEED_FACTOR, 1)
      const nextIndex = Math.min(FRAME_COUNT - 1, Math.floor(slowedProgress * (FRAME_COUNT - 1)))
      if (nextIndex === targetFrameIndex) return
      targetFrameIndex = nextIndex
      if (!rafId) {
        rafId = window.requestAnimationFrame(animateToTargetFrame)
      }
    }

    const onScroll = () => {
      renderFromScroll()
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    window.addEventListener('scroll', onScroll, { passive: true })

    for (let i = 0; i < FRAME_COUNT; i += 1) {
      const img = new Image()
      img.src = getFrameSrc(i)
      img.decoding = 'async'
      img.onload = () => {
        images[i] = img
        if (i === 0 && currentFrameIndex === 0) {
          drawCover(img)
        } else if (i === currentFrameIndex || i === targetFrameIndex) {
          drawCover(img)
        }
      }
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('scroll', onScroll)
      if (rafId) window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <main className="marketHome">
      <canvas className="cloudBackdrop" ref={cloudCanvasRef} aria-hidden="true" />
      <div className="marketHomeContent">
      <header className="marketHeader">
        <div className="marketNav">
          <div className="marketBrandWrap">
            <Link className="brandWordmark" to="/">
              NextMarket
            </Link>
            <span className="brandMeta">Маркетплейс для повседневных покупок</span>
          </div>
          <div className="marketNavActions">
            <Link className="menuGhostBtn" to="/favorites">
              Избранное
            </Link>
            <Link className="menuGhostBtn" to="/cart">
              Корзина
            </Link>
            {currentUser ? (
              <>
                <Link className="accountAvatarLink" to="/profile" aria-label="Открыть профиль">
                  <span className="accountAvatar" aria-hidden="true">
                    {currentUser.name[0]?.toUpperCase() || 'U'}
                  </span>
                  <span className="accountAvatarText">Профиль</span>
                </Link>
                <button className="menuGhostBtn logoutBtn" type="button" onClick={onLogout}>
                  Выйти
                </button>
              </>
            ) : (
              <Link className="profileBtn" to="/login">
                Войти
              </Link>
            )}
          </div>
        </div>

        <div className="searchRow">
          <button
            className={`catalogBtn ${showCategoriesMenu ? 'catalogBtnActive' : ''}`}
            type="button"
            onClick={() => setShowCategoriesMenu((prev) => !prev)}
            aria-expanded={showCategoriesMenu}
            aria-controls="categories-menu"
          >
            <span className="catalogBtnIcon" aria-hidden="true">
              ≡
            </span>
            <span>Категории</span>
          </button>
          <input className="searchInput" placeholder="Поиск по объявлениям" />
          <button className="searchBtn" type="button">
            Найти
          </button>
        </div>
        {showCategoriesMenu ? (
          <section id="categories-menu" className="searchCategoriesMenu" aria-label="Категории">
            {categories.map((item) => (
              <button key={item.title} className="searchCategoryChip" type="button">
                <span className="categoryEmoji">{item.emoji}</span>
                <span>{item.title}</span>
              </button>
            ))}
          </section>
        ) : null}
      </header>

      <div className="homeLayout">
        <div className="homeMain">
          <section className="homeHeroSpotlight">
            <div className="heroSpotlightText">
              <span className="heroEyebrow">не витайте в облаках - покупайте выгодно</span>
              <h1 className="heroHeadline">
                Не витайте в облаках - <span className="heroHeadlineAccent">покупайте!</span>
              </h1>
              <p className="heroLead">
                Находите нужное быстрее, покупайте безопаснее.
              </p>
            </div>
            <div className="heroMetrics">
              <article className="metricCard">
                <span className="metricLabel">Активных объявлений</span>
                <strong className="metricValue">24 000+</strong>
              </article>
            </div>
          </section>

          <section className="createCtaRow" aria-label="Размещение объявления">
            <button className="createAdHeroBtn" type="button">
              Разместить объявление
            </button>
          </section>

          <section className="productsBlock">
            <h2 className="homeSectionTitle">Рекомендации для вас</h2>
            <div className="productGrid">
              {allProducts.map((item, index) => {
                const favoriteId = toFavoriteProduct(item).id
                const isFavorite = favorites.some((fav) => fav.id === favoriteId)
                return (
                <article key={`${item.title}-${item.price}-${item.place}-${index}`} className="offerBtn">
                  <Link
                    className="offerMainLink"
                    to={`/products/${item.id}`}
                    state={{ backgroundLocation: location }}
                  >
                    <div className="productMedia">
                      <span className="productBadge">{item.badge}</span>
                      <div className="productImage" />
                    </div>
                    <div className="offerInfo">
                      <span className="offerBtnTitle">{item.title}</span>
                      <div className="offerMetaRow">
                        <span className="offerBtnText productPrice">{item.price}</span>
                        <span className="offerBtnText offerPlace">{item.place}</span>
                      </div>
                    </div>
                  </Link>
                  <button
                    className={`favoriteBtn ${isFavorite ? 'favoriteBtnActive' : ''}`}
                    type="button"
                    onClick={() => toggleFavorite(item)}
                    aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  >
                    {isFavorite ? '❤' : '♡'}
                  </button>
                </article>
                )
              })}
            </div>
          </section>
        </div>
      </div>
      </div>
    </main>
  )
}

