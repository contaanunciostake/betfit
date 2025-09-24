import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWallet } from '@/contexts/WalletContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext'; // ADICIONAR
import challengeService from '@/services/challengeService';
import { 
  X, 
  Trophy, 
  Users, 
  Clock, 
  Target, 
  Zap,
  CheckCircle,
  AlertCircle,
  Activity,
  DollarSign,
  Percent,
  Loader2,
  Database
} from 'lucide-react';

const ChallengeModal = ({ challenge, isOpen, onClose, onJoin }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [stakeAmount, setStakeAmount] = useState(25);
  const [isJoining, setIsJoining] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinSuccess, setJoinSuccess] = useState(null);
  const [completionError, setCompletionError] = useState('');
  const [completionSuccess, setCompletionSuccess] = useState(null);
  const [resultValue, setResultValue] = useState(85);
  const [challengeData, setChallengeData] = useState(null);
  const [userParticipation, setUserParticipation] = useState(null);
  
  const { balance, refreshWallet } = useWallet();
  const { user, isAuthenticated } = useAuth();
  const { platformFee } = useSettings(); // USAR TAXA DINÂMICA DO BANCO

  // TAXA DA PLATAFORMA - usar valor do banco ou fallback
  const currentPlatformFee = platformFee || 10;

  // Reset states when modal opens/closes
  useEffect(() => {
    if (isOpen && challenge) {
      // Reset all states
      setJoinError(null);
      setJoinSuccess(null);
      setCompletionError('');
      setCompletionSuccess(null);
      setUserParticipation(null);
      setChallengeData(null);
      
      // Load fresh data using challengeService
      loadChallengeData();
      checkUserParticipation();
    } else if (!isOpen) {
      // Clean up when modal closes
      setActiveTab('details');
      setJoinError(null);
      setJoinSuccess(null);
      setCompletionError('');
      setCompletionSuccess(null);
    }
  }, [isOpen, challenge?.id, user?.email]);

  // LOG da taxa quando ela muda
  useEffect(() => {
    console.log('💰 [MODAL] Taxa da plataforma atualizada:', currentPlatformFee);
  }, [currentPlatformFee]);

  const loadChallengeData = async () => {
    try {
      console.log('🎮 [MODAL] Carregando dados do desafio:', challenge.id);
      
      // Usar challengeService em vez de fetch direto
      const data = await challengeService.getChallenge(challenge.id);
      
      if (data.success && data.challenge) {
        setChallengeData(data.challenge);
        setStakeAmount(data.challenge.entry_fee || 25);
        console.log('✅ [MODAL] Dados do desafio carregados:', data.challenge);
      } else {
        console.warn('⚠️ [MODAL] Usando dados do prop challenge');
        setChallengeData(challenge);
        setStakeAmount(challenge.entry_fee || 25);
      }
    } catch (error) {
      console.error('❌ [MODAL] Erro ao carregar dados do desafio:', error);
      // Fallback para dados do prop
      setChallengeData(challenge);
      setStakeAmount(challenge.entry_fee || 25);
    }
  };

  const checkUserParticipation = async () => {
    if (!isAuthenticated || !user?.email || !challenge?.id) {
      console.log('👤 [MODAL] Usuário não autenticado ou dados faltando');
      return;
    }
    
    try {
      console.log('👤 [MODAL] Verificando participação:', { 
        challengeId: challenge.id, 
        userEmail: user.email 
      });
      
      // Usar challengeService
      const result = await challengeService.getUserParticipation(challenge.id, user.email);
      
      if (result.success && result.participation) {
        setUserParticipation(result.participation);
        console.log('✅ [MODAL] Participação encontrada:', result.participation);
      } else {
        setUserParticipation(null);
        console.log('👤 [MODAL] Usuário não está participando');
      }
      
    } catch (error) {
      console.error('❌ [MODAL] Erro ao verificar participação:', error);
      setUserParticipation(null);
    }
  };

  const currentChallenge = challengeData || challenge;

  // CÁLCULO DINÂMICO DE TAXAS
  const feeInfo = React.useMemo(() => {
    const totalStake = stakeAmount || 0;
    const houseFee = totalStake * (currentPlatformFee / 100);
    const netStake = totalStake - houseFee;
    
    console.log('🧮 [MODAL] Recalculando taxas:', {
      totalStake,
      platformFee: currentPlatformFee,
      houseFee,
      netStake
    });
    
    return {
      totalStake: totalStake,
      houseFee: houseFee,
      netStake: netStake,
      platformFeePercentage: currentPlatformFee
    };
  }, [stakeAmount, currentPlatformFee]);

  // CÁLCULO DINÂMICO DO POOL DISPONÍVEL
  const calculateAvailablePool = (totalPool) => {
    return totalPool * (1 - currentPlatformFee / 100);
  };

  // CÁLCULO DINÂMICO DA TAXA DO POOL
  const calculatePoolFee = (totalPool) => {
    return totalPool * (currentPlatformFee / 100);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  };

  const formatDistance = (meters) => {
    if (!meters) return '0 km';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatTimeRemaining = (endDate) => {
    if (!endDate) return '24h 0m';
    
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end - now;
      
      if (diff <= 0) return 'Expirado';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${hours}h ${minutes}m`;
    } catch (error) {
      return '24h 0m';
    }
  };

  const handleJoinChallenge = async () => {
    if (isJoining) return;
    
    if (!isAuthenticated || !user?.email) {
      setJoinError('Você precisa estar logado para participar de desafios.');
      return;
    }
    
    setIsJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      console.log('🎮 [MODAL] Tentando participar do desafio:', {
        challengeId: currentChallenge.id,
        stakeAmount: stakeAmount,
        userEmail: user.email,
        platformFee: currentPlatformFee
      });

      // Usar challengeService (que já inclui cálculos dinâmicos)
      const result = await challengeService.joinChallenge(currentChallenge.id, stakeAmount, user.email);
      console.log('📊 [MODAL] Resultado da participação:', result);

      if (result.success) {
        setJoinSuccess(result);
        
        // Atualizar saldo
        await refreshWallet();
        
        // Aguardar um pouco antes de verificar a participação
        setTimeout(async () => {
          console.log('🔄 [MODAL] Aguardando e verificando participação novamente...');
          await checkUserParticipation();
          
          // Recarregar dados do desafio também
          await loadChallengeData();
        }, 500);
        
        // Callback para notificar componente pai
        if (onJoin) {
          onJoin(result);
        }
        
      } else {
        setJoinError(result.error || 'Erro ao participar do desafio');
      }
    } catch (error) {
      console.error('❌ [MODAL] Erro ao participar do desafio:', error);
      setJoinError(error.message || 'Erro de conexão. Tente novamente.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCompleteChallenge = async () => {
    // Verificações mais detalhadas
    if (!isAuthenticated || !user?.email) {
      setCompletionError('Você precisa estar logado para completar o desafio');
      return;
    }

    if (!userParticipation) {
      setCompletionError('Você precisa participar do desafio primeiro. Vá para a aba "Participar" e faça sua aposta.');
      return;
    }

    if (userParticipation.status === 'completed') {
      setCompletionError('Este desafio já foi completado por você');
      return;
    }

    setIsCompleting(true);
    setCompletionError('');
    setCompletionSuccess(null);

    try {
      console.log('🏆 [MODAL] Tentando completar desafio:', {
        challengeId: currentChallenge.id,
        userEmail: user.email,
        resultValue: resultValue,
        participationData: userParticipation,
        platformFee: currentPlatformFee
      });

      const resultData = {
        result_value: resultValue,
        device_type: 'teste_modal',
        is_simulation: true
      };

      // Usar challengeService (que já inclui taxa dinâmica)
      const result = await challengeService.completeChallenge(currentChallenge.id, resultData, user.email);
      console.log('🎉 [MODAL] Resultado da conclusão:', result);
      
      if (result.success) {
        setCompletionSuccess(result);
        
        // Atualizar dados
        await refreshWallet();
        await checkUserParticipation();
        await loadChallengeData();
        
        // Mostrar resultado detalhado com taxa dinâmica
        const isWinner = result.completion?.is_winner || false;
        const prizeAmount = result.completion?.prize_amount || 0;
        const newBalance = result.new_balance || balance;
        const totalPool = result.total_pool || 0;
        const houseFee = calculatePoolFee(totalPool);
        
        if (isWinner) {
          const alertMessage = `🎉 PARABÉNS! VOCÊ VENCEU!\n\n` +
            `• Score: ${resultValue}%\n` +
            `• Prêmio ganho: ${formatCurrency(prizeAmount)}\n` +
            `• Pool total: ${formatCurrency(totalPool)}\n` +
            `• Taxa da casa (${currentPlatformFee}%): ${formatCurrency(houseFee)}\n` +
            `• Pool disponível: ${formatCurrency(calculateAvailablePool(totalPool))}\n` +
            `• Seu novo saldo: ${formatCurrency(newBalance)}`;
          
          setTimeout(() => alert(alertMessage), 500);
        } else {
          const alertMessage = `Desafio completado!\n\n` +
            `• Score: ${resultValue}%\n` +
            `• Resultado: Não atingiu a meta mínima (80%)\n` +
            `• Prêmio: R$ 0,00\n` +
            `• Taxa aplicada (${currentPlatformFee}%): ${formatCurrency(houseFee)}\n` +
            `• Seu saldo atual: ${formatCurrency(newBalance)}`;
          
          setTimeout(() => alert(alertMessage), 500);
        }
        
        if (onJoin) {
          onJoin({ 
            ...result, 
            challenge_updated: true,
            new_status: result.challenge_completed ? 'completed' : currentChallenge.status
          });
        }
        
      } else {
        throw new Error(result.error || result.message || 'Erro ao completar desafio');
      }
      
    } catch (error) {
      console.error('❌ [MODAL] Erro ao completar desafio:', error);
      setCompletionError(error.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const wouldBeWinner = resultValue >= 80;

  if (!isOpen || !currentChallenge) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
        <div className="bg-background border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground">{currentChallenge.title}</h2>
              <p className="text-sm text-muted-foreground">
                {currentChallenge.category} • {currentChallenge.difficulty} • Validação automática
              </p>
              
              {/* INDICADOR DE TAXA DINÂMICA */}
              <div className="flex items-center mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Database className="h-3 w-3 mr-1 text-blue-600" />
                <span className="text-xs text-blue-600">
                  Taxa da plataforma: {currentPlatformFee}%
                </span>
              </div>
              
              {userParticipation && (
                <div className="flex items-center mt-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userParticipation.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {userParticipation.status === 'completed' ? 'Completado' : 'Participando'}
                  </div>
                  {userParticipation.stake_amount && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Stake: {formatCurrency(userParticipation.stake_amount)}
                    </span>
                  )}
                  {userParticipation.result_value && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      Score: {userParticipation.result_value}%
                    </span>
                  )}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('details')}
            >
              Detalhes
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'participate'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('participate')}
            >
              Participar
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'simulate'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('simulate')}
            >
              Simular Vitória
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Challenge Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium text-foreground">Pool Total</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {formatCurrency(currentChallenge.total_pool || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Disponível: {formatCurrency(calculateAvailablePool(currentChallenge.total_pool || 0))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-foreground">Participantes</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {currentChallenge.participants || 0}
                      {currentChallenge.max_participants && `/${currentChallenge.max_participants}`}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium text-foreground">Tempo Restante</span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {formatTimeRemaining(currentChallenge.end_date)}
                    </div>
                  </div>
                </div>

                {/* Challenge Description */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Descrição do Desafio</h3>
                  <p className="text-muted-foreground">
                    {currentChallenge.description || 'Complete este desafio fitness e ganhe prêmios incríveis!'}
                  </p>
                </div>

                {/* Challenge Rules - ATUALIZADO COM TAXA DINÂMICA */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Regras</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">
                        Meta: {currentChallenge.requirements?.distance ? 
                          formatDistance(currentChallenge.requirements.distance) : 
                          'Completar desafio'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">
                        Stake mínimo: {formatCurrency(currentChallenge.entry_fee || 0)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">
                        Tempo limite: {currentChallenge.requirements?.time_limit ? 
                          `${Math.floor(currentChallenge.requirements.time_limit / 60)} minutos` : 
                          'Sem limite'
                        }
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Percent className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground">
                        Taxa da casa: {currentPlatformFee}%
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Database className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600">
                        Pool disponível: {formatCurrency(calculateAvailablePool(currentChallenge.total_pool || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'participate' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Participar do Desafio</h3>
                
                {/* Wallet Balance */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">Saldo da Carteira</span>
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatCurrency(balance)}
                  </div>
                </div>

                {/* Stake Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Valor do Stake: {formatCurrency(stakeAmount)}
                  </label>
                  <input
                    type="range"
                    min={currentChallenge.entry_fee || 25}
                    max={Math.min(balance, 1000)}
                    step="5"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(parseInt(e.target.value))}
                    className="w-full"
                    disabled={userParticipation}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(currentChallenge.entry_fee || 25)}</span>
                    <span>{formatCurrency(Math.min(balance, 1000))}</span>
                  </div>
                </div>

                {/* Fee Breakdown - ATUALIZADO COM TAXA DINÂMICA */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground">Resumo da Taxa</h4>
                    <Database className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">Dinâmica</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stake total:</span>
                      <span className="text-foreground">{formatCurrency(feeInfo.totalStake)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa da casa ({currentPlatformFee}%):</span>
                      <span className="text-red-500">-{formatCurrency(feeInfo.houseFee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <span className="font-medium text-foreground">Stake líquido:</span>
                      <span className="font-medium text-foreground">{formatCurrency(feeInfo.netStake)}</span>
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {joinError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{joinError}</AlertDescription>
                  </Alert>
                )}

                {joinSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Participação confirmada! Stake de {formatCurrency(joinSuccess.stake_amount)} registrado.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Join Button */}
                <Button 
                  onClick={handleJoinChallenge}
                  disabled={isJoining || balance < stakeAmount || userParticipation}
                  className="w-full"
                  size="lg"
                >
                  {userParticipation ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Já Participando
                    </>
                  ) : isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Trophy className="w-4 h-4 mr-2" />
                      Entrar no Desafio - {formatCurrency(stakeAmount)}
                    </>
                  )}
                </Button>
              </div>
            )}

            {activeTab === 'simulate' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-foreground">Simular Vitória</h3>
                <p className="text-sm text-muted-foreground">
                  Use esta função para testar o sistema de prêmios. Em produção, isso seria baseado em dados reais do dispositivo.
                </p>
                
                {/* Debug Info */}
                <div className="bg-gray-100 p-3 rounded text-xs">
                  <strong>Debug:</strong> User: {user?.email || 'N/A'} | 
                  Challenge: {currentChallenge?.id || 'N/A'} | 
                  Participation: {userParticipation ? 'SIM' : 'NÃO'}
                  {userParticipation && ` (Status: ${userParticipation.status})`} |
                  Taxa: {currentPlatformFee}%
                </div>
                
                {/* User Participation Status */}
                {!userParticipation && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Você precisa participar do desafio antes de poder completá-lo. Vá para a aba "Participar" e faça sua aposta.
                    </AlertDescription>
                  </Alert>
                )}

                {userParticipation && userParticipation.status === 'completed' && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Este desafio já foi completado. Score: {userParticipation.result_value}%
                      {userParticipation.prize_amount > 0 && ` | Prêmio: ${formatCurrency(userParticipation.prize_amount)}`}
                    </AlertDescription>
                  </Alert>
                )}
                
                {/* Result Value Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Score de Performance: {resultValue}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={resultValue}
                    onChange={(e) => setResultValue(parseInt(e.target.value))}
                    className="w-full"
                    disabled={!userParticipation || userParticipation.status === 'completed'}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0% (Falhou)</span>
                    <span>80% (Meta mínima)</span>
                    <span>100% (Perfeito)</span>
                  </div>
                </div>

                {/* Result Prediction */}
                <div className={`p-3 rounded-lg border ${
                  wouldBeWinner ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-2">
                    {wouldBeWinner ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      wouldBeWinner ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {wouldBeWinner ? 'Você seria VITORIOSO!' : 'Você não alcançaria a meta (precisa >= 80%)'}
                    </span>
                  </div>
                </div>

                {/* Prize Calculation - ATUALIZADO COM TAXA DINÂMICA */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-foreground">Cálculo do Prêmio</h4>
                    <Database className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600">Dinâmico</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Score:</span>
                      <span className="text-foreground">{resultValue}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pool total:</span>
                      <span className="text-foreground">{formatCurrency(currentChallenge.total_pool || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa da casa ({currentPlatformFee}%):</span>
                      <span className="text-red-500">-{formatCurrency(calculatePoolFee(currentChallenge.total_pool || 0))}</span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-1">
                      <span className="font-medium text-foreground">Prêmio estimado:</span>
                      <span className={`font-medium ${wouldBeWinner ? 'text-green-500' : 'text-red-500'}`}>
                        {wouldBeWinner ? 
                          formatCurrency(calculateAvailablePool(currentChallenge.total_pool || 0)) :
                          'R$ 0,00'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {completionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{completionError}</AlertDescription>
                  </Alert>
                )}

                {completionSuccess && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {completionSuccess.completion?.is_winner 
                        ? `Parabéns! Você ganhou ${formatCurrency(completionSuccess.completion.prize_amount)}!`
                        : 'Desafio completado, mas você não atingiu a meta mínima.'
                      }
                    </AlertDescription>
                  </Alert>
                )}

                {/* Complete Button */}
                <Button 
                  onClick={handleCompleteChallenge}
                  disabled={isCompleting || !userParticipation || userParticipation.status === 'completed'}
                  className="w-full"
                  size="lg"
                  variant={wouldBeWinner ? "default" : "outline"}
                >
                  {isCompleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Simular Conclusão do Desafio
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChallengeModal;