import { useEffect, useRef, useState } from 'react'
import { VolumeIcon } from './Icon.jsx'
import { getCryUrl } from '../utils.js'

function AudioButton({ pokemon, compact = false }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [available, setAvailable] = useState(true)
  const source = pokemon?.cries?.latest || pokemon?.cries?.legacy || (pokemon?.id ? getCryUrl(pokemon.id) : '')

  useEffect(() => {
    audioRef.current?.pause()
    audioRef.current = source ? new Audio(source) : null
    setPlaying(false)
    setAvailable(Boolean(source))
    return () => audioRef.current?.pause()
  }, [source])

  async function play() {
    if (!audioRef.current || !source) return
    audioRef.current.currentTime = 0
    try {
      setPlaying(true)
      await audioRef.current.play()
      audioRef.current.onended = () => setPlaying(false)
    } catch {
      setAvailable(false)
      setPlaying(false)
    }
  }

  return <button type="button" className={`icon-action ${compact ? 'icon-action-compact' : ''} ${playing ? 'is-playing' : ''}`} onClick={play} disabled={!available} aria-label={available ? `Play ${pokemon?.name || 'Pokémon'} cry` : 'Cry unavailable'}><VolumeIcon /> <span>{available ? (playing ? 'Playing cry' : 'Play cry') : 'Cry unavailable'}</span></button>
}
export default AudioButton
