import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  Settings, 
  Eye,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  X
} from 'lucide-react'

export default function PaymentsPage() {
  const [paymentSettings, setPaymentSettings] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('settings')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)

  // Função para mostrar mensagens temporárias
  const showMessage = (message, type = 'success') => {
    if (type === 'success') {
      setSuccessMessage(message)
      setError(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      setError(message)
      setSuccessMessage(null)
      setTimeout(() => setError(null), 5000)
    }
  }

  // Função para verificar se um método está configurado
  const isMethodConfigured = (settings) => {
    if (!settings) return false
    
    // Para MercadoPago, verificar se tem public_key E access_token
    if (settings.public_key && settings.public_key.trim() !== '' &&
        settings.access_token && settings.access_token.trim() !== '') {
      return true
    }
    
    // Para PIX, verificar merchant_id e api_key
    if (settings.merchant_id && settings.merchant_id.trim() !== '' &&
        settings.api_key && settings.api_key.trim() !== '') {
      return true
    }
    
    // Para Stripe, verificar publishable_key e secret_key
    if (settings.publishable_key && settings.publishable_key.trim() !== '' &&
        settings.secret_key && settings.secret_key.trim() !== '') {
      return true
    }
    
    // Para PayPal, verificar client_id e client_secret
    if (settings.client_id && settings.client_id.trim() !== '' &&
        settings.client_secret && settings.client_secret.trim() !== '') {
      return true
    }
    
    return false
  }

  useEffect(() => {
    let isMounted = true

    const loadPaymentData = async () => {
      try {
        if (!isMounted) return
        
        setConnectionStatus('connecting')
        setError(null)
        console.log('🔍 [PAYMENTS] Iniciando busca de dados de pagamento...')
        
        const [settingsResponse, transactionsResponse] = await Promise.all([
          fetch('http://localhost:5001/api/admin/payments/settings', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // Adicione headers de autenticação se necessário
              // 'Authorization': `Bearer ${token}`
            }
          }),
          fetch('http://localhost:5001/api/admin/payments/transactions', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer ${token}`
            }
          })
        ])
        
        let settingsData = {}
        let transactionsData = {}
        
        // Verificar se as requisições foram bem-sucedidas
        if (settingsResponse.ok) {
          settingsData = await settingsResponse.json()
          console.log('✅ [PAYMENTS] Settings recebidos:', settingsData)
        } else {
          console.warn(`⚠️ [PAYMENTS] Settings API retornou ${settingsResponse.status}`)
        }
        
        if (transactionsResponse.ok) {
          transactionsData = await transactionsResponse.json()
          console.log('✅ [PAYMENTS] Transactions recebidos:', transactionsData)
        } else {
          console.warn(`⚠️ [PAYMENTS] Transactions API retornou ${transactionsResponse.status}`)
        }
        
        if (!isMounted) return
        
        // IMPORTANTE: Processar dados do banco payment_credentials
        const defaultSettings = {
          pix: {
            enabled: false,
            merchant_id: '',
            api_key: '',
            webhook_url: '',
            fee_percentage: 2.5
          },
          stripe: {
            enabled: false,
            publishable_key: '',
            secret_key: '',
            webhook_secret: '',
            fee_percentage: 3.4
          },
          paypal: {
            enabled: false,
            client_id: '',
            client_secret: '',
            fee_percentage: 4.0
          },
          mercadopago: {
            enabled: false,
            environment: 'sandbox',
            public_key: '',
            access_token: '',
            client_id: '',
            client_secret: '',
            webhook_url: '',
            fee_percentage: 4.99,
            pix_enabled: true,
            credit_card_enabled: true,
            debit_card_enabled: true,
            installments_enabled: true,
            max_installments: 12
          }
        }

        // Processar dados do banco de dados (payment_credentials)
        const processedSettings = { ...defaultSettings }
        
        // Se temos dados da API, processar as credenciais
        if (settingsData.credentials && Array.isArray(settingsData.credentials)) {
          console.log('🔍 [PAYMENTS] Processando credenciais do banco:', settingsData.credentials)
          
          settingsData.credentials.forEach(credential => {
            const { payment_setting_id, credential_key, credential_value } = credential
            
            // Mapear payment_setting_id para provedor
            const providerMap = {
              7: 'mercadopago', // Baseado na sua tabela onde MercadoPago tem ID 7
              1: 'pix',
              2: 'stripe', 
              3: 'paypal'
            }
            
            const provider = providerMap[payment_setting_id]
            if (provider) {
              console.log(`🔧 [PAYMENTS] Processando ${provider}: ${credential_key} = ${credential_value ? 'SET' : 'EMPTY'}`)
              
              // Mapear credential_key para campo correto
              const keyMap = {
                'public_key': 'public_key',
                'access_token': 'access_token', 
                'client_id': 'client_id',
                'client_secret': 'client_secret',
                'webhook_url': 'webhook_url',
                'merchant_id': 'merchant_id',
                'api_key': 'api_key',
                'publishable_key': 'publishable_key',
                'secret_key': 'secret_key',
                'webhook_secret': 'webhook_secret'
              }
              
              const fieldName = keyMap[credential_key] || credential_key
              if (processedSettings[provider].hasOwnProperty(fieldName)) {
                processedSettings[provider][fieldName] = credential_value || ''
                console.log(`✅ [PAYMENTS] ${provider}.${fieldName} definido`)
              }
            }
          })
          
          // FORÇAR ativação do MercadoPago se tiver credenciais
          const mpCredentials = settingsData.credentials.filter(c => c.payment_setting_id === 7)
          const hasPublicKey = mpCredentials.some(c => c.credential_key === 'public_key' && c.credential_value && c.credential_value.trim() !== '')
          const hasAccessToken = mpCredentials.some(c => c.credential_key === 'access_token' && c.credential_value && c.credential_value.trim() !== '')
          
          if (hasPublicKey && hasAccessToken) {
            processedSettings.mercadopago.enabled = true
            console.log('🚀 [PAYMENTS] MercadoPago FORÇADO como ativo (tem public_key e access_token)')
          } else {
            console.log('⚠️ [PAYMENTS] MercadoPago não ativado:', { hasPublicKey, hasAccessToken })
          }
        } else {
          console.log('⚠️ [PAYMENTS] Nenhuma credencial encontrada na resposta da API')
        }
        
        // Se temos dados diretos da API (fallback)
        if (settingsData.settings) {
          Object.keys(settingsData.settings).forEach(provider => {
            if (processedSettings[provider]) {
              processedSettings[provider] = {
                ...processedSettings[provider],
                ...settingsData.settings[provider]
              }
            }
          })
        }
        
        console.log('📋 [PAYMENTS] Settings finais processados:', processedSettings)
        
        // Verificar automaticamente quais métodos devem estar ativos
        Object.keys(processedSettings).forEach(provider => {
          const isConfigured = isMethodConfigured(processedSettings[provider])
          if (isConfigured && !processedSettings[provider].enabled) {
            processedSettings[provider].enabled = true
            console.log(`🔄 [PAYMENTS] ${provider} ativado automaticamente (tem credenciais válidas)`)
          } else if (!isConfigured && processedSettings[provider].enabled) {
            // Opcional: desativar se não tem credenciais (remova esta linha se não quiser)
            // processedSettings[provider].enabled = false
            console.log(`⚠️ [PAYMENTS] ${provider} está ativo mas sem credenciais completas`)
          }
        })
        
        const mergedSettings = processedSettings
        
        setPaymentSettings(mergedSettings)
        
        // Processar transações
        const processedTransactions = transactionsData.transactions || [
          {
            id: '1',
            type: 'deposit',
            user_name: 'João Silva',
            user_email: 'joao@example.com',
            amount: 150.00,
            method: 'pix',
            status: 'completed',
            created_at: new Date().toISOString()
          }
        ]
        
        setTransactions(processedTransactions)
        setConnectionStatus('connected')
        
      } catch (error) {
        console.error('❌ [PAYMENTS] Erro ao carregar dados:', error)
        
        if (!isMounted) return
        
        setConnectionStatus('error')
        setError('Erro ao carregar configurações. Usando valores padrão.')
        
        // Usar configurações padrão em caso de erro
        setPaymentSettings({
          pix: {
            enabled: false,
            merchant_id: '',
            api_key: '',
            webhook_url: '',
            fee_percentage: 2.5
          },
          stripe: {
            enabled: false,
            publishable_key: '',
            secret_key: '',
            webhook_secret: '',
            fee_percentage: 3.4
          },
          paypal: {
            enabled: false,
            client_id: '',
            client_secret: '',
            fee_percentage: 4.0
          },
          mercadopago: {
            enabled: false,
            environment: 'sandbox',
            sandbox: {
              public_key: '',
              access_token: '',
              client_id: '',
              client_secret: '',
              webhook_url: ''
            },
            production: {
              public_key: '',
              access_token: '',
              client_id: '',
              client_secret: '',
              webhook_url: ''
            },
            fee_percentage: 4.99,
            pix_enabled: true,
            credit_card_enabled: true,
            debit_card_enabled: true,
            installments_enabled: true,
            max_installments: 12
          }
        })
        
        setTransactions([])
        
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadPaymentData()

    return () => {
      isMounted = false
    }
  }, [])

  const handleToggleMethod = async (method) => {
    try {
      setSaving(true)
      setError(null)
      
      const newEnabledState = !paymentSettings[method].enabled
      console.log(`🔄 [PAYMENTS] Alterando ${method}: ${paymentSettings[method].enabled} → ${newEnabledState}`)
      
      const response = await fetch(`http://localhost:5001/api/admin/payments/methods/${method}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          enabled: newEnabledState,
          payment_setting_id: method === 'mercadopago' ? 7 : 
                             method === 'pix' ? 1 : 
                             method === 'stripe' ? 2 : 
                             method === 'paypal' ? 3 : null
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      console.log('✅ [PAYMENTS] Toggle response:', result)
      
      // Atualizar estado local IMEDIATAMENTE
      setPaymentSettings(prev => {
        const updated = {
          ...prev,
          [method]: {
            ...prev[method],
            enabled: newEnabledState
          }
        }
        console.log(`✅ [PAYMENTS] Estado local atualizado - ${method}.enabled = ${newEnabledState}`)
        return updated
      })
      
      showMessage(`Método ${method} ${newEnabledState ? 'ativado' : 'desativado'} com sucesso!`)
      
    } catch (error) {
      console.error('❌ [PAYMENTS] Erro ao alterar método de pagamento:', error)
      showMessage(`Erro ao alterar método ${method}: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSettings = async (method, settings) => {
    try {
      setSaving(true)
      setError(null)
      
      console.log(`🔄 [PAYMENTS] Atualizando configurações de ${method}:`, settings)
      
      const response = await fetch(`http://localhost:5001/api/admin/payments/settings/${method}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      console.log(`✅ [PAYMENTS] Resposta da API:`, result)
      
      // Atualizar estado local com as configurações salvas
      setPaymentSettings(prev => {
        const updated = {
          ...prev,
          [method]: {
            ...prev[method],
            ...settings
          }
        }
        
        // Verificar se o método deve ser ativado automaticamente
        const isConfigured = isMethodConfigured(updated[method])
        if (isConfigured && !updated[method].enabled) {
          updated[method].enabled = true
          console.log(`🔄 [PAYMENTS] ${method} ativado automaticamente após salvar`)
        }
        
        return updated
      })
      
      showMessage(`Configurações de ${method.toUpperCase()} salvas com sucesso!`)
      console.log(`✅ [PAYMENTS] Configurações de ${method} atualizadas localmente`)
      
    } catch (error) {
      console.error('❌ [PAYMENTS] Erro ao atualizar configurações:', error)
      showMessage(`Erro ao salvar configurações de ${method}: ${error.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-100 text-yellow-800">Conectando...</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erro de Conexão</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      completed: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800' },
      failed: { label: 'Falhou', className: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-800' }
    }
    
    const config = variants[status] || variants.pending
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type) => {
    const icons = {
      deposit: <DollarSign className="w-4 h-4 text-green-600" />,
      withdrawal: <DollarSign className="w-4 h-4 text-red-600" />,
      bet: <CreditCard className="w-4 h-4 text-blue-600" />
    }
    return icons[type] || <CreditCard className="w-4 h-4" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-slate-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Mensagens de Status */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Header com Status e Debug Info */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Gestão de Pagamentos</h2>
          <p className="text-slate-600">Configure métodos de pagamento e monitore transações</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('🔍 [DEBUG] PaymentSettings atual:', paymentSettings)
              console.log('🔍 [DEBUG] MercadoPago Status:', {
                enabled: paymentSettings?.mercadopago?.enabled,
                hasPublicKey: !!(paymentSettings?.mercadopago?.public_key),
                hasAccessToken: !!(paymentSettings?.mercadopago?.access_token),
                isConfigured: isMethodConfigured(paymentSettings?.mercadopago),
                fullSettings: paymentSettings?.mercadopago
              })
              alert(`MercadoPago Status: ${paymentSettings?.mercadopago?.enabled ? 'ATIVO' : 'INATIVO'}\nVer console para detalhes completos`)
            }}
            className="text-xs"
          >
            Debug Info
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              console.log('🔄 [PAYMENTS] Forçando reload dos dados...')
              setLoading(true)
              window.location.reload()
            }}
            className="text-xs"
          >
            Recarregar Dados
          </Button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            {getConnectionStatusBadge()}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="analytics">Análises</TabsTrigger>
        </TabsList>

        {/* Payment Settings */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PIX Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>PIX</CardTitle>
                      <CardDescription>Pagamentos instantâneos via PIX</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={paymentSettings?.pix?.enabled || false}
                    onCheckedChange={() => handleToggleMethod('pix')}
                    disabled={saving}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <PixSettings 
                  settings={paymentSettings?.pix || {}}
                  onUpdate={(settings) => handleUpdateSettings('pix', settings)}
                  disabled={!paymentSettings?.pix?.enabled}
                  saving={saving}
                />
              </CardContent>
            </Card>

            {/* MercadoPago Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                      </svg>
                    </div>
                    <div>
                      <CardTitle>MercadoPago</CardTitle>
                      <CardDescription>PIX, Cartão de Crédito e Débito</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={paymentSettings?.mercadopago?.enabled || false}
                    onCheckedChange={() => handleToggleMethod('mercadopago')}
                    disabled={saving}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <MercadoPagoSettings 
                  settings={paymentSettings?.mercadopago || {}}
                  onUpdate={(settings) => handleUpdateSettings('mercadopago', settings)}
                  disabled={!paymentSettings?.mercadopago?.enabled}
                  saving={saving}
                />
              </CardContent>
            </Card>

            {/* Stripe Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Stripe</CardTitle>
                      <CardDescription>Cartões de crédito e débito</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={paymentSettings?.stripe?.enabled || false}
                    onCheckedChange={() => handleToggleMethod('stripe')}
                    disabled={saving}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <StripeSettings 
                  settings={paymentSettings?.stripe || {}}
                  onUpdate={(settings) => handleUpdateSettings('stripe', settings)}
                  disabled={!paymentSettings?.stripe?.enabled}
                  saving={saving}
                />
              </CardContent>
            </Card>

            {/* PayPal Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <CardTitle>PayPal</CardTitle>
                      <CardDescription>Pagamentos via PayPal</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={paymentSettings?.paypal?.enabled || false}
                    onCheckedChange={() => handleToggleMethod('paypal')}
                    disabled={saving}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <PayPalSettings 
                  settings={paymentSettings?.paypal || {}}
                  onUpdate={(settings) => handleUpdateSettings('paypal', settings)}
                  disabled={!paymentSettings?.paypal?.enabled}
                  saving={saving}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>
                Histórico de todas as transações da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(transaction.type)}
                            <span className="capitalize">{transaction.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.user_name}</p>
                            <p className="text-sm text-slate-500">{transaction.user_email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">R$ {transaction.amount.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.method}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Volume Total</p>
                    <p className="text-2xl font-bold text-slate-900">R$ 15.420,50</p>
                    <p className="text-xs text-slate-500 mt-1">+8.2% este mês</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Transações</p>
                    <p className="text-2xl font-bold text-slate-900">{transactions.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Últimos 30 dias</p>
                  </div>
                  <CreditCard className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-slate-900">98.5%</p>
                    <p className="text-xs text-slate-500 mt-1">Média mensal</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function MercadoPagoSettings({ settings, onUpdate, disabled, saving }) {
  const [formData, setFormData] = useState({
    public_key: settings.public_key || settings.sandbox?.public_key || '',
    access_token: settings.access_token || settings.sandbox?.access_token || '',
    client_id: settings.client_id || settings.sandbox?.client_id || '',
    client_secret: settings.client_secret || settings.sandbox?.client_secret || '',
    webhook_url: settings.webhook_url || settings.sandbox?.webhook_url || '',
    fee_percentage: settings.fee_percentage || 4.99,
    environment: settings.environment || 'sandbox',
    pix_enabled: settings.pix_enabled !== undefined ? settings.pix_enabled : true,
    credit_card_enabled: settings.credit_card_enabled !== undefined ? settings.credit_card_enabled : true,
    debit_card_enabled: settings.debit_card_enabled !== undefined ? settings.debit_card_enabled : true,
    installments_enabled: settings.installments_enabled !== undefined ? settings.installments_enabled : true,
    max_installments: settings.max_installments || 12
  })

  // Atualizar formData quando settings mudar (dados carregados do backend)
  useEffect(() => {
    console.log('🔄 [MERCADOPAGO] Settings atualizados:', settings)
    setFormData({
      public_key: settings.public_key || settings.sandbox?.public_key || '',
      access_token: settings.access_token || settings.sandbox?.access_token || '',
      client_id: settings.client_id || settings.sandbox?.client_id || '',
      client_secret: settings.client_secret || settings.sandbox?.client_secret || '',
      webhook_url: settings.webhook_url || settings.sandbox?.webhook_url || '',
      fee_percentage: settings.fee_percentage || 4.99,
      environment: settings.environment || 'sandbox',
      pix_enabled: settings.pix_enabled !== undefined ? settings.pix_enabled : true,
      credit_card_enabled: settings.credit_card_enabled !== undefined ? settings.credit_card_enabled : true,
      debit_card_enabled: settings.debit_card_enabled !== undefined ? settings.debit_card_enabled : true,
      installments_enabled: settings.installments_enabled !== undefined ? settings.installments_enabled : true,
      max_installments: settings.max_installments || 12
    })
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('💾 [MERCADOPAGO] Salvando configurações:', formData)
    onUpdate(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="mp_environment">Ambiente</Label>
        <select
          id="mp_environment"
          value={formData.environment}
          onChange={(e) => handleInputChange('environment', e.target.value)}
          disabled={disabled}
          className="w-full p-2 border rounded-md bg-white disabled:bg-gray-50 disabled:text-gray-500"
        >
          <option value="sandbox">Sandbox (Teste)</option>
          <option value="production">Production (Produção)</option>
        </select>
      </div>

      <div>
        <Label htmlFor="mp_public_key">Public Key</Label>
        <Input
          id="mp_public_key"
          value={formData.public_key}
          onChange={(e) => handleInputChange('public_key', e.target.value)}
          disabled={disabled}
          placeholder="TEST-1234567890abcdef-123456-abc123..."
        />
      </div>
      
      <div>
        <Label htmlFor="mp_access_token">Access Token</Label>
        <Input
          id="mp_access_token"
          type="password"
          value={formData.access_token}
          onChange={(e) => handleInputChange('access_token', e.target.value)}
          disabled={disabled}
          placeholder="TEST-1234567890-123456-abc123..."
        />
      </div>
      
      <div>
        <Label htmlFor="mp_client_id">Client ID</Label>
        <Input
          id="mp_client_id"
          value={formData.client_id}
          onChange={(e) => handleInputChange('client_id', e.target.value)}
          disabled={disabled}
          placeholder="1234567890123456"
        />
      </div>
      
      <div>
        <Label htmlFor="mp_client_secret">Client Secret</Label>
        <Input
          id="mp_client_secret"
          type="password"
          value={formData.client_secret}
          onChange={(e) => handleInputChange('client_secret', e.target.value)}
          disabled={disabled}
          placeholder="MercadoPago Client Secret"
        />
      </div>
      
      <div>
        <Label htmlFor="mp_webhook">Webhook URL</Label>
        <Input
          id="mp_webhook"
          value={formData.webhook_url}
          onChange={(e) => handleInputChange('webhook_url', e.target.value)}
          disabled={disabled}
          placeholder="https://api.betfit.com/webhooks/mercadopago"
        />
      </div>
      
      <div>
        <Label htmlFor="mp_fee">Taxa (%)</Label>
        <Input
          id="mp_fee"
          type="number"
          step="0.01"
          value={formData.fee_percentage}
          onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value))}
          disabled={disabled}
        />
      </div>
      
      {/* Métodos de Pagamento Habilitados */}
      <div className="border-t pt-4">
        <Label className="text-sm font-medium text-slate-700 mb-3 block">
          Métodos de Pagamento Habilitados
        </Label>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-green-600" />
              <span className="text-sm">PIX</span>
            </div>
            <Switch
              checked={formData.pix_enabled}
              onCheckedChange={(checked) => handleInputChange('pix_enabled', checked)}
              disabled={disabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Cartão de Crédito</span>
            </div>
            <Switch
              checked={formData.credit_card_enabled}
              onCheckedChange={(checked) => handleInputChange('credit_card_enabled', checked)}
              disabled={disabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <span className="text-sm">Cartão de Débito</span>
            </div>
            <Switch
              checked={formData.debit_card_enabled}
              onCheckedChange={(checked) => handleInputChange('debit_card_enabled', checked)}
              disabled={disabled}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-orange-600" />
              <span className="text-sm">Parcelamento</span>
            </div>
            <Switch
              checked={formData.installments_enabled}
              onCheckedChange={(checked) => handleInputChange('installments_enabled', checked)}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
      
      {/* Configurações de Parcelamento */}
      {formData.installments_enabled && (
        <div>
          <Label htmlFor="mp_max_installments">Máximo de Parcelas</Label>
          <Input
            id="mp_max_installments"
            type="number"
            min="1"
            max="24"
            value={formData.max_installments}
            onChange={(e) => handleInputChange('max_installments', parseInt(e.target.value))}
            disabled={disabled}
          />
          <p className="text-xs text-slate-500 mt-1">
            Número máximo de parcelas permitidas (1-24)
          </p>
        </div>
      )}
      
      <Button type="submit" disabled={disabled || saving} className="w-full">
        {saving ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações MercadoPago
          </>
        )}
      </Button>
      
      {/* Status dos Métodos */}
      {!disabled && (
        <div className="bg-slate-50 p-3 rounded-lg">
          <p className="text-xs font-medium text-slate-600 mb-2">Status dos Métodos:</p>
          <div className="flex flex-wrap gap-2">
            {formData.pix_enabled && (
              <Badge className="text-xs bg-green-100 text-green-800">PIX Ativo</Badge>
            )}
            {formData.credit_card_enabled && (
              <Badge className="text-xs bg-blue-100 text-blue-800">Crédito Ativo</Badge>
            )}
            {formData.debit_card_enabled && (
              <Badge className="text-xs bg-purple-100 text-purple-800">Débito Ativo</Badge>
            )}
            {formData.installments_enabled && (
              <Badge variant="outline" className="text-xs">
                Parcelas até {formData.max_installments}x
              </Badge>
            )}
          </div>
          <div className="mt-2">
            <Badge className="text-xs bg-gray-100 text-gray-800">
              Ambiente: {formData.environment === 'sandbox' ? 'Teste' : 'Produção'}
            </Badge>
          </div>
        </div>
      )}
    </form>
  )
}

function PixSettings({ settings, onUpdate, disabled, saving }) {
  const [formData, setFormData] = useState({
    merchant_id: settings.merchant_id || '',
    api_key: settings.api_key || '',
    webhook_url: settings.webhook_url || '',
    fee_percentage: settings.fee_percentage || 2.5
  })

  // Atualizar formData quando settings mudar
  useEffect(() => {
    setFormData({
      merchant_id: settings.merchant_id || '',
      api_key: settings.api_key || '',
      webhook_url: settings.webhook_url || '',
      fee_percentage: settings.fee_percentage || 2.5
    })
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="pix_merchant_id">Merchant ID</Label>
        <Input
          id="pix_merchant_id"
          value={formData.merchant_id}
          onChange={(e) => handleInputChange('merchant_id', e.target.value)}
          disabled={disabled}
          placeholder="betfit_merchant_123"
        />
      </div>
      
      <div>
        <Label htmlFor="pix_api_key">API Key</Label>
        <Input
          id="pix_api_key"
          type="password"
          value={formData.api_key}
          onChange={(e) => handleInputChange('api_key', e.target.value)}
          disabled={disabled}
          placeholder="pix_api_key_***"
        />
      </div>
      
      <div>
        <Label htmlFor="pix_webhook">Webhook URL</Label>
        <Input
          id="pix_webhook"
          value={formData.webhook_url}
          onChange={(e) => handleInputChange('webhook_url', e.target.value)}
          disabled={disabled}
          placeholder="https://api.betfit.com/webhooks/pix"
        />
      </div>
      
      <div>
        <Label htmlFor="pix_fee">Taxa (%)</Label>
        <Input
          id="pix_fee"
          type="number"
          step="0.1"
          value={formData.fee_percentage}
          onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value))}
          disabled={disabled}
        />
      </div>
      
      <Button type="submit" disabled={disabled || saving} className="w-full">
        {saving ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações PIX
          </>
        )}
      </Button>
    </form>
  )
}

function StripeSettings({ settings, onUpdate, disabled, saving }) {
  const [formData, setFormData] = useState({
    publishable_key: settings.publishable_key || '',
    secret_key: settings.secret_key || '',
    webhook_secret: settings.webhook_secret || '',
    fee_percentage: settings.fee_percentage || 3.4
  })

  // Atualizar formData quando settings mudar
  useEffect(() => {
    setFormData({
      publishable_key: settings.publishable_key || '',
      secret_key: settings.secret_key || '',
      webhook_secret: settings.webhook_secret || '',
      fee_percentage: settings.fee_percentage || 3.4
    })
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="stripe_publishable">Publishable Key</Label>
        <Input
          id="stripe_publishable"
          value={formData.publishable_key}
          onChange={(e) => handleInputChange('publishable_key', e.target.value)}
          disabled={disabled}
          placeholder="pk_test_51234567890abcdef"
        />
      </div>
      
      <div>
        <Label htmlFor="stripe_secret">Secret Key</Label>
        <Input
          id="stripe_secret"
          type="password"
          value={formData.secret_key}
          onChange={(e) => handleInputChange('secret_key', e.target.value)}
          disabled={disabled}
          placeholder="sk_test_***"
        />
      </div>
      
      <div>
        <Label htmlFor="stripe_webhook">Webhook Secret</Label>
        <Input
          id="stripe_webhook"
          type="password"
          value={formData.webhook_secret}
          onChange={(e) => handleInputChange('webhook_secret', e.target.value)}
          disabled={disabled}
          placeholder="whsec_***"
        />
      </div>
      
      <div>
        <Label htmlFor="stripe_fee">Taxa (%)</Label>
        <Input
          id="stripe_fee"
          type="number"
          step="0.1"
          value={formData.fee_percentage}
          onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value))}
          disabled={disabled}
        />
      </div>
      
      <Button type="submit" disabled={disabled || saving} className="w-full">
        {saving ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações Stripe
          </>
        )}
      </Button>
    </form>
  )
}

function PayPalSettings({ settings, onUpdate, disabled, saving }) {
  const [formData, setFormData] = useState({
    client_id: settings.client_id || '',
    client_secret: settings.client_secret || '',
    fee_percentage: settings.fee_percentage || 4.0
  })

  // Atualizar formData quando settings mudar
  useEffect(() => {
    setFormData({
      client_id: settings.client_id || '',
      client_secret: settings.client_secret || '',
      fee_percentage: settings.fee_percentage || 4.0
    })
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(formData)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="paypal_client_id">Client ID</Label>
        <Input
          id="paypal_client_id"
          value={formData.client_id}
          onChange={(e) => handleInputChange('client_id', e.target.value)}
          disabled={disabled}
          placeholder="PayPal Client ID"
        />
      </div>
      
      <div>
        <Label htmlFor="paypal_client_secret">Client Secret</Label>
        <Input
          id="paypal_client_secret"
          type="password"
          value={formData.client_secret}
          onChange={(e) => handleInputChange('client_secret', e.target.value)}
          disabled={disabled}
          placeholder="PayPal Client Secret"
        />
      </div>
      
      <div>
        <Label htmlFor="paypal_fee">Taxa (%)</Label>
        <Input
          id="paypal_fee"
          type="number"
          step="0.1"
          value={formData.fee_percentage}
          onChange={(e) => handleInputChange('fee_percentage', parseFloat(e.target.value))}
          disabled={disabled}
        />
      </div>
      
      <Button type="submit" disabled={disabled || saving} className="w-full">
        {saving ? (
          <>
            <Clock className="w-4 h-4 mr-2 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configurações PayPal
          </>
        )}
      </Button>
    </form>
  )
}