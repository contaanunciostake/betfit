import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Trophy,
  BarChart3,
  PieChart,
  Calendar,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const WalletStats = ({ stats = {}, detailed = false }) => {
  // Safe defaults for stats - para novos usuários, todos os valores devem ser zero
  const safeStats = {
    roi: 0,
    winRate: 0,
    netProfit: 0,
    averageStake: 0,
    totalEarned: 0,
    monthlyEarned: 0,
    totalDeposited: 0,
    totalSpent: 0,
    monthlySpent: 0,
    totalWithdrawn: 0
  };

  const formatCurrency = (amount) => {
    const safeAmount = typeof amount === 'number' ? amount : 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(safeAmount);
  };

  const getROIColor = (roi) => {
    const safeRoi = typeof roi === 'number' ? roi : 0;
    if (safeRoi > 0) return 'text-green-500';
    if (safeRoi < 0) return 'text-red-500';
    return 'text-muted-foreground';
  };

  const getROIIcon = (roi) => {
    const safeRoi = typeof roi === 'number' ? roi : 0;
    if (safeRoi > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (safeRoi < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <BarChart3 className="w-4 h-4 text-muted-foreground" />;
  };

  const getPerformanceBadge = (winRate) => {
    const safeWinRate = typeof winRate === 'number' ? winRate : 0;
    if (safeWinRate >= 70) return { label: 'Excelente', color: 'bg-green-500/10 text-green-700 dark:text-green-400' };
    if (safeWinRate >= 60) return { label: 'Bom', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' };
    if (safeWinRate >= 50) return { label: 'Regular', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' };
    return { label: 'Precisa Melhorar', color: 'bg-red-500/10 text-red-700 dark:text-red-400' };
  };

  if (!detailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Estatísticas Rápidas</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-card border rounded-lg">
              <div className="flex items-center justify-center mb-2">
                {getROIIcon(safeStats.roi)}
              </div>
              <p className="text-sm text-muted-foreground">ROI</p>
              <p className={`text-lg font-bold ${getROIColor(safeStats.roi)}`}>
                {safeStats.roi.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center p-3 bg-card border rounded-lg">
              <Trophy className="w-4 h-4 text-yellow-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Taxa de Vitória</p>
              <p className="text-lg font-bold text-primary">
                {safeStats.winRate.toFixed(1)}%
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lucro/Prejuízo:</span>
              <span className={getROIColor(safeStats.netProfit)}>
                {formatCurrency(safeStats.netProfit)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Stake Médio:</span>
              <span>{formatCurrency(safeStats.averageStake)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const performanceBadge = getPerformanceBadge(safeStats.winRate);

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span>Performance Geral</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-4xl font-bold mb-2 ${getROIColor(safeStats.roi)}`}>
              {safeStats.roi.toFixed(1)}%
            </div>
            <p className="text-muted-foreground mb-4">Retorno sobre Investimento (ROI)</p>
            <Badge className={performanceBadge.color}>
              {performanceBadge.label}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{safeStats.winRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Taxa de Vitória</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(safeStats.averageStake)}</p>
              <p className="text-sm text-muted-foreground">Stake Médio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span>Resumo Financeiro</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income */}
            <div className="space-y-4">
              <h3 className="font-medium text-green-600 dark:text-green-400 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Receitas
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Ganho:</span>
                  <span className="font-medium text-green-500">{formatCurrency(safeStats.totalEarned)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Este Mês:</span>
                  <span className="font-medium text-green-500">{formatCurrency(safeStats.monthlyEarned)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Depósitos:</span>
                  <span className="font-medium">{formatCurrency(safeStats.totalDeposited)}</span>
                </div>
              </div>
            </div>

            {/* Expenses */}
            <div className="space-y-4">
              <h3 className="font-medium text-red-600 dark:text-red-400 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2" />
                Gastos
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Gasto:</span>
                  <span className="font-medium text-red-500">{formatCurrency(safeStats.totalSpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Este Mês:</span>
                  <span className="font-medium text-red-500">{formatCurrency(safeStats.monthlySpent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Saques:</span>
                  <span className="font-medium">{formatCurrency(safeStats.totalWithdrawn)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Result */}
          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="font-medium">Resultado Líquido:</span>
              <span className={`text-xl font-bold ${getROIColor(safeStats.netProfit)}`}>
                {formatCurrency(safeStats.netProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Progresso Mensal</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Meta de Lucro Mensal:</span>
              <span className="font-medium">R$ 500,00</span>
            </div>
            <Progress value={57} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Atual: {formatCurrency(safeStats.monthlyEarned - safeStats.monthlySpent)}</span>
              <span>57% da meta</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="text-center p-3 bg-green-500/10 rounded-lg">
              <Zap className="w-4 h-4 text-green-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Ganhos</p>
              <p className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(safeStats.monthlyEarned)}
              </p>
            </div>
            <div className="text-center p-3 bg-red-500/10 rounded-lg">
              <Target className="w-4 h-4 text-red-500 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Gastos</p>
              <p className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(safeStats.monthlySpent)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletStats;

