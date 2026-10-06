// Gen VI–IX type effectiveness. Each attacking type lists targets for 2×, 0.5× and 0×.
const SUPER = {
  normal: [''], fire: ['grass', 'ice', 'bug', 'steel'], water: ['fire', 'ground', 'rock'], electric: ['water', 'flying'],
  grass: ['water', 'ground', 'rock'], ice: ['grass', 'ground', 'flying', 'dragon'], fighting: ['normal', 'ice', 'rock', 'dark', 'steel'],
  poison: ['grass', 'fairy'], ground: ['fire', 'electric', 'poison', 'rock', 'steel'], flying: ['grass', 'fighting', 'bug'],
  psychic: ['fighting', 'poison'], bug: ['grass', 'psychic', 'dark'], rock: ['fire', 'ice', 'flying', 'bug'],
  ghost: ['psychic', 'ghost'], dragon: ['dragon'], dark: ['psychic', 'ghost'], steel: ['ice', 'rock', 'fairy'], fairy: ['fighting', 'dragon', 'dark'],
}
const RESIST = {
  normal: ['rock', 'steel'], fire: ['fire', 'water', 'rock', 'dragon'], water: ['water', 'grass', 'dragon'], electric: ['electric', 'grass', 'dragon'],
  grass: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'], ice: ['fire', 'water', 'ice', 'steel'],
  fighting: ['poison', 'flying', 'psychic', 'bug', 'fairy'], poison: ['poison', 'ground', 'rock', 'ghost'], ground: ['grass', 'bug'],
  flying: ['electric', 'rock', 'steel'], psychic: ['psychic', 'steel'], bug: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'],
  rock: ['fighting', 'ground', 'steel'], ghost: ['dark'], dragon: ['steel'], dark: ['fighting', 'dark', 'fairy'], steel: ['fire', 'water', 'electric', 'steel'], fairy: ['fire', 'poison', 'steel'],
}
const IMMUNE = {
  normal: ['ghost'], fire: [], water: [], electric: ['ground'], grass: [], ice: [], fighting: ['ghost'], poison: ['steel'],
  ground: ['flying'], flying: [], psychic: ['dark'], bug: [], rock: [], ghost: ['normal'], dragon: ['fairy'], dark: [], steel: [], fairy: [],
}

export function effectiveness(attacking, defendingTypes = []) {
  return defendingTypes.reduce((multiplier, defending) => {
    if (IMMUNE[attacking]?.includes(defending)) return multiplier * 0
    if (SUPER[attacking]?.includes(defending)) return multiplier * 2
    if (RESIST[attacking]?.includes(defending)) return multiplier * 0.5
    return multiplier
  }, 1)
}

export function effectivenessLabel(value) {
  if (value === 0) return 'No effect'
  if (value > 1) return `${value}× super effective`
  if (value < 1) return `${value}× resisted`
  return 'Normal damage'
}

export function getDefenseProfile(types = []) {
  const output = {}
  for (const attacking of Object.keys(SUPER)) output[attacking] = effectiveness(attacking, types)
  return output
}
