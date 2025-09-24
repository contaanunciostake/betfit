import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Tags, Edit, Trash2, Loader2, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

// COMPONENTE DO FORMULÁRIO SEPARADO - Para evitar re-renders
const CreateCategoryForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'trophy',
    color: '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = () => {
    setLoading(true)
    setError('')

    const submitForm = async () => {
      try {
        console.log('🏷️ [CATEGORIES] Criando categoria no banco:', formData)
        
        // Validação básica
        if (!formData.name.trim() || !formData.description.trim()) {
          throw new Error('Nome e descrição são obrigatórios')
        }

        const response = await fetch('http://localhost:5001/api/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
            color: formData.color,
            icon: formData.icon
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ [CATEGORIES] Categoria criada no banco:', result)
        
        onSuccess(result.category)
      } catch (error) {
        console.error('❌ [CATEGORIES] Erro ao criar categoria:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    submitForm()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div>
        <Label htmlFor="name">Nome da Categoria *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ex: Natação, Corrida..."
          required
          disabled={loading}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descreva o tipo de desafios desta categoria..."
          required
          disabled={loading}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="icon">Ícone</Label>
          <Input
            id="icon"
            value={formData.icon}
            onChange={(e) => handleInputChange('icon', e.target.value)}
            placeholder="trophy, bike, waves..."
            disabled={loading}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="color">Cor</Label>
          <Input
            id="color"
            type="color"
            value={formData.color}
            onChange={(e) => handleInputChange('color', e.target.value)}
            disabled={loading}
            className="mt-1 h-10"
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !formData.name.trim() || !formData.description.trim()}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando no banco...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Criar Categoria
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}

// COMPONENTE DE EDIÇÃO
const EditCategoryForm = ({ category, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: category.name || '',
    description: category.description || '',
    icon: category.icon || 'trophy',
    color: category.color || '#3b82f6'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = () => {
    setLoading(true)
    setError('')

    const submitForm = async () => {
      try {
        console.log('✏️ [CATEGORIES] Editando categoria no banco:', category.id, formData)
        
        if (!formData.name.trim() || !formData.description.trim()) {
          throw new Error('Nome e descrição são obrigatórios')
        }

        const response = await fetch(`http://localhost:5001/api/categories/${category.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            description: formData.description.trim(),
            color: formData.color,
            icon: formData.icon
          })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ [CATEGORIES] Categoria editada no banco:', result)
        
        onSuccess(result.category)
      } catch (error) {
        console.error('❌ [CATEGORIES] Erro ao editar categoria:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    submitForm()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div>
        <Label htmlFor="edit-name">Nome da Categoria *</Label>
        <Input
          id="edit-name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="Ex: Natação, Corrida..."
          required
          disabled={loading}
          className="mt-1"
        />
      </div>
      
      <div>
        <Label htmlFor="edit-description">Descrição *</Label>
        <Textarea
          id="edit-description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Descreva o tipo de desafios desta categoria..."
          required
          disabled={loading}
          rows={3}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-icon">Ícone</Label>
          <Input
            id="edit-icon"
            value={formData.icon}
            onChange={(e) => handleInputChange('icon', e.target.value)}
            placeholder="trophy, bike, waves..."
            disabled={loading}
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="edit-color">Cor</Label>
          <Input
            id="edit-color"
            type="color"
            value={formData.color}
            onChange={(e) => handleInputChange('color', e.target.value)}
            disabled={loading}
            className="mt-1 h-10"
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button 
          variant="outline" 
          onClick={onCancel} 
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={loading || !formData.name.trim() || !formData.description.trim()}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Atualizando...
            </>
          ) : (
            <>
              <Edit className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  // Carregar categorias do banco de dados
  useEffect(() => {
    let isMounted = true

    const loadCategoriesFromDatabase = async () => {
      try {
        if (!isMounted) return
        
        setLoading(true)
        setConnectionStatus('connecting')
        setError('')
        
        console.log('🏷️ [CATEGORIES] Carregando categorias do banco de dados...')
        
        const response = await fetch(`http://localhost:5001/api/categories?_t=${Date.now()}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('✅ [CATEGORIES] Dados do banco recebidos:', data)
        
        if (!isMounted) return
        
        // Processar dados do banco
        const categoriesData = data.categories || []
        const challengesResponse = await fetch(`http://localhost:5001/api/challenges?_t=${Date.now()}`)
        const challengesData = await challengesResponse.json()
        const challenges = challengesData.challenges || []

        
        // Mapear cores hexadecimais para classes CSS
        const processedCategories = categoriesData.map(cat => {
        const categoryCount = challenges.filter(challenge => 
          challenge.category_name === cat.name || 
          challenge.category_id === cat.id
        ).length
          // Converter cor hex para classes CSS
          const colorMap = {
            '#ef4444': { bg: 'bg-red-100', text: 'text-red-600' },
            '#22c55e': { bg: 'bg-green-100', text: 'text-green-600' },
            '#f59e0b': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
            '#8b5cf6': { bg: 'bg-purple-100', text: 'text-purple-600' },
            '#06b6d4': { bg: 'bg-cyan-100', text: 'text-cyan-600' },
            '#3b82f6': { bg: 'bg-blue-100', text: 'text-blue-600' }
          }
          
          const colorClasses = colorMap[cat.color] || { bg: 'bg-blue-100', text: 'text-blue-600' }
          
          return {
            ...cat,
            challenges_count: categoryCount,
            color_bg: colorClasses.bg,
            text_color: colorClasses.text,
            created_at_formatted: cat.created_at ? 
              new Date(cat.created_at).toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric' 
              }) : 'Data não disponível'
          }
        })
        
        setCategories(processedCategories)
        setConnectionStatus('connected')
        
        console.log(`📋 [CATEGORIES] ${processedCategories.length} categorias carregadas do banco`)
        
      } catch (error) {
        console.error('❌ [CATEGORIES] Erro ao carregar categorias do banco:', error)
        
        if (!isMounted) return
        
        setConnectionStatus('error')
        setError('Erro ao conectar com banco de dados: ' + error.message)
        setCategories([]) // Array vazio em caso de erro
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCategoriesFromDatabase()

    return () => { isMounted = false }
  }, [])

  // Função para recarregar dados do banco
  const handleRefresh = async () => {
    setLoading(true)
    setError('')
    setSuccessMessage('')
    
    try {
      console.log('🔄 [CATEGORIES] Recarregando categorias do banco...')
      
      const response = await fetch(`http://localhost:5001/api/categories?_t=${Date.now()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const categoriesData = data.categories || []
      
      const processedCategories = categoriesData.map(cat => {
        const colorMap = {
          '#ef4444': { bg: 'bg-red-100', text: 'text-red-600' },
          '#22c55e': { bg: 'bg-green-100', text: 'text-green-600' },
          '#f59e0b': { bg: 'bg-yellow-100', text: 'text-yellow-600' },
          '#8b5cf6': { bg: 'bg-purple-100', text: 'text-purple-600' },
          '#06b6d4': { bg: 'bg-cyan-100', text: 'text-cyan-600' },
          '#3b82f6': { bg: 'bg-blue-100', text: 'text-blue-600' }
        }
        
        const colorClasses = colorMap[cat.color] || { bg: 'bg-blue-100', text: 'text-blue-600' }
        
        return {
          ...cat,
          challenges_count: 0,
          color_bg: colorClasses.bg,
          text_color: colorClasses.text,
          created_at_formatted: cat.created_at ? 
            new Date(cat.created_at).toLocaleDateString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric' 
            }) : 'Data não disponível'
        }
      })
      
      setCategories(processedCategories)
      setConnectionStatus('connected')
      setSuccessMessage(`✅ ${processedCategories.length} categorias recarregadas do banco`)
      
      setTimeout(() => setSuccessMessage(''), 3000)
      
    } catch (error) {
      console.error('❌ [CATEGORIES] Erro ao recarregar:', error)
      setError('Erro ao recarregar categorias do banco: ' + error.message)
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Callback para sucesso na criação
  const handleCreateSuccess = useCallback((newCategory) => {
    setShowCreateDialog(false)
    setSuccessMessage(`✅ Categoria "${newCategory.name}" criada no banco de dados!`)
    handleRefresh() // Recarregar do banco
    setTimeout(() => setSuccessMessage(''), 4000)
  }, [])

  // Callback para sucesso na edição
  const handleEditSuccess = useCallback((updatedCategory) => {
    setShowEditDialog(false)
    setEditingCategory(null)
    setSuccessMessage(`✅ Categoria "${updatedCategory.name}" atualizada no banco!`)
    handleRefresh() // Recarregar do banco
    setTimeout(() => setSuccessMessage(''), 4000)
  }, [])

  // Função para deletar categoria
  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Tem certeza que deseja remover a categoria "${category.name}"?`)) {
      return
    }

    try {
      console.log('🗑️ [CATEGORIES] Removendo categoria do banco:', category.id)
      
      const response = await fetch(`http://localhost:5001/api/categories/${category.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('✅ [CATEGORIES] Categoria removida do banco:', result)
      
      setSuccessMessage(`✅ Categoria "${category.name}" removida do banco de dados!`)
      handleRefresh() // Recarregar do banco
      setTimeout(() => setSuccessMessage(''), 4000)
      
    } catch (error) {
      console.error('❌ [CATEGORIES] Erro ao deletar categoria:', error)
      setError('Erro ao remover categoria: ' + error.message)
      setTimeout(() => setError(''), 5000)
    }
  }

  // Função para reativar categoria
const handleActivateCategory = async (category) => {
  if (!window.confirm(`Tem certeza que deseja reativar a categoria "${category.name}"?`)) {
    return
  }

  try {
    console.log('🔄 [CATEGORIES] Reativando categoria no banco:', category.id)
    
    const response = await fetch(`http://localhost:5001/api/categories/${category.id}/activate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || 'dummy-token'}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    console.log('✅ [CATEGORIES] Categoria reativada no banco:', result)
    
    setSuccessMessage(`✅ Categoria "${category.name}" reativada no banco de dados!`)
    handleRefresh() // Recarregar do banco
    setTimeout(() => setSuccessMessage(''), 4000)
    
  } catch (error) {
    console.error('❌ [CATEGORIES] Erro ao reativar categoria:', error)
    setError('Erro ao reativar categoria: ' + error.message)
    setTimeout(() => setError(''), 5000)
  }
}


  // Badge de status de conexão
  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-300">🗄️ Banco Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">🔄 Conectando...</Badge>
      case 'error':
        return <Badge variant="destructive">❌ Erro no Banco</Badge>
      default:
        return <Badge variant="outline">❓ Status Desconhecido</Badge>
    }
  }

  // Loading inicial
  if (loading && categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Gestão de Categorias</h2>
            <p className="text-slate-600">Carregando categorias do banco de dados...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestão de Categorias</h2>
          <p className="text-slate-600">
            Sistema integrado com banco de dados SQLite ({categories.length} categorias)
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getConnectionStatusBadge()}
          </div>
          
          <Button onClick={handleRefresh} variant="outline" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar Banco
          </Button>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
                <DialogDescription>
                  Adicionar categoria diretamente no banco de dados
                </DialogDescription>
              </DialogHeader>
              <CreateCategoryForm 
                onSuccess={handleCreateSuccess}
                onCancel={() => setShowCreateDialog(false)}
              />
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

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Card key={category.id} className={`hover:shadow-lg transition-shadow border-l-4 ${!category.is_active ? 'opacity-60 bg-gray-50' : ''}`} style={{ borderLeftColor: category.color }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${category.color_bg}`} style={{ backgroundColor: category.color + '20' }}>
                    <Tags className={`w-6 h-6 ${category.text_color}`} style={{ color: category.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline">
                        ID: {category.id}
                      </Badge>
                      <Badge variant="secondary">
                        {category.challenges_count || 0} desafios
                      </Badge>
                      {!category.is_active && (
                        <Badge variant="destructive" className="text-xs">
                          INATIVA
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {category.is_active ? (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category)
                          setShowEditDialog(true)
                        }}
                        title="Editar categoria"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteCategory(category)}
                        title="Desativar categoria"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleActivateCategory(category)}
                      title="Reativar categoria"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                {category.description || 'Sem descrição disponível'}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ícone: <span className="font-mono">{category.icon}</span></span>
                  <span>Cor: <span className="font-mono">{category.color}</span></span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Ativo: {category.is_active ? '✅' : '❌'}</span>
                  <span>Criado: {category.created_at_formatted}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
            <DialogDescription>
              Modificar categoria no banco de dados
            </DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <EditCategoryForm 
              category={editingCategory}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingCategory(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {!loading && categories.length === 0 && (
        <div className="text-center py-12">
          <Tags className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg mb-2">Nenhuma categoria encontrada no banco</p>
          <p className="text-slate-400 text-sm mb-4">
            As categorias são carregadas diretamente do banco de dados SQLite
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Categoria
          </Button>
        </div>
      )}

      {/* Database Statistics Card */}
      {categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas do Banco de Dados</CardTitle>
            <CardDescription>Dados em tempo real da tabela challenge_categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-sm text-gray-600">Total no Banco</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {categories.filter(cat => cat.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Categorias Ativas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {categories.reduce((sum, cat) => sum + (cat.challenges_count || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Desafios Vinculados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {categories.filter(cat => cat.created_at && cat.created_at.includes('2025-09-22')).length}
                </div>
                <div className="text-sm text-gray-600">Criadas Hoje</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                🗄️ Dados sincronizados com a tabela challenge_categories do banco SQLite
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}