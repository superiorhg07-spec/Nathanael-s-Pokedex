function StatBar({ label, value, compact = false }) {
  const percent = Math.min(100, Math.round((Number(value || 0) / 255) * 100))
  return <div className={`stat-row ${compact ? 'stat-row-compact' : ''}`}><div className="stat-label-row"><span>{label}</span><strong>{value}</strong></div><div className="stat-track"><span style={{ width: `${percent}%` }} /></div></div>
}
export default StatBar
