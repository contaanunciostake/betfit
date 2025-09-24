import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useSettings } from '../../contexts/SettingsContext';
import { X, Plus, Minus, Trash2, CreditCard, Loader2, CheckCircle, AlertCircle, Trophy, Star, Clock, Users, Target, Activity, Award, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, safeParseFloat } from '../../utils/formatters';

const BetSlip = ({ bets, onUpdateBet, onRemoveBet, onClearAll, onConfirm }) => {
  const { isAuthenticated, user } = useAuth();
  const { balance } = useWallet();
  const { platformFee } = useSettings();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationStatus, setConfirmationStatus] = useState('');
  const [lastConfirmationTime, setLastConfirmationTime] = useState(null);
  const [selectedStakes, setSelectedStakes] = useState({});
  const [betSlipId, setBetSlipId] = useState(null);

  // Gerar ID único para o bet slip quando houver apostas
  useEffect(() => {
    if (bets.length > 0 && !betSlipId) {
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 1000);
      const newId = `BF${timestamp.toString().slice(-6)}${randomNum.toString().padStart(3, '0')}`;
      setBetSlipId(newId);
    } else if (bets.length === 0) {
      setBetSlipId(null);
    }
  }, [bets.length, betSlipId]);

  // Atualizar selectedStakes quando o stake do bet mudar externamente
  useEffect(() => {
    const updatedStakes = {};
    bets.forEach(bet => {
      updatedStakes[bet.id] = safeParseFloat(bet.stake, 0);
    });
    setSelectedStakes(updatedStakes);
  }, [bets.map(bet => `${bet.id}-${bet.stake}`).join(',')]);

  const calculateTotal = () => {
    return bets.reduce((total, bet) => total + safeParseFloat(bet.stake, 0), 0);
  };

  const calculatePotentialReturn = () => {
    const currentPlatformFee = platformFee || 10;
    
    return bets.reduce((total, bet) => {
      const challenge = bet.challenge;
      const stakeAmount = safeParseFloat(bet.stake, 0);
      const totalPool = safeParseFloat(challenge.total_pool, 0);
      const participantCount = safeParseFloat(challenge.participant_count || challenge.participants || challenge.current_participants, 1);
      
      if (totalPool > 0) {
        const availablePool = totalPool * (1 - currentPlatformFee / 100);
        const userShare = stakeAmount / totalPool;
        const estimatedReturn = availablePool * userShare * participantCount;
        return total + Math.max(estimatedReturn, stakeAmount * 1.1);
      }
      
      let baseMultiplier = 1.8;
      if (challenge.category === 'fitness' || challenge.category === 'Fitness') {
        baseMultiplier = 1.5;
      } else if (challenge.type === 'duelo') {
        baseMultiplier = 1.9;
      } else if (challenge.type === 'battle_royale') {
        baseMultiplier = 3.0;
      }
      
      const effectiveMultiplier = baseMultiplier * (1 - currentPlatformFee / 100);
      const participantFactor = Math.min(1 + participantCount * 0.01, 2);
      const estimatedReturn = stakeAmount * effectiveMultiplier * participantFactor;
      return total + estimatedReturn;
    }, 0);
  };

  const calculatePlatformFee = () => {
    const currentPlatformFee = platformFee || 10;
    const total = calculateTotal();
    return total * (currentPlatformFee / 100);
  };

  const calculateNetAmount = () => {
    return calculateTotal() - calculatePlatformFee();
  };

  const updateStake = (betId, newStake) => {
    const bet = bets.find(b => b.id === betId);
    const minStake = safeParseFloat(bet?.challenge?.stake_min, 10);
    const maxStake = safeParseFloat(bet?.challenge?.stake_max, 1000);
    
    if (newStake < minStake) newStake = minStake;
    if (newStake > maxStake) newStake = maxStake;
    
    if (bet && newStake >= minStake) {
      onUpdateBet(betId, { stake: newStake });
      setSelectedStakes(prev => ({
        ...prev,
        [betId]: newStake
      }));
    }
  };

  const handleConfirm = async () => {
    if (isConfirming) {
      console.warn('[HANDLE_CONFIRM] - Clique ignorado, a confirmação já está em andamento.');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Erro de autenticação', {
        description: 'Você precisa estar logado para confirmar apostas',
        duration: 5000
      });
      return;
    }

    if (!user?.email) {
      toast.error('Erro de usuário', {
        description: 'Email do usuário não encontrado. Faça login novamente.',
        duration: 5000
      });
      return;
    }

    const totalAmount = calculateTotal();
    if (balance < totalAmount) {
      toast.error('Saldo insuficiente', {
        description: 'Faça um depósito para continuar com suas apostas.',
        duration: 6000,
        action: {
          label: 'Depositar',
          onClick: () => console.log('Navegar para depósito')
        }
      });
      return;
    }

    if (bets.length === 0) {
      toast.warning('Nenhuma aposta', {
        description: 'Selecione pelo menos um desafio para apostar',
        duration: 4000
      });
      return;
    }

    console.log('1. [HANDLE_CONFIRM] - Clique detectado. Configurando isConfirming para true.');
    setIsConfirming(true);
    setConfirmationStatus('Processando apostas...');

    try {
      console.log('2. [HANDLE_CONFIRM] - Chamando a função onConfirm (do contexto)...');
      
      await onConfirm();
      
      console.log('3. [HANDLE_CONFIRM] - onConfirm() (do contexto) terminou com SUCESSO.');
      
      toast.success('Apostas Confirmadas!', {
        description: `Código ${betSlipId} - Você agora está participando de ${bets.length} novo(s) desafio(s). Total investido: R$ ${totalAmount.toFixed(2)}`,
        duration: 6000,
        action: {
          label: 'Ver Meus Desafios',
          onClick: () => {
            console.log('Navegar para meus desafios');
          }
        }
      });
      
      setConfirmationStatus('Apostas confirmadas com sucesso!');
      setLastConfirmationTime(new Date());
      
    } catch (error) {
      console.error('4. [HANDLE_CONFIRM] - onConfirm() (do contexto) terminou com ERRO.');
      console.error('   - Mensagem de Erro:', error.message);
      
      toast.error('Erro ao confirmar apostas', {
        description: `${error.message}. Verifique seus dados e tente novamente.`,
        duration: 8000,
        action: {
          label: 'Tentar Novamente',
          onClick: () => handleConfirm()
        }
      });
      
      setConfirmationStatus(`Erro: ${error.message}`);
    } finally {
      console.log('5. [HANDLE_CONFIRM] - Bloco finally executado. Configurando isConfirming para false.');
      setIsConfirming(false);
      
      setTimeout(() => {
        setConfirmationStatus('');
      }, 5000);
    }
  };

  const getChallengeTypeLabel = (challenge) => {
    if (challenge.type) {
      switch (challenge.type) {
        case 'solo': return 'Solo';
        case 'duelo': return 'Duelo';
        case 'battle_royale': return 'Battle Royale';
        default: return challenge.type;
      }
    }
    
    if (challenge.category === 'fitness' || challenge.category === 'Fitness') {
      return 'Fitness';
    }
    
    return 'Desafio';
  };

  const getChallengeTypeIcon = (challenge) => {
    const category = (challenge.category || challenge.category_name || '').toLowerCase();
    
    switch (category) {
      case 'corrida':
      case 'running':
        return Activity;
      case 'ciclismo':
      case 'cycling':
        return Target;
      case 'caminhada':
      case 'steps':
      case 'walking':
        return Users;
      case 'fitness':
      case 'workouts':
        return Zap;
      case 'natação':
      case 'swimming':
        return Award;
      case 'yoga':
        return TrendingUp;
      default:
        return Trophy;
    }
  };

  const getChallengeTypeColor = (challenge) => {
    const category = (challenge.category || challenge.category_name || '').toLowerCase();
    
    switch (category) {
      case 'corrida':
      case 'running':
        return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'ciclismo':
      case 'cycling':
        return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'caminhada':
      case 'steps':
      case 'walking':
        return 'bg-purple-600/20 text-purple-400 border-purple-600/30';
      case 'fitness':
      case 'workouts':
        return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'natação':
      case 'swimming':
        return 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30';
      case 'yoga':
        return 'bg-orange-600/20 text-orange-400 border-orange-600/30';
      default:
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
    }
  };

  if (bets.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold flex items-center">
            <CreditCard className="w-4 h-4 mr-2 text-green-500" />
            SUAS APOSTAS
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-500" />
          </div>
          <h4 className="font-semibold text-white mb-2">Nenhuma aposta selecionada</h4>
          <p className="text-sm text-gray-400">
            Selecione desafios para começar a apostar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center">
          <CreditCard className="w-4 h-4 mr-2 text-green-500" />
          SUAS APOSTAS ({bets.length})
        </h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-white hover:bg-gray-600 px-2 py-1 h-7"
          >
            {isExpanded ? 'Minimizar' : 'Expandir'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1 h-7"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* STATUS DE CONFIRMAÇÃO */}
      {confirmationStatus && (
        <div className={`mx-4 mt-4 p-3 rounded-lg border ${
          confirmationStatus.includes('sucesso') 
            ? 'bg-green-600/20 border-green-600/30 text-green-400' :
          confirmationStatus.includes('Erro') 
            ? 'bg-red-600/20 border-red-600/30 text-red-400' :
          'bg-blue-600/20 border-blue-600/30 text-blue-400'
        }`}>
          <div className="flex items-center text-sm">
            {confirmationStatus.includes('sucesso') && <CheckCircle className="h-4 w-4 mr-2" />}
            {confirmationStatus.includes('Erro') && <AlertCircle className="h-4 w-4 mr-2" />}
            {!confirmationStatus.includes('sucesso') && !confirmationStatus.includes('Erro') && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <span>{confirmationStatus}</span>
          </div>
          {lastConfirmationTime && (
            <div className="text-xs text-gray-400 mt-1">
              Última confirmação: {lastConfirmationTime.toLocaleTimeString('pt-BR')}
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <>
          {/* Bet Items */}
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {bets.map((bet) => {
              const IconComponent = getChallengeTypeIcon(bet.challenge);
              const colorClasses = getChallengeTypeColor(bet.challenge);
              
              return (
                <div key={bet.id} className="bg-gray-750 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors">
                  {/* Challenge info */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-sm leading-tight">
                            {bet.challenge.title}
                          </h4>
                          <span className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full border ${colorClasses} mt-1`}>
                            {getChallengeTypeLabel(bet.challenge)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 space-y-1 bg-gray-800 rounded p-2">
                        <div className="flex justify-between">
                          <span>Meta:</span>
                          <span className="text-gray-300">{bet.challenge.target_value || 'N/A'} {bet.challenge.target_unit || 'km'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Participantes:</span>
                          <span className="text-gray-300">{bet.challenge.participant_count || bet.challenge.participants || bet.challenge.current_participants || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pool total:</span>
                          <span className="text-green-400 font-medium">R$ {(bet.challenge.total_pool || bet.challenge.pool_size || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pool disponível:</span>
                          <span className="text-green-400">R$ {((bet.challenge.total_pool || 0) * (1 - (platformFee || 10) / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveBet(bet.id)}
                      className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1 ml-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Stake controls */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Valor da Aposta:</span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStake(bet.id, Math.max(safeParseFloat(bet.stake, 0) - 5, safeParseFloat(bet.challenge.stake_min, 10)))}
                          className="p-1 h-7 w-7 hover:bg-gray-600"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">R$</span>
                          <input
                            type="number"
                            value={safeParseFloat(bet.stake, 0)}
                            onChange={(e) => {
                              const value = safeParseFloat(e.target.value, safeParseFloat(bet.challenge.stake_min, 10));
                              updateStake(bet.id, value);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="w-20 pl-6 pr-2 py-1 text-xs text-center bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-white"
                            min={safeParseFloat(bet.challenge.stake_min, 10)}
                            max={safeParseFloat(bet.challenge.stake_max, 1000)}
                            step="1"
                            placeholder={safeParseFloat(bet.challenge.stake_min, 10).toString()}
                          />
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStake(bet.id, Math.min(safeParseFloat(bet.stake, 0) + 5, safeParseFloat(bet.challenge.stake_max, 1000)))}
                          className="p-1 h-7 w-7 hover:bg-gray-600"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 flex justify-between">
                      <span>Mín: R$ {safeParseFloat(bet.challenge.stake_min, 10).toFixed(2)}</span>
                      <span>Máx: R$ {safeParseFloat(bet.challenge.stake_max, 1000).toFixed(2)}</span>
                    </div>

                    {/* Quick stake buttons */}
                    <div className="flex space-x-1">
                      {[
                        safeParseFloat(bet.challenge.stake_min, 10),
                        25, 
                        50, 
                        Math.min(100, safeParseFloat(bet.challenge.stake_max, 1000))
                      ].filter((amount, index, arr) => arr.indexOf(amount) === index).map((amount) => {
                        const currentStake = safeParseFloat(bet.stake, 0);
                        const isSelected = currentStake === amount;
                        
                        return (
                          <Button
                            key={amount}
                            variant={isSelected ? "default" : "ghost"}
                            size="sm"
                            onClick={() => updateStake(bet.id, amount)}
                            className={`text-xs px-2 py-1 h-6 transition-colors ${
                              isSelected 
                                ? 'bg-green-600 text-white hover:bg-green-700 border-green-600' 
                                : 'text-gray-400 hover:bg-gray-600 hover:text-white border-gray-600'
                            }`}
                          >
                            R$ {amount}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="px-4 pb-4">
            <div className="border-t border-gray-600 pt-4 mb-4">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Apostado:</span>
                  <span className="font-semibold text-white">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Taxa da plataforma ({platformFee || 10}%):</span>
                  <span className="font-semibold text-orange-400">
                    -{formatCurrency(calculatePlatformFee())}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Valor líquido para pool:</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(calculateNetAmount())}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Retorno Potencial:</span>
                  <span className="font-semibold text-green-400">
                    {formatCurrency(calculatePotentialReturn())}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Lucro Potencial:</span>
                  <span className="font-semibold text-blue-400">
                    {formatCurrency(calculatePotentialReturn() - calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            {/* Balance check */}
            {isAuthenticated && (
              <div className="mb-4 p-3 bg-gray-750 border border-gray-600 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Saldo disponível:</span>
                  <span className={`font-semibold ${
                    safeParseFloat(balance, 0) >= calculateTotal() ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatCurrency(balance)}
                  </span>
                </div>
                {safeParseFloat(balance, 0) < calculateTotal() && (
                  <p className="text-xs text-red-400 mt-1">
                    Saldo insuficiente para confirmar todas as apostas
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleConfirm}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
                disabled={bets.length === 0 || isConfirming || (isAuthenticated && safeParseFloat(balance, 0) < calculateTotal()) || !user?.email}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Confirmando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Confirmar Apostas
                  </>
                )}
              </Button>
              
              {isAuthenticated && safeParseFloat(balance, 0) < calculateTotal() && (
                <p className="text-xs text-red-400 text-center mt-2">
                  Saldo insuficiente. Acesse sua carteira para fazer um depósito.
                </p>
              )}

              {isAuthenticated && !user?.email && (
                <p className="text-xs text-red-400 text-center mt-2">
                  Erro: Email do usuário não encontrado. Faça login novamente.
                </p>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-gray-750/50 border border-gray-600/50 rounded-lg">
              <p className="text-xs text-gray-400 text-center">
                Jogue com responsabilidade. Apostas envolvem risco.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BetSlip;