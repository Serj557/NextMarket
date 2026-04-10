import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addToCart } from '../lib/cart'
import { productsApi, type ProductResponse } from '../lib/productsApi'

type Props = {
  modal?: boolean
}

export function ProductPage({ modal = false }: Props) {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [similarItems, setSimilarItems] = useState<ProductResponse[]>([])

  const locationText = useMemo(() => {
    if (!product?.description) return 'Не указано'
    const line = product.description
      .split('\n')
      .find((x) => x.trim().toLowerCase().startsWith('расположение:'))
    return line ? line.replace(/расположение:\s*/i, '').trim() || 'Не указано' : 'Не указано'
  }, [product])

  const detailsText = useMemo(() => {
    if (!product?.description) return 'Описание пока не заполнено.'
    return product.description
      .split('\n')
      .filter((x) => !x.trim().toLowerCase().startsWith('расположение:'))
      .join('\n')
      .trim()
  }, [product])

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
    if (!modal) return
    document.body.classList.add('product-modal-open')
    return () => {
      document.body.classList.remove('product-modal-open')
    }
  }, [modal])

  function onAddToCart() {
    if (!product) return
    addToCart({
      id: product.id,
      title: product.title,
      price: `${product.price.toLocaleString('ru-RU')} ₽`,
      place: locationText,
    })
    navigate('/cart')
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
            <div className="productHeroImage" />
            <article className="productDetailsCard productDetailsInline">
              <h2 className="productSectionTitle">Подробности</h2>
              <p className="productFullDescription">{detailsText}</p>
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
                <span className="productMetaValue">
                  ID продавца: {product.sellerId.slice(0, 8)}
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
              <button className="productPrimaryBtn" type="button">
                Написать продавцу
              </button>
              <button className="productGhostBtn" type="button" onClick={onAddToCart}>
                Добавить в корзину
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
    </main>
  )
}
