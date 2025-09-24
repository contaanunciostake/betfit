import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { ArrowUpIcon, ArrowDownIcon, TrophyIcon, DollarSignIcon } from 'lucide-react'

const WalletTransactions = ({ transactions = [] }) => {
  // Função para formatar data de forma segura
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Data não disponível'
      
      const date = new Date(dateString)
      
      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        console.warn('Data inválida:', dateString)
        return 'Data inválida'
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString)
      return 'Erro na data'
    }
  }

  // Função para formatar valor monetário
  const formatCurrency = (amount) => {
    try {
      const value = parseFloat(amount) || 0
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    } catch (error) {
      console.error('Erro ao formatar valor:', error, amount)
      return 'R$ 0,00'
    }
  }

  // Função para obter ícone do tipo de transação
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownIcon className="h-4 w-4 text-green-500" />
      case 'withdrawal':
      case 'stake':
        return <ArrowUpIcon className="h-4 w-4 text-red-500" />
      case 'winning':
        return <TrophyIcon className="h-4 w-4 text-yellow-500" />
      default:
        return <DollarSignIcon className="h-4 w-4 text-gray-500" />
    }
  }

  // Função para obter cor do badge
  const getBadgeVariant = (type) => {
    switch (type) {
      case 'deposit':
        return 'default'
      case 'withdrawal':
      case 'stake':
        return 'destructive'
      case 'winning':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Função para traduzir tipo de transação
  const getTransactionTypeLabel = (type) => {
    const labels = {
      'deposit': 'Depósito',
      'withdrawal': 'Saque',
      'stake': 'Aposta',
      'winning': 'Ganho',
      'bonus': 'Bônus',
      'refund': 'Reembolso'
    }
    return labels[type] || type
  }

  // Verificar se há transações
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <DollarSignIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma transação encontrada</p>
            <p className="text-sm">Suas transações aparecerão aqui</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Transações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction, index) => {
            // Usar index como fallback se não houver ID
            const transactionId = transaction.id || index
            
            return (
              <div
                key={transactionId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(transaction.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium">
                        {transaction.description || 'Transação'}
                      </p>
                      <Badge variant={getBadgeVariant(transaction.type)}>
                        {getTransactionTypeLabel(transaction.type)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default WalletTransactions

