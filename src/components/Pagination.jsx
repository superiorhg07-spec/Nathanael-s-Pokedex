function Pagination({ page, pageCount, onChange }) {
  if (pageCount <= 1) return null
  const pages = []; const start = Math.max(1, Math.min(page - 2, pageCount - 4)); const end = Math.min(pageCount, start + 4)
  for (let value = start; value <= end; value += 1) pages.push(value)
  return <nav className="pagination" aria-label="Pokémon pages"><button type="button" className="page-button" disabled={page === 1} onClick={() => onChange(page - 1)}>Previous</button><div className="page-numbers">{start > 1 && <><button type="button" className="page-number" onClick={() => onChange(1)}>1</button><span>…</span></>}{pages.map((value) => <button type="button" key={value} className={`page-number ${value === page ? 'is-active' : ''}`} onClick={() => onChange(value)}>{value}</button>)}{end < pageCount && <><span>…</span><button type="button" className="page-number" onClick={() => onChange(pageCount)}>{pageCount}</button></>}</div><button type="button" className="page-button" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Next</button></nav>
}
export default Pagination
