import { useEffect, useMemo, useRef, useState } from 'react'
import { formatId, formatPokemonName, getAnimatedSpriteUrl, normalizeSearch } from '../utils.js'

function PokemonSearchSelect({ label, value, onChange, catalog = [], placeholder = 'Search Pokémon…', disabled = false, allowClear = true }) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef(null)

  const suggestions = useMemo(() => {
    const query = String(value || '').trim().toLowerCase()
    if (!query) return catalog.slice(0, 8)
    const normalized = normalizeSearch(query)
    const exact = []
    const starts = []
    const contains = []
    for (const pokemon of catalog) {
      const name = pokemon.name.toLowerCase()
      const id = String(pokemon.id)
      if (name === normalized || id === query) exact.push(pokemon)
      else if (name.startsWith(normalized) || name.startsWith(query)) starts.push(pokemon)
      else if (name.includes(normalized) || name.includes(query)) contains.push(pokemon)
    }
    return [...exact, ...starts, ...contains].slice(0, 8)
  }, [catalog, value])

  useEffect(() => {
    function onPointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  function choose(pokemon) {
    onChange(pokemon.name)
    setOpen(false)
    setHighlight(0)
  }

  function handleKeyDown(event) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setOpen(true)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlight((index) => Math.min(index + 1, Math.max(0, suggestions.length - 1)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlight((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && suggestions[highlight]) {
      event.preventDefault()
      choose(suggestions[highlight])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <label className="pokemon-search-select" ref={rootRef}>
      <span className="filter-label">{label}</span>
      <div className="pokemon-search-input-wrap">
        <input
          value={value || ''}
          disabled={disabled}
          autoComplete="off"
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(event) => { onChange(event.target.value); setOpen(true); setHighlight(0) }}
          onKeyDown={handleKeyDown}
        />
        {allowClear && value && <button type="button" className="search-clear-mini" onClick={() => { onChange(''); setOpen(true) }} aria-label={`Clear ${label}`}>×</button>}
      </div>
      {open && !disabled && <div className="pokemon-suggestions" role="listbox">
        {suggestions.length ? suggestions.map((pokemon, index) => (
          <button key={pokemon.name} type="button" role="option" aria-selected={index === highlight} className={index === highlight ? 'is-highlighted' : ''} onMouseEnter={() => setHighlight(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(pokemon)}>
            <img src={getAnimatedSpriteUrl(pokemon.id)} alt="" width="42" height="42" />
            <span><strong>{formatPokemonName(pokemon.name)}</strong><small>{formatId(pokemon.id)}</small></span>
          </button>
        )) : <div className="pokemon-suggestions-empty">No matching Pokémon. Try a name or National Dex number.</div>}
      </div>}
    </label>
  )
}

export default PokemonSearchSelect
