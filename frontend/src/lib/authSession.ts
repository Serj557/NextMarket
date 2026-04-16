import type { AuthResponse } from './api'

export type CurrentUser = {
  userId: string
  email: string
  name: string
}

const TOKEN_KEY = 'nm_token'

export function saveAuthSession(payload: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, payload.token)
}

export function readCurrentUser(): CurrentUser | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return null
    return readUserFromJwt(token)
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY)
  // backwards-compat cleanup (older versions)
  localStorage.removeItem('nm_user')
}

export function hasAuthSession() {
  return Boolean(localStorage.getItem(TOKEN_KEY) && readCurrentUser())
}

export function readAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

type JwtPayload = {
  sub?: string
  nameid?: string
  email?: string
  name?: string
  exp?: number
}

function readUserFromJwt(token: string): CurrentUser | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  const payloadJson = base64UrlDecode(parts[1])
  const payload = JSON.parse(payloadJson) as JwtPayload

  const userId = payload.nameid || payload.sub
  const email = payload.email
  const name = payload.name

  if (!userId || !email || !name) return null
  return { userId, email, name }
}

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
  return atob(base64 + pad)
}
