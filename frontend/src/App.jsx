import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BlockchainProvider } from './context/BlockchainContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CollectorPage from './pages/CollectorPage'
import SupplyChainPage from './pages/SupplyChainPage'
import VerifyPage from './pages/VerifyPage'
import AdminPage from './pages/AdminPage'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-forest">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    return <div className="p-8 text-center"><h2 className="text-xl text-red-600">Access denied for role: {user.role}</h2></div>
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <BlockchainProvider>
        <AuthProvider>
          <div className="min-h-screen bg-cream">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify/:batchId" element={<VerifyPage />} />
              <Route path="/dashboard" element={
                <ProtectedRoute><Dashboard /></ProtectedRoute>
              } />
              <Route path="/collect" element={
                <ProtectedRoute roles={['collector','admin']}><CollectorPage /></ProtectedRoute>
              } />
              <Route path="/supply" element={
                <ProtectedRoute roles={['aggregator','processor','manufacturer','admin']}><SupplyChainPage /></ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
              } />
            </Routes>
          </div>
        </AuthProvider>
      </BlockchainProvider>
    </BrowserRouter>
  )
}
