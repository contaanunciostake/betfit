// src/services/api.js ou src/services/apiClient.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
const BYPASS_TUNNEL = import.meta.env.VITE_BYPASS_TUNNEL_REMINDER === '1'
const IS_TUNNEL = API_BASE_URL.includes('loca.lt') || API_BASE_URL.includes('ngrok')

console.log('🌐 API Configuration:', {
  baseURL: API_BASE_URL,
  bypassTunnel: BYPASS_TUNNEL,
  isTunnel: IS_TUNNEL,
  environment: import.meta.env.VITE_ENVIRONMENT
})

class ApiClient {
  constructor() {
    this.token = null
    this.requestQueue = new Map() // Para evitar requisições duplicadas
  }

  // Método para definir token de autenticação
  setToken(token) {
    this.token = token
    console.log('🔑 [API] Token definido:', token ? 'Token presente' : 'Token removido')
  }

  // Método para obter token atual
  getToken() {
    return this.token || localStorage.getItem('auth_token')
  }

  // MÉTODO NOVO: Headers otimizados para LocalTunnel
  _getHeaders(customHeaders = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Cache-Control': 'no-cache',
      ...customHeaders
    }

    // Headers específicos para LocalTunnel
    if (BYPASS_TUNNEL || IS_TUNNEL) {
      headers['bypass-tunnel-reminder'] = '1'
    }

    // Adicionar token se disponível
    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  // MÉTODO NOVO: Configurações de requisição para túneis
  _getRequestConfig(options = {}) {
    return {
      method: 'GET',
      headers: this._getHeaders(options.headers),
      credentials: 'include', // Importante para túneis
      mode: 'cors',
      ...options
    }
  }

  // Método genérico para requisições - ATUALIZADO
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const requestKey = `${options.method || 'GET'}_${endpoint}`
    
    // Evitar requisições duplicadas simultâneas
    if (this.requestQueue.has(requestKey)) {
      console.log(`🔄 [API] Requisição já em andamento: ${requestKey}`)
      return this.requestQueue.get(requestKey)
    }
    
    const config = this._getRequestConfig(options)

    const requestPromise = this._executeRequest(url, config, requestKey)
    
    // Adicionar à fila de requisições
    this.requestQueue.set(requestKey, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      // Remover da fila quando concluída
      this.requestQueue.delete(requestKey)
    }
  }

  // MÉTODO ATUALIZADO: Execução com tratamento específico para túneis
  async _executeRequest(url, config, requestKey) {
    try {
      console.log(`🌐 [API] ${config.method} ${url}`)
      
      const response = await fetch(url, config)
      
      // Tratamento específico para HTTP 511
      if (response.status === 511) {
        console.error('❌ [API] HTTP 511 - Network Authentication Required')
        throw new Error('Erro de autenticação de rede. Verifique se o túnel está funcionando.')
      }
      
      // Verificar se a resposta é JSON válido
      const contentType = response.headers.get('content-type')
      let result = null
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
      } else {
        const text = await response.text()
        // Tentar parsear como JSON se possível
        try {
          result = JSON.parse(text)
        } catch {
          result = { data: text, raw: true }
        }
      }
      
      if (!response.ok) {
        // Tratamento específico para diferentes códigos de erro
        const errorMessage = result?.message || result?.error || response.statusText
        
        if (response.status === 401) {
          console.warn('🔒 [API] Token expirado ou inválido')
          // Remover token inválido
          localStorage.removeItem('auth_token')
          this.token = null
        }
        
        // Tratamento específico para túneis
        if (IS_TUNNEL && (response.status >= 500 || response.status === 0)) {
          throw new Error('Erro de conexão com o túnel. Tente recarregar a página.')
        }
        
        throw new Error(`HTTP ${response.status}: ${errorMessage}`)
      }
      
      console.log(`✅ [API] ${config.method} ${url} - Sucesso`)
      
      return result
    } catch (error) {
      console.error(`❌ [API] ${config.method} ${url} - Erro:`, error)
      
      // Tratamento específico para erros de rede em túneis
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (IS_TUNNEL) {
          throw new Error('Erro de conexão com o túnel. Verifique se o túnel está ativo.')
        } else {
          throw new Error('Erro de conexão. Verifique sua internet.')
        }
      }
      
      throw error
    }
  }

  // Método GET
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    })
  }

  // Método POST
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
      ...options
    })
  }

  // Método PUT
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
      ...options
    })
  }

  // Método DELETE
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    })
  }

  // Método PATCH
  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : null,
      ...options
    })
  }

  // =================== MÉTODOS ESPECÍFICOS PARA MERCADOPAGO ===================

  // Configurações do MercadoPago
  async getMercadoPagoConfig() {
    return this.get('/api/payments/config')
  }

  // PIX Payments
  async createPixPayment(userId, amount, description) {
    return this.post('/api/payments/pix', {
      user_id: userId,
      amount: parseFloat(amount),
      description: description || 'Depósito BetFit'
    })
  }

  async checkPaymentStatus(paymentId) {
    return this.get(`/api/payments/status/${paymentId}`)
  }

  // Card Payments
  async createCardPayment(userId, amount, cardToken, description) {
    return this.post('/api/payments/card', {
      user_id: userId,
      amount: parseFloat(amount),
      token: cardToken,
      description: description || 'Depósito BetFit',
      installments: 1
    })
  }

  // Wallet Operations
  async getWalletBalance(userId) {
    return this.get(`/api/wallet/${userId}/balance`)
  }

  async getWalletTransactions(userId, filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.type) params.append('type', filters.type)
    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('start_date', filters.startDate)
    if (filters.endDate) params.append('end_date', filters.endDate)
    if (filters.limit) params.append('limit', filters.limit)
    if (filters.offset) params.append('offset', filters.offset)

    const queryString = params.toString()
    const endpoint = queryString 
      ? `/api/wallet/${userId}/transactions?${queryString}`
      : `/api/wallet/${userId}/transactions`
    
    return this.get(endpoint)
  }

  async getWalletInfo(userId) {
    return this.get(`/api/wallet/${userId}`)
  }

  // PIX Withdrawals
  async createPixWithdrawal(userId, amount, pixKey, description) {
    return this.post('/api/payments/withdraw/pix', {
      user_id: userId,
      amount: parseFloat(amount),
      pix_key: pixKey,
      description: description || 'Saque BetFit'
    })
  }

  async validatePixKey(pixKey) {
    return this.post('/api/payments/validate-pix-key', {
      pix_key: pixKey
    })
  }

  // Webhook handler (se necessário no frontend)
  async processWebhook(webhookData) {
    return this.post('/api/payments/webhook', webhookData)
  }

  // =================== MÉTODOS DE UTILIDADE ===================

  // MÉTODO ATUALIZADO: Upload de arquivos para túneis
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData()
    formData.append('file', file)
    
    // Adicionar dados adicionais
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key])
    })

    const headers = {}
    
    // Headers específicos para túneis
    if (BYPASS_TUNNEL || IS_TUNNEL) {
      headers['bypass-tunnel-reminder'] = '1'
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      console.log(`📁 [API] Upload para ${endpoint}`)
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Importante para túneis
        mode: 'cors'
      })

      if (response.status === 511) {
        throw new Error('Erro de autenticação de rede no upload.')
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`✅ [API] Upload concluído`)
      
      return result
    } catch (error) {
      console.error(`❌ [API] Erro no upload:`, error)
      throw error
    }
  }

  // Método para requisições com timeout
  async requestWithTimeout(endpoint, options = {}, timeout = 30000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const result = await this.request(endpoint, {
        ...options,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return result
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new Error('Requisição expirou. Tente novamente.')
      }
      
      throw error
    }
  }

  // MÉTODO ATUALIZADO: Verificar conectividade
  async checkConnection() {
    try {
      await this.get('/api/health', { 
        headers: { 'Cache-Control': 'no-cache' } 
      })
      return { connected: true }
    } catch (error) {
      return { 
        connected: false, 
        error: error.message 
      }
    }
  }

  // Limpar cache de requisições
  clearRequestQueue() {
    this.requestQueue.clear()
  }

  // Método para retry com backoff exponencial
  async requestWithRetry(endpoint, options = {}, maxRetries = 3) {
    let lastError
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await this.request(endpoint, options)
      } catch (error) {
        lastError = error
        
        // Não fazer retry para erros 4xx (exceto 408, 429)
        if (error.message.includes('HTTP 4') && 
            !error.message.includes('408') && 
            !error.message.includes('429')) {
          throw error
        }
        
        if (i < maxRetries) {
          const delay = Math.pow(2, i) * 1000 // Backoff exponencial
          console.log(`🔄 [API] Retry ${i + 1}/${maxRetries} em ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  // =================== MÉTODOS NOVOS PARA LOCALTUNNEL ===================

  // NOVO MÉTODO: Teste específico para túneis
  async testTunnelConnection() {
    try {
      const response = await this.get('/api/tunnel-health')
      console.log('🌐 [TUNNEL] Teste de conexão bem-sucedido:', response)
      return { success: true, data: response }
    } catch (error) {
      console.error('❌ [TUNNEL] Teste de conexão falhou:', error)
      return { success: false, error: error.message }
    }
  }

  // NOVO MÉTODO: Verificar se túnel está funcionando
  async checkTunnelHealth() {
    if (!IS_TUNNEL) {
      return { isTunnel: false, status: 'local' }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/tunnel-health`, {
        method: 'GET',
        headers: this._getHeaders(),
        credentials: 'include',
        mode: 'cors'
      })

      if (response.status === 511) {
        return { isTunnel: true, status: 'auth_required', error: 'HTTP 511' }
      }

      if (response.ok) {
        const data = await response.json()
        return { isTunnel: true, status: 'healthy', data }
      } else {
        return { isTunnel: true, status: 'error', error: `HTTP ${response.status}` }
      }
    } catch (error) {
      return { isTunnel: true, status: 'unreachable', error: error.message }
    }
  }

  // NOVO MÉTODO: Teste de conexão simples
  async testConnection() {
    try {
      const response = await this.get('/api/test-connection')
      return { success: true, data: response }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // NOVO MÉTODO: Obter informações do ambiente
  getEnvironmentInfo() {
    return {
      apiUrl: API_BASE_URL,
      isTunnel: IS_TUNNEL,
      bypassEnabled: BYPASS_TUNNEL,
      environment: import.meta.env.VITE_ENVIRONMENT || 'development',
      mode: import.meta.env.MODE || 'development'
    }
  }
}

// Criar instância única
const apiClient = new ApiClient()

export default apiClient