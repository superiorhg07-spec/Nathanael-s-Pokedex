import { useCallback, useState } from 'react'
import { getFavorites, toggleFavorite as toggleStoredFavorite } from '../utils.js'

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => getFavorites())
  const toggleFavorite = useCallback((name) => setFavorites(toggleStoredFavorite(name)), [])
  return { favorites, isFavorite: (name) => favorites.includes(name), toggleFavorite }
}
