import React from 'react';
import { Clock, Zap, Trophy, CheckCircle } from 'lucide-react';

const ChallengeStatusBadge = ({ challenge }) => {
  const now = new Date();
  const startDate = challenge.start_date ? new Date(challenge.start_date) : null;
  const endDate = challenge.end_date ? new Date(challenge.end_date) : null;
  const status = challenge.status || 'active';

  // Determinar estado
  let badgeConfig = {
    text: 'Ativo',
    icon: Zap,
    bgColor: 'bg-green-600',
    textColor: 'text-white',
    borderColor: 'border-green-500',
    animate: true
  };

  if (startDate && startDate > now) {
    // Para começar
    badgeConfig = {
      text: 'Em Breve',
      icon: Clock,
      bgColor: 'bg-blue-600',
      textColor: 'text-white',
      borderColor: 'border-blue-500',
      animate: false
    };
  } else if (status === 'completed' || status === 'finished') {
    // Finalizado
    badgeConfig = {
      text: 'Finalizado',
      icon: Trophy,
      bgColor: 'bg-purple-600',
      textColor: 'text-white',
      borderColor: 'border-purple-500',
      animate: false
    };
  } else if (endDate && endDate < now) {
    // Expirado
    badgeConfig = {
      text: 'Encerrado',
      icon: CheckCircle,
      bgColor: 'bg-gray-600',
      textColor: 'text-gray-300',
      borderColor: 'border-gray-500',
      animate: false
    };
  }

  const IconComponent = badgeConfig.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${badgeConfig.bgColor} ${badgeConfig.textColor} text-xs font-semibold border-2 ${badgeConfig.borderColor} ${badgeConfig.animate ? 'animate-pulse' : ''}`}>
      <IconComponent className="w-3 h-3 mr-1" />
      {badgeConfig.text}
    </div>
  );
};

export default ChallengeStatusBadge;
