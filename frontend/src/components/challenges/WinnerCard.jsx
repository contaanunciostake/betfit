import React from 'react';
import { Trophy, Award, TrendingUp, Clock } from 'lucide-react';

const WinnerCard = ({ winner, challenge }) => {
  return (
    <div className="bg-gradient-to-r from-purple-900/50 to-yellow-900/50 border-2 border-yellow-500 rounded-lg p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-yellow-400 text-xl font-bold flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Vencedor
            </h3>
            <p className="text-white font-medium">{winner.user_name || winner.user_id}</p>
          </div>
        </div>
      </div>

      {/* Premio */}
      <div className="bg-black/30 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Prêmio Conquistado</p>
            <p className="text-yellow-400 text-3xl font-bold">
              R$ {(winner.prize_amount || 0).toFixed(2)}
            </p>
          </div>
          <TrendingUp className="w-12 h-12 text-yellow-400" />
        </div>
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-black/20 rounded p-3">
          <p className="text-gray-400 mb-1">Desafio</p>
          <p className="text-white font-medium truncate">{challenge.title}</p>
        </div>
        <div className="bg-black/20 rounded p-3">
          <p className="text-gray-400 mb-1">Concluído em</p>
          <p className="text-white font-medium flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {winner.completed_at ? new Date(winner.completed_at).toLocaleDateString('pt-BR') : 'N/A'}
          </p>
        </div>
      </div>

      {/* Performance (se disponível) */}
      {winner.performance && (
        <div className="mt-4 bg-black/20 rounded p-3">
          <p className="text-gray-400 text-sm mb-2">Performance</p>
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">{winner.performance.value} {winner.performance.unit}</span>
            <span className="text-green-400 text-sm">Meta: {challenge.goal_value}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-green-500 to-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((winner.performance.value / challenge.goal_value) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WinnerCard;
