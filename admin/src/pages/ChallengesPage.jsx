import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Target, 
  Calendar,
  DollarSign,
  Activity,
  Trophy,
  Clock,
  Loader2,
  PlayCircle,
  AlertCircle,
  CheckCircle,
  Timer
} from 'lucide-react'

// Função para formatar a data de início para o input datetime-local
const getFormattedDateTime = (offsetMinutes = 0) => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset() + offsetMinutes);
  return now.toISOString().slice(0, 16);
};

// Função para calcular tempo restante até o início
const getTimeUntilStart = (startDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const diff = start.getTime() - now.getTime();
  
  if (diff <= 0) return null;
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// LABELS DOS CAMPOS
const getFieldLabel = (field) => {
  const labels = {
    title: 'Título',
    description: 'Descrição',
    category_id: 'Categoria',
    target_value: 'Meta',
    stake_min: 'Stake Mínimo',
    stake_max: 'Stake Máximo',
    start_at: 'Data de Início'
  }
  return labels[field] || field
}

// COMPONENTE DO FORMULÁRIO SEPARADO - FIX PRINCIPAL
const ChallengeForm = ({ formData, onInputChange, categories, creating, error }) => {
  const handleChange = useCallback((field, value) => {
    onInputChange(field, value);
  }, [onInputChange]);

  // HELPER PARA EXPLICAR OS TIPOS DE SELEÇÃO
  const getSelectionTypeDescription = (type) => {
    switch (type) {
      case 'first_to_complete':
        return 'Primeiros a completar o desafio'
      case 'top_performers':
        return 'Melhores performances (maiores scores)'
      case 'all_qualifiers':
        return 'Todos que atingirem a meta mínima'
      default:
        return 'Primeiro a completar'
    }
  }

  // HELPER PARA EXPLICAR TIPOS DE DISTRIBUIÇÃO
  const getDistributionTypeDescription = (type) => {
    switch (type) {
      case 'equal':
        return 'Dividir igualmente entre todos os vencedores'
      case 'proportional':
        return 'Proporcional à performance de cada um'
      case 'ranking_based':
        return 'Baseada na posição (1º recebe mais que 2º, etc.)'
      default:
        return 'Distribuição igual'
    }
  }

  return (
    <div className="space-y-6 py-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {/* SEÇÃO 1: INFORMAÇÕES BÁSICAS */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Informações Básicas</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ex: Corrida 5km em 30 minutos"
              disabled={creating}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category_id" className="text-sm font-medium">Categoria *</Label>
            <Select 
              value={formData.category_id.toString()} 
              onValueChange={(value) => handleChange('category_id', value)}
              disabled={creating}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description" className="text-sm font-medium">Descrição *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="Descreva o desafio em detalhes..."
            rows={3}
            disabled={creating}
            className="mt-1"
          />
        </div>
      </div>

      {/* SEÇÃO 2: CONFIGURAÇÕES DO DESAFIO */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Configurações do Desafio</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="target_value" className="text-sm font-medium">Meta *</Label>
            <Input
              id="target_value"
              type="number"
              step="0.1"
              min="0.1"
              value={formData.target_value}
              onChange={(e) => handleChange('target_value', e.target.value)}
              placeholder="5.0"
              disabled={creating}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="target_unit" className="text-sm font-medium">Unidade</Label>
            <Select 
              value={formData.target_unit} 
              onValueChange={(value) => handleChange('target_unit', value)}
              disabled={creating}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="km">Quilômetros</SelectItem>
                <SelectItem value="steps">Passos</SelectItem>
                <SelectItem value="calories">Calorias</SelectItem>
                <SelectItem value="minutes">Minutos</SelectItem>
                <SelectItem value="hours">Horas</SelectItem>
                <SelectItem value="reps">Repetições</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="max_participants" className="text-sm font-medium">Máx. Participantes</Label>
            <Input
              id="max_participants"
              type="number"
              min="1"
              value={formData.max_participants}
              onChange={(e) => handleChange('max_participants', e.target.value)}
              placeholder="100"
              disabled={creating}
              className="mt-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="stake_min" className="text-sm font-medium">Stake Mínimo (R$) *</Label>
            <Input
              id="stake_min"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.stake_min}
              onChange={(e) => handleChange('stake_min', e.target.value)}
              placeholder="10.00"
              disabled={creating}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="stake_max" className="text-sm font-medium">Stake Máximo (R$) *</Label>
            <Input
              id="stake_max"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.stake_max}
              onChange={(e) => handleChange('stake_max', e.target.value)}
              placeholder="50.00"
              disabled={creating}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* SEÇÃO 3: CONFIGURAÇÃO DE VENCEDORES - ESTA É A SEÇÃO QUE ESTAVA FALTANDO! */}
      <div className="space-y-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
          🏆 Configuração de Vencedores
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="max_winners" className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Número de Vencedores *
            </Label>
            <Input
              id="max_winners"
              type="number"
              min="1"
              max="50"
              value={formData.max_winners || '1'}
              onChange={(e) => handleChange('max_winners', e.target.value)}
              placeholder="1"
              disabled={creating}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Quantos usuários podem ganhar prêmios (1-50)
            </p>
          </div>
          
          <div>
            <Label htmlFor="winner_selection_type" className="text-sm font-medium flex items-center">
              <Target className="w-4 h-4 mr-1" />
              Critério de Seleção *
            </Label>
            <Select 
              value={formData.winner_selection_type || 'first_to_complete'} 
              onValueChange={(value) => handleChange('winner_selection_type', value)}
              disabled={creating}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_to_complete">Primeiros a Completar</SelectItem>
                <SelectItem value="top_performers">Melhores Performances</SelectItem>
                <SelectItem value="all_qualifiers">Todos Qualificados</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getSelectionTypeDescription(formData.winner_selection_type || 'first_to_complete')}
            </p>
          </div>
          
          <div>
            <Label htmlFor="prize_distribution_type" className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              Distribuição de Prêmios *
            </Label>
            <Select 
              value={formData.prize_distribution_type || 'equal'} 
              onValueChange={(value) => handleChange('prize_distribution_type', value)}
              disabled={creating}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Distribuição Igual</SelectItem>
                <SelectItem value="proportional">Proporcional à Performance</SelectItem>
                <SelectItem value="ranking_based">Baseada no Ranking</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {getDistributionTypeDescription(formData.prize_distribution_type || 'equal')}
            </p>
          </div>
        </div>

        {/* PREVIEW DA CONFIGURAÇÃO */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">📋 Preview da Configuração:</h5>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>{formData.max_winners || '1'}</strong> vencedor{parseInt(formData.max_winners || '1') !== 1 ? 'es' : ''} será{parseInt(formData.max_winners || '1') !== 1 ? 'ão' : ''} selecionado{parseInt(formData.max_winners || '1') !== 1 ? 's' : ''}</p>
            <p>• Critério: <strong>{getSelectionTypeDescription(formData.winner_selection_type || 'first_to_complete')}</strong></p>
            <p>• Prêmios: <strong>{getDistributionTypeDescription(formData.prize_distribution_type || 'equal')}</strong></p>
            {parseInt(formData.max_winners || '1') > 1 && (formData.prize_distribution_type || 'equal') === 'ranking_based' && (
              <p className="text-blue-600">• 1º lugar receberá a maior parte, 2º lugar menos, e assim por diante</p>
            )}
          </div>
        </div>
      </div>

      {/* SEÇÃO 4: AGENDAMENTO */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Agendamento</h3>
        
        <div>
          <Label htmlFor="start_at" className="text-sm font-medium flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            Data e Hora de Início *
          </Label>
          <Input
            id="start_at"
            type="datetime-local"
            value={formData.start_at}
            onChange={(e) => handleChange('start_at', e.target.value)}
            disabled={creating}
            className="mt-1"
          />
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <p className="flex items-center">
              <PlayCircle className="w-3 h-3 mr-1" />
              O desafio ficará ativo nesta data e hora exata.
            </p>
            <p className="flex items-center">
              <Timer className="w-3 h-3 mr-1" />
              Se for no passado, começará imediatamente ao ser criado.
            </p>
            {formData.start_at && (
              <p className="flex items-center text-blue-600 font-medium">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(formData.start_at) <= new Date() ? 
                  'Começará imediatamente' : 
                  `Começará em ${getTimeUntilStart(formData.start_at) || 'alguns momentos'}`
                }
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="requirements" className="text-sm font-medium">Requisitos Especiais</Label>
          <Textarea
            id="requirements"
            value={formData.requirements}
            onChange={(e) => handleChange('requirements', e.target.value)}
            placeholder="Ex: Usar GPS, enviar foto de comprovação, etc."
            rows={2}
            disabled={creating}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  )
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([])
  const [categories, setCategories] = useState([])
  const [participationsData, setParticipationsData] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [dataSource, setDataSource] = useState('unknown')

  // ESTADO DO FORMULÁRIO OTIMIZADO - USANDO start_at
  const [formData, setFormData] = useState({
  title: '',
  description: '',
  category_id: '',
  target_value: '',
  target_unit: 'km',
  stake_min: '',
  stake_max: '',
  max_participants: '100',
  start_at: getFormattedDateTime(60),
  requirements: '',
  // CAMPOS DE MÚLTIPLOS VENCEDORES
  max_winners: '1',
  winner_selection_type: 'first_to_complete',
  prize_distribution_type: 'equal'
})

  // CARREGAMENTO INICIAL
  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      try {
        if (!isMounted) return
        
        setLoading(true)
        console.log('🎮 [CHALLENGES] Carregamento inicial...')
        
        await Promise.all([
          loadRealChallenges(),
          loadCategories()
        ])
        
      } catch (error) {
        console.error('❌ [CHALLENGES] Erro no carregamento inicial:', error)
        if (isMounted) {
          setError('Erro ao carregar dados iniciais')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadInitialData()
    return () => { isMounted = false }
  }, [])

  // CARREGAR DESAFIOS REAIS DO BANCO
  const loadRealChallenges = async () => {
    try {
      console.log('🎮 [CHALLENGES] Buscando desafios do banco SQLite...')

      // Use a variável de ambiente
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://betfit-backend.onrender.com'
      
      // Então no início do arquivo, adicione:
      const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://betfit-backend.onrender.com'

      
      // Tentar endpoint admin primeiro
      let response = await fetch(`${API_BASE_URL}/api/admin/challenges/simple-real?_t=${Date.now()}`)
      
      if (!response.ok) {
        console.warn('⚠️ [CHALLENGES] Endpoint admin não disponível, usando fallback...')
        
        // Fallback para endpoint principal
        response = await fetch(`${API_BASE_URL}/api/challenges?_t=${Date.now()}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const fallbackData = await response.json()
        const challengesData = Array.isArray(fallbackData) ? fallbackData : (fallbackData.challenges || [])
        setChallenges(challengesData)
        setDataSource('fallback')
        
        const totalParticipants = challengesData.reduce((sum, c) => sum + (c.participant_count || 0), 0)
        const totalPool = challengesData.reduce((sum, c) => sum + (c.total_pool || 0), 0)
        
        setParticipationsData({
          total_participations: totalParticipants,
          active_participations: totalParticipants,
          total_pool: totalPool,
          active_challenges: challengesData.filter(c => c.status === 'active').length,
          total_challenges: challengesData.length
        })
        
        return
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar dados do banco')
      }
      
      const challengesData = data.challenges || []
      setChallenges(challengesData)
      setDataSource('real_database_sqlite')
      
      setParticipationsData({
        total_participations: data.total_participants || 0,
        active_participations: data.total_participants || 0,
        total_pool: data.total_pool || 0,
        active_challenges: data.active_challenges || 0,
        total_challenges: data.total_challenges || challengesData.length
      })
      
      console.log(`✅ [CHALLENGES] ${challengesData.length} desafios carregados`)
      
    } catch (error) {
      console.error('❌ [CHALLENGES] Erro ao carregar desafios:', error)
      setError('Erro ao carregar desafios: ' + error.message)
      setChallenges([])
      setDataSource('error')
    }
  }

  // CARREGAR CATEGORIAS
  const loadCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories?_t=${Date.now()}`)
      
      if (response.ok) {
        const data = await response.json()
        const categoriesData = data.categories || data || []
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      } else {
        throw new Error('Endpoint de categorias não disponível')
      }
      
    } catch (error) {
      console.error('⚠️ [CATEGORIES] Usando categorias padrão:', error)
      setCategories([
        { id: 1, name: 'Corrida', description: 'Desafios de corrida' },
        { id: 2, name: 'Ciclismo', description: 'Desafios de ciclismo' },
        { id: 3, name: 'Passos', description: 'Desafios de caminhada' },
        { id: 4, name: 'Treinos', description: 'Desafios de treino' },
        { id: 5, name: 'Calorias', description: 'Desafios de queima de calorias' },
        { id: 6, name: 'Natação', description: 'Desafios de natação' }
      ])
    }
  }

  // RECARREGAR DADOS
  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      setError('')
      
      await Promise.all([
        loadRealChallenges(),
        loadCategories()
      ])
      
      setSuccessMessage('✅ Dados recarregados com sucesso!')
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (error) {
      console.error('❌ [CHALLENGES] Erro ao recarregar:', error)
      setError('Erro ao recarregar dados')
    } finally {
      setRefreshing(false)
    }
  }

  // RESETAR FORMULÁRIO
  const resetForm = useCallback(() => {
  setFormData({
    title: '',
    description: '',
    category_id: '',
    target_value: '',
    target_unit: 'km',
    stake_min: '',
    stake_max: '',
    max_participants: '100',
    start_at: getFormattedDateTime(60),
    requirements: '',
    // RESETAR CAMPOS DE MÚLTIPLOS VENCEDORES
    max_winners: '1',
    winner_selection_type: 'first_to_complete',
    prize_distribution_type: 'equal'
  })
  setError('')
}, [])

  // ALTERAR CAMPOS DO FORMULÁRIO - FUNÇÃO OTIMIZADA
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  // VALIDAR FORMULÁRIO OTIMIZADO
  const validateForm = () => {
    const required = ['title', 'description', 'category_id', 'target_value', 'stake_min', 'stake_max', 'start_at']
    
    for (const field of required) {
      if (!formData[field]) {
        setError(`Campo obrigatório: ${getFieldLabel(field)}`)
        return false
      }
    }

    if (parseFloat(formData.stake_min) <= 0) {
      setError('Stake mínimo deve ser maior que zero')
      return false
    }

    if (parseFloat(formData.stake_max) < parseFloat(formData.stake_min)) {
      setError('Stake máximo deve ser maior ou igual ao mínimo')
      return false
    }

    if (parseFloat(formData.target_value) <= 0) {
      setError('Meta deve ser maior que zero')
      return false
    }

    // VALIDAÇÃO DE DATA OTIMIZADA
    const startDate = new Date(formData.start_at)
    const now = new Date()
    
    if (isNaN(startDate.getTime())) {
      setError('Data de início inválida')
      return false
    }

    // Permitir datas no passado (começará imediatamente)
    // Mas avisar se for muito no passado (mais de 1 dia)
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    if (startDate < dayAgo) {
      setError('Data de início não pode ser mais de 1 dia no passado')
      return false
    }

    return true
  }

  // CRIAR DESAFIO - FUNÇÃO OTIMIZADA
  const handleCreateChallenge = async () => {
    try {
      setError('')
      setCreating(true)
      
      if (!validateForm()) {
        return
      }

      console.log('🎮 [CHALLENGES] Criando desafio:', formData)
      
      // PROCESSAMENTO OTIMIZADO DA DATA
      const startDate = new Date(formData.start_at)
      const now = new Date()
      
      // Converter para UTC mantendo a hora local escolhida
      const startAtUTC = startDate.toISOString()
      
      // Determinar status baseado na data
      const isPastDate = startDate <= now
      const status = isPastDate ? 'active' : 'pending'
      
      console.log(`📅 [CHALLENGES] Data escolhida: ${startDate.toLocaleString('pt-BR')}`)
      console.log(`📅 [CHALLENGES] Status: ${status} (${isPastDate ? 'começará imediatamente' : 'agendado'})`)
      
      // Preparar dados para o backend
      const challengeData = {
        title: formData.title,
        category_id: parseInt(formData.category_id), // ID da categoria selecionada
        description: formData.description.trim(),
        category_id: parseInt(formData.category_id),
        target_value: parseFloat(formData.target_value),
        target_unit: formData.target_unit,
        stake_min: parseFloat(formData.stake_min),
        stake_max: parseFloat(formData.stake_max),
        max_participants: parseInt(formData.max_participants) || 100,
        start_at: startAtUTC,
        requirements: formData.requirements.trim() || '',
        expected_status: status // Enviar status esperado
      }

      console.log('📤 [CHALLENGES] Enviando dados:', challengeData)

      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
        },
        body: JSON.stringify(challengeData)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 405) {
          throw new Error('Endpoint POST /api/challenges não está disponível no backend.')
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [CHALLENGES] Desafio criado:', result)
      
      const statusMessage = isPastDate ? 'ativo imediatamente' : `agendado para ${startDate.toLocaleString('pt-BR')}`
      setSuccessMessage(`✅ Desafio "${result.challenge?.title}" criado com sucesso! Status: ${statusMessage}`)
      setIsCreateModalOpen(false)
      resetForm()
      
      // Recarregar lista
      await loadRealChallenges()
      
      setTimeout(() => setSuccessMessage(''), 5000)
      
    } catch (error) {
      console.error('❌ [CHALLENGES] Erro ao criar desafio:', error)
      setError('Erro ao criar desafio: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  // STATUS BADGE OTIMIZADO COM CONTADOR
  const getStatusBadge = (status, start_at) => {
    if (start_at) {
      const startDate = new Date(start_at);
      const now = new Date();
      
      if (startDate > now) {
        const timeLeft = getTimeUntilStart(start_at);
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Timer className="w-3 h-3 mr-1" />
          Inicia em {timeLeft}
        </Badge>;
      }
    }
    
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      case 'completed':
        return <Badge variant="secondary">
          <Trophy className="w-3 h-3 mr-1" />
          Concluído
        </Badge>
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Agendado
        </Badge>
      default:
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
    }
  }

  // COR DO DATA SOURCE
  const getDataSourceColor = () => {
    switch (dataSource) {
      case 'real_database_sqlite': return 'text-green-600 font-semibold'
      case 'fallback': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  // LOADING INICIAL
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold">Painel de Desafios</h2>
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-200 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Painel de Desafios</h2>
          <p className="text-slate-600">
            Gestão de desafios com controle de horário de início ({challenges.length} desafios)
          </p>
          <p className={`text-xs ${getDataSourceColor()}`}>
            ✅ Fonte: {dataSource === 'real_database_sqlite' ? 'Banco SQLite Real' : 
                      dataSource === 'fallback' ? 'Endpoint Fallback' : 
                      dataSource === 'error' ? 'Erro ao Carregar' : 'Desconhecida'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing} 
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Desafio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Desafio</DialogTitle>
                <DialogDescription>
                  Preencha os dados do novo desafio. Use a data de início para controlar exatamente quando o desafio ficará ativo.
                </DialogDescription>
              </DialogHeader>
              <ChallengeForm 
                formData={formData}
                onInputChange={handleInputChange}
                categories={categories}
                creating={creating}
                error={error}
              />
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateChallenge}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Desafio
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total de Desafios</p>
                <p className="text-2xl font-bold text-slate-900">
                  {participationsData.total_challenges || challenges.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Todos os desafios</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Desafios Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {participationsData.active_challenges || challenges.filter(c => c.status === 'active').length}
                </p>
                <p className="text-xs text-slate-500 mt-1">Em andamento</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Participantes</p>
                <p className="text-2xl font-bold text-blue-600">
                  {participationsData.active_participations || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1">Usuários participando</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pool Total</p>
                <p className="text-2xl font-bold text-purple-600">
                  R$ {(participationsData.total_pool || 0).toFixed(2)}
                </p>
                <p className="text-xs text-slate-500 mt-1">Valor em apostas</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Desafios */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Desafios</CardTitle>
          <CardDescription>
            {refreshing ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recarregando desafios...
              </div>
            ) : (
              `${challenges.length} desafios encontrados - ${participationsData.active_participations || 0} participações ativas`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {challenges.length > 0 ? (
            <div className="space-y-4">
              {challenges.map((challenge, index) => {
                const participantsCount = challenge.participant_count || challenge.participants_count || 0
                
                return (
                  <div key={challenge.id || index} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
                      <div className="lg:col-span-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-slate-900">{challenge.title}</p>
                            <p className="text-sm text-slate-600 mt-1">{challenge.description || 'Sem descrição'}</p>
                            <p className="text-xs text-slate-400 mt-1">ID: {challenge.id}</p>
                          </div>
                          <div className="ml-2 shrink-0">
                            {getStatusBadge(challenge.status, challenge.start_at || challenge.start_date)}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-slate-700 flex items-center">
                          <Target className="h-4 w-4 mr-1" />
                          Categoria
                        </p>
                        <p className="text-sm text-slate-600">
                          {challenge.category_name || challenge.category || 'N/A'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-slate-700 flex items-center">
                          <Activity className="h-4 w-4 mr-1" />
                          Meta
                        </p>
                        <p className="text-sm text-slate-600">
                          {challenge.target_value || 'N/A'} {challenge.target_unit}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-slate-700 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Pool
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          R$ {(challenge.total_pool || 0).toFixed(2)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center text-sm text-slate-600">
                          <Users className="h-4 w-4 mr-1" />
                          <span className={`font-semibold ${participantsCount > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            {participantsCount} participantes
                          </span>
                        </div>
                        
                        {(challenge.start_at || challenge.start_date) && (
                          <div className="flex items-center text-sm text-slate-600">
                            <PlayCircle className="h-4 w-4 mr-1" />
                            <span>Inicia: {new Date(challenge.start_at || challenge.start_date).toLocaleString('pt-BR')}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('Editar:', challenge.id)}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('Deletar:', challenge.id)}
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg mb-2">Nenhum desafio encontrado</p>
              <p className="text-slate-400 text-sm mb-4">
                Comece criando seu primeiro desafio fitness com horário controlado
              </p>
              <Button onClick={() => { resetForm(); setIsCreateModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeiro Desafio
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
