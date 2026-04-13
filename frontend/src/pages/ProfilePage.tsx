import { Link, Navigate } from 'react-router-dom'
import { hasAuthSession, readCurrentUser } from '../lib/authSession'

export function ProfilePage() {
  const user = readCurrentUser()

  if (!hasAuthSession() || !user) {
    return (
      <main className="marketHome">
        <section className="homeBlock">
          <h1 className="homeSectionTitle">Профиль</h1>
          <p className="homeCardText">Вы не авторизованы.</p>
          <p className="homeCardText">
            <Link to="/login">Войти в аккаунт</Link>
          </p>
        </section>
      </main>
    )
  }

  return <Navigate to="/my-products?section=settings" replace />
}
