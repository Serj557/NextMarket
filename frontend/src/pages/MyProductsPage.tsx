import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { clearAuthSession, readCurrentUser } from '../lib/authSession'
import { readCart } from '../lib/cart'
import { readFavorites } from '../lib/favorites'
import {
  productsApi,
  type CreateProductRequest,
  type ProductResponse,
  type UpdateProductRequest,
} from '../lib/productsApi'

const adCategories: string[] = [
  'Авто',
  'Недвижимость',
  'Работа',
  'Одежда',
  'Хобби',
  'Животные',
  'Услуги',
  'Электроника',
]

type CabinetSection = 'my-products' | 'favorites' | 'cart' | 'settings'

export function MyProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSection = (searchParams.get('section') as CabinetSection) || 'my-products'
  const isMyProductsSection = selectedSection === 'my-products'
  const createMode = isMyProductsSection && searchParams.get('mode') === 'create'
  const user = readCurrentUser()
  const [items, setItems] = useState<ProductResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState<'used' | 'new'>('used')
  const [saleLocation, setSaleLocation] = useState('')
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stockQty, setStockQty] = useState('1')
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [cartCount, setCartCount] = useState(0)

  const isLoggedIn = Boolean(user?.userId)

  function onLogout() {
    clearAuthSession()
    window.location.href = '/'
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
    setItems(res.data)
    setLoading(false)
  }

  useEffect(() => {
    void loadMyProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId])

  useEffect(() => {
    setFavoriteCount(readFavorites().length)
    setCartCount(readCart().length)
  }, [selectedSection])

  function resetForm() {
    setEditingId(null)
    setTitle('')
    setCategory('')
    setCondition('used')
    setSaleLocation('')
    setPhotoPreviews([])
    setDescription('')
    setPrice('')
    setStockQty('1')
  }

  function onSelectPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) {
      setPhotoPreviews([])
      return
    }
    const previews = Array.from(files)
      .slice(0, 6)
      .map((file) => URL.createObjectURL(file))
    setPhotoPreviews(previews)
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

    const payloadBase = {
      sellerId: user.userId,
      title: title.trim(),
      description: fullDescription,
      price: normalizedPrice,
      stockQty: Number(stockQty),
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
    setPhotoPreviews([])
    setDescription(item.description ?? '')
    setPrice(String(item.price))
    setStockQty(String(item.stockQty))
  }

  async function removeItem(id: string) {
    if (!user) return
    const res = await productsApi.remove(id, user.userId)
    if (!res.ok) return setError('error' in res ? res.error : 'Не удалось удалить объявление')
    await loadMyProducts()
  }

  const heading = useMemo(() => {
    if (editingId) return 'Редактирование объявления'
    return 'Добавление объявления'
  }, [editingId])

  const draftCount = useMemo(() => items.filter((x) => !x.isActive).length, [items])

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
            <Link to="/favorites">Избранное</Link>
            <Link to="/cart">Корзина</Link>
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
          <header className="myAdsHeader">
            <h1 className="myAdsTitle">{headerBySection.title}</h1>
            <p className="myAdsSubtitle">{headerBySection.subtitle}</p>
            {isMyProductsSection && !createMode ? (
              <div className="myAdsTabs">
                <span className="myAdsTab myAdsTabActive">Активные {items.length}</span>
                <span className="myAdsTab">Черновики {draftCount}</span>
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
                  <div className="myAdsItemPreview" />
                  <div className="myAdsItemMain">
                    <h3 className="myProductTitle">{item.title}</h3>
                    <p className="myProductMeta">
                      {item.price.toLocaleString('ru-RU')} ₽ · Остаток: {item.stockQty}
                    </p>
                    {item.description ? <p className="myProductDesc">{item.description}</p> : null}
                    <div className="myProductActions">
                      <button className="menuGhostBtn" type="button" onClick={() => startEdit(item)}>
                        Редактировать
                      </button>
                      <button className="logoutBtn menuGhostBtn" type="button" onClick={() => removeItem(item.id)}>
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
              <article className="myProductCard">
                <div>
                  <h3 className="myProductTitle">Избранные товары</h3>
                  <p className="myProductMeta">Сохранено товаров: {favoriteCount}</p>
                  <p className="myProductDesc">Список избранного открывается в отдельном разделе каталога.</p>
                </div>
                <div className="myProductActions">
                  <Link className="menuGhostBtn" to="/favorites">
                    Перейти в избранное
                  </Link>
                </div>
              </article>
            </div>
          ) : null}

          {selectedSection === 'cart' ? (
            <div className="myProductsList myAdsList">
              <article className="myProductCard">
                <div>
                  <h3 className="myProductTitle">Корзина</h3>
                  <p className="myProductMeta">Товаров в корзине: {cartCount}</p>
                  <p className="myProductDesc">Проверьте список и оформите заказ в отдельной корзине.</p>
                </div>
                <div className="myProductActions">
                  <Link className="menuGhostBtn" to="/cart">
                    Перейти в корзину
                  </Link>
                </div>
              </article>
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
    </main>
  )
}
