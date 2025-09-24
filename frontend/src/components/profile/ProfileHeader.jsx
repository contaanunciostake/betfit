import { useState } from 'react';
import { 
  User, 
  Edit3, 
  Camera, 
  MapPin, 
  Calendar,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Target,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ProfileHeader = ({ user, stats, onEditProfile }) => {
  const [isHovering, setIsHovering] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getLevelColor = (level) => {
    switch (level.toLowerCase()) {
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-gray-400';
      case 'gold': return 'bg-yellow-500';
      case 'platinum': return 'bg-purple-500';
      case 'diamond': return 'bg-blue-500';
      default: return 'bg-primary';
    }
  };

  const getLevelIcon = (level) => {
    switch (level.toLowerCase()) {
      case 'bronze': return '🥉';
      case 'silver': return '🥈';
      case 'gold': return '🥇';
      case 'platinum': return '💎';
      case 'diamond': return '💠';
      default: return '⭐';
    }
  };

  const xpProgress = (user.xp / user.nextLevelXp) * 100;

  return (
    <Card className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-32 translate-x-32" />
      
      <CardContent className="relative p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center lg:items-start mb-6 lg:mb-0">
            <div 
              className="relative group cursor-pointer"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-4xl lg:text-5xl font-bold shadow-lg">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Camera overlay */}
              <div className={`absolute inset-0 bg-black/50 rounded-full flex items-center justify-center transition-opacity ${
                isHovering ? 'opacity-100' : 'opacity-0'
              }`}>
                <Camera className="w-8 h-8 text-white" />
              </div>
              
              {/* Verification badge */}
              {user.verified && (
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Level Badge */}
            <div className="mt-4 flex items-center space-x-2">
              <Badge className={`${getLevelColor(user.level)} text-white px-3 py-1`}>
                <span className="mr-1">{getLevelIcon(user.level)}</span>
                {user.level}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {user.xp} XP
              </Badge>
            </div>

            {/* XP Progress */}
            <div className="w-full max-w-xs mt-3">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>Nível {user.level}</span>
                <span>{user.xp}/{user.nextLevelXp} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {user.nextLevelXp - user.xp} XP para próximo nível
              </p>
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                  {user.name}
                </h1>
                <p className="text-muted-foreground mb-3">
                  {user.bio}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {user.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Membro desde {formatDate(user.joinedAt)}</span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={onEditProfile}
                variant="outline" 
                className="mt-4 sm:mt-0 flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar Perfil</span>
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Trophy className="w-5 h-5 text-accent mr-2" />
                  <span className="text-2xl font-bold text-foreground">
                    {stats.wonChallenges}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Vitórias</p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-primary mr-2" />
                  <span className="text-2xl font-bold text-foreground">
                    {stats.totalChallenges}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Desafios</p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-2xl font-bold text-foreground">
                    {stats.successRate.toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
              </div>

              <div className="bg-secondary/50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-5 h-5 text-orange-500 mr-2" />
                  <span className="text-2xl font-bold text-foreground">
                    {stats.currentStreak}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">Sequência</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;

