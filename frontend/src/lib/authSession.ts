import type { AuthResponse } from './api'

export type CurrentUser = {
  userId: string
  email: string
  name: string
}

const TOKEN_KEY = 'nm_token'
const USER_KEY = 'nm_user'

export function saveAuthSession(payload: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, payload.token)
  const user: CurrentUser = {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function readCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const user = JSON.parse(raw) as CurrentUser
    if (!user?.userId || !user?.email || !user?.name) return null
    return user
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function hasAuthSession() {
  return Boolean(localStorage.getItem(TOKEN_KEY) && readCurrentUser())
}
