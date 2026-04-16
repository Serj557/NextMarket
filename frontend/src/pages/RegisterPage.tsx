import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell } from '../components/AuthShell'
import { api } from '../lib/api'
import { saveAuthSession } from '../lib/authSession'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const passwordsMatch = password.length > 0 && password === password2
  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().length > 3 && password.length >= 6 && passwordsMatch
  }, [name, email, password, passwordsMatch])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!canSubmit) return

    setLoading(true)
    try {
      const res = await api.register({ name: name.trim(), email: email.trim(), password })
      if (!res.ok) {
        setError('error' in res ? res.error : 'Ошибка регистрации')
        return
      }
      saveAuthSession(res.data)
      setSuccess('Аккаунт создан.')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Регистрация" subtitle="Создайте аккаунт, чтобы начать">
      <form className="form" onSubmit={onSubmit}>
        <label className="field">
          <span className="label">Имя</span>
          <input
            className="input"
            type="text"
            autoComplete="name"
            placeholder="Сергей"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

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
            autoComplete="new-password"
            placeholder="Минимум 6 символов"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="label">Повтор пароля</span>
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder="Повторите пароль"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </label>

        {!passwordsMatch && password2.length > 0 ? (
          <div className="alert alertWarn">Пароли не совпадают</div>
        ) : null}
        {error ? <div className="alert alertError">{error}</div> : null}
        {success ? <div className="alert alertOk">{success}</div> : null}

        <button className="btn" type="submit" disabled={!canSubmit || loading}>
          {loading ? 'Создаём…' : 'Зарегистрироваться'}
        </button>

        <div className="hintRow">
          <span className="muted">Уже есть аккаунт?</span> <Link to="/login">Войти</Link>
        </div>
      </form>
    </AuthShell>
  )
}

