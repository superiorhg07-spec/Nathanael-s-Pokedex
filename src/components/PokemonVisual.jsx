import { useEffect, useRef, useState } from 'react'
import AudioButton from './AudioButton.jsx'
import { getAnimatedSpriteUrl, getArtworkUrl } from '../utils.js'

function PokemonVisual({ pokemon, models = null, compact = false, battle = false, action = null }) {
  const [mode, setMode] = useState(models?.regular ? '3d' : 'animated')
  const [shiny, setShiny] = useState(false)
  const [modelFailed, setModelFailed] = useState(false)
  const [battleAnimClass, setBattleAnimClass] = useState('')
  const viewerRef = useRef(null)
  const idleAnimationRef = useRef('')
  const modelUrl = models && !modelFailed ? (shiny ? models.shiny || models.regular : models.regular) : ''
  const sprite = pokemon?.sprites?.other?.showdown?.front_default || getAnimatedSpriteUrl(pokemon?.id)
  const shinySprite = pokemon?.sprites?.other?.showdown?.front_shiny || pokemon?.sprites?.front_shiny
  const artwork = pokemon?.sprites?.other?.['official-artwork']?.front_default || getArtworkUrl(pokemon?.id)
  const artworkShiny = pokemon?.sprites?.other?.['official-artwork']?.front_shiny || artwork

  useEffect(() => {
    setMode(models?.regular ? '3d' : 'animated')
    setModelFailed(false)
  }, [models, pokemon?.id])

  useEffect(() => {
    if (mode !== '3d' || !viewerRef.current) return undefined
    const viewer = viewerRef.current
    const onLoad = () => {
      const animations = Array.isArray(viewer.availableAnimations) ? viewer.availableAnimations : []
      if (!animations.length) {
        setMode('animated')
        return
      }
      idleAnimationRef.current = animations.find((name) => /idle|stand|default|loop/i.test(name)) || animations[0]
      try { viewer.animationName = idleAnimationRef.current; viewer.play() } catch { /* viewer can still render */ }
    }
    viewer.addEventListener('load', onLoad)
    if (viewer.loaded) onLoad()
    return () => viewer.removeEventListener('load', onLoad)
  }, [mode, modelUrl])

  useEffect(() => {
    if (!battle || !action) return undefined
    setBattleAnimClass('')
    const frame = window.requestAnimationFrame(() => {
      setBattleAnimClass(action.type === 'attack' ? 'battle-action-attack' : action.type === 'hit' ? 'battle-action-hit' : 'battle-action-focus')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [battle, action?.token, action?.type])

  useEffect(() => {
    if (!battle || mode !== '3d' || !viewerRef.current || !action) return undefined
    const viewer = viewerRef.current
    const animations = Array.isArray(viewer.availableAnimations) ? viewer.availableAnimations : []
    if (!animations.length) return undefined
    const matcher = action.type === 'attack'
      ? /attack|move|strike|hit|tackle|slam|bite|claw|punch|kick|beam|blast|shot|slash|tail|charge|impact/i
      : /hurt|damage|hit|flinch|defend|guard|block/i
    const actionAnimation = animations.find((name) => matcher.test(name))
    if (!actionAnimation) return undefined
    try { viewer.animationName = actionAnimation; viewer.play() } catch { return undefined }
    const timer = window.setTimeout(() => {
      try { viewer.animationName = idleAnimationRef.current || animations[0]; viewer.play() } catch { /* viewer can still render */ }
    }, 720)
    return () => window.clearTimeout(timer)
  }, [action?.token, action?.type, battle, mode])

  const on3DError = () => {
    setModelFailed(true)
    setMode('animated')
  }

  return <div className={`visual-system ${compact ? 'visual-system-compact' : ''} ${battle ? 'visual-system-battle' : ''} ${battleAnimClass}`} data-action-token={action?.token || ''}>
    {!battle && <div className="visual-toolbar">
      <div className="visual-tabs">
        {models?.regular && !modelFailed && <button type="button" className={mode === '3d' ? 'is-active' : ''} onClick={() => setMode('3d')}>3D</button>}
        <button type="button" className={mode === 'animated' ? 'is-active' : ''} onClick={() => setMode('animated')}>Animated</button>
        <button type="button" className={mode === 'artwork' ? 'is-active' : ''} onClick={() => setMode('artwork')}>Artwork</button>
      </div>
      <div className="visual-actions"><button type="button" className={`mini-toggle ${shiny ? 'is-active' : ''}`} onClick={() => setShiny((value) => !value)}>{shiny ? 'Shiny on' : 'Shiny'}</button><AudioButton pokemon={pokemon} compact /></div>
    </div>}
    <div className="visual-stage">
      {mode === '3d' && modelUrl ? <model-viewer ref={viewerRef} className="pokemon-model" src={modelUrl} {...(!battle ? { 'camera-controls': true } : {})} auto-rotate autoplay animation-crossfade-duration="220" shadow-intensity="1" exposure="1.05" interaction-prompt="none" reveal="auto" alt={`${pokemon?.name} 3D model`} onError={on3DError} /> : null}
      {mode === 'animated' ? <img className="pokemon-visual animated-visual" src={shiny && shinySprite ? shinySprite : sprite} alt={`${pokemon?.name} animated sprite`} onError={(event) => { if (event.currentTarget.dataset.fallback !== '1') { event.currentTarget.dataset.fallback = '1'; event.currentTarget.src = artwork } }} /> : null}
      {mode === 'artwork' ? <img className="pokemon-visual artwork-visual" src={shiny ? artworkShiny : artwork} alt={`${pokemon?.name} artwork`} /> : null}
    </div>
    {mode === 'animated' && models?.regular && !modelFailed && <small className="visual-fallback-note">Animated fallback shown when the 3D model has no animation or fails to load.</small>}
  </div>
}
export default PokemonVisual
