import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { parsePrice, readCart, removeFromCart } from '../lib/cart'

export function CartPage() {
  const [items, setItems] = useState(() => readCart())

  function removeItem(id: string) {
    const next = removeFromCart(id)
    setItems(next)
  }

  useEffect(() => {
    setItems(readCart())
  }, [])

  const totalCount = useMemo(
    () => items.length,
    [items],
  )
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + parsePrice(item.price), 0),
    [items],
  )

  return (
    <main className="marketHome">
      <section className="homeBlock cartBlock">
        <header className="cartHeader">
          <h1 className="homeSectionTitle">Корзина</h1>
          <p className="cartSubtitle">Проверьте товары перед оформлением заказа.</p>
        </header>
        {items.length === 0 ? (
          <div className="cartEmpty">
            <p className="homeCardText">Корзина пока пустая. Добавьте товары из карточек объявлений.</p>
            <p className="homeCardText">
              <Link to="/">Перейти к товарам</Link>
            </p>
          </div>
        ) : (
          <>
            <div className="cartGrid">
              <div className="cartItems">
                {items.map((item) => {
                  return (
                    <article key={item.id} className="cartItemCard">
                      {item.imageUrl ? (
                        <img className="cartItemPreview" src={item.imageUrl} alt={item.title} />
                      ) : (
                        <div className="cartItemPreview" />
                      )}
                      <div className="cartItemMain">
                        <h2 className="cartItemTitle">{item.title}</h2>
                        <p className="cartItemMeta">{item.place}</p>
                        <p className="cartItemPrice">Цена: {item.price}</p>
                      </div>
                      <div className="cartItemActions">
                        <div className="cartItemTotal">{parsePrice(item.price).toLocaleString('ru-RU')} ₽</div>
                        <button className="cartRemoveBtn cartRemoveBtnIcon" type="button" onClick={() => removeItem(item.id)} aria-label="Удалить из корзины">
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path
                              d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9zm1 12h8a2 2 0 0 0 2-2V8H6v11a2 2 0 0 0 2 2z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>

              <aside className="cartSummary">
                <h2 className="cartSummaryTitle">Итого</h2>
                <div className="cartSummaryRow">
                  <span>Товаров</span>
                  <strong>{totalCount}</strong>
                </div>
                <div className="cartSummaryRow">
                  <span>Сумма</span>
                  <strong>{totalPrice.toLocaleString('ru-RU')} ₽</strong>
                </div>
                <button className="productPrimaryBtn" type="button">
                  Оформить заказ
                </button>
              </aside>
            </div>
            <p className="homeCardText cartBackLink">
              <Link to="/">Вернуться на главную</Link>
            </p>
          </>
        )}
      </section>
    </main>
  )
}

