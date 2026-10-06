import { API_BASE_URL, MAX_DEX_RESULTS, POKEMON_3D_INDEX_URL } from '../config.js'

const cache = new Map()
const pending = new Map()

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json()
}

// Shared requests must NOT be aborted by one React component unmounting.
// React StrictMode intentionally mounts/unmounts effects once during development,
// so aborting the shared fetch can otherwise poison the next caller.
function withAbort(promise, signal) {
  if (!signal) return promise
  if (signal.aborted) return Promise.reject(new DOMException('The operation was aborted.', 'AbortError'))

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException('The operation was aborted.', 'AbortError'))
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(
      (value) => { signal.removeEventListener('abort', onAbort); resolve(value) },
      (error) => { signal.removeEventListener('abort', onAbort); reject(error) },
    )
  })
}

function cachedJson(url, signal) {
  if (cache.has(url)) return withAbort(Promise.resolve(cache.get(url)), signal)

  let request = pending.get(url)
  if (!request) {
    request = fetchJson(url)
      .then((data) => { cache.set(url, data); return data })
      .finally(() => pending.delete(url))
    pending.set(url, request)
  }
  return withAbort(request, signal)
}

export async function getPokemonList(signal) {
  const data = await cachedJson(`${API_BASE_URL}/pokemon?limit=${MAX_DEX_RESULTS}&offset=0`, signal)
  return data.results
    .map((pokemon) => ({
      name: pokemon.name,
      url: pokemon.url,
      id: Number(pokemon.url.split('/').filter(Boolean).pop()),
      isForm: pokemon.name.includes('-'),
    }))
    .filter((pokemon) => pokemon.id > 0)
}

export async function getPokemon(name, signal) { return cachedJson(`${API_BASE_URL}/pokemon/${encodeURIComponent(name)}`, signal) }
export async function getPokemonSpecies(name, signal) { return cachedJson(`${API_BASE_URL}/pokemon-species/${encodeURIComponent(name)}`, signal) }
export async function getEvolutionChain(url, signal) { return cachedJson(url, signal) }
export async function getMove(nameOrId, signal) { return cachedJson(`${API_BASE_URL}/move/${encodeURIComponent(nameOrId)}`, signal) }
export async function getType(nameOrId, signal) { return cachedJson(`${API_BASE_URL}/type/${encodeURIComponent(nameOrId)}`, signal) }
export async function getGeneration(id, signal) { return cachedJson(`${API_BASE_URL}/generation/${id}`, signal) }
export async function getPokemonByType(type, signal) { return getType(type, signal) }

export async function getPokemonBundle(name, signal) {
  const pokemon = await getPokemon(name, signal)
  let species = null
  if (pokemon.species?.name) {
    try { species = await getPokemonSpecies(pokemon.species.name, signal) } catch (error) { if (error.name === 'AbortError') throw error }
  }
  return { pokemon, species }
}

export async function get3DModelIndex(signal) {
  try { return await cachedJson(POKEMON_3D_INDEX_URL, signal) } catch (error) {
    if (error?.name === 'AbortError') throw error
    return null
  }
}

function norm(value = '') {
  return String(value)
    .toLowerCase()
    .replaceAll('_', '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function findModel(payload, id, name = '') {
  if (!payload) return null
  const collection = Array.isArray(payload) ? payload : payload.pokemon || []
  const target = norm(name)
  const byId = collection.filter((item) => Number(item.id) === Number(id))
  const candidates = byId.length ? byId : target ? collection : []

  for (const entry of candidates) {
    const forms = Array.isArray(entry.forms) ? entry.forms : []
    if (!forms.length) continue

    const exact = forms.find((form) => norm(form.name || form.formName) === target)
    const loose = forms.find((form) => {
      const formName = norm(form.name || form.formName)
      return target && (formName.includes(target) || target.includes(formName))
    })
    const chosen = exact || loose

    if (chosen) {
      const regular = forms.find((form) => !/shiny/i.test(String(form.formName || form.name || '')))
      const shiny = forms.find((form) => /shiny/i.test(String(form.formName || form.name || '')))
      return {
        regular: chosen.model || regular?.model || null,
        shiny: shiny?.model || chosen.model || regular?.model || null,
        sourceForm: chosen.name || chosen.formName || null,
      }
    }

    if (!target) {
      const regular = forms.find((form) => String(form.formName || '').toLowerCase() === 'regular') || forms.find((form) => !/shiny/i.test(String(form.formName || form.name || ''))) || forms[0]
      const shiny = forms.find((form) => /shiny/i.test(String(form.formName || form.name || '')))
      return { regular: regular?.model || null, shiny: shiny?.model || null, sourceForm: regular?.name || regular?.formName || null }
    }
  }
  return null
}

export async function get3DModelsForPokemon(id, signal, pokemonName = '') {
  const indexed = findModel(await get3DModelIndex(signal), id, pokemonName)
  return { regular: indexed?.regular || null, shiny: indexed?.shiny || null, sourceForm: indexed?.sourceForm || null }
}
