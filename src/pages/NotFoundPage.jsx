import { Link } from 'react-router-dom'
function NotFoundPage(){return <div className="not-found"><p className="eyebrow">404 · Unknown route</p><h1>Nothing here.</h1><p>This route fell outside the field network.</p><Link to="/" className="primary-button">Return to the Pokédex</Link></div>}
export default NotFoundPage
