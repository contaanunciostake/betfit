import { useState } from 'react';
import { 
  Target,
  Plus,
  Calendar,
  DollarSign,
  TrendingUp,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const WalletGoals = ({ goals }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: '',
    deadline: ''
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getDaysRemaining = (deadline) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getStatusBadge = (goal) => {
    const daysRemaining = getDaysRemaining(goal.deadline);
    const progress = goal.progress;

    if (progress >= 100) {
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Concluída</Badge>;
    }
    
    if (daysRemaining < 0) {
      return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Expirada</Badge>;
    }
    
    if (daysRemaining <= 7) {
      return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Urgente</Badge>;
    }
    
    return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">Ativa</Badge>;
  };

  const handleCreateGoal = () => {
    if (!newGoal.title || !newGoal.target || !newGoal.deadline) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    // Here you would typically send the data to your backend
    console.log('Creating goal:', newGoal);
    
    // Reset form
    setNewGoal({
      title: '',
      description: '',
      target: '',
      deadline: ''
    });
    setShowCreateForm(false);
    
    alert('Meta criada com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Metas Financeiras</h2>
          <p className="text-muted-foreground">Defina e acompanhe seus objetivos</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="betfit-button-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Nova Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goalTitle">Título da Meta *</Label>
                <Input
                  id="goalTitle"
                  placeholder="Ex: Comprar equipamento novo"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="goalTarget">Valor Alvo (R$) *</Label>
                <Input
                  id="goalTarget"
                  type="number"
                  placeholder="1000.00"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({...newGoal, target: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="goalDescription">Descrição</Label>
              <Textarea
                id="goalDescription"
                placeholder="Descreva sua meta..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="goalDeadline">Data Limite *</Label>
              <Input
                id="goalDeadline"
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleCreateGoal} className="betfit-button-primary">
                Criar Meta
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => (
          <Card key={goal.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{goal.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {goal.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(goal)}
                  <Button variant="ghost" size="sm">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progresso:</span>
                  <span className="font-medium">{goal.progress.toFixed(1)}%</span>
                </div>
                <Progress 
                  value={goal.progress} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(goal.current)}</span>
                  <span>{formatCurrency(goal.target)}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Faltam:</span>
                  </div>
                  <span className="font-medium text-primary">
                    {formatCurrency(goal.target - goal.current)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Prazo:</span>
                  </div>
                  <span className="font-medium">
                    {formatDate(goal.deadline)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Restam:</span>
                  </div>
                  <span className={`font-medium ${getDaysRemaining(goal.deadline) <= 7 ? 'text-red-500' : 'text-foreground'}`}>
                    {getDaysRemaining(goal.deadline)} dias
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Contribuir
                </Button>
                {goal.progress >= 100 && (
                  <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluída
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {goals.length === 0 && !showCreateForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhuma meta definida
              </h3>
              <p className="text-muted-foreground mb-4">
                Crie suas primeiras metas financeiras para acompanhar seu progresso
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="betfit-button-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Meta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground mb-1">Dicas para suas metas</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Defina metas específicas e realistas</li>
                <li>• Estabeleça prazos para manter o foco</li>
                <li>• Acompanhe seu progresso regularmente</li>
                <li>• Comemore quando atingir seus objetivos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletGoals;

