import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMove, getPokemon, getPokemonList } from '../api/pokeApi.js'
import PokemonVisual from '../components/PokemonVisual.jsx'
import PokemonSearchSelect from '../components/PokemonSearchSelect.jsx'
import TypeBadge from '../components/TypeBadge.jsx'
import { createBattleMon, executeTurn, FOCUS_GAIN, GUARD_COST, MAX_ENERGY, pickAiAction, teamHasLiving } from '../battle/engine.js'
import { formatPokemonName } from '../utils.js'

function chooseDiverseMoves(details, types) {
  const unique = details.filter(Boolean).filter((move, index, list) => list.findIndex((x) => x.name === move.name) === index)
  const damaging = unique.filter((move) => move.power > 0)
  const same = damaging.filter((move) => types.includes(move.type?.name))
  const coverage = damaging.filter((move) => !types.includes(move.type?.name))
  const status = unique.filter((move) => !move.power && move.meta?.ailment?.name && move.meta?.ailment?.name !== 'none')
  const picks = []
  const takeBest = (pool) => {
    const item = pool.filter((x) => !picks.some((p) => p.name === x.name)).sort((a,b) => (b.power || 0) - (a.power || 0) || (b.accuracy || 0) - (a.accuracy || 0))[0]
    if (item) picks.push(item)
  }
  takeBest(same)
  takeBest(coverage)
  takeBest(status)
  for (const move of damaging.sort((a,b) => (b.power || 0) - (a.power || 0) || (a.energyCost || 0) - (b.energyCost || 0))) {
    if (picks.length >= 4) break
    if (!picks.some((p) => p.name === move.name)) picks.push(move)
  }
  return picks.slice(0,4)
}

function BattlePage() {
  const [catalog, setCatalog] = useState([])
  const [setupTeam, setSetupTeam] = useState(() => {
    try { const saved = JSON.parse(localStorage.getItem('pokedex-team') || '[]'); return saved.length === 3 ? saved : ['', '', ''] } catch { return ['', '', ''] }
  })
  const [userTeam, setUserTeam] = useState([])
  const [enemyTeam, setEnemyTeam] = useState([])
  const [activeUser, setActiveUser] = useState(0)
  const [activeEnemy, setActiveEnemy] = useState(0)
  const [round, setRound] = useState(1)
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(true)
  const [inBattle, setInBattle] = useState(false)
  const [winner, setWinner] = useState('')
  const [effect, setEffect] = useState(null)
  const [moveLock, setMoveLock] = useState(false)
  const [setupError, setSetupError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getPokemonList(controller.signal).then(setCatalog).catch((error) => {
      if (error.name !== 'AbortError') setSetupError(error.message)
    }).finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [])

  const setupReady = setupTeam.filter(Boolean).length === 3 && new Set(setupTeam).size === 3
  const user = userTeam[activeUser]
  const enemy = enemyTeam[activeEnemy]
  const arenaType = enemy?.types?.[0] || user?.types?.[0] || 'psychic'
  const effectType = effect?.type || 'normal'

  async function makeBattleMon(name, slot) {
    const pokemon = await getPokemon(name)
    const names = pokemon.moves.map((x) => x.move.name)
    const sampled = [...new Set([...names.slice(0, 18), ...names.slice(Math.max(0, Math.floor(names.length * 0.35)), Math.floor(names.length * 0.35) + 12)])].slice(0, 18)
    const details = await Promise.all(sampled.map((move) => getMove(move).catch(() => null)))
    const selected = chooseDiverseMoves(details, pokemon.types.map((x) => x.type.name))
    return createBattleMon({ pokemon }, selected, slot)
  }

  async function startBattle() {
    if (!setupReady) { setSetupError('Choose three different Pokémon before starting the battle.'); return }
    setSetupError('')
    setBusy(true)
    try {
      const used = new Set(setupTeam)
      const pool = catalog.filter((pokemon) => !used.has(pokemon.name))
      const enemyNames = []
      while (enemyNames.length < 3 && pool.length) {
        const pick = pool[Math.floor(Math.random() * pool.length)]
        if (!enemyNames.includes(pick.name)) enemyNames.push(pick.name)
      }
      if (enemyNames.length < 3) throw new Error('The catalogue is incomplete. Refresh and try again.')
      const [players, enemies] = await Promise.all([
        Promise.all(setupTeam.map((name, index) => makeBattleMon(name, index))),
        Promise.all(enemyNames.map((name, index) => makeBattleMon(name, index))),
      ])
      players.forEach((mon,index) => { mon.active=index===0 })
      enemies.forEach((mon,index) => { mon.active=index===0 })
      setUserTeam(players); setEnemyTeam(enemies); setActiveUser(0); setActiveEnemy(0); setRound(1); setWinner('')
      setLog([`Arena ready. ${players[0].displayName} enters the field.`, `Rival squad: ${enemyNames.map(formatPokemonName).join(' · ')}`])
      localStorage.setItem('pokedex-team', JSON.stringify(setupTeam))
      setInBattle(true)
    } catch (error) { setSetupError(error.message || 'Battle preparation failed.') }
    finally { setBusy(false) }
  }

  function switchUser(index) {
    if (moveLock || winner || index === activeUser || userTeam[index]?.fainted) return
    const next = userTeam.map((mon,i) => ({ ...mon, active: i===index }))
    setUserTeam(next); setActiveUser(index); setRound((v) => v+1)
    setLog((old) => [`You sent out ${next[index].displayName}.`, ...old].slice(0,12))
  }

  function pushLog(events) {
    const lines = events.map((event) => {
      if (event.type==='attack') return `${formatPokemonName(event.actorName)} used ${formatPokemonName(event.move)} for ${event.damage} damage.`
      if (event.type==='focus') return `${formatPokemonName(event.actorName)} focused and restored ${event.amount} energy.`
      if (event.type==='guard') return `${formatPokemonName(event.actorName)} braced for impact.`
      if (event.type==='miss') return `${formatPokemonName(event.actorName)} missed ${formatPokemonName(event.move)}.`
      if (event.type==='critical') return `Critical hit!`
      if (event.type==='super') return `${formatPokemonName(event.targetName)} is weak to that move!`
      if (event.type==='resist') return `${formatPokemonName(event.targetName)} resisted the hit.`
      if (event.type==='immune') return `It had no effect on ${formatPokemonName(event.targetName)}.`
      if (event.type==='status') return `${formatPokemonName(event.targetName)} is now ${formatPokemonName(event.status)}.`
      if (event.type==='status-damage') return `${formatPokemonName(event.targetName)} took ${event.damage} ${formatPokemonName(event.status)} damage.`
      if (event.type==='skip') return `${formatPokemonName(event.actorName)} could not move.`
      if (event.type==='faint') return `${formatPokemonName(event.targetName)} fainted.`
      return ''
    }).filter(Boolean)
    if (lines.length) setLog((old) => [...lines, ...old].slice(0,12))
  }

  function resolveNext(team, current) {
    return team.findIndex((mon,index) => index !== current && !mon.fainted && mon.hp > 0)
  }

  function chooseAction(action) {
    if (!user || !enemy || moveLock || winner || user.fainted || enemy.fainted) return
    if (action.kind === 'move' && user.energy < action.move.energyCost) return
    if (action.kind === 'guard' && user.energy < GUARD_COST) return
    setMoveLock(true)

    const cloneTeam = (team) => team.map((mon) => ({ ...mon, types:[...mon.types], stats:mon.stats, sprites:mon.sprites, moves:mon.moves.map((m)=>({...m})) }))
    const nextUserTeam = cloneTeam(userTeam)
    const nextEnemyTeam = cloneTeam(enemyTeam)
    const nextUser = nextUserTeam[activeUser]
    const nextEnemy = nextEnemyTeam[activeEnemy]
    const aiAction = pickAiAction(nextEnemy, nextUser)
    const events = executeTurn(nextUser, nextEnemy, action, aiAction)
    let nextUserIndex = activeUser
    let nextEnemyIndex = activeEnemy
    if (nextEnemy.fainted) nextEnemyIndex = resolveNext(nextEnemyTeam, activeEnemy)
    if (nextUser.fainted) nextUserIndex = resolveNext(nextUserTeam, activeUser)
    if (nextEnemyIndex < 0) nextEnemyIndex = activeEnemy
    if (nextUserIndex < 0) nextUserIndex = activeUser
    nextUserTeam.forEach((mon,i)=>{ mon.active=i===nextUserIndex && !mon.fainted })
    nextEnemyTeam.forEach((mon,i)=>{ mon.active=i===nextEnemyIndex && !mon.fainted })
    const playerAlive=teamHasLiving(nextUserTeam), opponentAlive=teamHasLiving(nextEnemyTeam)
    setUserTeam(nextUserTeam); setEnemyTeam(nextEnemyTeam); setActiveUser(nextUserIndex); setActiveEnemy(nextEnemyIndex); setRound((v)=>v+1)
    pushLog(events)
    const attack=events.find((e)=>e.type==='attack')
    const attackerMoves = attack?.actor === 'opponent' ? nextEnemy.moves : nextUser.moves
    setEffect(attack ? { id: Date.now(), move:attack.move, type:attack.moveType || attackerMoves.find((m)=>m.name===attack.move)?.type || 'normal', actor:attack.actor, damage:attack.damage, critical:attack.critical, target:attack.targetName } : { id: Date.now(), move: events.find((e)=>e.type==='focus') ? 'FOCUS' : 'GUARD', type:'normal', actor:'player' })
    window.setTimeout(()=>setEffect(null),900)
    if (!opponentAlive) setWinner('VICTORY')
    else if (!playerAlive) setWinner('DEFEAT')
    window.setTimeout(()=>setMoveLock(false),650)
  }

  const moveButtons=useMemo(()=>user?.moves||[],[user])

  if (!inBattle) return <section className="battle-page">
    <div className="section-heading page-section-heading"><div><p className="section-kicker">Battle arena</p><h1>3v3 Battle Lab</h1></div><span>Actual API moves · energy strategy · round combat</span></div>
    <div className="battle-setup-grid">
      <section className="battle-setup-main"><div className="setup-intro"><p className="section-kicker">Arena protocol</p><h2>Pick three. Then fight.</h2><p>Each Pokémon receives four real moves from the API. Energy makes strong attacks expensive; Focus and Guard give you tactical options between attacks.</p></div>
      <div className="setup-select-grid">{setupTeam.map((value,index)=><PokemonSearchSelect key={index} label={`Slot ${index+1}`} value={value} onChange={(next)=>setSetupTeam((old)=>old.map((item,i)=>i===index?next:item))} catalog={catalog} placeholder="Search any Pokémon or form…" disabled={busy}/>)}</div>
      <div className="setup-actions"><button className="primary-button" onClick={startBattle} disabled={busy||!setupReady}>{busy?'Preparing API data…':'Enter arena'}</button><Link to="/team" className="secondary-button">Open Team Builder</Link></div>
      {setupError&&<div className="state-card error-state"><strong>Battle setup failed.</strong><span>{setupError}</span></div>}</section>
      <aside className="battle-setup-side"><p className="section-kicker">Battle systems</p><div className="setup-rule"><strong>⚡ Energy economy</strong><span>Different moves have different costs based on power, accuracy and priority.</span></div><div className="setup-rule"><strong>🛡 Guard</strong><span>Spend {GUARD_COST} energy to halve incoming damage for the round.</span></div><div className="setup-rule"><strong>✨ Focus</strong><span>Spend your turn to recover {FOCUS_GAIN} energy, plus the normal round regeneration.</span></div><div className="setup-rule"><strong>☄ Effects</strong><span>Accuracy, priority, STAB, type matchups, critical hits, drain, recoil and status ailments are simulated.</span></div><div className="setup-rule"><strong>🤖 Rival AI</strong><span>The rival evaluates power, type advantage, accuracy, energy and HP before choosing a move, guard or Focus.</span></div></aside>
    </div></section>

  return <section className={`battle-page arena-page arena-${arenaType}`}>
    <div className="section-heading page-section-heading battle-heading"><div><p className="section-kicker">Live battle</p><h1>Battle Nexus</h1></div><span>Round {round} · {user?.displayName} vs {enemy?.displayName}</span></div>
    <div className="battle-toolbar"><button className="secondary-button" onClick={()=>setInBattle(false)} disabled={moveLock}>Change team</button><button className="secondary-button" onClick={startBattle} disabled={busy}>Restart</button><span>{userTeam.filter((mon)=>!mon.fainted).length}/3 alive · {enemyTeam.filter((mon)=>!mon.fainted).length}/3 rival alive</span></div>

    <div className={`battle-arena arena-${arenaType}`}>
      <div className="arena-sky"><i/><i/><i/><b/><span className="arena-sun"/><span className="arena-cloud cloud-a"/><span className="arena-cloud cloud-b"/></div>
      <div className="arena-particles"><i/><i/><i/><i/><i/><i/></div>
      <div className={`battle-spell-fx type-${effectType} ${effect ? 'is-live' : ''} ${effect?.actor === 'opponent' ? 'from-enemy' : 'from-player'}`} key={effect?.id || 'idle'}><span/><b/><i/></div>
      <div className="arena-grid-floor"><span/><span/></div>
      <div className={`battle-pop ${effect?.actor==='player'?'player-pop':''} ${effect?.actor==='opponent'?'enemy-pop':''} ${effect?'is-live':''}`}>{effect?.move ? formatPokemonName(effect.move) : ''}{effect?.damage ? <strong>-{effect.damage}</strong> : null}</div>

      <div className="battle-squad-strip user-strip"><small>YOUR SQUAD</small>{userTeam.map((mon,index)=><button key={mon.name} className={`${index===activeUser?'active':''} ${mon.fainted?'fainted':''}`} onClick={()=>switchUser(index)} disabled={mon.fainted||index===activeUser||moveLock}><img src={mon.sprites?.front_default || mon.sprites?.other?.showdown?.front_default || ''} alt=""/><span>{formatPokemonName(mon.name)}</span></button>)}</div>
      <div className="battle-squad-strip enemy-strip"><small>RIVAL</small>{enemyTeam.map((mon,index)=><div key={mon.name} className={`${index===activeEnemy?'active':''} ${mon.fainted?'fainted':''}`}><span>{formatPokemonName(mon.name)}</span><b>{mon.fainted?'FAINTED':index===activeEnemy?'ACTIVE':'READY'}</b></div>)}</div>

      <div className="battle-mon-panel player-panel">
        <div className="battle-card-top"><div><strong>{user?.displayName}</strong><div className="type-row">{user?.types.map((type)=><TypeBadge key={type} type={type}/>)}</div></div><span>Lv. {user?.level}</span></div>
        <div className="battle-bars"><div className="hp-row"><span>HP</span><div className="hp-track"><i style={{width:`${user?Math.round(user.hp/user.maxHp*100):0}%`}}/></div><strong>{user?.hp}/{user?.maxHp}</strong></div><div className="energy-row"><span>⚡</span><div className="energy-track"><i style={{width:`${user?Math.round(user.energy/MAX_ENERGY*100):0}%`}}/></div><strong>{user?.energy}</strong></div></div>
        {user&&<div className={`battle-mon-visual ${effect?.actor==='player'?'is-attacking':''} ${effect?.actor==='opponent'&&effect?.target===user.name?'is-hit':''}`}><PokemonVisual pokemon={user} compact battle action={effect && effect.actor==='player' ? { type:'attack', token:effect.id } : effect && effect.target===user.name ? { type:'hit', token:effect.id } : null} /></div>}
      </div>

      <div className="battle-mon-panel enemy-panel">
        <div className="battle-card-top"><div><strong>{enemy?.displayName}</strong><div className="type-row">{enemy?.types.map((type)=><TypeBadge key={type} type={type}/>)}</div></div><span>Lv. {enemy?.level}</span></div>
        <div className="battle-bars"><div className="hp-row"><span>HP</span><div className="hp-track enemy-hp"><i style={{width:`${enemy?Math.round(enemy.hp/enemy.maxHp*100):0}%`}}/></div><strong>{enemy?.hp}/{enemy?.maxHp}</strong></div><div className="energy-row"><span>⚡</span><div className="energy-track"><i style={{width:`${enemy?Math.round(enemy.energy/MAX_ENERGY*100):0}%`}}/></div><strong>{enemy?.energy}</strong></div></div>
        {enemy&&<div className={`battle-mon-visual ${effect?.actor==='opponent'?'is-attacking':''} ${effect?.actor==='player'&&effect?.target===enemy.name?'is-hit':''}`}><PokemonVisual pokemon={enemy} compact battle action={effect && effect.actor==='opponent' ? { type:'attack', token:effect.id } : effect && effect.target===enemy.name ? { type:'hit', token:effect.id } : null} /></div>}
      </div>

      <div className="battle-center-panel">
        <div className="battle-vs-core"><span>ROUND {round}</span><b>VS</b></div>
        <div className="battle-log battle-log-arena" aria-live="polite">{log.map((line,index)=><p key={`${line}-${index}`}>{line}</p>)}</div>
      </div>

      {winner && <div className={`battle-finish ${winner==='VICTORY'?'victory':'defeat'}`}><div className="finish-glow"/><p className="section-kicker">{winner==='VICTORY'?'Arena cleared':'Run ended'}</p><h2>{winner}</h2><strong>{winner==='VICTORY'?'Your squad wins the Battle Nexus.':'The rival squad takes the field.'}</strong><div className="finish-team">{userTeam.map((mon)=><div key={mon.name} className={mon.fainted?'fainted':''}><img src={mon.sprites?.other?.showdown?.front_default||mon.sprites?.front_default||''} alt=""/><span>{formatPokemonName(mon.name)}</span></div>)}</div><div className="finish-actions"><button className="primary-button" onClick={startBattle}>Rematch</button><button className="secondary-button" onClick={()=>{setWinner('');setInBattle(false)}}>New teams</button></div></div>}
    </div>

    <div className="battle-command-deck">
      <div className="battle-command-head"><div><p className="section-kicker">Command deck</p><h2>{user?.displayName} — choose an action</h2><small className="battle-turn-hint">Moves are real API moves. Energy, accuracy, priority and type matchups matter.</small></div><span>{user?.energy} / {MAX_ENERGY} energy</span></div>
      <div className="battle-moves-grid">
        {moveButtons.map((move)=><button key={move.name} className={`battle-move-card type-${move.type}`} disabled={moveLock||Boolean(winner)||user?.fainted||user.energy<move.energyCost} onClick={()=>chooseAction({kind:'move',move})}><div className="move-type-line"><TypeBadge type={move.type}/><span>{move.damageClass}</span></div><strong>{formatPokemonName(move.name)}</strong><div className="move-stats"><span>POWER <b>{move.power||'—'}</b></span><span>ACC <b>{move.accuracy??'—'}%</b></span><span>ENERGY <b>{move.energyCost}</b></span></div>{move.ailment!=='none'&&<small>Effect: {formatPokemonName(move.ailment)}</small>}</button>)}
      </div>
      <div className="battle-tactics"><button className="tactic-button focus" disabled={moveLock||Boolean(winner)||user?.fainted} onClick={()=>chooseAction({kind:'focus'})}><span>✦</span><div><strong>Focus</strong><small>+{FOCUS_GAIN} energy</small></div></button><button className="tactic-button guard" disabled={moveLock||Boolean(winner)||user?.energy<GUARD_COST} onClick={()=>chooseAction({kind:'guard'})}><span>◈</span><div><strong>Guard</strong><small>{GUARD_COST} energy · halve damage</small></div></button></div>
    </div>
  </section>
}
export default BattlePage
