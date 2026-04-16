import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clearAuthSession, readCurrentUser } from '../lib/authSession'
import { marketplaceCategories } from '../lib/categories'
import { addFavorite, getMyFavorites, removeFavorite } from '../lib/favoritesApi'
import { extractCategory, extractLocation } from '../lib/productDescription'
import { productsApi, type ProductResponse } from '../lib/productsApi'

type CategoryItem = {
  title: string
}

const categories: CategoryItem[] = marketplaceCategories.map((title) => ({ title }))

type ProductItem = {
  id: string
  title: string
  price: string
  place: string
  badge: string
  imageUrl: string | null
  category: string
}

function toHomeCard(item: ProductResponse): ProductItem {
  const category = extractCategory(item.description) || 'Без категории'

  return {
    id: item.id,
    title: item.title,
    price: `${item.price.toLocaleString('ru-RU')} ₽`,
    place: extractLocation(item.description),
    badge: 'Новое',
    imageUrl: item.imageUrls?.[0] ?? null,
    category,
  }
}

export function HomePage() {
  const location = useLocation()
  const cloudCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentUser, setCurrentUser] = useState(() => readCurrentUser())
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [allProducts, setAllProducts] = useState<ProductItem[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([])

  async function toggleFavorite(item: ProductItem) {
    if (!currentUser) return
    const exists = favoriteIds.includes(item.id)
    const res = exists
      ? await removeFavorite(currentUser.userId, item.id)
      : await addFavorite(currentUser.userId, item.id)
    if (!res.ok) return
    setFavoriteIds(res.data.map((x) => x.productId))
  }

  function onLogout() {
    clearAuthSession()
    setCurrentUser(null)
  }

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSearchText(searchInput)
  }

  useEffect(() => {
    let cancelled = false
    let retryTimer: number | undefined

    const loadProducts = async (attempt = 0) => {
      const res = await productsApi.getAll()
      if (cancelled) return
      if (!res.ok) {
        if (attempt < 5) {
          retryTimer = window.setTimeout(() => {
            void loadProducts(attempt + 1)
          }, 1400)
        }
        return
      }
      const next = res.data.map(toHomeCard)
      setAllProducts(next)
      setFilteredProducts(next)
    }

    void loadProducts()

    return () => {
      cancelled = true
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [])

  useEffect(() => {
    if (!currentUser) {
      setFavoriteIds([])
      return
    }
    let cancelled = false
    void (async () => {
      const res = await getMyFavorites(currentUser.userId)
      if (!res.ok || cancelled) return
      setFavoriteIds(res.data.map((x) => x.productId))
    })()
    return () => {
      cancelled = true
    }
  }, [currentUser?.userId])

  useEffect(() => {
    const query = searchText.trim().toLowerCase()
    const next = allProducts.filter((item) => {
      const categoryOk = selectedCategory ? item.category === selectedCategory : true
      if (!query) return categoryOk
      return (
        categoryOk &&
        (item.title.toLowerCase().includes(query) ||
          item.place.toLowerCase().includes(query) ||
          item.category.toLowerCase().includes(query))
      )
    })
    setFilteredProducts(next)
  }, [allProducts, searchText, selectedCategory])

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
            <Link className="menuGhostBtn" to={currentUser ? '/my-products?section=favorites' : '/login'}>
              Избранное
            </Link>
            <Link className="menuGhostBtn" to={currentUser ? '/my-products?section=cart' : '/login'}>
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

        <form className="searchRow" onSubmit={onSearchSubmit}>
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
          <input
            className="searchInput"
            placeholder="Поиск по объявлениям"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button className="searchBtn" type="submit">
            Найти
          </button>
        </form>
        {showCategoriesMenu ? (
          <section id="categories-menu" className="searchCategoriesMenu" aria-label="Категории">
            <button
              className={`searchCategoryChip ${selectedCategory === '' ? 'searchCategoryChipActive' : ''}`}
              type="button"
              onClick={() => setSelectedCategory('')}
            >
              <span>Все категории</span>
            </button>
            {categories.map((item) => (
              <button
                key={item.title}
                className={`searchCategoryChip ${selectedCategory === item.title ? 'searchCategoryChipActive' : ''}`}
                type="button"
                onClick={() => setSelectedCategory(item.title)}
              >
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
                Не <span className="heroFloatWord">витайте</span> в{' '}
                <span className="heroCloudWord">облаках</span> -{' '}
                <span className="heroHeadlineAccent">покупайте!</span>
              </h1>
              <p className="heroLead">
                Находите нужное быстрее, покупайте безопаснее.
              </p>
            </div>
            <div className="heroMetrics">
              <article className="metricCard">
                <span className="metricLabel">Активных объявлений</span>
                <strong className="metricValue">{filteredProducts.length.toLocaleString('ru-RU')}+</strong>
              </article>
            </div>
          </section>

          <section className="createCtaRow" aria-label="Размещение объявления">
            <Link className="createAdHeroBtn createAdHeroLink" to="/my-products?mode=create">
              Разместить объявление
            </Link>
          </section>

          <section className="productsBlock">
            <h2 className="homeSectionTitle">Рекомендации для вас</h2>
            <div className="productGrid">
              {filteredProducts.map((item, index) => {
                const isFavorite = favoriteIds.includes(item.id)
                return (
                <article key={`${item.title}-${item.price}-${item.place}-${index}`} className="offerBtn">
                  <Link
                    className="offerMainLink"
                    to={`/products/${item.id}`}
                    state={{ backgroundLocation: location }}
                  >
                    <div className="productMedia">
                      <span className="productBadge">{item.badge}</span>
                      {item.imageUrl ? (
                        <img className="productImage" src={item.imageUrl} alt={item.title} />
                      ) : (
                        <div className="productImage" />
                      )}
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
            {filteredProducts.length === 0 ? (
              <p className="homeCardText">Ничего не найдено. Попробуйте другой запрос или категорию.</p>
            ) : null}
          </section>
        </div>
      </div>
      </div>
    </main>
  )
}

