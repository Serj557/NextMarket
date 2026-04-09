import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { api } from '../lib/api'
import { saveAuthSession } from '../lib/authSession'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length >= 4, [email, password])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!canSubmit) return

    setLoading(true)
    try {
      const res = await api.login({ email: email.trim(), password })
      if (!res.ok) {
        setError('error' in res ? res.error : 'Ошибка авторизации')
        return
      }
      saveAuthSession(res.data)
      setSuccess('Успешный вход.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Вход" subtitle="Войдите, чтобы покупать и продавать товары">
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">Email</span>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="label">Пароль</span>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? <div className="alert alertError">{error}</div> : null}
        {success ? <div className="alert alertOk">{success}</div> : null}

        <button className="btn" type="submit" disabled={!canSubmit || loading}>
          {loading ? 'Входим…' : 'Войти'}
        </button>

        <div className="hintRow">
          <span className="muted">Нет аккаунта?</span> <Link to="/register">Зарегистрироваться</Link>
        </div>
      </form>
    </AuthShell>
  )
}

