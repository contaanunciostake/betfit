// src/components/TunnelTest.jsx
import { useState, useEffect } from 'react'
import apiClient from '../services/api'

const TunnelTest = () => {
  const [status, setStatus] = useState('idle')
  const [results, setResults] = useState({})
  const [error, setError] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(true)

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
  const IS_TUNNEL = API_URL.includes('loca.lt') || API_URL.includes('ngrok')

  const runTests = async () => {
    setStatus('checking')
    setError(null)
    setResults({})

    try {
      console.log('🧪 [TunnelTest] Iniciando testes de conexão...')
      
      // Teste 1: Health check básico
      let healthResult = null
      try {
        healthResult = await apiClient.checkTunnelHealth()
        console.log('✅ [TunnelTest] Health check:', healthResult)
      } catch (err) {
        console.warn('⚠️ [TunnelTest] Health check falhou:', err.message)
        healthResult = { error: err.message }
      }

      // Teste 2: Teste específico do túnel (se for túnel)
      let tunnelResult = null
      if (IS_TUNNEL) {
        try {
          tunnelResult = await apiClient.testTunnelConnection()
          console.log('✅ [TunnelTest] Tunnel test:', tunnelResult)
        } catch (err) {
          console.warn('⚠️ [TunnelTest] Tunnel test falhou:', err.message)
          tunnelResult = { success: false, error: err.message }
        }
      }

      // Teste 3: Teste de API básica
      let apiResult = null
      try {
        apiResult = await apiClient.testConnection()
        console.log('✅ [TunnelTest] API test:', apiResult)
      } catch (err) {
        console.warn('⚠️ [TunnelTest] API test falhou:', err.message)
        apiResult = { success: false, error: err.message }
      }

      const testResults = {
        timestamp: new Date().toISOString(),
        apiUrl: API_URL,
        isTunnel: IS_TUNNEL,
        healthCheck: healthResult,
        tunnelTest: tunnelResult,
        apiTest: apiResult,
        environment: import.meta.env.VITE_ENVIRONMENT,
        bypassEnabled: import.meta.env.VITE_BYPASS_TUNNEL_REMINDER === '1'
      }

      setResults(testResults)
      
      // Determinar status geral
      const hasErrors = (
        (healthResult && healthResult.error) ||
        (tunnelResult && !tunnelResult.success) ||
        (apiResult && !apiResult.success)
      )

      if (hasErrors) {
        setStatus('warning')
      } else {
        setStatus('success')
      }
      
      console.log('✅ [TunnelTest] Testes concluídos:', testResults)

    } catch (err) {
      console.error('❌ [TunnelTest] Erro geral nos testes:', err)
      setError(err.message)
      setStatus('failed')
      
      setResults({
        timestamp: new Date().toISOString(),
        apiUrl: API_URL,
        isTunnel: IS_TUNNEL,
        error: err.message,
        errorType: err.name || 'Unknown'
      })
    }
  }

  // Auto-executar periodicamente em túneis
  useEffect(() => {
  if (IS_TUNNEL) {
    const interval = setInterval(runTests, 30000) // A cada 30 segundos
    return () => clearInterval(interval)
  }
}, [IS_TUNNEL])

  // Não mostrar se não for túnel e não estiver visível
  if (!IS_TUNNEL && !isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm transition-colors"
          title="Testar conexão da API"
        >
          API Test
        </button>
      </div>
    )
  }

  if (!isVisible) return null

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      case 'checking': return 'bg-blue-500 animate-pulse'
      default: return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'success': return 'Conectado'
      case 'warning': return 'Parcial'
      case 'failed': return 'Erro'
      case 'checking': return 'Testando...'
      default: return 'Idle'
    }
  }

  const getStatusTextColor = () => {
    switch (status) {
      case 'success': return 'text-green-700'
      case 'warning': return 'text-yellow-700'
      case 'failed': return 'text-red-700'
      case 'checking': return 'text-blue-700'
      default: return 'text-gray-700'
    }
  }

  return (
    <div className={`fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl z-50 transition-all duration-300 ${
      isMinimized ? 'w-64' : 'w-80'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
          <h3 className="font-semibold text-gray-900 text-sm">
            {IS_TUNNEL ? 'Status do Túnel' : 'Status da API'}
          </h3>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? '📄' : '📋'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Fechar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3">
          {/* Status Principal */}
          <div className="flex items-center mb-3">
            <span className={`text-sm font-medium ${getStatusTextColor()}`}>
              {getStatusText()}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {results.timestamp && new Date(results.timestamp).toLocaleTimeString()}
            </span>
          </div>

          {/* Informações Básicas */}
          <div className="space-y-1 text-xs text-gray-600 mb-3">
            <div><strong>URL:</strong> {API_URL}</div>
            {IS_TUNNEL && <div><strong>Tipo:</strong> {API_URL.includes('loca.lt') ? 'LocalTunnel' : 'ngrok'}</div>}
            <div><strong>Ambiente:</strong> {results.environment || import.meta.env.VITE_ENVIRONMENT || 'dev'}</div>
            {results.bypassEnabled && <div><strong>Bypass:</strong> Ativo</div>}
          </div>

          {/* Resultados dos Testes */}
          {results.healthCheck && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-700">Health Check:</div>
              <div className={`text-xs ${results.healthCheck.error ? 'text-red-600' : 'text-green-600'}`}>
                {results.healthCheck.error ? results.healthCheck.error : results.healthCheck.status || 'OK'}
              </div>
            </div>
          )}

          {results.tunnelTest && (
            <div className="mb-2">
              <div className="text-xs font-medium text-gray-700">Tunnel Test:</div>
              <div className={`text-xs ${results.tunnelTest.success ? 'text-green-600' : 'text-red-600'}`}>
                {results.tunnelTest.success ? 'OK' : results.tunnelTest.error || 'Falhou'}
              </div>
            </div>
          )}

          {results.apiTest && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-700">API Test:</div>
              <div className={`text-xs ${results.apiTest.success ? 'text-green-600' : 'text-red-600'}`}>
                {results.apiTest.success ? 'OK' : results.apiTest.error || 'Falhou'}
              </div>
            </div>
          )}

          {/* Mensagem de Erro Geral */}
          {error && (
            <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
              <div className="font-medium text-red-700">Erro:</div>
              <div className="text-red-600">{error}</div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2">
            <button
              onClick={runTests}
              disabled={status === 'checking'}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-3 py-2 rounded text-xs transition-colors"
            >
              {status === 'checking' ? 'Testando...' : 'Testar'}
            </button>
            
            {status === 'failed' && (
              <button
                onClick={() => window.location.reload()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs transition-colors"
              >
                Reload
              </button>
            )}
          </div>

          {/* Debug Info */}
          {import.meta.env.MODE === 'development' && results.timestamp && (
            <details className="mt-3">
              <summary className="text-xs cursor-pointer text-gray-500 hover:text-gray-700">
                Debug Info
              </summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto max-h-32">
                {JSON.stringify(results, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Minimized Content */}
      {isMinimized && (
        <div className="p-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${getStatusTextColor()}`}>
              {getStatusText()}
            </span>
            <button
              onClick={runTests}
              disabled={status === 'checking'}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              Test
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default TunnelTest