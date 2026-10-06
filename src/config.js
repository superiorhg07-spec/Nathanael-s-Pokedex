export const API_BASE_URL = 'https://pokeapi.co/api/v2'
export const SPRITE_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
export const ARTWORK_BASE_URL = `${SPRITE_BASE_URL}/other/official-artwork`
export const SHOWDOWN_SPRITE_BASE_URL = `${SPRITE_BASE_URL}/other/showdown`
export const CRIES_BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest'
export const POKEMON_3D_INDEX_URL = 'https://pokemon-3d-api.onrender.com/v1/pokemon'
export const POKEMON_3D_FALLBACK_BASE = 'https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt'
export const FEATURED_IDS = [384, 487, 386, 150, 149, 448, 282, 658, 6, 25, 94, 248]
export const PAGE_SIZE_OPTIONS = [12, 24, 48]
export const MAX_DEX_RESULTS = 10000
export const GENERATIONS = [
  { id: 1, label: 'Gen I', range: 'Kanto' }, { id: 2, label: 'Gen II', range: 'Johto' },
  { id: 3, label: 'Gen III', range: 'Hoenn' }, { id: 4, label: 'Gen IV', range: 'Sinnoh' },
  { id: 5, label: 'Gen V', range: 'Unova' }, { id: 6, label: 'Gen VI', range: 'Kalos' },
  { id: 7, label: 'Gen VII', range: 'Alola' }, { id: 8, label: 'Gen VIII', range: 'Galar' },
  { id: 9, label: 'Gen IX', range: 'Paldea' },
]
export const TYPE_ORDER = ['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy']
export const TYPE_COLORS = {
  normal:['#e9edf4','#263244','#8b94a8'], fire:['#ff7a45','#fff7f2','#ffad7a'], water:['#3d82ff','#f3f7ff','#8db8ff'],
  electric:['#f5c542','#1d1a09','#ffe78a'], grass:['#50b848','#f2fff1','#91df87'], ice:['#6ed2dd','#f2ffff','#b9f0f4'],
  fighting:['#d94b4b','#fff4f4','#f09595'], poison:['#9c5bd8','#fff6ff','#d6a4f3'], ground:['#d8a94f','#fffaf0','#ead08f'],
  flying:['#7b8fe8','#f6f7ff','#b2c0ff'], psychic:['#e55f9c','#fff3fa','#f2a3c7'], bug:['#8cae2d','#fbfff0','#cadc7d'],
  rock:['#9a7f61','#fbf6ef','#ceb799'], ghost:['#7057a8','#f7f4ff','#aa98dc'], dragon:['#5f62cf','#f5f5ff','#a9abf3'],
  dark:['#3c3b45','#f4f3f6','#7f7b8b'], steel:['#718199','#f5f8fc','#b6c2d2'], fairy:['#d86b9b','#fff3f9','#efabc6'],
}
