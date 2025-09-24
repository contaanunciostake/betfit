import { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Target, 
  DollarSign,
  Star,
  Crown,
  Zap,
  Flame,
  Shield,
  Gem,
  Lock,
  CheckCircle,
  Calendar,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ProfileAchievements = ({ achievements, userLevel, userXp, nextLevelXp }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getAchievementIcon = (iconName, earned = false) => {
    const iconClass = `w-8 h-8 ${earned ? 'text-yellow-500' : 'text-gray-400'}`;
    
    switch (iconName) {
      case 'trophy': return <Trophy className={iconClass} />;
      case 'award': return <Award className={iconClass} />;
      case 'target': return <Target className={iconClass} />;
      case 'dollar-sign': return <DollarSign className={iconClass} />;
      case 'star': return <Star className={iconClass} />;
      case 'crown': return <Crown className={iconClass} />;
      case 'zap': return <Zap className={iconClass} />;
      case 'flame': return <Flame className={iconClass} />;
      case 'shield': return <Shield className={iconClass} />;
      case 'gem': return <Gem className={iconClass} />;
      default: return <Trophy className={iconClass} />;
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-gray-500 bg-gray-600/20';
      case 'rare': return 'border-blue-500 bg-blue-600/20';
      case 'epic': return 'border-purple-500 bg-purple-600/20';
      case 'legendary': return 'border-yellow-500 bg-yellow-600/20';
      default: return 'border-gray-500 bg-gray-600/20';
    }
  };

  const getRarityText = (rarity) => {
    switch (rarity) {
      case 'common': return 'Comum';
      case 'rare': return 'Raro';
      case 'epic': return 'Épico';
      case 'legendary': return 'Lendário';
      default: return 'Comum';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Extended achievements for demonstration
  const extendedAchievements = [
    ...achievements,
    {
      id: 5,
      title: 'Velocista',
      description: 'Complete 10 desafios de corrida',
      icon: 'zap',
      earned: true,
      earnedAt: '2024-02-10T16:20:00Z',
      rarity: 'common'
    },
    {
      id: 6,
      title: 'Resistência',
      description: 'Complete um desafio de mais de 2 horas',
      icon: 'shield',
      earned: false,
      progress: 0,
      total: 1,
      rarity: 'rare'
    },
    {
      id: 7,
      title: 'Campeão Semanal',
      description: 'Seja o #1 do ranking semanal',
      icon: 'crown',
      earned: false,
      progress: 0,
      total: 1,
      rarity: 'epic'
    },
    {
      id: 8,
      title: 'Incansável',
      description: 'Mantenha uma sequência de 30 dias',
      icon: 'flame',
      earned: false,
      progress: 8,
      total: 30,
      rarity: 'legendary'
    },
    {
      id: 9,
      title: 'Diversificado',
      description: 'Complete desafios em 5 categorias diferentes',
      icon: 'star',
      earned: true,
      earnedAt: '2024-04-05T10:15:00Z',
      rarity: 'rare'
    },
    {
      id: 10,
      title: 'Colecionador',
      description: 'Ganhe 25 conquistas',
      icon: 'gem',
      earned: false,
      progress: 5,
      total: 25,
      rarity: 'epic'
    }
  ];

  const earnedAchievements = extendedAchievements.filter(a => a.earned);
  const inProgressAchievements = extendedAchievements.filter(a => !a.earned);

  const xpProgress = nextLevelXp > 0 ? (userXp / nextLevelXp) * 100 : 0;

  // Level rewards
  const levelRewards = [
    { level: 'Bronze', xp: 0, rewards: ['Avatar personalizado', 'Badge Bronze'] },
    { level: 'Silver', xp: 500, rewards: ['Filtros especiais', 'Badge Silver', '5% bônus XP'] },
    { level: 'Gold', xp: 1500, rewards: ['Estatísticas avançadas', 'Badge Gold', '10% bônus XP'] },
    { level: 'Platinum', xp: 3000, rewards: ['Acesso antecipado', 'Badge Platinum', '15% bônus XP'] },
    { level: 'Diamond', xp: 5000, rewards: ['Suporte prioritário', 'Badge Diamond', '20% bônus XP'] }
  ];

  return (
    <div className="space-y-6">
      {/* Level Progress */}
      <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
        <CardHeader className="border-b border-gray-700/50">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span>Progresso de Nível</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {userLevel.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-white">Nível {userLevel}</h3>
                <span className="text-sm text-gray-400">{userXp}/{nextLevelXp} XP</span>
              </div>
              <Progress 
                value={xpProgress} 
                className="h-3 bg-gray-700"
                style={{
                  '--progress-background': '#374151',
                  '--progress-foreground': '#16a34a'
                }}
              />
              <p className="text-sm text-gray-400 mt-1">
                {nextLevelXp - userXp} XP para o próximo nível
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {levelRewards.map((reward, index) => (
              <div 
                key={reward.level}
                className={`p-3 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                  userXp >= reward.xp 
                    ? 'border-yellow-500 bg-yellow-600/20' 
                    : 'border-gray-600 bg-gray-800/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
                  userXp >= reward.xp ? 'bg-yellow-500 text-white' : 'bg-gray-600 text-gray-400'
                }`}>
                  {userXp >= reward.xp ? <CheckCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <p className="text-sm font-semibold text-white">{reward.level}</p>
                <p className="text-xs text-gray-400">{reward.xp} XP</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
        <CardHeader className="border-b border-gray-700/50">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Conquistas</span>
            </div>
            <Badge className="bg-green-600 text-white border-green-600">
              {earnedAchievements.length}/{extendedAchievements.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
              >
                Todas
              </TabsTrigger>
              <TabsTrigger 
                value="earned"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
              >
                Conquistadas
              </TabsTrigger>
              <TabsTrigger 
                value="progress"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300"
              >
                Em Progresso
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {extendedAchievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg ${
                      achievement.earned 
                        ? getRarityColor(achievement.rarity)
                        : 'border-gray-600 bg-gray-800/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {achievement.earned ? (
                          getAchievementIcon(achievement.icon, true)
                        ) : (
                          <div className="relative">
                            {getAchievementIcon(achievement.icon, false)}
                            <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-gray-400 bg-[#1E1E1E] rounded-full p-0.5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white truncate">
                            {achievement.title}
                          </h4>
                          <Badge className="text-xs bg-gray-600 text-gray-300 border-gray-600">
                            {getRarityText(achievement.rarity)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">
                          {achievement.description}
                        </p>
                        
                        {achievement.earned ? (
                          <div className="flex items-center space-x-1 text-xs text-green-500">
                            <CheckCircle className="w-3 h-3" />
                            <span>Conquistado em {formatDate(achievement.earnedAt)}</span>
                          </div>
                        ) : achievement.progress !== undefined ? (
                          <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progresso</span>
                              <span>{achievement.progress}/{achievement.total}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / achievement.total) * 100} 
                              className="h-2 bg-gray-700"
                              style={{
                                '--progress-background': '#374151',
                                '--progress-foreground': '#16a34a'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Bloqueado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="earned" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedAchievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 hover:shadow-lg ${getRarityColor(achievement.rarity)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {getAchievementIcon(achievement.icon, true)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white truncate">
                            {achievement.title}
                          </h4>
                          <Badge className="text-xs bg-gray-600 text-gray-300 border-gray-600">
                            {getRarityText(achievement.rarity)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">
                          {achievement.description}
                        </p>
                        
                        <div className="flex items-center space-x-1 text-xs text-green-500">
                          <CheckCircle className="w-3 h-3" />
                          <span>Conquistado em {formatDate(achievement.earnedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inProgressAchievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="p-4 rounded-lg border-2 border-gray-600 bg-gray-800/50 transition-all hover:scale-105 hover:shadow-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 relative">
                        {getAchievementIcon(achievement.icon, false)}
                        <Lock className="absolute -bottom-1 -right-1 w-4 h-4 text-gray-400 bg-[#1E1E1E] rounded-full p-0.5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-white truncate">
                            {achievement.title}
                          </h4>
                          <Badge className="text-xs bg-gray-600 text-gray-300 border-gray-600">
                            {getRarityText(achievement.rarity)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-400 mb-2">
                          {achievement.description}
                        </p>
                        
                        {achievement.progress !== undefined ? (
                          <div>
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progresso</span>
                              <span>{achievement.progress}/{achievement.total}</span>
                            </div>
                            <Progress 
                              value={(achievement.progress / achievement.total) * 100} 
                              className="h-2 bg-gray-700"
                              style={{
                                '--progress-background': '#374151',
                                '--progress-foreground': '#16a34a'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-xs text-gray-400">
                            <Lock className="w-3 h-3" />
                            <span>Bloqueado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{earnedAchievements.length}</p>
            <p className="text-sm text-gray-400">Conquistadas</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{inProgressAchievements.length}</p>
            <p className="text-sm text-gray-400">Em Progresso</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {earnedAchievements.filter(a => a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary').length}
            </p>
            <p className="text-sm text-gray-400">Raras</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
          <CardContent className="p-4 text-center">
            <Gem className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">
              {Math.round((earnedAchievements.length / extendedAchievements.length) * 100)}%
            </p>
            <p className="text-sm text-gray-400">Completude</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileAchievements;

