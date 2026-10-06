import { effectiveness } from '../data/typeChart.js'
import { clamp, formatPokemonName } from '../utils.js'

export const MAX_ENERGY = 100
export const ENERGY_REGEN = 8
export const FOCUS_GAIN = 34
export const GUARD_COST = 14
export const LEVEL = 50

function stat(pokemon, name) {
  return pokemon.stats?.find((item) => item.stat?.name === name)?.base_stat || 50
}

function moveEnergyCost(power, accuracy, priority = 0, ailment = 'none') {
  if (!power) return ailment !== 'none' ? 16 : 10
  let cost = power <= 40 ? 16 : power <= 60 ? 23 : power <= 80 ? 31 : power <= 100 ? 40 : power <= 120 ? 50 : 60
  if ((accuracy ?? 100) < 90) cost = Math.max(12, cost - 4)
  if (priority > 0) cost += 3
  return clamp(cost, 10, 65)
}

function normalizeMove(move, index = 0) {
  const power = move?.power ?? 0
  return {
    id: move?.id || 9000 + index,
    name: move?.name || 'tackle',
    power,
    accuracy: move?.accuracy ?? 100,
    priority: move?.priority || 0,
    type: move?.type?.name || 'normal',
    damageClass: move?.damage_class?.name || 'physical',
    pp: move?.pp || 10,
    energyCost: moveEnergyCost(power, move?.accuracy ?? 100, move?.priority || 0, move?.meta?.ailment?.name || 'none'),
    ailment: move?.meta?.ailment?.name || 'none',
    ailmentChance: move?.meta?.ailment_chance || 0,
    drain: move?.meta?.drain || 0,
    recoil: move?.meta?.recoil || 0,
  }
}

export function normalizeBattleMove(move, index = 0) { return normalizeMove(move, index) }

export function createBattleMon(bundle, moves = [], slot = 0) {
  const p = bundle?.pokemon || bundle
  const hp = calculateHp(p, LEVEL)
  const normalizedMoves = moves.map(normalizeMove).filter((move, index, array) => array.findIndex((x) => x.name === move.name) === index).slice(0, 4)
  if (!normalizedMoves.length) normalizedMoves.push(normalizeMove({ name: 'tackle', power: 40, accuracy: 100, type: { name: 'normal' }, damage_class: { name: 'physical' } }))
  return {
    id: p.id, name: p.name, displayName: formatPokemonName(p.name), types: p.types.map((item) => item.type.name),
    stats: p.stats, sprites: p.sprites, abilities: p.abilities?.map((x) => x.ability.name) || [], moves: normalizedMoves,
    slot, level: LEVEL, maxHp: hp, hp, energy: MAX_ENERGY, status: null, statusTurns: 0, toxicCounter: 1,
    guarding: false, fainted: false, active: false,
  }
}

export function calculateHp(pokemon, level = LEVEL) {
  return Math.floor(((2 * stat(pokemon, 'hp') + 31) * level) / 100) + level + 10
}

function calculateDamage(attacker, defender, move) {
  if (!move?.power) return { damage: 0, multiplier: 1, critical: false, missed: false, base: 0 }
  if (Math.random() * 100 >= (move.accuracy ?? 100)) return { missed: true, damage: 0, multiplier: 1, critical: false, base: 0 }
  const attackStat = move.damageClass === 'special' ? stat(attacker, 'special-attack') : stat(attacker, 'attack')
  const defenseStat = move.damageClass === 'special' ? stat(defender, 'special-defense') : stat(defender, 'defense')
  const burnPenalty = attacker.status === 'burn' && move.damageClass === 'physical' ? 0.5 : 1
  const stab = attacker.types.includes(move.type) ? 1.5 : 1
  const multiplier = effectiveness(move.type, defender.types)
  const critical = Math.random() < 0.0625
  const crit = critical ? 1.5 : 1
  const randomFactor = 0.85 + Math.random() * 0.15
  const base = Math.floor(Math.floor(Math.floor((2 * attacker.level / 5 + 2) * move.power * attackStat * burnPenalty / Math.max(1, defenseStat)) / 50) + 2)
  const guard = defender.guarding ? 0.5 : 1
  const damage = multiplier === 0 ? 0 : Math.max(1, Math.floor(base * stab * multiplier * crit * randomFactor * guard))
  return { damage, multiplier, critical, missed: false, base, guard }
}

function priority(action) {
  if (action?.kind === 'focus' || action?.kind === 'guard') return 1
  return Number(action?.move?.priority || 0)
}

export function pickAiAction(mon, target = null) {
  const usable = mon.moves.filter((move) => mon.energy >= move.energyCost)
  const hpRatio = mon.hp / mon.maxHp
  if (!usable.length) return { kind: 'focus' }
  if (mon.energy < Math.min(...mon.moves.map((move) => move.energyCost))) return { kind: 'focus' }
  if (hpRatio < 0.28 && mon.energy >= GUARD_COST && Math.random() < 0.38) return { kind: 'guard' }
  const targetTypes = target?.types || []
  const score = (move) => {
    const eff = effectiveness(move.type, targetTypes)
    const utility = move.ailment !== 'none' ? 12 : 0
    const precision = (move.accuracy ?? 100) / 100
    return (move.power || 0) * Math.max(0, eff) * precision + utility - move.energyCost * 0.25 + (move.priority || 0) * 14
  }
  return { kind: 'move', move: usable.reduce((best, current) => !best || score(current) > score(best) ? current : best, null) }
}

function applyAilment(target, move, events) {
  if (!move.ailment || move.ailment === 'none' || !move.ailmentChance || target.status) return
  if (Math.random() * 100 >= move.ailmentChance) return
  target.status = move.ailment
  target.statusTurns = move.ailment === 'sleep' ? 2 : move.ailment === 'freeze' ? 3 : 3
  target.toxicCounter = 1
  events.push({ type: 'status', targetName: target.name, status: move.ailment })
}

function applyEndRoundStatus(mon, events) {
  if (mon.fainted || !mon.status) return
  if (mon.status === 'paralysis') {
    mon.statusTurns -= 1
  } else if (mon.status === 'burn' || mon.status === 'poison') {
    const tick = Math.max(1, Math.floor(mon.maxHp * 0.06))
    mon.hp = clamp(mon.hp - tick, 0, mon.maxHp)
    events.push({ type: 'status-damage', targetName: mon.name, damage: tick, status: mon.status })
  } else if (mon.status === 'bad-poison') {
    const tick = Math.max(1, Math.floor(mon.maxHp * (0.04 + 0.02 * (mon.toxicCounter - 1))))
    mon.hp = clamp(mon.hp - tick, 0, mon.maxHp)
    events.push({ type: 'status-damage', targetName: mon.name, damage: tick, status: mon.status })
    mon.toxicCounter += 1
  }
  if (mon.status === 'sleep' || mon.status === 'freeze') mon.statusTurns -= 1
  if (mon.statusTurns <= 0) mon.status = null
  if (mon.hp <= 0) { mon.hp = 0; mon.fainted = true; events.push({ type: 'faint', targetName: mon.name }) }
}

function canAct(mon, events) {
  if (mon.fainted) return false
  if (mon.status === 'sleep' || mon.status === 'freeze') {
    if (Math.random() < 0.65) {
      events.push({ type: 'skip', actorName: mon.name, status: mon.status })
      return false
    }
    mon.status = null
  }
  if (mon.status === 'paralysis' && Math.random() < 0.25) {
    events.push({ type: 'skip', actorName: mon.name, status: 'paralysis' })
    return false
  }
  return true
}

export function executeTurn(player, opponent, playerAction, opponentAction) {
  const events = []
  const actions = [
    { actor: 'player', mon: player, target: opponent, action: playerAction },
    { actor: 'opponent', mon: opponent, target: player, action: opponentAction },
  ].filter((entry) => entry.action)
  actions.sort((a, b) => (priority(b.action) - priority(a.action)) || (stat(b.mon, 'speed') - stat(a.mon, 'speed')) || (Math.random() - 0.5))

  for (const entry of actions) {
    const { mon, target, action, actor } = entry
    if (!canAct(mon, events) || target.fainted) continue
    if (action.kind === 'focus') {
      mon.energy = clamp(mon.energy + FOCUS_GAIN, 0, MAX_ENERGY)
      events.push({ type: 'focus', actor, actorName: mon.name, amount: FOCUS_GAIN })
      continue
    }
    if (action.kind === 'guard') {
      if (mon.energy < GUARD_COST) {
        mon.energy = clamp(mon.energy + FOCUS_GAIN, 0, MAX_ENERGY)
        events.push({ type: 'focus', actor, actorName: mon.name, amount: FOCUS_GAIN })
      } else {
        mon.energy -= GUARD_COST
        mon.guarding = true
        events.push({ type: 'guard', actor, actorName: mon.name })
      }
      continue
    }

    const move = action.move
    if (!move || mon.energy < move.energyCost) {
      mon.energy = clamp(mon.energy + FOCUS_GAIN, 0, MAX_ENERGY)
      events.push({ type: 'focus', actor, actorName: mon.name, amount: FOCUS_GAIN })
      continue
    }
    mon.energy = clamp(mon.energy - move.energyCost, 0, MAX_ENERGY)
    const result = calculateDamage(mon, target, move)
    if (result.missed) {
      events.push({ type: 'miss', actor: actor, actorName: mon.name, targetName: target.name, move: move.name })
      continue
    }
    target.hp = clamp(target.hp - result.damage, 0, target.maxHp)
    events.push({ type: 'attack', actor, actorName: mon.name, targetName: target.name, move: move.name, damage: result.damage, multiplier: result.multiplier, critical: result.critical, guard: result.guard, power: move.power })
    if (result.multiplier > 1) events.push({ type: 'super', targetName: target.name, multiplier: result.multiplier })
    if (result.multiplier < 1 && result.multiplier > 0) events.push({ type: 'resist', targetName: target.name, multiplier: result.multiplier })
    if (result.multiplier === 0) events.push({ type: 'immune', targetName: target.name })
    if (result.critical) events.push({ type: 'critical', actorName: mon.name })
    if (result.damage > 0) applyAilment(target, move, events)
    if (move.drain && result.damage > 0) mon.hp = clamp(mon.hp + Math.max(1, Math.floor(result.damage * Math.abs(move.drain) / 100)), 0, mon.maxHp)
    if (move.recoil && result.damage > 0) mon.hp = clamp(mon.hp - Math.max(1, Math.floor(result.damage * Math.abs(move.recoil) / 100)), 0, mon.maxHp)
    if (target.hp <= 0) {
      target.hp = 0
      target.fainted = true
      events.push({ type: 'faint', targetName: target.name })
    }
  }

  for (const mon of [player, opponent]) {
    mon.guarding = false
    mon.energy = clamp(mon.energy + ENERGY_REGEN, 0, MAX_ENERGY)
    applyEndRoundStatus(mon, events)
  }
  return events
}

export function teamHasLiving(team = []) { return team.some((mon) => !mon.fainted && mon.hp > 0) }
