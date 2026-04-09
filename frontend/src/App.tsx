import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CartPage } from './pages/CartPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HelpPage } from './pages/HelpPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProductPage } from './pages/ProductPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'

export function App() {
  const location = useLocation()
  const { pathname } = location
  const state = location.state as { backgroundLocation?: Location } | null

  useEffect(() => {
    const isAuthRoute = pathname === '/login' || pathname === '/register'
    const isCartRoute = pathname === '/cart'
    document.body.classList.toggle('auth-clouds-active', isAuthRoute)
    document.body.classList.toggle('cart-clouds-active', isCartRoute)
  }, [pathname])

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {state?.backgroundLocation ? (
        <Routes>
          <Route path="/products/:productId" element={<ProductPage modal />} />
        </Routes>
      ) : null}
    </>
  )
}

