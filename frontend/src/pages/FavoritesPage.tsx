import { useState } from 'react'
import { Link } from 'react-router-dom'
import { readFavorites, writeFavorites } from '../lib/favorites'

export function FavoritesPage() {
  const [favorites, setFavorites] = useState(() => readFavorites())

  function removeFavorite(id: string) {
    const next = favorites.filter((item) => item.id !== id)
    setFavorites(next)
    writeFavorites(next)
  }

  return (
    <main className="marketHome">
      <section className="homeBlock">
        <h1 className="homeSectionTitle">Избранное</h1>
        {favorites.length === 0 ? (
          <p className="homeCardText">Список избранного пока пуст.</p>
        ) : (
          <div className="productGrid">
            {favorites.map((item) => (
              <article key={item.id} className="offerBtn">
                <button
                  className="favoriteBtn favoriteBtnActive"
                  type="button"
                  onClick={() => removeFavorite(item.id)}
                  aria-label="Убрать из избранного"
                >
                  ❤
                </button>
                <div className="productImage" />
                <span className="offerBtnTitle">{item.title}</span>
                <span className="offerBtnText productPrice">{item.price}</span>
                <span className="offerBtnText">{item.place}</span>
              </article>
            ))}
          </div>
        )}
        <p className="homeCardText">
          <Link to="/">Вернуться на главную</Link>
        </p>
      </section>
    </main>
  )
}

