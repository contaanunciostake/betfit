import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Ban, 
  CheckCircle,
  UserX,
  Wallet,
  Activity,
  Plus,
  LogIn,
  Loader2
} from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [addBalanceUser, setAddBalanceUser] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState('')
  const [addingBalance, setAddingBalance] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://betfit-backend.onrender.com'

  // Carregamento inicial
  useEffect(() => {
    let isMounted = true

    const loadUsers = async () => {
      try {
        if (!isMounted) return
        
        setLoading(true)
        console.log('👥 [USERS] Carregamento inicial...')
        
        const response = await fetch(`${API_BASE_URL}/api/users?page=1&limit=10&_t=${Date.now()}`)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        console.log('✅ [USERS] Usuários carregados:', data)
        
        if (!isMounted) return
        
        setUsers(data.users || [])
        setPagination(prev => ({
          ...prev,
          page: 1,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }))
        
      } catch (error) {
        console.error('❌ [USERS] Erro no carregamento inicial:', error)
        if (isMounted) {
          setUsers([])
          setPagination(prev => ({ ...prev, total: 0, pages: 0 }))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  // FUNÇÃO DE BUSCA CORRIGIDA
  const handleSearch = async () => {
    try {
      setSearchLoading(true)
      console.log('🔍 [USERS] Iniciando busca:', { search, statusFilter })
      
      const params = new URLSearchParams({
        page: '1',
        limit: pagination.limit.toString(),
        _t: Date.now().toString()
      })
      
      // Adicionar parâmetros de busca apenas se preenchidos
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      if (statusFilter && statusFilter !== '') {
        params.append('status', statusFilter)
      }

      const url = `${API_BASE_URL}/api/users?${params.toString()}`
      console.log('🔍 [USERS] URL de busca:', url)

      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ [USERS] Busca concluída:', data)
      
      setUsers(data.users || [])
      setPagination(prev => ({
        ...prev,
        page: 1,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
      
    } catch (error) {
      console.error('❌ [USERS] Erro na busca:', error)
      alert('Erro ao realizar busca. Verifique o console para mais detalhes.')
    } finally {
      setSearchLoading(false)
    }
  }

  // FUNÇÃO DE PAGINAÇÃO CORRIGIDA
  const handlePageChange = async (newPage) => {
    try {
      setLoading(true)
      console.log('📄 [USERS] Mudando para página:', newPage)
      
      const params = new URLSearchParams({
        page: newPage.toString(),
        limit: pagination.limit.toString(),
        _t: Date.now().toString()
      })
      
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      if (statusFilter && statusFilter !== '') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`${API_BASE_URL}/api/users?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ [USERS] Página carregada:', data)
      
      setUsers(data.users || [])
      setPagination(prev => ({
        ...prev,
        page: newPage,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
      
    } catch (error) {
      console.error('❌ [USERS] Erro ao mudar página:', error)
    } finally {
      setLoading(false)
    }
  }

  // FUNÇÃO LIMPAR FILTROS
  const handleClearFilters = async () => {
    setSearch('')
    setStatusFilter('')
    
    try {
      setSearchLoading(true)
      console.log('🧹 [USERS] Limpando filtros...')
      
      const response = await fetch(`${API_BASE_URL}/api/users?page=1&limit=10&_t=${Date.now()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ [USERS] Filtros limpos:', data)
      
      setUsers(data.users || [])
      setPagination(prev => ({
        ...prev,
        page: 1,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
      
    } catch (error) {
      console.error('❌ [USERS] Erro ao limpar filtros:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  // FUNÇÃO ALTERAR STATUS CORRIGIDA
  const handleStatusChange = async (userId, newStatus) => {
    try {
      console.log(`👤 [USER] Alterando status do usuário ${userId} para: ${newStatus}`)
      
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ [USER] Status alterado:', result)
      
      // Atualizar usuário na lista local
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ))
      
      setSuccessMessage(`Status do usuário alterado para: ${newStatus === 'active' ? 'Ativo' : newStatus === 'blocked' ? 'Bloqueado' : 'Pendente'}`)
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error('❌ [USER] Erro ao alterar status:', error)
      alert(`Erro ao alterar status: ${error.message}`)
    }
  }

  // FUNÇÃO ADICIONAR SALDO CORRIGIDA
  const handleAddBalance = async () => {
    if (!addBalanceUser || !balanceAmount || parseFloat(balanceAmount) <= 0) {
      alert('Por favor, insira um valor válido maior que zero.')
      return
    }

    try {
      setAddingBalance(true)
      const amount = parseFloat(balanceAmount)
      console.log(`💰 [BALANCE] Adicionando R$ ${amount.toFixed(2)} ao usuário ${addBalanceUser.id} (${addBalanceUser.name})`)
      
      const response = await fetch(`${API_BASE_URL}/api/users/${addBalanceUser.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: amount })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('✅ [BALANCE] Saldo adicionado:', result)
      
      // Atualizar saldo do usuário na lista local
      setUsers(prev => prev.map(user => 
        user.id === addBalanceUser.id 
          ? { 
              ...user, 
              wallet: { 
                ...user.wallet, 
                balance: result.new_balance || (user.wallet.balance + amount)
              } 
            } 
          : user
      ))
      
      setSuccessMessage(`R$ ${amount.toFixed(2)} adicionado com sucesso à carteira de ${addBalanceUser.name}!`)
      setShowSuccessModal(true)
      setAddBalanceUser(null)
      setBalanceAmount('')
      
    } catch (error) {
      console.error('❌ [BALANCE] Erro ao adicionar saldo:', error)
      alert(`Erro ao adicionar saldo: ${error.message}`)
    } finally {
      setAddingBalance(false)
    }
  }

  // FUNÇÃO PARA BUSCA COM ENTER
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Ativo</Badge>
      case 'blocked':
        return <Badge variant="destructive">Bloqueado</Badge>
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getKycBadge = (kycStatus) => {
    switch (kycStatus) {
      case 'verified':
        return <Badge variant="success">Verificado</Badge>
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">Não informado</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Usuários</h1>
            <p className="text-muted-foreground">Gestão de usuários</p>
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Usuários</h1>
          <p className="text-muted-foreground">
            Gestão de usuários ({pagination.total} usuários encontrados)
          </p>
        </div>
      </div>

      {/* Filtros Corrigidos */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros para encontrar usuários específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, email ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos</option>
                <option value="active">Ativo</option>
                <option value="blocked">Bloqueado</option>
                <option value="pending">Pendente</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleSearch} 
                disabled={searchLoading}
                className="px-6"
              >
                {searchLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Buscar
              </Button>
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                disabled={searchLoading}
              >
                Limpar
              </Button>
            </div>
          </div>
          
          {/* Indicador de filtros ativos */}
          {(search || statusFilter) && (
            <div className="mt-4 flex gap-2 flex-wrap">
              {search && (
                <Badge variant="secondary">
                  Busca: "{search}"
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="secondary">
                  Status: {statusFilter === 'active' ? 'Ativo' : statusFilter === 'blocked' ? 'Bloqueado' : 'Pendente'}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {searchLoading ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Buscando usuários...
              </div>
            ) : (
              `Página ${pagination.page} de ${pagination.pages} - ${pagination.total} usuários`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {search || statusFilter ? 'Nenhum usuário encontrado com os filtros aplicados.' : 'Nenhum usuário encontrado.'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead>KYC</TableHead>
                    <TableHead>Participações</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {user.id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{user.email}</div>
                          <div className="text-sm text-muted-foreground">{user.phone || 'Não informado'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          R$ {(user.wallet?.balance || 0).toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.stats?.total_transactions || 0} transações
                        </div>
                      </TableCell>
                      <TableCell>
                        {getKycBadge(user.stats?.kyc_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 text-green-500 mr-1" />
                          <span>{user.stats?.active_participations || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAddBalanceUser(user)}>
                              <Wallet className="mr-2 h-4 w-4" />
                              Adicionar Saldo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {user.status === 'active' ? (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(user.id, 'blocked')}
                                className="text-red-600"
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                Bloquear
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Ativar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {users.length} de {pagination.total} usuários
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1 || loading}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i
                        if (pageNum > pagination.pages) return null
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className="w-8"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages || loading}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Usuário */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Usuário</DialogTitle>
              <DialogDescription>
                Informações completas de {selectedUser.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Informações Pessoais</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Nome:</strong> {selectedUser.name}</div>
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Telefone:</strong> {selectedUser.phone || 'Não informado'}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedUser.status)}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Carteira</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Saldo:</strong> R$ {(selectedUser.wallet?.balance || 0).toFixed(2)}</div>
                  <div><strong>Disponível:</strong> R$ {(selectedUser.wallet?.available || 0).toFixed(2)}</div>
                  <div><strong>Pendente:</strong> R$ {(selectedUser.wallet?.pending || 0).toFixed(2)}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Estatísticas</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Participações Ativas:</strong> {selectedUser.stats?.active_participations || 0}</div>
                  <div><strong>Total Transações:</strong> {selectedUser.stats?.total_transactions || 0}</div>
                  <div><strong>KYC:</strong> {getKycBadge(selectedUser.stats?.kyc_status)}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Datas</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Cadastro:</strong> {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString('pt-BR') : 'N/A'}</div>
                  <div><strong>Último Login:</strong> {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString('pt-BR') : 'Nunca'}</div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Adicionar Saldo Corrigido */}
      {addBalanceUser && (
        <Dialog open={!!addBalanceUser} onOpenChange={() => {
          if (!addingBalance) {
            setAddBalanceUser(null)
            setBalanceAmount('')
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Saldo</DialogTitle>
              <DialogDescription>
                Adicionar saldo à carteira de <strong>{addBalanceUser.name}</strong>
                <br />
                <span className="text-sm text-muted-foreground">
                  Saldo atual: R$ {(addBalanceUser.wallet?.balance || 0).toFixed(2)}
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Valor (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  disabled={addingBalance}
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Insira um valor maior que zero
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setAddBalanceUser(null)
                    setBalanceAmount('')
                  }}
                  disabled={addingBalance}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddBalance} 
                  disabled={addingBalance || !balanceAmount || parseFloat(balanceAmount) <= 0}
                >
                  {addingBalance ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Adicionar Saldo
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <Dialog open={showSuccessModal} onOpenChange={() => setShowSuccessModal(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-green-600">✅ Sucesso!</DialogTitle>
              <DialogDescription className="text-base">
                {successMessage}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => setShowSuccessModal(false)}>
                OK
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

