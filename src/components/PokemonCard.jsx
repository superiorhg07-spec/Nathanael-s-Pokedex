import { Link } from 'react-router-dom'
import { formatId, formatPokemonName, getAnimatedSpriteUrl, getArtworkUrl } from '../utils.js'
import { HeartIcon } from './Icon.jsx'
import TypeBadge from './TypeBadge.jsx'

function PokemonCard({ pokemon, favorite = false, onToggleFavorite, detail = null }) {
  const types = detail?.types?.map((item) => item.type.name) || []
  const image = detail?.sprites?.other?.showdown?.front_default || getAnimatedSpriteUrl(pokemon.id)
  return <article className="pokemon-card">
    <Link to={`/pokemon/${pokemon.name}`} className="pokemon-card-link">
      <div className="pokemon-card-topline"><span>{formatId(pokemon.id)}</span><span>{pokemon.isForm ? 'FORM' : 'DEX'} <b className="pokemon-card-arrow">↗</b></span></div>
      <div className="pokemon-card-art-wrap"><div className="card-radial" /><img className="pokemon-card-art" src={image || getArtworkUrl(pokemon.id)} alt="" loading="lazy" width="220" height="220" onError={(event) => { if (event.currentTarget.dataset.fallback !== '1') { event.currentTarget.dataset.fallback = '1'; event.currentTarget.src = getArtworkUrl(pokemon.id) } }} /></div>
      <div className="pokemon-card-copy"><p className="pokemon-card-name">{formatPokemonName(pokemon.name)}</p>{types.length ? <div className="type-row">{types.map((type) => <TypeBadge key={type} type={type} />)}</div> : <p className="pokemon-card-subtitle">Open field profile →</p>}</div>
    </Link>
    <button className={`favorite-button ${favorite ? 'is-favorite' : ''}`} type="button" aria-label={favorite ? `Remove ${formatPokemonName(pokemon.name)} from favorites` : `Add ${formatPokemonName(pokemon.name)} to favorites`} onClick={(event) => { event.preventDefault(); event.stopPropagation(); onToggleFavorite?.(pokemon.name) }}><HeartIcon filled={favorite} /></button>
  </article>
}
export default PokemonCard
