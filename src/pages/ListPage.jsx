import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEATURED_IDS, PAGE_SIZE_OPTIONS, TYPE_ORDER } from '../config.js'
import { getGeneration, getPokemonByType, getPokemonList } from '../api/pokeApi.js'
import PokemonCard from '../components/PokemonCard.jsx'
import SearchForm from '../components/SearchForm.jsx'
import FilterPanel from '../components/FilterPanel.jsx'
import LoadingGrid from '../components/LoadingGrid.jsx'
import Pagination from '../components/Pagination.jsx'
import { applySmartSearch, formatPokemonName, getArtworkUrl, parseSmartSearch, SEARCH_TYPE_TOKENS } from '../utils.js'
import { useFavorites } from '../hooks/useFavorites.js'

function ListPage() {
  const [catalog, setCatalog] = useState([])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('id')
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1])
  const [page, setPage] = useState(1)
  const [generation, setGeneration] = useState('all')
  const [type, setType] = useState('all')
  const [typeIds, setTypeIds] = useState(null)
  const [generationNames, setGenerationNames] = useState(null)
  const [smartQueryType, setSmartQueryType] = useState(null)
  const [smartQueryGeneration, setSmartQueryGeneration] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [error, setError] = useState('')
  const [featured, setFeatured] = useState([])
  const { isFavorite, toggleFavorite } = useFavorites()
  const navigate = useNavigate()

  useEffect(() => { const controller = new AbortController(); getPokemonList(controller.signal).then((data) => { setCatalog(data); setError('') }).catch((err) => { if (err.name !== 'AbortError') setError(err.message) }).finally(() => { if (!controller.signal.aborted) setIsLoading(false) }); return () => controller.abort() }, [])
  useEffect(() => { setFeatured(FEATURED_IDS.map((id) => catalog.find((pokemon) => pokemon.id === id)).filter(Boolean)) }, [catalog])
  useEffect(() => { let cancelled = false; async function loadFilter() { setFilterLoading(true); try { if (type !== 'all') { const data = await getPokemonByType(type); if (!cancelled) setTypeIds(new Set(data.pokemon.map((entry) => Number(entry.pokemon.url.split('/').filter(Boolean).pop())))) } else if (!cancelled) setTypeIds(null); if (generation !== 'all') { const data = await getGeneration(generation); if (!cancelled) setGenerationNames(new Set(data.pokemon_species.map((entry) => entry.name))) } else if (!cancelled) setGenerationNames(null) } catch { if (!cancelled) { setTypeIds(null); setGenerationNames(null) } } finally { if (!cancelled) setFilterLoading(false) } } loadFilter(); return () => { cancelled = true } }, [generation, type])
  useEffect(() => { let cancelled = false; const parsed = parseSmartSearch(query); setSmartQueryType(parsed.type); setSmartQueryGeneration(parsed.generation); async function loadSmart() { if (parsed.type && SEARCH_TYPE_TOKENS.includes(parsed.type)) { try { const data = await getPokemonByType(parsed.type); if (!cancelled) setSmartQueryType({ value: parsed.type, ids: new Set(data.pokemon.map((entry) => Number(entry.pokemon.url.split('/').filter(Boolean).pop()))) }) } catch { if (!cancelled) setSmartQueryType(null) } } else if (!cancelled) setSmartQueryType(null); if (parsed.generation && parsed.generation >= 1 && parsed.generation <= 9) { try { const data = await getGeneration(parsed.generation); if (!cancelled) setSmartQueryGeneration({ value: parsed.generation, names: new Set(data.pokemon_species.map((entry) => entry.name)) }) } catch { if (!cancelled) setSmartQueryGeneration(null) } } else if (!cancelled) setSmartQueryGeneration(null) } loadSmart(); return () => { cancelled = true } }, [query])
  const filtered = useMemo(() => { let result = applySmartSearch(catalog, query); if (typeIds) result = result.filter((pokemon) => typeIds.has(pokemon.id)); if (generationNames) result = result.filter((pokemon) => generationNames.has(pokemon.name)); if (smartQueryType?.ids) result = result.filter((pokemon) => smartQueryType.ids.has(pokemon.id)); if (smartQueryGeneration?.names) result = result.filter((pokemon) => smartQueryGeneration.names.has(pokemon.name)); if (sort === 'name') result.sort((a,b) => a.name.localeCompare(b.name)); else result.sort((a,b) => a.id-b.id); return result }, [catalog, query, typeIds, generationNames, smartQueryType, smartQueryGeneration, sort])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize)); const visible = filtered.slice((page-1)*pageSize, page*pageSize)
  useEffect(() => { setPage(1) }, [query, sort, pageSize, generation, type])
  function updateFilters(change) { if (change.generation !== undefined) setGeneration(change.generation); if (change.type !== undefined) setType(change.type); if (change.sort !== undefined) setSort(change.sort); if (change.pageSize !== undefined) setPageSize(change.pageSize) }
  function goRandom() { if (catalog.length) navigate(`/pokemon/${catalog[Math.floor(Math.random()*catalog.length)].name}`) }
  const showingStart = filtered.length ? (page-1)*pageSize+1 : 0; const showingEnd = Math.min(page*pageSize, filtered.length)
  return <><section className="hero-section"><div className="hero-copy"><div className="hero-orb"><span>DATA</span><b>LIVE</b></div><p className="eyebrow">A next-generation Pokémon field system</p><h1>Meet them. See them. <span>Battle them.</span></h1><p className="hero-intro">The old Pokédex was built to be read. This one is built to be explored: animated sprites, real Pokémon cries, 3D views, team analysis, comparisons, and a proper round-based 3v3 battle lab.</p><SearchForm onSearchChange={setQuery} onRandom={goRandom} catalog={catalog} onSelect={(pokemon) => navigate(`/pokemon/${pokemon.name}`)} /></div><div className="hero-orbit"><div className="hero-ring hero-ring-one" /><div className="hero-ring hero-ring-two" /><div className="hero-pokeball"><span /><i /><b /></div><span className="hero-dot hero-dot-one" /><span className="hero-dot hero-dot-two" /><span className="hero-dot hero-dot-three" /><div className="hero-readout"><span>DEX ONLINE</span><strong>{catalog.length ? catalog.length.toLocaleString() : '—'}</strong><small>entries indexed</small></div></div></section>
  {!query && featured.length > 0 && <section className="featured-section"><div className="section-heading"><div><p className="section-kicker">Featured encounters</p><h2>Start with the heavy hitters</h2></div><span>Try Deoxys / Giratina</span></div><div className="featured-grid">{featured.map((pokemon) => <button type="button" className="featured-card" key={pokemon.name} onClick={() => navigate(`/pokemon/${pokemon.name}`)}><img src={getArtworkUrl(pokemon.id)} alt="" width="100" height="100" loading="lazy"/><span>{formatPokemonName(pokemon.name)}</span></button>)}</div></section>}
  <section className="catalog-section"><div className="section-heading catalog-heading"><div><p className="section-kicker">National catalogue</p><h2>{query ? 'Smart search results' : 'Browse every indexed entry'}</h2></div><span>{filtered.length.toLocaleString()} matches</span></div><FilterPanel generation={generation} type={type} sort={sort} pageSize={pageSize} onChange={updateFilters} /><div className="catalog-toolbar"><div className="result-copy"><strong>{showingStart.toLocaleString()}–{showingEnd.toLocaleString()}</strong><span>of {filtered.length.toLocaleString()}</span></div><div className="toolbar-message">{filterLoading ? 'Syncing filter data…' : type !== 'all' || generation !== 'all' ? `${type !== 'all' ? type : 'all types'} · ${generation !== 'all' ? `Gen ${generation}` : 'all generations'}` : 'All systems ready'}</div></div>{isLoading && <LoadingGrid count={8}/>} {!isLoading && error && <div className="state-card error-state"><strong>The field network is unavailable.</strong><span>{error}</span><button type="button" className="secondary-button" onClick={() => window.location.reload()}>Retry</button></div>} {!isLoading && !error && filtered.length === 0 && <div className="state-card"><strong>No Pokémon found.</strong><span>Try a name, number, type, or generation filter.</span></div>} {!isLoading && !error && filtered.length > 0 && <><div className="pokemon-grid">{visible.map((pokemon) => <PokemonCard key={`${pokemon.name}-${pokemon.id}`} pokemon={pokemon} favorite={isFavorite(pokemon.name)} onToggleFavorite={toggleFavorite}/>)}</div><Pagination page={page} pageCount={pageCount} onChange={setPage}/></>}</section></>
}
export default ListPage
