import { Link } from 'react-router-dom'

export function CartPage() {
  return (
    <main className="marketHome">
      <section className="homeBlock">
        <h1 className="homeSectionTitle">Корзина</h1>
        <p className="homeCardText">Здесь будут выбранные товары перед оформлением заказа.</p>
        <p className="homeCardText">
          <Link to="/">Вернуться на главную</Link>
        </p>
      </section>
    </main>
  )
}

