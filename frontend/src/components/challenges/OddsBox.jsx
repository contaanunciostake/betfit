import { Clock, Users, Target, Zap, Trophy, Bike, Footprints, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const OddsBox = ({ challenge = {}, onJoin, onChallengeClick, isUserParticipating = false }) => {
  // Safe defaults for challenge data
  const safeChallenge = {
    title: challenge?.title || 'Desafio',
    type: challenge?.type || 'solo',
    category: challenge?.category || 'running',
    start_at: challenge?.start_at || challenge?.start_date || new Date().toISOString(),
    end_at: challenge?.end_date || null, // Manter como null se não houver data de término
    target_value: challenge?.target_value || 0,
    target_unit: challenge?.target_unit || challenge?.target_metric || 'km',
    stake_min: typeof challenge?.stake_min === 'number' ? challenge.stake_min : (challenge?.entry_fee || 0),
    participant_count: challenge?.participant_count || challenge?.current_participants || 0,
    total_pool: typeof challenge?.total_pool === 'number' ? challenge.total_pool : 0,
    max_participants: challenge?.max_participants || null,
    validation_method: challenge?.validation_method || 'Strava',
    required_app_category: challenge?.required_app_category || null,
  };

  // Verificar se o desafio está lotado
  const isFull = safeChallenge.max_participants && 
                 safeChallenge.participant_count >= safeChallenge.max_participants;

  const getCategoryIcon = (category) => {
    const icons = {
      running: Footprints,
      cycling: Bike,
      steps: Target,
      workouts: Zap,
      calories: Trophy,
      walking: Footprints, // Adicionado para cobrir mais casos
      mind: Trophy // Adicionado para cobrir mais casos
    };
    return icons[category] || Target;
  };

  // Função para traduzir a categoria do app em um nome amigável
  const getRequiredAppName = (category) => {
    const names = {
      running: 'App de Corrida',
      steps: 'App de Passos',
      workouts: 'App de Treino',
      cycling: 'App de Ciclismo',
      walking: 'App de Passos'
    };
    return names[category] || `App de ${category}`;
  };

  const getTypeColor = (type) => {
    const colors = {
      solo: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      duel: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      battle: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };
    return colors[type] || colors.solo;
  };

  const getTypeLabel = (type) => {
    const labels = {
      solo: 'Solo',
      duel: 'Duelo',
      battle: 'Battle Royale'
    };
    return labels[type] || type;
  };

  const formatTimeRemaining = (endTime) => {
    if (!endTime) return 'Indefinido';
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Finalizado';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };

  const IconComponent = getCategoryIcon(safeChallenge.category);

  // Determinar o estilo da borda baseado no status
  const getBorderStyle = () => {
    if (isUserParticipating) {
      return 'border-green-500/50 bg-green-500/5'; // Verde quando participando
    }
    if (isFull) {
      return 'border-red-500/50 bg-red-500/5'; // Vermelho quando lotado
    }
    return 'border-border'; // Padrão
  };

  return (
    <div 
      className={`betfit-odds-box group cursor-pointer ${getBorderStyle()}`}
      onClick={() => onChallengeClick && onChallengeClick(challenge)}
    >
      {/* Badge de status no canto superior direito */}
      {(isUserParticipating || isFull) && (
        <div className="absolute top-2 right-2 z-10">
          {isUserParticipating && (
            <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <CheckCircle className="w-3 h-3" />
              <span>Participando</span>
            </div>
          )}
          {isFull && !isUserParticipating && (
            <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Lotado
            </div>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${
            isUserParticipating ? 'bg-green-500/20' : 'bg-primary/20'
          }`}>
            <IconComponent className={`w-5 h-5 ${
              isUserParticipating ? 'text-green-500' : 'text-primary'
            }`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm leading-tight">
              {safeChallenge.title}
            </h3>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(safeChallenge.type)}`}>
              {getTypeLabel(safeChallenge.type)}
            </div>
          </div>
        </div>
        
        {/* Time remaining */}
        <div className="text-right">
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{formatTimeRemaining(safeChallenge.end_at)}</span>
          </div>
        </div>
      </div>

      {/* Status message quando participando */}
      {isUserParticipating && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-green-600">
            <Trophy className="w-4 h-4" />
            <span className="text-sm font-medium">Você está participando deste desafio</span>
          </div>
        </div>
      )}

      {/* Status message quando lotado */}
      {isFull && !isUserParticipating && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center space-x-2 text-red-600">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Desafio lotado</span>
          </div>
        </div>
      )}

      {/* Challenge details */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Meta:</span>
          <span className="font-semibold text-foreground">
            {safeChallenge.target_value} {safeChallenge.target_unit}
          </span>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Stake mínimo:</span>
          <span className="font-semibold text-accent">
            R$ {safeChallenge.stake_min.toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1 text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{safeChallenge.participant_count} participantes</span>
          </div>
          <div className="text-right">
            <div className="font-semibold text-primary">
              Pool: R$ {(safeChallenge.available_pool || safeChallenge.total_pool * 0.9 || 0).toFixed(2)}
            </div>
            {safeChallenge.total_pool > 0 && (
              <div className="text-xs text-muted-foreground">
                Total: R$ {safeChallenge.total_pool.toFixed(2)} (-10% taxa)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {safeChallenge.max_participants && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Participantes</span>
            <span>{safeChallenge.participant_count}/{safeChallenge.max_participants}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isFull ? 'bg-red-500' : 
                isUserParticipating ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ 
                width: `${Math.min((safeChallenge.participant_count / safeChallenge.max_participants) * 100, 100)}%` 
              }}
            />
          </div>
        </div>
      )}

      {/* Action button */}
      <Button 
        onClick={(e) => {
          e.stopPropagation();
          if (!isUserParticipating && !isFull) {
            onJoin(challenge);
          }
        }}
        className={`w-full group-hover:shadow-lg ${
          isUserParticipating 
            ? 'bg-gray-500 hover:bg-gray-500 cursor-not-allowed' 
            : isFull
            ? 'bg-red-500 hover:bg-red-500 cursor-not-allowed'
            : 'betfit-button-primary'
        }`}
        size="sm"
        disabled={isUserParticipating || isFull}
      >
        {isUserParticipating 
          ? 'Já está participando' 
          : isFull 
          ? 'Desafio lotado'
          : 'Entrar no Desafio'
        }
      </Button>

      {/* Validation method and App Requirement indicators */}
      <div className="mt-3 flex items-center justify-center space-x-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Zap className="w-3 h-3 text-accent" />
          <span>Validação automática</span>
        </div>
        
        {/* =================================================================== */}
        {/* <<< NOVO BLOCO ADICIONADO AQUI >>> */}
        {/* Ele só aparece se required_app_category tiver um valor */}
        {safeChallenge.required_app_category && (
          <div className="flex items-center space-x-1 font-semibold">
            <Smartphone className="w-3 h-3 text-primary" />
            <span className="text-primary">{getRequiredAppName(safeChallenge.required_app_category)}</span>
          </div>
        )}
        {/* =================================================================== */}
        
      </div>
    </div>
  );
};

export default OddsBox;
