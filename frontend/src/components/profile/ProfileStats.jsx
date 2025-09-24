import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Trophy,
  Activity,
  Flame,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ProfileStats = ({ stats, recentActivity }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'win': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'loss': return <ArrowDown className="w-4 h-4 text-red-500" />;
      case 'participation': return <Minus className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'win': return 'text-green-500';
      case 'loss': return 'text-red-500';
      case 'participation': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const completionRate = stats.totalChallenges > 0 ? (stats.completedChallenges / stats.totalChallenges) * 100 : 0;
  const winRate = stats.completedChallenges > 0 ? (stats.wonChallenges / stats.completedChallenges) * 100 : 0;
  const profitLoss = stats.totalEarned - stats.totalSpent;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Financial Stats */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="flex items-center space-x-2 text-white">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span>Estatísticas Financeiras</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-600/20 rounded-lg border border-green-600/30">
                <p className="text-sm text-gray-400 mb-1">Total Ganho</p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(stats.totalEarned)}
                </p>
              </div>
              
              <div className="text-center p-4 bg-red-600/20 rounded-lg border border-red-600/30">
                <p className="text-sm text-gray-400 mb-1">Total Gasto</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(stats.totalSpent)}
                </p>
              </div>
              
              <div className={`text-center p-4 rounded-lg border ${
                profitLoss >= 0 
                  ? 'bg-green-600/20 border-green-600/30' 
                  : 'bg-red-600/20 border-red-600/30'
              }`}>
                <p className="text-sm text-gray-400 mb-1">Lucro/Prejuízo</p>
                <p className={`text-2xl font-bold ${
                  profitLoss >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatCurrency(profitLoss)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Stake Médio</span>
                  <span className="font-semibold text-white">{formatCurrency(stats.averageStake)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Categoria Favorita</span>
                  <Badge className="bg-green-600 text-white border-green-600">{stats.favoriteCategory}</Badge>
                </div>
              </div>
              
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Sequência Atual</span>
                  <span className="font-semibold flex items-center text-white">
                    <Flame className="w-4 h-4 text-orange-500 mr-1" />
                    {stats.currentStreak}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Maior Sequência</span>
                  <span className="font-semibold text-white">{stats.longestStreak}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="flex items-center space-x-2 text-white">
              <BarChart3 className="w-5 h-5 text-green-500" />
              <span>Performance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Taxa de Conclusão</span>
                  <span className="font-semibold text-white">{completionRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={completionRate} 
                  className="h-2 bg-gray-700"
                  style={{
                    '--progress-background': '#374151',
                    '--progress-foreground': '#16a34a'
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {stats.completedChallenges} de {stats.totalChallenges} desafios concluídos
                </p>
              </div>

              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Taxa de Vitória</span>
                  <span className="font-semibold text-white">{winRate.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={winRate} 
                  className="h-2 bg-gray-700"
                  style={{
                    '--progress-background': '#374151',
                    '--progress-foreground': '#16a34a'
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {stats.wonChallenges} vitórias em {stats.completedChallenges} desafios concluídos
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                <Activity className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-white">{stats.totalDistance}km</p>
                <p className="text-xs text-gray-400">Distância Total</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-white">{stats.totalCalories.toLocaleString()}</p>
                <p className="text-xs text-gray-400">Calorias Queimadas</p>
              </div>
              
              <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-lg font-bold text-white">{stats.totalWorkouts}</p>
                <p className="text-xs text-gray-400">Treinos Realizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Calendar className="w-5 h-5 text-green-500" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.challenge}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0 text-right">
                      <p className={`text-sm font-semibold ${getActivityColor(activity.type)}`}>
                        {activity.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(activity.amount))}
                      </p>
                      <Badge 
                        className={`text-xs mt-1 ${
                          activity.status === 'completed' 
                            ? 'bg-green-600 text-white border-green-600' 
                            : 'bg-gray-600 text-gray-300 border-gray-600'
                        }`}
                      >
                        {activity.status === 'completed' ? 'Concluído' : 
                         activity.status === 'active' ? 'Ativo' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Achievements */}
        <Card className="mt-6 bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardHeader className="border-b border-gray-700/50">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Trophy className="w-5 h-5 text-green-500" />
              <span>Conquistas Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">Primeira Vitória</p>
                  <p className="text-xs text-gray-400">Vença seu primeiro desafio</p>
                </div>
                <Badge className="bg-green-600 text-white border-green-600">✓</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">Sequência de 10</p>
                  <p className="text-xs text-gray-400">Vença 10 desafios seguidos</p>
                </div>
                <Badge className="bg-gray-600 text-gray-300 border-gray-600">
                  {Math.min(stats.longestStreak, 10)}/10
                </Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:bg-gray-800/70 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">100 Desafios</p>
                  <p className="text-xs text-gray-400">Complete 100 desafios</p>
                </div>
                <Badge className={`border ${
                  stats.totalChallenges >= 100 
                    ? 'bg-green-600 text-white border-green-600' 
                    : 'bg-gray-600 text-gray-300 border-gray-600'
                }`}>
                  {stats.totalChallenges}/100
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileStats;

