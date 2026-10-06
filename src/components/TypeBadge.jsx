import { TYPE_COLORS } from '../config.js'

function TypeBadge({ type, large = false }) {
  const [background, text, accent] = TYPE_COLORS[type] || ['#e8eaed', '#34383d', '#9aa3b1']
  return <span className={`type-badge ${large ? 'type-badge-large' : ''}`} style={{ '--type-bg': background, '--type-text': text, '--type-accent': accent }}>{type}</span>
}
export default TypeBadge
