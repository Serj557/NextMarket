import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MyProductsPage } from './pages/MyProductsPage'
import { ProductPage } from './pages/ProductPage'
import { ProfilePage } from './pages/ProfilePage'
import { RegisterPage } from './pages/RegisterPage'

export function App() {
  const location = useLocation()
  const { pathname } = location
  const state = location.state as { backgroundLocation?: Location } | null

  useEffect(() => {
    const isAuthRoute = pathname === '/login' || pathname === '/register'
    document.body.classList.toggle('auth-clouds-active', isAuthRoute)
    document.body.classList.remove('cart-clouds-active')
  }, [pathname])

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/my-products" element={<MyProductsPage />} />
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

