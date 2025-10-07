import React from 'react';
import { TrendingUp, Target } from 'lucide-react';

/**
 * Componente de barra de progresso para desafios
 * @param {Object} props
 * @param {number} props.current - Valor atual do progresso
 * @param {number} props.target - Valor alvo/meta
 * @param {string} props.unit - Unidade de medida (km, passos, min, kcal)
 * @param {string} props.size - Tamanho da barra ('sm', 'md', 'lg')
 * @param {boolean} props.showLabel - Mostrar rótulo com valores
 */
const ProgressBar = ({
  current = 0,
  target = 100,
  unit = '',
  size = 'md',
  showLabel = true
}) => {
  // Calcular porcentagem
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const percentageRounded = Math.round(percentage);

  // Determinar cor baseado no progresso
  const getColorClass = () => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColorClass = () => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Tamanhos da barra
  const heightClass = {
    'sm': 'h-1',
    'md': 'h-2',
    'lg': 'h-3'
  }[size] || 'h-2';

  const textSizeClass = {
    'sm': 'text-[10px]',
    'md': 'text-xs',
    'lg': 'text-sm'
  }[size] || 'text-xs';

  return (
    <div className="w-full">
      {/* Label com valores */}
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-1">
            <TrendingUp className={`w-3 h-3 ${getTextColorClass()}`} />
            <span className={`${textSizeClass} ${getTextColorClass()} font-medium`}>
              {current.toFixed(1)}{unit} / {target}{unit}
            </span>
          </div>
          <div className={`${textSizeClass} ${getTextColorClass()} font-bold`}>
            {percentageRounded}%
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      <div className="w-full bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`${heightClass} ${getColorClass()} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        >
          {/* Animação de brilho */}
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer"></div>
        </div>
      </div>

      {/* Status textual (opcional) */}
      {percentage >= 100 && (
        <div className="flex items-center justify-center mt-1">
          <Target className="w-3 h-3 text-green-400 mr-1" />
          <span className={`${textSizeClass} text-green-400 font-medium`}>
            Meta atingida!
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
