import { useEffect, useMemo, useState } from 'react'
import { getPokemonBundle, getPokemonList } from '../api/pokeApi.js'
import PokemonVisual from '../components/PokemonVisual.jsx'
import StatBar from '../components/StatBar.jsx'
import TypeBadge from '../components/TypeBadge.jsx'
import PokemonSearchSelect from '../components/PokemonSearchSelect.jsx'
import { formatPokemonName, getBaseStatTotal, normalizeSearch } from '../utils.js'

function ComparePage() {
  const [a, setA] = useState('pikachu')
  const [b, setB] = useState('gengar')
  const [catalog, setCatalog] = useState([])
  const [left, setLeft] = useState(null)
  const [right, setRight] = useState(null)
  const [busy, setBusy] = useState(false)
  const [catalogBusy, setCatalogBusy] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getPokemonList(controller.signal)
      .then((items) => setCatalog(items))
      .catch((error) => { if (error.name !== 'AbortError') setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setCatalogBusy(false) })
    return () => controller.abort()
  }, [])

  async function compare(nextA = a, nextB = b) {
    const subjectA = normalizeSearch(nextA)
    const subjectB = normalizeSearch(nextB)
    if (!subjectA || !subjectB) {
      setError('Choose two Pokémon before comparing.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const [aa, bb] = await Promise.all([getPokemonBundle(subjectA), getPokemonBundle(subjectB)])
      setLeft(aa)
      setRight(bb)
    } catch (error) {
      setError(error.message || 'Comparison failed.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { compare() }, [])

  const metric = (bundle, key) => bundle?.pokemon?.stats?.find((x) => x.stat.name === key)?.base_stat || 0
  const totalA = getBaseStatTotal(left?.pokemon?.stats)
  const totalB = getBaseStatTotal(right?.pokemon?.stats)
  const winner = totalA === totalB ? 'Even BST' : totalA > totalB ? `${formatPokemonName(left?.pokemon?.name)} has the higher BST` : `${formatPokemonName(right?.pokemon?.name)} has the higher BST`

  return <section className="compare-page">
    <div className="section-heading page-section-heading"><div><p className="section-kicker">Analysis lab</p><h1>Compare two Pokémon</h1></div><span>Live suggestions · stats · types · visuals</span></div>
    <div className="compare-controls compare-controls-rich">
      <PokemonSearchSelect label="Subject A" value={a} onChange={setA} catalog={catalog} placeholder="Search first Pokémon…" disabled={catalogBusy} />
      <div className="compare-center-mark" aria-hidden="true">VS</div>
      <PokemonSearchSelect label="Subject B" value={b} onChange={setB} catalog={catalog} placeholder="Search second Pokémon…" disabled={catalogBusy} />
      <button className="primary-button compare-run" type="button" onClick={() => compare()} disabled={busy || catalogBusy}>{busy ? 'Loading…' : 'Compare now'}</button>
    </div>
    {error && <div className="state-card error-state"><strong>Comparison needs attention.</strong><span>{error}</span><button type="button" className="secondary-button" onClick={() => compare()}>Retry</button></div>}
    {!left || !right ? <div className="state-card"><strong>{busy ? 'Loading comparison…' : 'Pick two Pokémon to start.'}</strong><span>Use the live suggestions above. The inputs accept names or National Dex numbers.</span></div> : <>
      <div className="compare-summary"><strong>{winner}</strong><span>BST {totalA} vs {totalB} · comparison data comes directly from PokéAPI</span></div>
      <div className="compare-grid">
        {[left, right].map((bundle, index) => {
          const pokemon = bundle.pokemon
          const isA = index === 0
          return <section className="compare-side" key={pokemon.name}>
            <div className="compare-heading"><span>{isA ? 'A' : 'B'}</span><div><h2>{formatPokemonName(pokemon.name)}</h2><div className="type-row">{pokemon.types.map((x) => <TypeBadge key={x.type.name} type={x.type.name} />)}</div></div><strong>BST {getBaseStatTotal(pokemon.stats)}</strong></div>
            <PokemonVisual pokemon={pokemon} compact models={null} />
            {pokemon.stats.map((x) => <StatBar key={x.stat.name} label={formatPokemonName(x.stat.name)} value={x.base_stat} />)}
          </section>
        })}
        <section className="compare-middle"><div className="compare-vs">VS</div><div className="compare-metric-list">{['hp','attack','defense','special-attack','special-defense','speed'].map((key) => <div key={key}><span>{key.replace('special-','Sp. ')}</span><b>{metric(left,key)}</b><i>{metric(right,key)}</i></div>)}</div><p className="muted-copy">Left value · right value. Higher is not always better: typing, move pools, abilities, and team role still matter.</p></section>
      </div>
    </>}
  </section>
}
export default ComparePage
