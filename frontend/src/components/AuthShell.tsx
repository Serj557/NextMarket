import { Link } from 'react-router-dom'

type Props = {
  title: string
  subtitle?: string
  active: 'login' | 'register'
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, active, children }: Props) {
  return (
    <div className="page">
      <div className="authCard">
        <header className="authHeader">
          <div className="brand">
            <div className="brandMark" aria-hidden="true" />
            <div className="brandText">
              <div className="brandName">NextMarket</div>
              <div className="brandTagline">Мини‑маркетплейс</div>
            </div>
          </div>
          <h1 className="authTitle">{title}</h1>
          {subtitle ? <p className="authSubtitle">{subtitle}</p> : null}
        </header>

        <nav className="authTabs" aria-label="Вход и регистрация">
          <Link className={active === 'login' ? 'tab tabActive' : 'tab'} to="/login">
            Вход
          </Link>
          <Link className={active === 'register' ? 'tab tabActive' : 'tab'} to="/register">
            Регистрация
          </Link>
        </nav>

        <main className="authBody">{children}</main>

        <footer className="authFooter">
          <span className="muted">
            API: <code className="inlineCode">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}</code>
          </span>
        </footer>
      </div>
    </div>
  )
}

