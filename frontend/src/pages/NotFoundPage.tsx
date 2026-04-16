import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="marketHome">
      <section className="homeBlock">
        <h1 className="homeSectionTitle">404 — страница не найдена</h1>
        <p className="homeCardText">Проверьте адрес или вернитесь на главную.</p>
        <p className="homeCardText">
          <Link to="/">На главную</Link>
        </p>
      </section>
    </main>
  )
}

