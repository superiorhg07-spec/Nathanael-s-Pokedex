import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import DetailPage from './pages/DetailPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import ListPage from './pages/ListPage.jsx'
import ComparePage from './pages/ComparePage.jsx'
import TeamBuilderPage from './pages/TeamBuilderPage.jsx'
import BattlePage from './pages/BattlePage.jsx'
import TypeLabPage from './pages/TypeLabPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

function App(){return <HashRouter><Routes><Route element={<Layout/>}><Route path="/" element={<ListPage/>}/><Route path="/favorites" element={<FavoritesPage/>}/><Route path="/compare" element={<ComparePage/>}/><Route path="/team" element={<TeamBuilderPage/>}/><Route path="/battle" element={<BattlePage/>}/><Route path="/types" element={<TypeLabPage/>}/><Route path="/pokemon/:name" element={<DetailPage/>}/><Route path="*" element={<NotFoundPage/>}/></Route></Routes></HashRouter>}
export default App
