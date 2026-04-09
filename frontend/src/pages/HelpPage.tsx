import { Link } from 'react-router-dom'

export function HelpPage() {
  return (
    <main className="marketHome">
      <section className="homeBlock">
        <h1 className="homeSectionTitle">Помощь</h1>
        <p className="homeCardText">себе помоги</p>
        <p className="homeCardText">
          <Link to="/">На главную</Link>
        </p>
      </section>
    </main>
  )
}

