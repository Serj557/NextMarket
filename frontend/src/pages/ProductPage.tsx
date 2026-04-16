import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { readCurrentUser } from '../lib/authSession'
import { addToCartApi, getMyCart } from '../lib/cartApi'
import { productsApi, type ProductResponse } from '../lib/productsApi'
import { getUserById } from '../lib/usersApi'

type Props = {
  modal?: boolean
}

function parseDescription(description?: string | null) {
  if (!description) {
    return {
      category: 'Не указана',
      condition: 'Не указано',
      location: 'Не указано',
      text: 'Описание пока не заполнено.',
    }
  }

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
    category: categoryLine?.replace(/категория:\s*/i, '').trim() || 'Не указана',
    condition: conditionLine?.replace(/состояние:\s*/i, '').trim() || 'Не указано',
    location: locationLine?.replace(/расположение:\s*/i, '').trim() || 'Не указано',
    text: text || 'Описание пока не заполнено.',
  }
}

export function ProductPage({ modal = false }: Props) {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [similarItems, setSimilarItems] = useState<ProductResponse[]>([])
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(1)
  const [sellerNameResolved, setSellerNameResolved] = useState<string>('')
  const [sellerRatingResolved, setSellerRatingResolved] = useState<number | null>(null)
  const productImages = useMemo(() => product?.imageUrls ?? [], [product?.imageUrls])
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const imageUrl = productImages[activeImageIndex] ?? null

  const parsedDetails = useMemo(() => parseDescription(product?.description), [product?.description])
  const locationText = parsedDetails.location
  const isOutOfStock = (product?.stockQty ?? 0) <= 0

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setIsLoading(true)
      const [byIdRes, allRes] = await Promise.all([
        productsApi.getById(productId),
        productsApi.getAll(),
      ])
      if (!cancelled && byIdRes.ok) setProduct(byIdRes.data)
      if (!cancelled && allRes.ok) {
        setSimilarItems(allRes.data.filter((item) => item.id !== productId).slice(0, 3))
      }
      if (!cancelled) setIsLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    setActiveImageIndex(0)
  }, [productId, productImages.length])

  useEffect(() => {
    if (!product) return
    setCartQuantity(product.stockQty > 0 ? 1 : 0)
  }, [product?.id, product?.stockQty])

  useEffect(() => {
    if (!product) return
    setSellerNameResolved(product.sellerName || '')
    setSellerRatingResolved(typeof product.sellerRating === 'number' ? product.sellerRating : null)

    const needsName = !product.sellerName
    const needsRating = typeof product.sellerRating !== 'number'
    if (!needsName && !needsRating) return

    let cancelled = false
    void (async () => {
      if (needsName) {
        const userRes = await getUserById(product.sellerId)
        if (!cancelled && userRes.ok) {
          setSellerNameResolved(userRes.data.name)
        }
      }

      if (needsRating) {
        const allRes = await productsApi.getAll()
        if (!cancelled && allRes.ok) {
          const sellerProducts = allRes.data.filter((x) => x.sellerId === product.sellerId)
          const rated = sellerProducts
            .map((x) => x.averageRating)
            .filter((x): x is number => typeof x === 'number')
          const avg = rated.length > 0 ? rated.reduce((sum, value) => sum + value, 0) / rated.length : null
          setSellerRatingResolved(avg)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [product?.id, product?.sellerId, product?.sellerName, product?.sellerRating])

  useEffect(() => {
    if (!modal) return
    document.body.classList.add('product-modal-open')
    return () => {
      document.body.classList.remove('product-modal-open')
    }
  }, [modal])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  async function onAddToCart(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.preventDefault()
    e?.stopPropagation()
    if (!product) return
    if (isOutOfStock) {
      setToast({ type: 'error', message: 'Товар закончился и сейчас недоступен для покупки.' })
      return
    }
    setToast(null)
    const user = readCurrentUser()
    if (!user) {
      navigate('/login')
      return
    }
    setIsAddingToCart(true)
    const safeQty = Math.max(1, Math.min(cartQuantity || 1, Math.max(product.stockQty, 1)))
    const res = await addToCartApi({
      buyerId: user.userId,
      productId: product.id,
      quantity: safeQty,
    })
    if (!res.ok) {
      const message = 'error' in res ? res.error : 'Не удалось добавить товар в корзину. Попробуйте еще раз.'
      setToast({ type: 'error', message })
      setIsAddingToCart(false)
      return
    }

    const cartCheck = await getMyCart(user.userId)
    const isAdded = cartCheck.ok && cartCheck.data.some((item) => item.productId === product.id)
    setToast(
      isAdded
        ? { type: 'success', message: `Товар добавлен в корзину (${safeQty} шт.).` }
        : { type: 'error', message: 'Товар не появился в корзине. Обновите страницу и попробуйте снова.' },
    )
    setIsAddingToCart(false)
  }

  function onOpenCartFromToast(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault()
    setToast(null)
    navigate('/my-products?section=cart')
  }

  if (isLoading) {
    return (
      <main className="productPage">
        <section className="productShell">
          <div className="productNotFound">
            <h1 className="productTitle">Загрузка объявления...</h1>
          </div>
        </section>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="productPage">
        <section className="productShell">
          <div className="productNotFound">
            <h1 className="productTitle">Товар не найден</h1>
            <p className="productSubtitle">Возможно, объявление снято с публикации или ссылка устарела.</p>
            <Link className="productBackBtn" to="/">
              ← Вернуться на главную
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main
      className={modal ? 'productPage productPageModal' : 'productPage'}
      onClick={modal ? () => navigate(-1) : undefined}
    >
      <section
        className={modal ? 'productShell productShellModal' : 'productShell'}
        onClick={modal ? (e) => e.stopPropagation() : undefined}
      >
        <header className="productTopBar">
          {modal ? (
            <button className="productBackBtn productBackBtnPlain" type="button" onClick={() => navigate(-1)}>
              ✕ Закрыть
            </button>
          ) : (
            <Link className="productBackBtn" to="/">
              ← Назад к ленте
            </Link>
          )}
          <span className="productBadge productBadgeStatic">Объявление</span>
        </header>

        <div className="productLayout">
          <div className="productGallery">
            {imageUrl ? (
              <img className="productHeroImage" src={imageUrl} alt={product.title} />
            ) : (
              <div className="productHeroImage" />
            )}
            {productImages.length > 1 ? (
              <div className="productThumbRow" aria-label="Галерея фото">
                {productImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    className={`productThumbBtn ${activeImageIndex === index ? 'productThumbBtnActive' : ''}`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    aria-label={`Фото ${index + 1}`}
                  >
                    <img className="productThumbImage" src={img} alt="" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : null}
            <article className="productDetailsCard productDetailsInline">
              <h2 className="productSectionTitle">Подробности</h2>
              <div className="productDetailsParams">
                <p className="productDetailLine">
                  <span>Категория</span>
                  <strong>{parsedDetails.category}</strong>
                </p>
                <p className="productDetailLine">
                  <span>Состояние</span>
                  <strong>{parsedDetails.condition}</strong>
                </p>
                <p className="productDetailLine">
                  <span>Расположение</span>
                  <strong>{parsedDetails.location}</strong>
                </p>
              </div>
              <div className="productDescriptionBlock">
                <h3 className="productDescriptionTitle">Описание</h3>
                <p className="productFullDescription">{parsedDetails.text}</p>
              </div>
            </article>
          </div>

          <aside className="productSummary">
            <h1 className="productTitle">{product.title}</h1>
            <p className="productSubtitle">Находите нужное быстрее, покупайте безопаснее.</p>

            <div className="productPriceBlock">
              <span className="productPriceLabel">Стоимость</span>
              <strong className="productMainPrice">{product.price.toLocaleString('ru-RU')} ₽</strong>
            </div>

            <div className="productMetaStack">
              <div className="productMetaItem">
                <span className="productMetaLabel">Город</span>
                <span className="productMetaValue">{locationText}</span>
              </div>
              <div className="productMetaItem">
                <span className="productMetaLabel">Расположение</span>
                <span className="productMetaValue">{locationText}</span>
              </div>
              <div className="productMetaItem">
                <span className="productMetaLabel">Продавец</span>
                <span className="productMetaValue productSellerLine">
                  <span>{sellerNameResolved || `Пользователь ${product.sellerId.slice(0, 8)}`}</span>
                  {typeof sellerRatingResolved === 'number' ? (
                    <span className="productSellerRatingBadge">★ {sellerRatingResolved.toFixed(1)}</span>
                  ) : null}
                </span>
              </div>
              <div className="productMetaItem">
                <span className="productMetaLabel">Опубликовано</span>
                <span className="productMetaValue">
                  {new Date(product.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>

            <div className="productActions">
              {product.stockQty > 1 ? (
                <label className="productQtyControl">
                  <span>Количество</span>
                  <input
                    className="input"
                    type="number"
                    min={1}
                    max={product.stockQty}
                    step={1}
                    value={cartQuantity}
                    onChange={(e) => {
                      const next = Number(e.target.value)
                      if (!Number.isFinite(next)) return
                      setCartQuantity(Math.max(1, Math.min(next, product.stockQty)))
                    }}
                  />
                </label>
              ) : null}
              {isOutOfStock ? (
                <div className="productStockBanner" role="status" aria-live="polite">
                  Товар закончился - сейчас нет в наличии
                </div>
              ) : null}
              <button className="productPrimaryBtn" type="button">
                Написать продавцу
              </button>
              <button
                className="productGhostBtn"
                type="button"
                onClick={onAddToCart}
                disabled={isAddingToCart || isOutOfStock}
                data-action="add-to-cart"
              >
                {isOutOfStock ? 'Нет в наличии' : isAddingToCart ? 'Добавляем...' : 'Добавить в корзину'}
              </button>
            </div>
          </aside>
        </div>

        <section className="productSimilarSection">
          <h2 className="productSectionTitle">Похожие объявления</h2>
          <div className="productSimilarGrid">
            {similarItems.map((item) => (
              <Link key={item.id} className="similarCard" to={`/products/${item.id}`}>
                <div className="similarImage" />
                <span className="similarTitle">{item.title}</span>
                <span className="similarMeta">{item.price.toLocaleString('ru-RU')} ₽</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
      {toast ? (
        <div className={`appToast ${toast.type === 'success' ? 'appToastSuccess' : 'appToastError'}`}>
          {toast.message}
          {toast.type === 'success' ? (
            <>
              {' '}
              <Link to="/my-products?section=cart" onClick={onOpenCartFromToast}>
                Открыть корзину
              </Link>
            </>
          ) : null}
        </div>
      ) : null}
    </main>
  )
}
