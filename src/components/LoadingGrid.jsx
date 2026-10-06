function LoadingGrid({ count = 8 }) { return <div className="pokemon-grid loading-grid">{Array.from({ length: count }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-art" /><div className="skeleton-line wide" /><div className="skeleton-line" /></div>)}</div> }
export default LoadingGrid
