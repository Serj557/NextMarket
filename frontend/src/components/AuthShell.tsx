import { Link } from 'react-router-dom'

type Props = {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <div className="page authPage">
      <div className="authCard">
        <header className="authHeader">
          <Link className="backBtn" to="/">
            ← Назад
          </Link>
          <h1 className="authTitle">{title}</h1>
          {subtitle ? <p className="authSubtitle">{subtitle}</p> : null}
        </header>

        <main className="authBody">{children}</main>
      </div>
    </div>
  )
}

