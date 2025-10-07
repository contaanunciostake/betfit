import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function WinnersBanner({ challengeId }) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/winners`);
        const data = await response.json();

        if (data.success) {
          setWinners(data.winners.slice(0, 3)); // Top 3
        }
      } catch (error) {
        console.error('Erro ao buscar vencedores:', error);
      } finally {
        setLoading(false);
      }
    };

    if (challengeId) {
      fetchWinners();
    }
  }, [challengeId]);

  if (loading) {
    return (
      <div className="animate-pulse bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-6">
        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (winners.length === 0) return null;

  const getMedalIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className="text-yellow-500" size={32} />;
      case 2:
        return <Medal className="text-gray-400" size={28} />;
      case 3:
        return <Award className="text-amber-600" size={24} />;
      default:
        return null;
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return 'from-yellow-400 to-amber-500';
      case 2:
        return 'from-gray-300 to-gray-400';
      case 3:
        return 'from-amber-500 to-amber-600';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border-2 border-yellow-300 dark:border-yellow-700 shadow-xl overflow-hidden relative"
    >
      {/* Sparkles Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <Sparkles className="absolute top-4 right-4 text-yellow-400 animate-pulse" size={24} />
        <Sparkles className="absolute bottom-4 left-4 text-yellow-400 animate-pulse" size={20} style={{ animationDelay: '500ms' }} />
        <Sparkles className="absolute top-1/2 left-1/3 text-yellow-300 animate-pulse" size={16} style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        className="flex items-center justify-center gap-3 mb-6 relative z-10"
      >
        <Trophy className="text-yellow-500" size={32} />
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400">
          Vencedores
        </h2>
        <Trophy className="text-yellow-500" size={32} />
      </motion.div>

      {/* Winners Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {winners.map((winner, index) => {
          const position = winner.position || index + 1;

          return (
            <motion.div
              key={winner.user_id}
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                type: 'spring',
                stiffness: 150,
                delay: 0.3 + index * 0.15
              }}
              whileHover={{ scale: 1.05, rotate: position === 1 ? 2 : 0 }}
              className={`relative ${position === 1 ? 'md:col-span-3 md:order-first' : ''}`}
            >
              <div className={`
                bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border-2
                ${position === 1 ? 'border-yellow-400 dark:border-yellow-600' : ''}
                ${position === 2 ? 'border-gray-300 dark:border-gray-600' : ''}
                ${position === 3 ? 'border-amber-400 dark:border-amber-600' : ''}
                hover:shadow-2xl transition-all duration-300
              `}>
                {/* Position Badge */}
                <div className="absolute -top-4 -right-4">
                  <div className={`
                    w-12 h-12 rounded-full bg-gradient-to-br ${getPositionColor(position)}
                    flex items-center justify-center text-white font-bold text-lg shadow-lg
                  `}>
                    {position}º
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4">
                  {/* Medal Icon */}
                  <motion.div
                    animate={{
                      rotate: position === 1 ? [0, 10, -10, 0] : 0,
                      scale: position === 1 ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                      duration: 2,
                      repeat: position === 1 ? Infinity : 0,
                      repeatDelay: 1
                    }}
                  >
                    {getMedalIcon(position)}
                  </motion.div>

                  {/* Winner Info */}
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                      {winner.user_name || winner.user_email}
                    </h3>

                    {winner.performance && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {winner.performance}
                      </p>
                    )}

                    {/* Prize */}
                    {winner.prize_amount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.5 + index * 0.15 }}
                        className={`
                          inline-block px-4 py-2 rounded-full text-white font-bold
                          bg-gradient-to-r ${getPositionColor(position)}
                          shadow-lg
                        `}
                      >
                        R$ {winner.prize_amount.toFixed(2)}
                      </motion.div>
                    )}
                  </div>

                  {/* Stats */}
                  {(winner.score || winner.metric_value) && (
                    <div className="flex gap-4 text-sm">
                      {winner.score && (
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Pontuação</p>
                          <p className="font-bold text-gray-900 dark:text-white">{winner.score}</p>
                        </div>
                      )}
                      {winner.metric_value && (
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">Métrica</p>
                          <p className="font-bold text-gray-900 dark:text-white">{winner.metric_value}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Congratulations Message */}
      {winners.length > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-6 text-gray-700 dark:text-gray-300 font-semibold relative z-10"
        >
          🎉 Parabéns aos vencedores! 🎉
        </motion.p>
      )}
    </motion.div>
  );
}
