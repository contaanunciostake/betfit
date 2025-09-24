import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { ChallengeProvider } from './contexts/ChallengeContext';
import { SettingsProvider } from './contexts/SettingsContext';
// TunnelTest temporariamente desabilitado
// import TunnelTest from './components/TunnelTest';

// Pages
import LandingPage from './pages/LandingPage';
import MainLayout from './components/layout/MainLayout';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import ProfileTest from './pages/ProfileTest';
import Settings from './pages/Settings';

// Common Components
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

import './App.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Public Route Component (redirects authenticated users)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingScreen />;
  }
  
  return !isAuthenticated ? children : <Navigate to="/challenges" replace />;
};

// Component to handle tunnel configuration - OTIMIZADO
const AppWithTunnelSupport = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  const IS_TUNNEL = API_URL.includes('loca.lt') || API_URL.includes('ngrok');

  useEffect(() => {
    // Log mínimo na inicialização
    console.log('BetFit Frontend iniciado');
    console.log('API URL:', API_URL);
    
    // Apenas operações DOM essenciais
    if (IS_TUNNEL) {
      document.body.classList.add('tunnel-mode');
    }

    // Cleanup otimizado
    return () => {
      if (IS_TUNNEL) {
        document.body.classList.remove('tunnel-mode');
      }
    };
  }, [IS_TUNNEL]); // Dependências reduzidas

  return (
    <div className="App">
      <Routes>
        {/* Public Route for Landing Page */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/challenges" 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile/*" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile-test" 
          element={
            <ProtectedRoute>
              <ProfileTest />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/wallet" 
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route 
          path="*" 
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          } 
        />
      </Routes>

      {/* TunnelTest DESABILITADO temporariamente para melhorar performance */}
      {/* Reabilite apenas quando necessário para debug */}
      {/* process.env.NODE_ENV === 'development' && <TunnelTest /> */}
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <SettingsProvider>
          <AuthProvider>
            <WalletProvider>
              <ChallengeProvider>
                <AppWithTunnelSupport />
              </ChallengeProvider>
            </WalletProvider>
          </AuthProvider>
        </SettingsProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;