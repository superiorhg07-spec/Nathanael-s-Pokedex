import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPokemon, getPokemonList } from '../api/pokeApi.js'
import PokemonSearchSelect from '../components/PokemonSearchSelect.jsx'
import TypeBadge from '../components/TypeBadge.jsx'
import { getBaseStatTotal, formatPokemonName } from '../utils.js'

function TeamBuilderPage() {
  const navigate = useNavigate()
  const [catalog, setCatalog] = useState([])
  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('pokedex-team') || '[]')
      return Array.from({ length: 3 }, (_, index) => saved[index] || '')
    } catch { return ['', '', ''] }
  })
  const [details, setDetails] = useState([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getPokemonList(controller.signal)
      .then((list) => setCatalog(list))
      .catch((error) => { if (error.name !== 'AbortError') setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let cancelled = false
    const names = selected.filter(Boolean)
    Promise.all(names.map((name) => getPokemon(name).catch(() => null))).then((data) => {
      if (!cancelled) setDetails(data.filter(Boolean))
    })
    return () => { cancelled = true }
  }, [selected])

  function updateSlot(index, name) {
    setSelected((current) => current.map((item, itemIndex) => itemIndex === index ? name : item))
  }

  function clearTeam() {
    setSelected(['', '', ''])
    localStorage.removeItem('pokedex-team')
    setError('')
  }

  const duplicate = selected.filter(Boolean).some((name, index, list) => list.indexOf(name) !== index)
  const ready = selected.every(Boolean) && !duplicate
  const coverage = useMemo(() => {
    const types = new Map()
    details.forEach((pokemon) => pokemon.types.forEach((item) => types.set(item.type.name, (types.get(item.type.name) || 0) + 1)))
    return [...types.entries()].sort((a, b) => b[1] - a[1])
  }, [details])

  function saveAndBattle() {
    if (!ready) return
    localStorage.setItem('pokedex-team', JSON.stringify(selected))
    navigate('/battle')
  }

  return <section className="team-page">
    <div className="section-heading page-section-heading"><div><p className="section-kicker">Team lab</p><h1>Build your 3v3 squad</h1></div><span>{selected.filter(Boolean).length}/3 selected</span></div>
    <div className="team-layout">
      <section className="team-current">
        <div className="team-panel-heading"><div><strong>Current squad</strong><span>Search with live Pokémon suggestions. Duplicate picks are blocked.</span></div><button className="secondary-button" type="button" onClick={clearTeam}>Clear</button></div>
        <div className="team-slots">{selected.map((name, index) => { const d = details.find((item) => item.name === name); return <div className={`team-slot ${name ? 'filled' : ''}`} key={index}>{d ? <><button type="button" className="team-remove" onClick={() => updateSlot(index, '')} aria-label={`Remove ${formatPokemonName(d.name)}`}>×</button><img src={d.sprites.other?.showdown?.front_default || d.sprites.front_default} alt=""/><strong>{formatPokemonName(d.name)}</strong><div className="type-row">{d.types.map((item) => <TypeBadge key={item.type.name} type={item.type.name}/>)}</div><span>BST {getBaseStatTotal(d.stats)}</span></> : <><b>0{index + 1}</b><span>Empty slot</span></>}</div> })}</div>
        <div className="team-search-grid">{selected.map((value, index) => <PokemonSearchSelect key={index} label={`Choose slot ${index + 1}`} value={value} onChange={(name) => updateSlot(index, name)} catalog={catalog} placeholder={busy ? 'Loading catalogue…' : 'Search Pokémon…'} disabled={busy} />)}</div>
        <div className="team-readout"><span>Selected type profile</span><div>{coverage.length ? coverage.map(([type, count]) => <span className="team-type-count" key={type}><TypeBadge type={type}/><small>×{count}</small></span>) : <small>Select Pokémon to analyze your core.</small>}</div></div>
        {duplicate && <div className="state-card error-state"><strong>Duplicate Pokémon.</strong><span>Choose three different species for a valid squad.</span></div>}
        {error && <div className="state-card error-state"><strong>Team data unavailable.</strong><span>{error}</span></div>}
        <button className="primary-button full-width" disabled={!ready} onClick={saveAndBattle}>{ready ? 'Save squad & enter battle' : 'Choose three different Pokémon'}</button>
        <Link to="/battle" className="secondary-button full-width">Open battle arena</Link>
      </section>
      <section className="team-library"><div className="team-panel-heading"><div><strong>Why three?</strong><span>The battle lab is designed around active choices, switching, energy and type coverage.</span></div></div><div className="team-readout team-readout-large"><span>Current squad analysis</span><strong>{details.length ? `${details.reduce((sum, p) => sum + getBaseStatTotal(p.stats), 0).toLocaleString()} combined BST` : 'Waiting for picks'}</strong><p>Use Compare for one-on-one analysis and the Type Lab for matchup planning.</p><div className="setup-rule"><strong>Tip</strong><span>Pair strong offensive coverage with Pokémon that resist each other's common weaknesses.</span></div></div><Link to="/compare" className="secondary-button full-width">Open Compare Lab</Link><Link to="/types" className="secondary-button full-width">Open Type Lab</Link></section>
    </div>
  </section>
}
export default TeamBuilderPage
