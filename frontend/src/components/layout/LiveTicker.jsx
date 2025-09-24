import { useState, useEffect } from 'react';
import { useChallenges } from '../../contexts/ChallengeContext';
import { Trophy, TrendingUp, Users, Zap, Activity } from 'lucide-react';

const LiveTicker = () => {
  const { globalActivity } = useChallenges();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Fallback activities if no real data
  const fallbackActivities = [
    {
      id: 1,
      type: 'win',
      user: 'Maria Silva',
      amount: 150.00,
      challenge: 'Corrida 5km',
      icon: Trophy,
      color: 'text-accent'
    },
    {
      id: 2,
      type: 'join',
      user: 'João Santos',
      amount: 25.00,
      challenge: 'Battle Royale Steps',
      icon: Users,
      color: 'text-primary'
    },
    {
      id: 3,
      type: 'complete',
      user: 'Ana Costa',
      amount: 75.50,
      challenge: 'Duelo Ciclismo',
      icon: Zap,
      color: 'text-blue-400'
    },
    {
      id: 4,
      type: 'trending',
      user: 'Carlos Lima',
      amount: 200.00,
      challenge: 'Desafio 10k Steps',
      icon: TrendingUp,
      color: 'text-green-400'
    },
    {
      id: 5,
      type: 'win',
      user: 'Fernanda Oliveira',
      amount: 89.90,
      challenge: 'Treino HIIT 30min',
      icon: Trophy,
      color: 'text-accent'
    }
  ];

  // Process real activity data
  const processedActivities = globalActivity.length > 0 
    ? globalActivity.map(activity => ({
        id: activity.id,
        type: activity.type || 'activity',
        user: activity.user_name || 'Usuário',
        amount: activity.amount || 0,
        challenge: activity.challenge_name || 'Desafio',
        timestamp: activity.created_at,
        icon: getIconForActivityType(activity.type),
        color: getColorForActivityType(activity.type)
      }))
    : fallbackActivities;

  // Auto-scroll through activities
  useEffect(() => {
    if (processedActivities.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % processedActivities.length);
    }, 4000); // Slower for better readability

    return () => clearInterval(interval);
  }, [processedActivities.length]);

  // Reset index when activities change
  useEffect(() => {
    setCurrentIndex(0);
  }, [globalActivity]);

  function getIconForActivityType(type) {
    switch (type) {
      case 'win':
      case 'payout':
        return Trophy;
      case 'join':
      case 'participation':
        return Users;
      case 'complete':
      case 'submission':
        return Zap;
      case 'trending':
      case 'popular':
        return TrendingUp;
      default:
        return Activity;
    }
  }

  function getColorForActivityType(type) {
    switch (type) {
      case 'win':
      case 'payout':
        return 'text-accent';
      case 'join':
      case 'participation':
        return 'text-primary';
      case 'complete':
      case 'submission':
        return 'text-blue-400';
      case 'trending':
      case 'popular':
        return 'text-green-400';
      default:
        return 'text-muted-foreground';
    }
  }

  const formatMessage = (activity) => {
    const amount = activity.amount ? `R$ ${activity.amount.toFixed(2)}` : '';
    
    switch (activity.type) {
      case 'win':
      case 'payout':
        return `🏆 ${activity.user} ganhou ${amount} no ${activity.challenge}`;
      case 'join':
      case 'participation':
        return `🚀 ${activity.user} entrou no ${activity.challenge}${amount ? ` com ${amount}` : ''}`;
      case 'complete':
      case 'submission':
        return `⚡ ${activity.user} completou ${activity.challenge}${amount ? ` e ganhou ${amount}` : ''}`;
      case 'trending':
      case 'popular':
        return `📈 ${activity.challenge} está em alta!${activity.user ? ` ${activity.user}` : ''}${amount ? ` ganhou ${amount}` : ''}`;
      default:
        return `${activity.user} - ${activity.challenge}${amount ? ` (${amount})` : ''}`;
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  if (processedActivities.length === 0) {
    return null; // Don't render if no activities
  }

  return (
    <div className="betfit-live-ticker">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-4 h-10">
          {/* Live indicator */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-2 h-2 bg-destructive rounded-full pulse-green"></div>
            <span className="text-sm font-semibold text-foreground">AO VIVO</span>
          </div>

          {/* Scrolling content */}
          <div className="flex-1 overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {processedActivities.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div
                    key={`${activity.id}-${index}`}
                    className="flex-shrink-0 w-full flex items-center space-x-3"
                  >
                    <IconComponent className={`w-4 h-4 ${activity.color}`} />
                    <span className="text-sm text-muted-foreground flex-1">
                      {formatMessage(activity)}
                    </span>
                    {activity.timestamp && (
                      <span className="text-xs text-muted-foreground/60 flex-shrink-0">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {processedActivities.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
                aria-label={`Ver atividade ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;

