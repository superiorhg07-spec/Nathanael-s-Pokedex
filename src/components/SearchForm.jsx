import { useEffect, useMemo, useRef, useState } from 'react'
import { DiceIcon, SearchIcon } from './Icon.jsx'
import { formatId, formatPokemonName, getAnimatedSpriteUrl, normalizeSearch } from '../utils.js'

function SearchForm({ onSearchChange, onRandom, onSelect, catalog = [] }) {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)
  const rootRef = useRef(null)
  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    const normalized = normalizeSearch(q)
    const exact = []
    const starts = []
    const contains = []
    for (const pokemon of catalog) {
      const name = pokemon.name.toLowerCase()
      const id = String(pokemon.id)
      if (name === normalized || id === q) exact.push(pokemon)
      else if (name.startsWith(normalized) || name.startsWith(q)) starts.push(pokemon)
      else if (name.includes(normalized) || name.includes(q)) contains.push(pokemon)
    }
    return [...exact, ...starts, ...contains].slice(0, 7)
  }, [catalog, value])

  useEffect(() => {
    const keydown = (event) => {
      if (event.key === '/' && document.activeElement !== inputRef.current) { event.preventDefault(); inputRef.current?.focus() }
    }
    const outside = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    window.addEventListener('keydown', keydown)
    document.addEventListener('pointerdown', outside)
    return () => { window.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside) }
  }, [])

  function choose(pokemon) {
    setValue(pokemon.name)
    setOpen(false)
    onSearchChange(pokemon.name)
    onSelect?.(pokemon)
  }

  function submit(event) {
    event.preventDefault()
    onSearchChange(normalizeSearch(value))
    setOpen(false)
  }

  function clear() { setValue(''); onSearchChange(''); setOpen(false) }

  function handleKeyDown(event) {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) { setOpen(true); return }
    if (event.key === 'ArrowDown') { event.preventDefault(); setHighlight((index) => Math.min(index + 1, Math.max(0, suggestions.length - 1))) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setHighlight((index) => Math.max(index - 1, 0)) }
    else if (event.key === 'Enter' && open && suggestions[highlight]) { event.preventDefault(); choose(suggestions[highlight]) }
    else if (event.key === 'Escape') setOpen(false)
  }

  return <div className="search-stack" ref={rootRef}>
    <div className="search-form-shell">
      <form className="search-box" onSubmit={submit}>
        <SearchIcon />
        <input ref={inputRef} className="search-input" value={value} autoComplete="off" onFocus={() => setOpen(true)} onKeyDown={handleKeyDown} onChange={(event) => { setValue(event.target.value); onSearchChange(normalizeSearch(event.target.value)); setOpen(true); setHighlight(0) }} placeholder="Search by name, number, type or generation…" aria-label="Search Pokémon" />
        <kbd>/</kbd>
        {value && <button type="button" className="clear-button" onClick={clear}>Clear</button>}
        <button className="search-button" type="submit">Search</button>
      </form>
      {open && suggestions.length > 0 && <div className="search-suggestions" role="listbox">{suggestions.map((pokemon, index) => <button key={pokemon.name} type="button" className={index === highlight ? 'is-highlighted' : ''} onMouseEnter={() => setHighlight(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(pokemon)}><img src={getAnimatedSpriteUrl(pokemon.id)} alt="" width="38" height="38"/><span><strong>{formatPokemonName(pokemon.name)}</strong><small>{formatId(pokemon.id)}</small></span></button>)}</div>}
    </div>
    <div className="search-actions"><button type="button" className="text-action" onClick={onRandom}><DiceIcon /> Surprise me</button><span className="search-hint">Try: Deoxys, 487, fire, gen 3</span></div>
  </div>
}
export default SearchForm
