import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'

// Components
import AdminLogin from './components/AdminLogin'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'

// Pages
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import ChallengesPage from './pages/ChallengesPage'
import PaymentsPage from './pages/PaymentsPage'
import CategoriesPage from './pages/CategoriesPage'
import SettingsPage from './pages/SettingsPage'
import LogsPage from './pages/LogsPage'
import InstallationPage from './pages/InstallationPage'
import { Toaster } from 'sonner';

// Context
import { AdminProvider, useAdmin } from './contexts/AdminContext'

function AppContent() {
  const { admin, loading } = useAdmin()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return <AdminLogin />
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
        <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/challenges" element={<ChallengesPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/installation" element={<InstallationPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/logs" element={<LogsPage />} />
          </Routes>
        </main>
      </div>
      
      {/* Toaster adicionado dentro do AppContent */}
      <Toaster 
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        theme="dark"
      />
    </div>
  )
}

function App() {
  return (
    <AdminProvider>
      <Router>
        <AppContent />
      </Router>
    </AdminProvider>
  )
}

export default App
