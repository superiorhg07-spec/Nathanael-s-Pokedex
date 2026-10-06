import { ARTWORK_BASE_URL, CRIES_BASE_URL, SHOWDOWN_SPRITE_BASE_URL, SPRITE_BASE_URL } from './config.js'

const SEARCH_ALIASES = {
  'mr mime':'mr-mime', mrmime:'mr-mime', 'mime jr':'mime-jr', farfetchd:'farfetchd',
  "farfetch’d":'farfetchd', "farfetch'd":'farfetchd', nidoranf:'nidoran-f', nidoranm:'nidoran-m',
}
const FORM_PREFIX = {
  mega:'mega', gmax:'gmax', gigantamax:'gmax', alolan:'alola', alola:'alola', galarian:'galar', galar:'galar',
  hisuian:'hisui', hisui:'hisui', paldean:'paldea', paldea:'paldea', origin:'origin', primal:'primal',
  attack:'attack', defense:'defense', speed:'speed', sky:'sky', ash:'ash', therian:'therian', incarnate:'incarnate',
}
export function normalizeSearch(value='') {
  const raw=value.trim().toLowerCase().replaceAll('’',"'")
  if (!raw) return ''
  if (SEARCH_ALIASES[raw]) return SEARCH_ALIASES[raw]
  const tokens=raw.replaceAll("'","").split(/\s+/).filter(Boolean)
  if (tokens.length>1 && FORM_PREFIX[tokens[0]]) {
    const form = FORM_PREFIX[tokens[0]]
    const rest = tokens.slice(1)
    if (form === 'mega' && (rest.at(-1) === 'x' || rest.at(-1) === 'y')) return `${rest.slice(0,-1).join('-')}-mega-${rest.at(-1)}`
    return `${rest.join('-')}-${form}`
  }
  return raw.replaceAll(' ','-')
}
export function capitalize(value=''){return value?value.charAt(0).toUpperCase()+value.slice(1):''}
export function formatPokemonName(name=''){
  const parts=String(name).split('-').filter(Boolean)
  const suffixes=new Set(['mega','gmax','gigantamax','alola','galar','hisui','paldea','origin','primal','attack','defense','speed','therian','incarnate','sky','ash','complete'])
  const base=[], suffix=[]
  for(const part of parts)(suffixes.has(part)||/^mega-[xy]$/.test(part)?suffix:base).push(part)
  if(!suffix.length)return parts.map(capitalize).join(' ')
  const baseLabel = base.map(capitalize).join(' ')
  let s = suffix.join(' ').replace('gmax','G-Max').replace('gigantamax','Gigantamax').replace('mega x','Mega X').replace('mega y','Mega Y')
  if (suffix.includes('mega')) {
    const megaTail = suffix.includes('x') ? 'X' : suffix.includes('y') ? 'Y' : ''
    return `Mega ${baseLabel}${megaTail ? ` ${megaTail}` : ''}`
  }
  return `${baseLabel} ${s.charAt(0).toUpperCase()+s.slice(1)}`
}
export function formatId(id){return `#${String(id).padStart(4,'0')}`}
export function getSpriteUrl(id){return `${SPRITE_BASE_URL}/${id}.png`}
export function getArtworkUrl(id){return `${ARTWORK_BASE_URL}/${id}.png`}
export function getAnimatedSpriteUrl(id){return `${SHOWDOWN_SPRITE_BASE_URL}/${id}.gif`}
export function getCryUrl(id){return `${CRIES_BASE_URL}/${id}.ogg`}
export function getFavorites(){try{return JSON.parse(localStorage.getItem('pokedex-favorites')||'[]')}catch{return[]}}
export function saveFavorites(favorites){localStorage.setItem('pokedex-favorites',JSON.stringify(favorites))}
export function toggleFavorite(name){const favorites=getFavorites();const next=favorites.includes(name)?favorites.filter((item)=>item!==name):[...favorites,name];saveFavorites(next);return next}
export function getEnglishText(entries,key){if(!Array.isArray(entries))return '';const match=entries.find((entry)=>entry.language?.name==='en');return key?match?.[key]||'':match}
export function cleanPokeText(value=''){return value.replace(/[\f\n\r]+/g,' ').replace(/\s+/g,' ').trim()}
export function getFirstEnglishFlavorText(entries=[]){const entry=entries.find((item)=>item.language?.name==='en');return cleanPokeText(entry?.flavor_text||'')}
export function getEnglishGenus(genera=[]){const entry=genera.find((item)=>item.language?.name==='en');return cleanPokeText(entry?.genus||'')}
export function flattenEvolutionChain(node){if(!node)return[];const current={name:node.species?.name||'',id:Number(node.species?.url?.split('/').filter(Boolean).pop())||0};return[current,...(node.evolves_to||[]).flatMap(flattenEvolutionChain)]}
export function getGenerationLabel(generation){const value=generation?.name?.replace('generation-','');return value?value.toUpperCase():'UNKNOWN'}
export function getGenerationFromId(id){if(id<=151)return 1;if(id<=251)return 2;if(id<=386)return 3;if(id<=493)return 4;if(id<=649)return 5;if(id<=721)return 6;if(id<=809)return 7;if(id<=905)return 8;return 9}
export function getBaseStatTotal(stats=[]){return stats.reduce((sum,item)=>sum+Number(item.base_stat||0),0)}
export function slugToLabel(value=''){return formatPokemonName(value.replaceAll('_','-'))}
export function clamp(value,min,max){return Math.min(max,Math.max(min,value))}
export function formatNumber(value){return Number(value||0).toLocaleString()}
export function buildSmartSearchTokens(query=''){return query.toLowerCase().trim().split(/\s+/).filter(Boolean)}
export const SEARCH_TYPE_TOKENS=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']
export function parseSmartSearch(query=''){const tokens=buildSmartSearchTokens(query);const type=tokens.find((token)=>SEARCH_TYPE_TOKENS.includes(token))||null;const genIndex=tokens.findIndex((token)=>token==='gen'||token==='generation');const gen=genIndex>=0&&/^\d+$/.test(tokens[genIndex+1]||'')?Number(tokens[genIndex+1]):null;const remaining=tokens.filter((token,index)=>token!==type&&!(index===genIndex||index===genIndex+1));return{type,generation:gen,remaining}}
export function pokemonSearchScore(pokemon,query=''){
  const raw=String(query).trim().toLowerCase(), normalized=normalizeSearch(raw), name=String(pokemon.name||'').toLowerCase(), display=formatPokemonName(name).toLowerCase(), id=String(pokemon.id)
  if(!raw)return 0
  const tokens=raw.split(/\s+/).filter(Boolean)
  const tokenHit=tokens.every(token=>name.includes(token)||display.includes(token)||id===token)
  if(name===normalized||id===raw)return 100
  if(display===raw)return 98
  if(tokenHit&&name.includes(normalized))return 94
  if(name.startsWith(normalized)||display.startsWith(raw))return 84
  if(tokenHit)return 78
  if(name.includes(normalized)||display.includes(raw))return 68
  return 0
}
export function rankPokemonSearch(catalog=[],query='',limit=10){
  const q=String(query).trim()
  if(!q)return catalog.slice(0,limit)
  return catalog.map((pokemon)=>({pokemon,score:pokemonSearchScore(pokemon,q)})).filter((entry)=>entry.score>0).sort((a,b)=>b.score-a.score||a.pokemon.id-b.pokemon.id).slice(0,limit).map((entry)=>entry.pokemon)
}
export function applySmartSearch(catalog,query=''){const{remaining}=parseSmartSearch(query);if(!remaining.length)return catalog;return catalog.filter((pokemon)=>pokemonSearchScore(pokemon,remaining.join(' '))>0)}
