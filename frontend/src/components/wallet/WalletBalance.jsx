import { useState, useEffect } from 'react';
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  EyeOff,
  Plus,
  Minus,
  Zap,
  AlertCircle,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/contexts/WalletContext';

const WalletBalance = ({ showBalance = true }) => {
  // Usar o WalletContext atualizado
  const {
    realBalance,
    realAvailable,
    realPending,
    isLoading,
    connectionStatus,
    lastUpdate,
    errorMessage,
    refreshWallet,
    debugInfo
  } = useWallet();

  // Estados locais para controle da interface
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Dados reais do saldo (com fallback para zeros se não houver dados)
  const balance = {
    total: realBalance || 0,
    available: realAvailable || 0,
    pending: realPending || 0
  };

  // Stats mockados por enquanto (você pode implementar APIs para estes dados depois)
  const stats = {
    monthlyEarned: 0,
    monthlySpent: 0,
    roi: 0,
    winRate: 0,
    averageStake: 0
  };

  // Função para refresh manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshWallet();
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Formatação de moeda
  const formatCurrency = (amount) => {
    if (!showBalance) return '••••••';
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safeAmount);
  };

  // Cor do saldo baseada no valor
  const getBalanceColor = (amount) => {
    const safeAmount = typeof amount === 'number' ? amount : 0;
    if (safeAmount > 1000) return 'text-green-500';
    if (safeAmount > 500) return 'text-yellow-500';
    if (safeAmount > 0) return 'text-blue-500';
    return 'text-red-500';
  };

  // Cor do lucro
  const getProfitColor = (profit) => {
    const safeProfit = typeof profit === 'number' ? profit : 0;
    if (safeProfit > 0) return 'text-green-500';
    if (safeProfit < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  // Ícone de status da conexão
  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'connecting':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Status da conexão em texto
  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'error':
        return 'Erro de conexão';
      default:
        return 'Desconectado';
    }
  };

  // Debug: Log dos dados recebidos
  useEffect(() => {
    console.log('💰 [WalletBalance] Dados atualizados:', {
      realBalance,
      realAvailable,
      realPending,
      connectionStatus,
      lastUpdate,
      debugInfo
    });
  }, [realBalance, realAvailable, realPending, connectionStatus, lastUpdate]);

  return (
    <div className="space-y-4">
      {/* Header com status e controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {getConnectionIcon()}
          <span className="text-sm text-muted-foreground">
            {getConnectionStatus()}
          </span>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground">
              • Atualizado: {new Date(lastUpdate).toLocaleTimeString('pt-BR')}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="h-8"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          {/* Botão de debug (apenas em desenvolvimento) */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="h-8 text-xs"
            >
              Debug
            </Button>
          )}
        </div>
      </div>

      {/* Mensagem de erro se houver */}
      {errorMessage && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* Debug info (apenas em desenvolvimento) */}
      {showDebugInfo && process.env.NODE_ENV === 'development' && (
        <div className="p-3 bg-gray-500/10 rounded-lg border border-gray-500/20">
          <p className="text-xs font-mono text-muted-foreground">
            <strong>Debug Info:</strong><br />
            User: {debugInfo?.user || 'N/A'}<br />
            Status: {connectionStatus}<br />
            Balance: R$ {realBalance}<br />
            Available: R$ {realAvailable}<br />
            Pending: R$ {realPending}<br />
            Cache: {debugInfo?.cacheAvailable ? 'Sim' : 'Não'}
          </p>
        </div>
      )}

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Main Balance Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                Saldo Total
              </CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className={`text-4xl font-bold ${getBalanceColor(balance.total)}`}>
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                      <span>Carregando...</span>
                    </div>
                  ) : (
                    formatCurrency(balance.total)
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Disponível: {formatCurrency(balance.available)}
                </p>
              </div>
              
              {balance.pending > 0 && (
                <div className="flex items-center space-x-2 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                      Pendente: {formatCurrency(balance.pending)}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">
                      Aguardando confirmação
                    </p>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button className="flex-1 betfit-button-primary" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Depositar
                </Button>
                <Button variant="outline" className="flex-1" size="sm">
                  <Minus className="w-4 h-4 mr-2" />
                  Sacar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Profit/Loss */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lucro Mensal
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getProfitColor(stats.monthlyEarned - stats.monthlySpent)}`}>
                {formatCurrency(stats.monthlyEarned - stats.monthlySpent)}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ganhos:</span>
                  <span className="text-green-500">{formatCurrency(stats.monthlyEarned)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gastos:</span>
                  <span className="text-red-500">{formatCurrency(stats.monthlySpent)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ROI Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ROI Total
              </CardTitle>
              {stats.roi >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className={`text-2xl font-bold ${getProfitColor(stats.roi)}`}>
                {showBalance ? `${stats.roi.toFixed(1)}%` : '••••'}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de Vitória:</span>
                  <span className="text-primary">{stats.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Stake Médio:</span>
                  <span>{formatCurrency(stats.averageStake)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletBalance;

