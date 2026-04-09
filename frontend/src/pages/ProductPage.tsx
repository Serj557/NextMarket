import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addToCart } from '../lib/cart'
import { getMockProductById, mockProducts } from '../lib/mockProducts'

type Props = {
  modal?: boolean
}

export function ProductPage({ modal = false }: Props) {
  const { productId = '' } = useParams()
  const navigate = useNavigate()
  const product = getMockProductById(productId)
  const similarItems = mockProducts.filter((item) => item.id !== productId).slice(0, 3)

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
      price: product.price,
      place: product.place,
    })
    navigate('/cart')
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
          <span className="productBadge productBadgeStatic">{product.badge}</span>
        </header>

        <div className="productLayout">
          <div className="productGallery">
            <div className="productHeroImage" />
            <article className="productDetailsCard productDetailsInline">
              <h2 className="productSectionTitle">Подробности</h2>
              <p className="productFullDescription">{product.fullDescription}</p>
            </article>
          </div>

          <aside className="productSummary">
            <h1 className="productTitle">{product.title}</h1>
            <p className="productSubtitle">{product.description}</p>

            <div className="productPriceBlock">
              <span className="productPriceLabel">Стоимость</span>
              <strong className="productMainPrice">{product.price}</strong>
            </div>

            <div className="productMetaStack">
              <div className="productMetaItem">
                <span className="productMetaLabel">Город</span>
                <span className="productMetaValue">{product.place}</span>
              </div>
              <div className="productMetaItem">
                <span className="productMetaLabel">Расположение</span>
                <span className="productMetaValue">{product.address}</span>
              </div>
              <div className="productMetaItem">
                <span className="productMetaLabel">Продавец</span>
                <span className="productMetaValue">
                  {product.sellerName} · {product.sellerRating}
                </span>
              </div>
              <div className="productMetaItem">
                <span className="productMetaLabel">Опубликовано</span>
                <span className="productMetaValue">
                  {product.postedAt} · {product.views} просмотров
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
                <span className="similarMeta">{item.price} · {item.place}</span>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
