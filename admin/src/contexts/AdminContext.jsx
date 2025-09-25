import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AdminContext = createContext()

export const useAdmin = () => {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider')
  }
  return context
}

export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Configuração da API - Localhost como padrão
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://betfit-backend.onrender.com'

  // Função genérica para chamadas da API - Melhorada e robusta
  const apiCall = async (endpoint, options = {}) => {
    try {
      setLoading(true)
      setError('')

      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`
      
      console.log(`🌐 [API] ${options.method || 'GET'} ${url}`)

      const config = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      }

      // Adicionar token para endpoints admin
      if (endpoint.includes('/admin/') && admin?.token) {
        config.headers.Authorization = `Bearer ${admin.token}`
      }

      const response = await fetch(url, config)
      
      console.log(`📡 [API] Status: ${response.status}`)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = await response.text()
        }
        console.error(`❌ [API] Erro ${response.status}:`, errorData)
        throw new Error(`Erro ${response.status}: ${typeof errorData === 'object' ? errorData.message || errorData.error || 'Erro desconhecido' : errorData}`)
      }

      const data = await response.json()
      console.log(`✅ [API] Resposta:`, data)
      
      return data

    } catch (error) {
      console.error('❌ [API] Erro na requisição:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // ==================== MÉTODOS PARA DESAFIOS ====================

  // Buscar desafios públicos (endpoint original)
  const getChallenges = useCallback(async () => {
    try {
      console.log('🔍 [ADMIN] Buscando desafios públicos...')
      const data = await apiCall('/api/challenges')
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar desafios:', error)
      throw error
    }
  }, [])

  // NOVO: Buscar desafios para admin com dados de participação
  const getAdminChallenges = useCallback(async () => {
    try {
      console.log('🔍 [ADMIN] Buscando desafios para painel admin...')
      const data = await apiCall('/api/admin/challenges')
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar desafios admin:', error)
      // Fallback para endpoint público se admin não existir
      console.log('🔄 [ADMIN] Tentando endpoint público como fallback...')
      return await getChallenges()
    }
  }, [getChallenges])

  // NOVO: Buscar todas as participações
  const getAllParticipations = useCallback(async () => {
    try {
      console.log('🔍 [ADMIN] Buscando todas as participações...')
      const data = await apiCall('/api/challenges/my-participations')
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar participações:', error)
      // Retornar estrutura vazia se falhar
      return {
        participations: [],
        active_participations: [],
        completed_participations: [],
        total: 0,
        active_count: 0,
        completed_count: 0,
        message: 'Nenhuma participação encontrada'
      }
    }
  }, [])

  // NOVO: Buscar participações por usuário
  const getUserParticipations = useCallback(async (userEmail) => {
    try {
      console.log('🔍 [ADMIN] Buscando participações do usuário:', userEmail)
      const data = await apiCall(`/api/challenges/my-participations?user_email=${encodeURIComponent(userEmail)}`)
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar participações do usuário:', error)
      return {
        participations: [],
        active_participations: [],
        completed_participations: [],
        total: 0,
        active_count: 0,
        completed_count: 0,
        message: `Nenhuma participação encontrada para ${userEmail}`
      }
    }
  }, [])

  // NOVO: Buscar métricas do dashboard
  const getDashboardMetrics = useCallback(async () => {
    try {
      console.log('📊 [ADMIN] Buscando métricas do dashboard...')
      const data = await apiCall('/api/admin/dashboard/metrics')
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar métricas:', error)
      // Retornar métricas mock se falhar
      return {
        users: { total: 0, active: 0, blocked: 0 },
        challenges: { total_participations: 0, active_participations: 0, completed_participations: 0 },
        transactions: { total: 0, completed: 0, total_volume: 0.0 },
        wallets: { total_balance: 0.0, average_balance: 0.0 },
        message: 'Métricas não disponíveis'
      }
    }
  }, [])

  // NOVO: Buscar estatísticas de desafios com participações
  const getChallengeStats = useCallback(async () => {
    try {
      console.log('📊 [ADMIN] Buscando estatísticas de desafios...')
      
      // Buscar desafios e participações em paralelo
      const [challengesData, participationsData] = await Promise.all([
        getAdminChallenges(),
        getAllParticipations()
      ])

      // Calcular estatísticas
      const totalChallenges = challengesData?.challenges?.length || challengesData?.total || 0
      const totalParticipations = participationsData?.total || 0
      const activeParticipations = participationsData?.active_count || 0
      const completedParticipations = participationsData?.completed_count || 0

      // Calcular pool total
      let totalPool = 0
      if (challengesData?.challenges) {
        totalPool = challengesData.challenges.reduce((sum, challenge) => {
          return sum + (parseFloat(challenge.total_pool) || 0)
        }, 0)
      }

      const stats = {
        total_challenges: totalChallenges,
        active_challenges: challengesData?.challenges?.filter(c => c.status === 'active')?.length || 0,
        total_participants: totalParticipations,
        active_participants: activeParticipations,
        completed_participants: completedParticipations,
        total_pool: totalPool,
        challenges: challengesData?.challenges || [],
        participations: participationsData?.participations || []
      }

      console.log('✅ [ADMIN] Estatísticas calculadas:', stats)
      return stats

    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar estatísticas de desafios:', error)
      return {
        total_challenges: 0,
        active_challenges: 0,
        total_participants: 0,
        active_participants: 0,
        completed_participants: 0,
        total_pool: 0,
        challenges: [],
        participations: []
      }
    }
  }, [getAdminChallenges, getAllParticipations])

  // ==================== MÉTODOS PARA CATEGORIAS (CORRIGIDO) ====================

  // CORRIGIDO: Buscar categorias sem fallback de dados mock
  const getCategories = useCallback(async () => {
    try {
      console.log('🔍 [ADMIN] Buscando categorias do banco de dados...')
      const data = await apiCall('/api/categories')
      console.log('✅ [ADMIN] Categorias carregadas do banco:', data)
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar categorias do banco:', error)
      // REMOVIDO O FALLBACK - Deixar o erro passar para o componente tratar
      throw error
    }
  }, [])

  // NOVO: Criar categoria
  const createCategory = useCallback(async (categoryData) => {
    try {
      console.log('🏷️ [ADMIN] Criando categoria:', categoryData)
      
      const backendData = {
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon || 'trophy',
        color: categoryData.color || '#3b82f6'
      }

      console.log('📤 [ADMIN] Dados da categoria para backend:', backendData)

      const data = await apiCall('/api/categories', {
        method: 'POST',
        body: JSON.stringify(backendData)
      })
      
      return { success: true, ...data }
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao criar categoria:', error)
      throw error
    }
  }, [])

  // NOVO: Atualizar categoria
  const updateCategory = useCallback(async (categoryId, categoryData) => {
    try {
      console.log('📝 [ADMIN] Atualizando categoria:', categoryId, categoryData)
      
      const backendData = {
        name: categoryData.name,
        description: categoryData.description,
        icon: categoryData.icon || 'trophy',
        color: categoryData.color || '#3b82f6'
      }

      const data = await apiCall(`/api/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(backendData)
      })
      
      return { success: true, ...data }
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao atualizar categoria:', error)
      throw error
    }
  }, [])

  // NOVO: Deletar categoria
  const deleteCategory = useCallback(async (categoryId) => {
    try {
      console.log('🗑️ [ADMIN] Deletando categoria:', categoryId)
      
      const data = await apiCall(`/api/categories/${categoryId}`, {
        method: 'DELETE'
      })
      
      return { success: true, ...data }
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao deletar categoria:', error)
      throw error
    }
  }, [])

  // ==================== MÉTODOS ORIGINAIS DE DESAFIOS MANTIDOS ====================

  const createChallenge = useCallback(async (challengeData) => {
    try {
      console.log('🎮 [ADMIN] Criando desafio:', challengeData)
      
      // Mapear campos do frontend para backend (sem entry_fee)
      const backendData = {
        title: challengeData.title,
        description: challengeData.description,
        category_id: parseInt(challengeData.category_id || challengeData.category),
        target_value: parseFloat(challengeData.target_value),
        target_unit: challengeData.target_unit,
        stake_min: parseFloat(challengeData.stake_min || challengeData.entry_fee || 10),
        stake_max: parseFloat(challengeData.stake_max || challengeData.entry_fee * 2 || 50),
        max_participants: challengeData.max_participants || 100,
        end_at: challengeData.end_at || challengeData.end_date
      }

      console.log('📤 [ADMIN] Dados para backend:', backendData)

      const data = await apiCall('/api/admin/challenges', {
        method: 'POST',
        body: JSON.stringify(backendData)
      })
      
      return { success: true, ...data }
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao criar desafio:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const updateChallenge = useCallback(async (challengeId, challengeData) => {
    try {
      console.log('📝 [ADMIN] Atualizando desafio:', challengeId)
      
      const backendData = {
        title: challengeData.title,
        description: challengeData.description,
        category_id: parseInt(challengeData.category_id),
        target_value: parseFloat(challengeData.target_value),
        target_unit: challengeData.target_unit,
        stake_min: parseFloat(challengeData.stake_min),
        stake_max: parseFloat(challengeData.stake_max),
        max_participants: challengeData.max_participants || 100,
        end_at: challengeData.end_at
      }

      const data = await apiCall(`/api/admin/challenges/${challengeId}`, {
        method: 'PUT',
        body: JSON.stringify(backendData)
      })
      
      return { success: true, ...data }
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao atualizar desafio:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const deleteChallenge = useCallback(async (challengeId) => {
    try {
      console.log('🗑️ [ADMIN] Deletando desafio:', challengeId)
      
      const data = await apiCall(`/api/admin/challenges/${challengeId}`, {
        method: 'DELETE'
      })
      
      return { success: true, ...data }
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao deletar desafio:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const getStats = useCallback(async () => {
    try {
      console.log('📊 [ADMIN] Buscando estatísticas...')
      const data = await apiCall('/api/admin/stats')
      return data
    } catch (error) {
      console.error('❌ [ADMIN] Erro ao buscar estatísticas:', error)
      throw error
    }
  }, [])

  // ==================== AUTENTICAÇÃO ====================

  // Autenticação admin (mock) - Mantendo como estava
  const login = async (credentials) => {
    try {
      console.log('🔐 [ADMIN] Fazendo login...')
      
      // Mock de autenticação
      const mockAdmin = {
        id: 1,
        name: 'Administrador BetFit',
        email: credentials.email,
        token: 'mock_admin_token_' + Date.now(),
        role: 'admin'
      }
      
      setAdmin(mockAdmin)
      localStorage.setItem('admin_token', mockAdmin.token)
      localStorage.setItem('admin_data', JSON.stringify(mockAdmin))
      
      return { success: true, admin: mockAdmin }
    } catch (error) {
      console.error('❌ [ADMIN] Erro no login:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_data')
  }

  // Verificar autenticação ao carregar - SEM DEPENDÊNCIAS para evitar loops
  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const adminData = localStorage.getItem('admin_data')
    
    if (token && adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData)
        setAdmin(parsedAdmin)
        console.log('✅ [ADMIN] Dados de autenticação carregados:', parsedAdmin.email)
      } catch (error) {
        console.error('❌ [ADMIN] Erro ao carregar dados salvos:', error)
        logout()
      }
    }
  }, []) // Dependências vazias - executa apenas uma vez

  // Função adicional para testar conectividade
  const testConnection = useCallback(async () => {
    try {
      console.log('🔗 [ADMIN] Testando conexão com backend localhost...')
      const data = await apiCall('/api/health')
      console.log('✅ [ADMIN] Backend localhost conectado:', data)
      return { success: true, data }
    } catch (error) {
      console.error('❌ [ADMIN] Backend localhost não está respondendo:', error)
      return { success: false, error: error.message }
    }
  }, [])

  const value = {
    admin,
    loading,
    error,
    apiCall,
    
    // Métodos originais
    getChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    getStats,
    login,
    logout,
    testConnection,
    
    // Métodos de categorias (corrigidos e expandidos)
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    
    // Métodos para participações e admin
    getAdminChallenges,
    getAllParticipations,
    getUserParticipations,
    getDashboardMetrics,
    getChallengeStats
  }

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  )
}
