import { useState } from 'react';
import { 
  Clock, 
  Filter, 
  Search,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ProfileHistory = ({ activities, stats }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Extended mock data for demonstration
  const extendedActivities = [
    ...activities,
    {
      id: 6,
      type: 'win',
      challenge: 'Natação 1km',
      amount: 95.00,
      date: '2024-08-04T16:20:00Z',
      status: 'completed',
      category: 'swimming',
      participants: 8,
      position: 1
    },
    {
      id: 7,
      type: 'participation',
      challenge: 'Yoga 60min',
      amount: -20.00,
      date: '2024-08-03T07:30:00Z',
      status: 'active',
      category: 'yoga',
      participants: 15,
      position: null
    },
    {
      id: 8,
      type: 'loss',
      challenge: 'Corrida 10km',
      amount: -50.00,
      date: '2024-08-02T06:00:00Z',
      status: 'completed',
      category: 'running',
      participants: 25,
      position: 8
    },
    {
      id: 9,
      type: 'win',
      challenge: 'Battle Royale Passos',
      amount: 180.00,
      date: '2024-08-01T20:15:00Z',
      status: 'completed',
      category: 'steps',
      participants: 30,
      position: 1
    },
    {
      id: 10,
      type: 'participation',
      challenge: 'Treino Funcional 45min',
      amount: -30.00,
      date: '2024-07-31T18:45:00Z',
      status: 'pending',
      category: 'workouts',
      participants: 12,
      position: null
    }
  ];

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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'win': return <Trophy className="w-5 h-5 text-green-500" />;
      case 'loss': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'participation': return <Target className="w-5 h-5 text-blue-500" />;
      default: return <Activity className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      default: return 'Desconhecido';
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'win': return 'Vitória';
      case 'loss': return 'Derrota';
      case 'participation': return 'Participação';
      default: return 'Atividade';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      running: 'bg-blue-500/20 text-blue-400',
      cycling: 'bg-green-500/20 text-green-400',
      swimming: 'bg-cyan-500/20 text-cyan-400',
      steps: 'bg-purple-500/20 text-purple-400',
      workouts: 'bg-orange-500/20 text-orange-400',
      yoga: 'bg-pink-500/20 text-pink-400',
      calories: 'bg-red-500/20 text-red-400'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-400';
  };

  // Filter and sort activities
  const filteredActivities = extendedActivities
    .filter(activity => {
      const matchesSearch = activity.challenge.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || activity.type === filterType;
      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date) - new Date(b.date);
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'challenge':
          comparison = a.challenge.localeCompare(b.challenge);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.wonChallenges}</p>
                <p className="text-sm text-muted-foreground">Vitórias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.totalChallenges}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalEarned)}</p>
                <p className="text-sm text-muted-foreground">Ganhos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalSpent)}</p>
                <p className="text-sm text-muted-foreground">Gastos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Histórico de Atividades</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar desafios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="win">Vitórias</SelectItem>
                <SelectItem value="loss">Derrotas</SelectItem>
                <SelectItem value="participation">Participações</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="amount">Valor</SelectItem>
                <SelectItem value="challenge">Desafio</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full sm:w-auto"
            >
              {sortOrder === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            </Button>
          </div>

          {/* Activities List */}
          <div className="space-y-3">
            {filteredActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {activity.challenge}
                    </h4>
                    {activity.category && (
                      <Badge className={`text-xs ${getCategoryColor(activity.category)}`}>
                        {activity.category}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(activity.date)}</span>
                    </span>
                    
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(activity.status)}
                      <span>{getStatusText(activity.status)}</span>
                    </span>
                    
                    {activity.participants && (
                      <span>{activity.participants} participantes</span>
                    )}
                    
                    {activity.position && (
                      <Badge variant="outline" className="text-xs">
                        {activity.position}º lugar
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0 text-right">
                  <p className={`text-lg font-semibold ${
                    activity.amount > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {activity.amount > 0 ? '+' : ''}{formatCurrency(activity.amount)}
                  </p>
                  <Badge variant={activity.type === 'win' ? 'default' : 'secondary'} className="text-xs">
                    {getTypeText(activity.type)}
                  </Badge>
                </div>

                <Button variant="ghost" size="sm" className="flex-shrink-0">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou termos de busca.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileHistory;

