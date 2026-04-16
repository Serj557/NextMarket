import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { clearAuthSession, readCurrentUser } from '../lib/authSession'
import { getMyCart, removeFromCartApi, type CartItemDto, updateCartItemQuantityApi } from '../lib/cartApi'
import { getMyFavorites, removeFavorite } from '../lib/favoritesApi'
import { createOrder, getMyOrders, markOrderCompleted } from '../lib/ordersApi'
import { getMyRatings, rateProduct } from '../lib/ratingsApi'
import { marketplaceCategories } from '../lib/categories'
import { formatRub } from '../lib/format'
import {
  productsApi,
  type CreateProductRequest,
  type ProductResponse,
  type UpdateProductRequest,
} from '../lib/productsApi'
import {
  filesToDataUrls,
  toCabinetCartItem,
  toCabinetFavoriteItem,
  toCabinetOrderItem,
  type CabinetCartItem,
  type CabinetFavoriteItem,
  type CabinetOrderItem,
} from './myProducts/cabinetMappers'

const adCategories: string[] = [...marketplaceCategories]

type CabinetSection = 'my-products' | 'favorites' | 'cart' | 'orders' | 'settings'

export function MyProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSection = (searchParams.get('section') as CabinetSection) || 'my-products'
  const isMyProductsSection = selectedSection === 'my-products'
  const createMode = isMyProductsSection && searchParams.get('mode') === 'create'
  const user = readCurrentUser()
  const storageKeyPrefix = useMemo(
    () => (user?.userId ? `nextmarket:reviews:${user.userId}` : 'nextmarket:reviews:anon'),
    [user?.userId],
  )
  const [items, setItems] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState<'used' | 'new'>('used')
  const [saleLocation, setSaleLocation] = useState('')
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stockQty, setStockQty] = useState('1')
  const [cabinetCartItems, setCabinetCartItems] = useState<CabinetCartItem[]>([])
  const [selectedCartIds, setSelectedCartIds] = useState<string[]>([])
  const [cabinetFavoriteItems, setCabinetFavoriteItems] = useState<CabinetFavoriteItem[]>([])
  const [cabinetOrders, setCabinetOrders] = useState<CabinetOrderItem[]>([])
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [ratingByOrderLineId, setRatingByOrderLineId] = useState<Record<string, number>>({})

  const [reviewModal, setReviewModal] = useState<{
    open: boolean
    lineId: string | null
    productId: string | null
  }>({ open: false, lineId: null, productId: null })
  const [reviewRating, setReviewRating] = useState<number>(5)
  const [isSendingReview, setIsSendingReview] = useState(false)

  const isLoggedIn = Boolean(user?.userId)

  useEffect(() => {
    try {
      const rawRatings = localStorage.getItem(`${storageKeyPrefix}:ratings`)
      const parsedRatings = rawRatings ? (JSON.parse(rawRatings) as Record<string, number>) : {}
      setRatingByOrderLineId(parsedRatings && typeof parsedRatings === 'object' ? parsedRatings : {})
    } catch {
      setRatingByOrderLineId({})
    }
  }, [storageKeyPrefix])

  useEffect(() => {
    if (!user?.userId) return
    try {
      localStorage.setItem(`${storageKeyPrefix}:ratings`, JSON.stringify(ratingByOrderLineId))
    } catch {
      // ignore
    }
  }, [ratingByOrderLineId, storageKeyPrefix, user?.userId])

  function onLogout() {
    clearAuthSession()
    navigate('/', { replace: true })
  }

  async function loadMyProducts() {
    if (!user) return
    setLoading(true)
    setError(null)
    const res = await productsApi.getMyProducts(user.userId)
    if (!res.ok) {
      setError('error' in res ? res.error : 'Не удалось загрузить объявления')
      setLoading(false)
      return
    }
    setItems(res.data.filter((item) => item.isActive))
    setLoading(false)
  }

  async function refreshCart() {
    if (!user) return
    const res = await getMyCart(user.userId)
    if (!res.ok) {
      setCabinetCartItems([])
      setSelectedCartIds([])
      return
    }
    const mapped = res.data.map(toCabinetCartItem)
    setCabinetCartItems(mapped)
    setSelectedCartIds((prev) => {
      const prevSet = new Set(prev)
      const next = mapped.filter((x) => !x.isOutOfStock).map((x) => x.id).filter((id) => prevSet.has(id))
      if (next.length > 0) return next
      return mapped.filter((x) => !x.isOutOfStock).map((x) => x.id)
    })
  }

  useEffect(() => {
    void loadMyProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  useEffect(() => {
    if (selectedSection !== 'cart' || !user) return
    let cancelled = false
    void (async () => {
      const res = await getMyCart(user.userId)
      if (cancelled) return
      if (!res.ok) {
        setCabinetCartItems([])
        setSelectedCartIds([])
        return
      }
      const mapped = res.data.map(toCabinetCartItem)
      setCabinetCartItems(mapped)
      setSelectedCartIds((prev) => {
        const prevSet = new Set(prev)
        const next = mapped.filter((x) => !x.isOutOfStock).map((x) => x.id).filter((id) => prevSet.has(id))
        if (next.length > 0) return next
        return mapped.filter((x) => !x.isOutOfStock).map((x) => x.id)
      })
    })()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refreshCart()
    }, 5000)

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshCart()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [selectedSection, user?.userId])

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setCategory('')
    setCondition('used')
    setSaleLocation('')
    setPhotoPreviews([])
    setPhotoFiles([])
    setDescription('')
    setPrice('')
    setStockQty('1')
  }

  function onSelectPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) {
      setPhotoPreviews([])
      setPhotoFiles([])
      return
    }
    const selected = Array.from(files).slice(0, 6)
    const previews = selected.slice(0, 6).map((file) => URL.createObjectURL(file))
    setPhotoPreviews(previews)
    setPhotoFiles(selected)
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return

    const fullDescription = [
      `Категория: ${category}`,
      `Состояние: ${condition === 'new' ? 'Новое' : 'Б/У'}`,
      `Расположение: ${saleLocation.trim()}`,
      '',
      description.trim(),
    ]
      .filter(Boolean)
      .join('\n')

    const normalizedPrice = Number(price.replace(',', '.'))

    const imageUrls = photoFiles.length > 0 ? await filesToDataUrls(photoFiles) : photoPreviews

    const payloadBase = {
      sellerId: user.userId,
      title: title.trim(),
      description: fullDescription,
      price: normalizedPrice,
      stockQty: Number(stockQty),
      imageUrls,
    }

    if (!category || !payloadBase.title || !saleLocation.trim()) {
      setError('Заполните категорию, название и расположение.')
      return
    }
    if (!Number.isFinite(payloadBase.price) || payloadBase.price <= 0) {
      setError('Укажите корректную цену.')
      return
    }
    if (!Number.isInteger(payloadBase.stockQty) || payloadBase.stockQty < 0) {
      setError('Количество на складе должно быть целым числом от 0.')
      return
    }

    setError(null)
    if (editingId) {
      const payload: UpdateProductRequest = { ...payloadBase, isActive: true }
      const res = await productsApi.update(editingId, payload)
      if (!res.ok) return setError('error' in res ? res.error : 'Не удалось обновить объявление')
      resetForm()
      await loadMyProducts()
      return
    } else {
      const payload: CreateProductRequest = payloadBase
      const res = await productsApi.create(payload)
      if (!res.ok) return setError('error' in res ? res.error : 'Не удалось создать объявление')
      if (res.ok) {
        resetForm()
        navigate(`/products/${res.data.id}`)
        return
      }
    }
  }

  function startEdit(item: ProductResponse) {
    setEditingId(item.id)
    setTitle(item.title)
    setCategory('')
    setCondition('used')
    setSaleLocation('')
    setPhotoPreviews(item.imageUrls ?? [])
    setPhotoFiles([])
    setDescription(item.description ?? '')
    setPrice(String(item.price))
    setStockQty(String(item.stockQty))
  }

  async function removeItem(id: string) {
    if (!user) return
    const res = await productsApi.remove(id, user.userId)
    if (!res.ok) return setError('error' in res ? res.error : 'Не удалось удалить объявление')
    setItems((prev) => prev.filter((item) => item.id !== id))
    await loadMyProducts()
  }

  const heading = useMemo(() => {
    if (editingId) return 'Редактирование объявления'
    return 'Добавление объявления'
  }, [editingId])


  const headerBySection = useMemo(() => {
    if (selectedSection === 'favorites') {
      return { title: 'Избранное', subtitle: 'Быстрый доступ к понравившимся товарам.' }
    }
    if (selectedSection === 'cart') {
      return { title: 'Корзина', subtitle: 'Проверьте товары перед оформлением заказа.' }
    }
    if (selectedSection === 'settings') {
      return { title: 'Настройки профиля', subtitle: 'Управление данными аккаунта и безопасностью.' }
    }
    if (selectedSection === 'orders') {
      return { title: 'Мои заказы', subtitle: 'История заказов и состав каждой покупки.' }
    }
    return {
      title: createMode ? 'Размещение объявления' : 'Мои объявления',
      subtitle: createMode
        ? 'Заполните данные объявления и опубликуйте его.'
        : 'Управляйте своими объявлениями в одном месте.',
    }
  }, [createMode, selectedSection])

  function switchSection(section: CabinetSection) {
    resetForm()
    if (section === 'my-products') {
      setSearchParams({})
      return
    }
    setSearchParams({ section })
  }

  function applyCartResponse(items: CartItemDto[]) {
    const mapped = items.map(toCabinetCartItem)
    setCabinetCartItems(mapped)
    setSelectedCartIds((prev) => prev.filter((id) => mapped.some((x) => x.id === id && !x.isOutOfStock)))
  }

  async function loadOrders() {
    if (!user) return
    const res = await getMyOrders(user.userId)
    if (!res.ok) {
      setCabinetOrders([])
      setError('error' in res ? res.error : 'Не удалось загрузить заказы')
      return
    }
    // Pull ratings from backend to keep review state stable after refresh.
    const ratingsRes = await getMyRatings()
    const byProductId: Record<string, number> = {}
    if (ratingsRes.ok) {
      for (const r of ratingsRes.data) {
        byProductId[r.productId] = r.rating
      }
    }

    const nextRatingByLineId: Record<string, number> = {}
    for (const order of res.data) {
      for (const item of order.items) {
        const lineId = `${order.id}:${item.productId}`
        const rating = byProductId[item.productId]
        if (typeof rating === 'number') nextRatingByLineId[lineId] = rating
      }
    }

    if (Object.keys(nextRatingByLineId).length > 0) {
      setRatingByOrderLineId((prev) => ({ ...prev, ...nextRatingByLineId }))
    }

    setCabinetOrders(res.data.map((order) => toCabinetOrderItem(order, { ...ratingByOrderLineId, ...nextRatingByLineId })))
  }

  async function onCheckout() {
    if (!user || cabinetCartItems.length === 0) return
    const selectedItems = cabinetCartItems.filter((item) => selectedCartIds.includes(item.id))
    if (selectedItems.length === 0) {
      setError('Выберите хотя бы один товар в корзине для оформления заказа.')
      return
    }
    setError(null)
    setIsCreatingOrder(true)
    const payload = {
      buyerId: user.userId,
      items: selectedItems.map((x) => ({ productId: x.id, quantity: x.quantity })),
    }
    const res = await createOrder(payload)
    if (!res.ok) {
      setError('error' in res ? res.error : 'Не удалось оформить заказ')
      setIsCreatingOrder(false)
      return
    }
    await markOrderCompleted(res.data.id, user.userId)

    for (const cartItem of selectedItems) {
      // Keep cart and orders consistent after successful checkout.
      await removeFromCartApi(user.userId, cartItem.id)
    }

    await loadOrders()
    const freshCart = await getMyCart(user.userId)
    if (freshCart.ok) {
      const mapped = freshCart.data.map(toCabinetCartItem)
      setCabinetCartItems(mapped)
      setSelectedCartIds(mapped.map((x) => x.id))
    } else {
      setCabinetCartItems([])
      setSelectedCartIds([])
    }
    setSearchParams({ section: 'orders' })
    setIsCreatingOrder(false)
  }

  async function onRateSeller(lineId: string, productId: string, rating: number) {
    if (!user) return
    const res = await rateProduct(productId, rating)
    if (!res.ok) {
      setError('error' in res ? res.error : 'Не удалось сохранить оценку')
      return
    }
    setError(null)
    setRatingByOrderLineId((prev) => ({ ...prev, [lineId]: rating }))
    setCabinetOrders((prev) =>
      prev.map((order) => ({
        ...order,
        lines: order.lines.map((line) => (line.lineId === lineId ? { ...line, rating } : line)),
      })),
    )
  }

  function openReviewModal(lineId: string, productId: string) {
    setReviewRating(ratingByOrderLineId[lineId] ?? 5)
    setReviewModal({ open: true, lineId, productId })
  }

  function closeReviewModal() {
    if (isSendingReview) return
    setReviewModal({ open: false, lineId: null, productId: null })
  }

  async function submitReview() {
    if (!reviewModal.open || !reviewModal.lineId || !reviewModal.productId) return
    if (!user) return

    setIsSendingReview(true)
    try {
      await onRateSeller(reviewModal.lineId, reviewModal.productId, reviewRating)
      setReviewModal({ open: false, lineId: null, productId: null })
    } finally {
      setIsSendingReview(false)
    }
  }

  const selectedItems = useMemo(
    () => cabinetCartItems.filter((item) => selectedCartIds.includes(item.id)),
    [cabinetCartItems, selectedCartIds],
  )
  const selectedTotalLabel = useMemo(() => {
    const total = selectedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    return formatRub(total)
  }, [selectedItems])

  function toggleCartItemSelection(productId: string) {
    const target = cabinetCartItems.find((x) => x.id === productId)
    if (!target || target.isOutOfStock) return
    setSelectedCartIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    )
  }

  function toggleAllCartItems(checked: boolean) {
    const selectable = cabinetCartItems.filter((x) => !x.isOutOfStock).map((x) => x.id)
    setSelectedCartIds(checked ? selectable : [])
  }
  useEffect(() => {
    if (selectedSection !== 'favorites' || !user) return
    let cancelled = false
    void (async () => {
      const res = await getMyFavorites(user.userId)
      if (cancelled) return
      if (!res.ok) return setCabinetFavoriteItems([])
      setCabinetFavoriteItems(res.data.map(toCabinetFavoriteItem))
    })()
    return () => {
      cancelled = true
    }
  }, [selectedSection, user?.userId])

  useEffect(() => {
    if (selectedSection !== 'orders' || !user) return
    void loadOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, user?.userId])

  useEffect(() => {
    if (selectedSection !== 'orders') return
    // re-render ratings in already loaded orders when local storage loads ratings
    setCabinetOrders((prev) =>
      prev.map((order) => ({
        ...order,
        lines: order.lines.map((line) => ({
          ...line,
          rating: ratingByOrderLineId[line.lineId] ?? line.rating,
        })),
      })),
    )
  }, [ratingByOrderLineId, selectedSection])


  if (!isLoggedIn) {
    return (
      <main className="marketHome">
        <section className="homeBlock">
          <h1 className="homeSectionTitle">Мои объявления</h1>
          <p className="homeCardText">Войдите в аккаунт, чтобы управлять своими объявлениями.</p>
          <p className="homeCardText">
            <Link to="/login">Войти</Link>
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="myAdsPage">
      <header className="myAdsTopbar">
        <div className="myAdsTopbarInner">
          <Link className="brandWordmark" to="/">
            NextMarket
          </Link>
          <nav className="myAdsTopLinks" aria-label="Разделы">
            <Link to="/">Главная</Link>
            <Link to="/my-products?section=favorites">Избранное</Link>
            <Link to="/my-products?section=cart">Корзина</Link>
            <Link to="/profile">Профиль</Link>
          </nav>
          <button className="menuGhostBtn logoutBtn" type="button" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </header>

      <section className="myAdsWorkspace">
        <aside className="myAdsSidebar">
          <div className="myAdsProfileCard">
            <div className="myAdsAvatar" aria-hidden="true">
              {user?.name[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <strong className="myAdsProfileName">{user?.name}</strong>
              <p className="myAdsProfileMail">{user?.email}</p>
            </div>
          </div>
          <nav className="myAdsSidebarMenu" aria-label="Меню профиля">
            <Link
              className={`myAdsSidebarLink ${selectedSection === 'my-products' ? 'myAdsSidebarLinkActive' : ''}`}
              to="/my-products"
              onClick={(e) => {
                e.preventDefault()
                switchSection('my-products')
              }}
            >
              Мои объявления
            </Link>
            <Link
              className={`myAdsSidebarLink ${selectedSection === 'favorites' ? 'myAdsSidebarLinkActive' : ''}`}
              to="/my-products?section=favorites"
              onClick={(e) => {
                e.preventDefault()
                switchSection('favorites')
              }}
            >
              Избранное
            </Link>
            <Link
              className={`myAdsSidebarLink ${selectedSection === 'cart' ? 'myAdsSidebarLinkActive' : ''}`}
              to="/my-products?section=cart"
              onClick={(e) => {
                e.preventDefault()
                switchSection('cart')
              }}
            >
              Корзина
            </Link>
            <Link
              className={`myAdsSidebarLink ${selectedSection === 'orders' ? 'myAdsSidebarLinkActive' : ''}`}
              to="/my-products?section=orders"
              onClick={(e) => {
                e.preventDefault()
                switchSection('orders')
              }}
            >
              Заказы
            </Link>
            <Link
              className={`myAdsSidebarLink ${selectedSection === 'settings' ? 'myAdsSidebarLinkActive' : ''}`}
              to="/my-products?section=settings"
              onClick={(e) => {
                e.preventDefault()
                switchSection('settings')
              }}
            >
              Настройки профиля
            </Link>
          </nav>
        </aside>

        <div className="myAdsMain">
          <header className={`myAdsHeader ${selectedSection === 'cart' ? 'wbCartPageHeader' : ''}`}>
            <h1 className={`myAdsTitle ${selectedSection === 'cart' ? 'wbCartPageTitle' : ''}`}>{headerBySection.title}</h1>
            <p className={`myAdsSubtitle ${selectedSection === 'cart' ? 'wbCartPageSubtitle' : ''}`}>{headerBySection.subtitle}</p>
            {isMyProductsSection && !createMode ? (
              <div className="myAdsTabs">
                <span className="myAdsTab myAdsTabActive">Активные {items.length}</span>
              </div>
            ) : null}
          </header>

          {isMyProductsSection && (createMode || editingId) ? (
            <form className="myProductsForm myAdsForm" onSubmit={onSubmit}>
              <h2 className="homeSectionTitle myProductsSubTitle">{heading}</h2>
              <label className="field">
                <span className="label">Категория</span>
                <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Выберите категорию</option>
                  {adCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="label">Название объявления</span>
                <input
                  className="input"
                  placeholder="Например: iPhone 14 Pro 256GB"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <div className="field">
                <span className="label">Состояние</span>
                <div className="myProductsRadioRow">
                  <label className="myProductsRadio">
                    <input
                      type="radio"
                      name="condition"
                      value="used"
                      checked={condition === 'used'}
                      onChange={() => setCondition('used')}
                    />
                    <span>Б/У</span>
                  </label>
                  <label className="myProductsRadio">
                    <input
                      type="radio"
                      name="condition"
                      value="new"
                      checked={condition === 'new'}
                      onChange={() => setCondition('new')}
                    />
                    <span>Новое</span>
                  </label>
                </div>
              </div>

              <label className="field">
                <span className="label">Фотографии (до 6)</span>
                <input
                  className="input myProductsFileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onSelectPhotos}
                />
              </label>
              {photoPreviews.length > 0 ? (
                <div className="myProductsPhotoGrid">
                  {photoPreviews.map((preview, index) => (
                    <img key={`${preview}-${index}`} className="myProductsPhoto" src={preview} alt={`Фото ${index + 1}`} />
                  ))}
                </div>
              ) : null}

              <label className="field">
                <span className="label">Описание</span>
                <textarea
                  className="input"
                  placeholder="Опишите состояние, комплектацию и особенности товара"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </label>

              <label className="field">
                <span className="label">Расположение</span>
                <input
                  className="input"
                  placeholder="Город, район или точка встречи"
                  value={saleLocation}
                  onChange={(e) => setSaleLocation(e.target.value)}
                />
              </label>

              <input
                className="input"
                type="hidden"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
              <label className="field">
                <span className="label">Цена</span>
                <input
                  className="input"
                  placeholder="Цена, ₽"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="label">Количество товара</span>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  placeholder="Например: 3"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                />
              </label>

              <div className="myProductsActions">
                <button className="productPrimaryBtn" type="submit">
                  {editingId ? 'Сохранить изменения' : 'Разместить объявление'}
                </button>
                <button
                  className="productGhostBtn"
                  type="button"
                  onClick={() => {
                    resetForm()
                    setSearchParams({})
                  }}
                >
                  Отменить
                </button>
              </div>
            </form>
          ) : null}

          {error ? <div className="alert alertError">{error}</div> : null}
          {isMyProductsSection && loading ? <p className="homeCardText">Загрузка товаров...</p> : null}

          {isMyProductsSection && !createMode ? (
            <div className="myProductsList myAdsList">
              {items.map((item) => (
                <article key={item.id} className="myProductCard myAdsItemCard">
                  {item.imageUrls?.[0] ? (
                    <img className="myAdsItemPreview" src={item.imageUrls[0]} alt={item.title} />
                  ) : (
                    <div className="myAdsItemPreview" />
                  )}
                  <div className="myAdsItemMain">
                    <h3 className="myProductTitle">{item.title}</h3>
                    <p className="myProductMeta">
                      {item.price.toLocaleString('ru-RU')} ₽ · Остаток: {item.stockQty}
                    </p>
                    <div className="myProductActions">
                      <button className="menuGhostBtn" type="button" onClick={() => startEdit(item)}>
                        Редактировать
                      </button>
                      <button
                        className="logoutBtn menuGhostBtn"
                        type="button"
                        onClick={() => {
                          const confirmed = window.confirm('Удалить объявление безвозвратно?')
                          if (!confirmed) return
                          void removeItem(item.id)
                        }}
                      >
                        Удалить
                      </button>
                      <Link className="menuGhostBtn" to={`/products/${item.id}`}>
                        Детали
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {selectedSection === 'favorites' ? (
            <div className="myProductsList myAdsList">
              {cabinetFavoriteItems.length === 0 ? (
                <article className="myProductCard">
                  <div>
                    <h3 className="myProductTitle">Избранное пусто</h3>
                    <p className="myProductDesc">Добавляйте товары в избранное, чтобы они отображались здесь.</p>
                  </div>
                </article>
              ) : (
                cabinetFavoriteItems.map((item) => (
                  <article key={item.id} className="myProductCard myAdsItemCard">
                    {item.imageUrl ? (
                      <img className="myAdsItemPreview" src={item.imageUrl} alt={item.title} />
                    ) : (
                      <div className="myAdsItemPreview" />
                    )}
                    <div className="myAdsItemMain">
                      <h3 className="myProductTitle">{item.title}</h3>
                      <p className="myProductMeta">{item.priceLabel} · {item.place}</p>
                      <div className="myProductActions">
                        <button
                          className="logoutBtn menuGhostBtn"
                          type="button"
                          onClick={async () => {
                            if (!user) return
                            const res = await removeFavorite(user.userId, item.id)
                            if (!res.ok) return
                            setCabinetFavoriteItems(res.data.map(toCabinetFavoriteItem))
                          }}
                        >
                          Удалить
                        </button>
                        <Link className="menuGhostBtn" to="/">
                          Открыть каталог
                        </Link>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {selectedSection === 'cart' ? (
            <section className="wbCartLayout">
              <div className="wbCartMain">
                {cabinetCartItems.length === 0 ? (
                  <article className="myProductCard">
                    <div>
                      <h3 className="myProductTitle">Корзина пуста</h3>
                      <p className="myProductDesc">Добавьте товары из объявлений, чтобы оформить заказ.</p>
                    </div>
                  </article>
                ) : (
                  <article className="wbCartBlock">
                    <header className="wbCartBlockHead">
                      <h3 className="wbCartBlockTitle">Магазин · товары</h3>
                      <label className="myAdsCheckboxLabel">
                        <input
                          type="checkbox"
                          checked={cabinetCartItems.length > 0 && selectedCartIds.length === cabinetCartItems.length}
                          onChange={(e) => toggleAllCartItems(e.target.checked)}
                        />
                        <span>Выбрать все</span>
                      </label>
                    </header>
                    <div className="wbCartItems">
                      {cabinetCartItems.map((item) => (
                        <article key={item.id} className={`wbCartItemRow ${item.isOutOfStock ? 'wbCartItemRowMuted' : ''}`}>
                          <label className="myAdsCheckboxLabel myAdsCheckboxLabelInline">
                            <input
                              type="checkbox"
                              checked={selectedCartIds.includes(item.id)}
                              disabled={item.isOutOfStock}
                              onChange={() => toggleCartItemSelection(item.id)}
                            />
                          </label>
                          {item.imageUrl ? (
                            <img className="myAdsItemPreview wbCartPreview" src={item.imageUrl} alt={item.title} />
                          ) : (
                            <div className="myAdsItemPreview wbCartPreview" />
                          )}
                          <div className="wbCartInfo">
                            <h4 className="myProductTitle">{item.title}</h4>
                            <p className="myProductMeta">{item.place}</p>
                            <p className="myProductMeta">
                              {item.isOutOfStock ? 'Товар закончился' : `В корзине: ${item.quantity} шт.`}
                            </p>
                            <button
                              className="logoutBtn menuGhostBtn wbCartRemoveBtn"
                              type="button"
                              onClick={async () => {
                                if (!user) return
                                const res = await removeFromCartApi(user.userId, item.id)
                                if (!res.ok) return
                                applyCartResponse(res.data)
                                setSelectedCartIds((prev) => prev.filter((id) => id !== item.id))
                              }}
                            >
                              Удалить
                            </button>
                          </div>
                          <div className="wbCartQty">
                            <div className="wbQtyLabel">Количество</div>
                            <div className="wbQtyStepper" aria-label="Количество товара">
                              <button
                                type="button"
                                className="wbQtyBtn"
                                disabled={item.isOutOfStock || item.quantity <= 1}
                                onClick={async () => {
                                  if (!user || item.isOutOfStock || item.quantity <= 1) return
                                  const res = await updateCartItemQuantityApi(user.userId, item.id, item.quantity - 1)
                                  if (!res.ok) {
                                    setError('error' in res ? res.error : 'Не удалось обновить количество')
                                    void refreshCart()
                                    return
                                  }
                                  setError(null)
                                  applyCartResponse(res.data)
                                }}
                                aria-label="Уменьшить количество"
                              >
                                −
                              </button>
                              <span className="wbQtyValue">{item.quantity}</span>
                              <button
                                type="button"
                                className="wbQtyBtn"
                                disabled={item.isOutOfStock || item.quantity >= item.stockQty}
                                onClick={async () => {
                                  if (!user || item.isOutOfStock || item.quantity >= item.stockQty) return
                                  const res = await updateCartItemQuantityApi(user.userId, item.id, item.quantity + 1)
                                  if (!res.ok) {
                                    setError('error' in res ? res.error : 'Не удалось обновить количество')
                                    void refreshCart()
                                    return
                                  }
                                  setError(null)
                                  applyCartResponse(res.data)
                                }}
                                aria-label="Увеличить количество"
                              >
                                +
                              </button>
                            </div>
                            <strong className="wbCartLinePrice">
                              {(item.unitPrice * item.quantity).toLocaleString('ru-RU')} ₽
                            </strong>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                )}
                {cabinetCartItems.length > 0 ? (
                  <article className="wbCartBlock">
                    <h3 className="wbCartBlockTitle">Способ доставки</h3>
                    <p className="myProductDesc">Выбрать адрес доставки</p>
                  </article>
                ) : null}
              </div>

              {cabinetCartItems.length > 0 ? (
                <aside className="wbCartSummary">
                  <h3 className="wbCartSummaryTitle">Итого</h3>
                  <p className="wbCartSummaryMeta">Выбрано товаров: {selectedItems.length}</p>
                  <div className="wbCartSummaryTotal">{selectedTotalLabel}</div>
                  <button className="productPrimaryBtn wbCartOrderBtn" type="button" onClick={onCheckout} disabled={isCreatingOrder}>
                    {isCreatingOrder ? 'Оформляем...' : 'Оформить заказ'}
                  </button>
                </aside>
              ) : null}
            </section>
          ) : null}

          {selectedSection === 'orders' ? (
            <div className="myProductsList myAdsList">
              {cabinetOrders.length === 0 ? (
                <article className="myProductCard">
                  <div>
                    <h3 className="myProductTitle">Заказов пока нет</h3>
                    <p className="myProductDesc">Оформленные покупки будут отображаться в этом разделе.</p>
                  </div>
                </article>
              ) : (
                cabinetOrders.map((order) => (
                  <article key={order.id} className="myProductCard">
                    <div>
                      <h3 className="myProductTitle">Заказ #{order.id.slice(0, 8)}</h3>
                      <p className="myProductMeta">
                        Статус: {order.statusLabel} · Позиций: {order.itemsCount} · Сумма: {order.totalPriceLabel}
                      </p>
                      <p className="myProductDesc">
                        Создан: {order.createdAtLabel}
                        {order.completedAtLabel ? ` · Завершен: ${order.completedAtLabel}` : ''}
                      </p>
                      <div className="myAdsOrderLines">
                        {order.lines.map((line) => (
                          <div key={`${order.id}-${line.productId}`} className="myAdsOrderLineCard">
                            <p className="myAdsOrderLine">
                              {line.quantity} × {line.unitPriceLabel} = {line.lineTotalLabel}
                            </p>
                            <div className="myAdsOrderRatingRow">
                              <span>
                                {typeof line.rating === 'number' ? `Отзыв: ★ ${line.rating}` : 'Отзыв'}
                              </span>
                              <button
                                className="menuGhostBtn"
                                type="button"
                                onClick={() => openReviewModal(line.lineId, line.productId)}
                              >
                                {typeof line.rating === 'number' ? 'Изменить отзыв' : 'Оставить отзыв'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="myProductActions">
                      <Link className="menuGhostBtn" to="/">
                        В каталог
                      </Link>
                    </div>
                  </article>
                ))
              )}
            </div>
          ) : null}

          {selectedSection === 'settings' ? (
            <div className="myProductsList myAdsList">
              <article className="myProductCard">
                <div>
                  <h3 className="myProductTitle">Данные аккаунта</h3>
                  <p className="myProductMeta">{user?.name}</p>
                  <p className="myProductDesc">{user?.email}</p>
                </div>
                <div className="myProductActions">
                  <Link className="menuGhostBtn" to="/my-products">
                    К объявлениям
                  </Link>
                  <button className="logoutBtn menuGhostBtn" type="button" onClick={onLogout}>
                    Выйти из аккаунта
                  </button>
                </div>
              </article>
            </div>
          ) : null}
        </div>
      </section>

      {reviewModal.open ? (
        <div
          className="myAdsModalOverlay"
          role="dialog"
          aria-modal="true"
          aria-label={reviewModal.lineId && typeof ratingByOrderLineId[reviewModal.lineId] === 'number' ? 'Изменить отзыв' : 'Оставить отзыв'}
          onClick={closeReviewModal}
        >
          <div className="myAdsModal" onClick={(e) => e.stopPropagation()}>
            <h3 className="myProductTitle">
              {reviewModal.lineId && typeof ratingByOrderLineId[reviewModal.lineId] === 'number'
                ? 'Изменить отзыв'
                : 'Оставить отзыв'}
            </h3>
            <p className="myProductDesc">Выберите оценку от 1 до 5 и отправьте.</p>
            <div className="myAdsOrderStars" aria-label="Оценка">
              {[1, 2, 3, 4, 5].map((score) => (
                <button
                  key={`modal-score-${score}`}
                  className={`myAdsStarBtn ${reviewRating >= score ? 'myAdsStarBtnActive' : ''}`}
                  type="button"
                  onClick={() => setReviewRating(score)}
                  disabled={isSendingReview}
                >
                  ★
                </button>
              ))}
            </div>
            <div className="myProductsActions" style={{ marginTop: 12 }}>
              <button className="productPrimaryBtn" type="button" onClick={() => void submitReview()} disabled={isSendingReview}>
                {isSendingReview ? 'Отправляем…' : 'Отправить'}
              </button>
              <button className="productGhostBtn" type="button" onClick={closeReviewModal} disabled={isSendingReview}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
