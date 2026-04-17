import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Schools from './pages/Schools'
import SchoolDetail from './pages/SchoolDetail'
import CalendarOutput from './pages/Calendar'
import Lots from './pages/Lots'
import LotDetail from './pages/LotDetail'
import GlobalEvents from './pages/GlobalEvents'
import CategorySettings from './pages/CategorySettings'
import { ToastProvider } from './components/ui/Toast'

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/schools" element={<Schools />} />
            <Route path="/schools/:id" element={<SchoolDetail />} />
            <Route path="/global-events" element={<GlobalEvents />} />
            <Route path="/calendar" element={<CalendarOutput />} />
            <Route path="/lots" element={<Lots />} />
            <Route path="/lots/:id" element={<LotDetail />} />
            <Route path="/category-settings" element={<CategorySettings />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
