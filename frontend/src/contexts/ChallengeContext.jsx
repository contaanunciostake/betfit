import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'sonner'; // <<< NOVA IMPORTAÇÃO ADICIONADA
import challengeService from '../services/challengeService';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  challenges: [],
  userParticipations: [],
  betSlip: [],
  isLoading: false,
  error: null,
  filters: {
    category: 'all',
    sortBy: 'popular',
    status: 'active',
  },
  categories: [],
  globalActivity: [],
};

// Action types
const CHALLENGE_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_CHALLENGES: 'SET_CHALLENGES',
  ADD_CHALLENGE: 'ADD_CHALLENGE',
  UPDATE_CHALLENGE: 'UPDATE_CHALLENGE',
  SET_USER_PARTICIPATIONS: 'SET_USER_PARTICIPATIONS',
  ADD_PARTICIPATION: 'ADD_PARTICIPATION',
  UPDATE_PARTICIPATION: 'UPDATE_PARTICIPATION',
  SET_BET_SLIP: 'SET_BET_SLIP',
  ADD_TO_BET_SLIP: 'ADD_TO_BET_SLIP',
  REMOVE_FROM_BET_SLIP: 'REMOVE_FROM_BET_SLIP',
  UPDATE_BET_SLIP_ITEM: 'UPDATE_BET_SLIP_ITEM',
  CLEAR_BET_SLIP: 'CLEAR_BET_SLIP',
  SET_FILTERS: 'SET_FILTERS',
  SET_CATEGORIES: 'SET_CATEGORIES',
  SET_GLOBAL_ACTIVITY: 'SET_GLOBAL_ACTIVITY',
  ADD_ACTIVITY: 'ADD_ACTIVITY',
  RESET_CHALLENGES: 'RESET_CHALLENGES',
};

// Reducer function
function challengeReducer(state, action) {
  switch (action.type) {
    case CHALLENGE_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case CHALLENGE_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case CHALLENGE_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case CHALLENGE_ACTIONS.SET_CHALLENGES:
      return {
        ...state,
        challenges: action.payload,
      };

    case CHALLENGE_ACTIONS.ADD_CHALLENGE:
      return {
        ...state,
        challenges: [action.payload, ...state.challenges],
      };

    case CHALLENGE_ACTIONS.UPDATE_CHALLENGE:
      return {
        ...state,
        challenges: state.challenges.map(challenge =>
          challenge.id === action.payload.id 
            ? { ...challenge, ...action.payload } 
            : challenge
        ),
      };

    case CHALLENGE_ACTIONS.SET_USER_PARTICIPATIONS:
      return {
        ...state,
        userParticipations: action.payload,
      };

    case CHALLENGE_ACTIONS.ADD_PARTICIPATION:
      return {
        ...state,
        userParticipations: [action.payload, ...state.userParticipations],
      };

    case CHALLENGE_ACTIONS.UPDATE_PARTICIPATION:
      return {
        ...state,
        userParticipations: state.userParticipations.map(participation =>
          participation.id === action.payload.id 
            ? { ...participation, ...action.payload } 
            : participation
        ),
      };

    case CHALLENGE_ACTIONS.SET_BET_SLIP:
      return {
        ...state,
        betSlip: action.payload,
      };

    case CHALLENGE_ACTIONS.ADD_TO_BET_SLIP:
      // Check if challenge is already in bet slip
      const existingIndex = state.betSlip.findIndex(
        item => item.challenge.id === action.payload.challenge.id
      );
      
      if (existingIndex >= 0) {
        return state; // Don't add duplicates
      }
      
      return {
        ...state,
        betSlip: [...state.betSlip, action.payload],
      };

    case CHALLENGE_ACTIONS.REMOVE_FROM_BET_SLIP:
      return {
        ...state,
        betSlip: state.betSlip.filter(item => item.id !== action.payload),
      };

    case CHALLENGE_ACTIONS.UPDATE_BET_SLIP_ITEM:
      return {
        ...state,
        betSlip: state.betSlip.map(item =>
          item.id === action.payload.id 
            ? { ...item, ...action.payload } 
            : item
        ),
      };

    case CHALLENGE_ACTIONS.CLEAR_BET_SLIP:
      return {
        ...state,
        betSlip: [],
      };

    case CHALLENGE_ACTIONS.SET_FILTERS:
      return {
        ...state,
        filters: { ...state.filters, ...action.payload },
      };

    case CHALLENGE_ACTIONS.SET_CATEGORIES:
      return {
        ...state,
        categories: action.payload,
      };

    case CHALLENGE_ACTIONS.SET_GLOBAL_ACTIVITY:
      return {
        ...state,
        globalActivity: action.payload,
      };

    case CHALLENGE_ACTIONS.ADD_ACTIVITY:
      return {
        ...state,
        globalActivity: [action.payload, ...state.globalActivity.slice(0, 19)],
      };

    case CHALLENGE_ACTIONS.RESET_CHALLENGES:
      return initialState;

    default:
      return state;
  }
}

// Create context
const ChallengeContext = createContext();

// Provider component
export function ChallengeProvider({ children }) {
  const [state, dispatch] = useReducer(challengeReducer, initialState);
  const { isAuthenticated, user } = useAuth();

  // FUNCAO CORRIGIDA: Load user participations - VERSÃO HÍBRIDA QUE FUNCIONA
  const loadUserParticipations = async (userEmail) => {
    if (!userEmail) {
      console.log('👤 [CONTEXT] Sem email do usuário, não carregando participações');
      return;
    }
    
    try {
      // <<< LOG 1: VERIFICA SE A FUNÇÃO É CHAMADA >>>
      console.log(`1. [CONTEXT] INICIANDO busca de participações para: ${userEmail}`);
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://betfit-backend.onrender.com';
      const response = await fetch(`${API_BASE_URL}/api/challenges/my-participations?user_email=${userEmail}`);
      const data = await response.json();
      
      // <<< LOG 2: VERIFICA O QUE A API RETORNOU >>>
      console.log("2. [CONTEXT] API /my-participations RESPONDEU COM:", data);
      
      // CORREÇÃO HÍBRIDA: Tenta ambos os formatos
      if (data && data.active_participations) {
        // Formato novo do backend SQLite
        const participations = data.active_participations;
        dispatch({ 
          type: CHALLENGE_ACTIONS.SET_USER_PARTICIPATIONS, 
          payload: participations 
        });
        console.log(`✅ [CONTEXT] ${participations.length} participações ativas carregadas (formato novo)!`);
        console.log(`📋 [CONTEXT] Detalhes:`, participations);
      } else if (data.success && data.participations) {
        // Formato antigo
        dispatch({ 
          type: CHALLENGE_ACTIONS.SET_USER_PARTICIPATIONS, 
          payload: data.participations 
        });
        console.log(`✅ [CONTEXT] ${data.participations.length} participações carregadas (formato antigo)!`);
      } else {
        console.log('⚠️ [CONTEXT] Nenhuma participação encontrada ou erro na resposta');
        dispatch({ type: CHALLENGE_ACTIONS.SET_USER_PARTICIPATIONS, payload: [] });
      }
    } catch (error) {
      console.error('❌ [CONTEXT] Erro ao buscar participações do usuário:', error);
      dispatch({ type: CHALLENGE_ACTIONS.SET_USER_PARTICIPATIONS, payload: [] });
    }
  };

  // Load challenges when component mounts or filters change
  useEffect(() => {
    loadChallenges();
    
    // Set up real-time sync for pools (more frequent)
    challengeService.startAutoSync(10000); // Every 10 seconds for pool updates
    
    // Listen for challenge updates
    const unsubscribe = challengeService.addListener((event, data) => {
      if (event === 'challenges_updated') {
        dispatch({ type: CHALLENGE_ACTIONS.SET_CHALLENGES, payload: data });
      } else if (event === 'pool_updated') {
        // Update specific challenge pool
        dispatch({ type: CHALLENGE_ACTIONS.UPDATE_CHALLENGE, payload: data });
      } else if (event === 'challenge_joined') {
        // Recarregar participações quando usuário participar de desafio
        console.log('🎮 Usuário participou de desafio, recarregando participações...');
        if (user?.email) {
          loadUserParticipations(user.email);
        }
      }
    });
    
    return () => {
      challengeService.stopAutoSync();
      unsubscribe();
    };
  }, [state.filters]);

  // CORRECAO: Load user participations when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      console.log(`🔐 [CONTEXT] Usuário autenticado: ${user.email}, carregando participações...`);
      loadUserParticipations(user.email);
    } else {
      console.log('👤 [CONTEXT] Usuário não autenticado, limpando participações...');
      dispatch({ type: CHALLENGE_ACTIONS.SET_USER_PARTICIPATIONS, payload: [] });
    }
  }, [isAuthenticated, user?.email]);

  // Load global activity with real-time updates
  useEffect(() => {
    loadGlobalActivity();
    
    // Set up polling for real-time updates
    const interval = setInterval(loadGlobalActivity, 20000); // Every 20 seconds
    
    return () => clearInterval(interval);
  }, []);

  // MANTÉM A FUNÇÃO ORIGINAL QUE NÃO DÁ ERRO
  const loadChallenges = async (forceRefresh = false) => {
    try {
      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: true });
      
      let challengesData;
      if (forceRefresh) {
        challengesData = await challengeService.forceRefresh(state.filters);
      } else {
        challengesData = await challengeService.getChallenges(state.filters);
      }
      
      dispatch({ type: CHALLENGE_ACTIONS.SET_CHALLENGES, payload: challengesData.challenges });
      
    } catch (error) {
      dispatch({ type: CHALLENGE_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Force refresh challenges from server
  const refreshChallenges = async () => {
    console.log('🔄 Atualizando desafios e participações...');
    await loadChallenges(true);
    // Também recarregar participações quando atualizar desafios
    if (isAuthenticated && user?.email) {
      await loadUserParticipations(user.email);
    }
  };

  // Load global activity
  const loadGlobalActivity = async () => {
    try {
      const activityData = await challengeService.getGlobalActivity(20);
      dispatch({ 
        type: CHALLENGE_ACTIONS.SET_GLOBAL_ACTIVITY, 
        payload: activityData.activities 
      });
    } catch (error) {
      console.warn('Failed to load global activity:', error);
    }
  };

  // Join challenge
  const joinChallenge = async (challengeId, stakeAmount) => {
    try {
      if (!isAuthenticated || !user?.email) {
        throw new Error('Usuário não autenticado');
      }

      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: true });
      
      console.log(`🎮 Usuário ${user.email} participando do desafio ${challengeId} com aposta R$ ${stakeAmount}...`);
      
      const participation = await challengeService.joinChallenge(challengeId, stakeAmount, user.email);
      
      if (participation.success) {
        console.log('✅ Participação registrada com sucesso!');
        
        // Update challenge participant count
        const updatedChallenge = {
          id: challengeId,
          participant_count: (state.challenges.find(c => c.id === challengeId)?.participant_count || 0) + 1,
          total_pool: (state.challenges.find(c => c.id === challengeId)?.total_pool || 0) + stakeAmount,
        };
        
        dispatch({ type: CHALLENGE_ACTIONS.UPDATE_CHALLENGE, payload: updatedChallenge });
        
        // Recarregar participações do usuário após participar
        await loadUserParticipations(user.email);
        
        return participation;
      } else {
        throw new Error(participation.error || 'Erro ao participar do desafio');
      }
    } catch (error) {
      console.error('❌ Erro ao participar do desafio:', error);
      dispatch({ type: CHALLENGE_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Submit result
  const submitResult = async (challengeId, resultData) => {
    try {
      if (!isAuthenticated || !user?.email) {
        throw new Error('Usuário não autenticado');
      }

      const submission = await challengeService.submitResult(challengeId, resultData, user.email);
      
      // Update participation status
      const updatedParticipation = {
        id: submission.participant_id,
        status: 'completed',
        result_value: resultData.result_value,
        submitted_at: new Date().toISOString(),
      };
      
      dispatch({ type: CHALLENGE_ACTIONS.UPDATE_PARTICIPATION, payload: updatedParticipation });
      
      return submission;
    } catch (error) {
      dispatch({ type: CHALLENGE_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  };

  // Add to bet slip
  const addToBetSlip = (challenge) => {
    const betSlipItem = {
      id: Date.now(), // Temporary ID
      challenge,
      stake: challenge.stake_min,
    };
    
    dispatch({ type: CHALLENGE_ACTIONS.ADD_TO_BET_SLIP, payload: betSlipItem });
  };

  // Remove from bet slip
  const removeFromBetSlip = (itemId) => {
    dispatch({ type: CHALLENGE_ACTIONS.REMOVE_FROM_BET_SLIP, payload: itemId });
  };

  // Update bet slip item
  const updateBetSlipItem = (itemId, updates) => {
    dispatch({ 
      type: CHALLENGE_ACTIONS.UPDATE_BET_SLIP_ITEM, 
      payload: { id: itemId, ...updates } 
    });
  };

  // Clear bet slip
  const clearBetSlip = () => {
    dispatch({ type: CHALLENGE_ACTIONS.CLEAR_BET_SLIP });
  };

  // FUNÇÃO CORRIGIDA COM TOAST: Confirm bets (join multiple challenges)
  const confirmBets = async () => {
    if (!isAuthenticated || !user?.email) {
      toast.error("Usuário não autenticado", { description: "Por favor, faça login." });
      return;
    }
    if (state.betSlip.length === 0) return;
    
    dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: true });
    const toastId = toast.loading(`Confirmando ${state.betSlip.length} aposta(s)...`);
    
    try {
      // Cria uma promessa para cada aposta
      const betPromises = state.betSlip.map(bet => 
        challengeService.joinChallenge(bet.challenge.id, bet.stake, user.email)
      );
      
      // Espera todas as apostas serem processadas
      const results = await Promise.all(betPromises);
      
      // Verifica se alguma delas retornou um erro
      const firstError = results.find(res => !res.success);
      if (firstError) {
        throw new Error(firstError.error || "Uma das apostas falhou.");
      }
      
      // Se todas foram bem-sucedidas:
      toast.success("Apostas confirmadas com sucesso!", {
        id: toastId,
        description: `Você agora está participando de ${results.length} novo(s) desafio(s).`,
      });
      
      dispatch({ type: CHALLENGE_ACTIONS.CLEAR_BET_SLIP });
      
      // A CORREÇÃO CRUCIAL ESTÁ AQUI
      console.log('🔄 [CONTEXT] Recarregando participações do usuário após aposta...');
      await loadUserParticipations(user.email);
      
    } catch (error) {
      // Se qualquer promessa falhar, o erro será pego aqui
      toast.error("Falha ao confirmar apostas", {
        id: toastId,
        description: error.message,
      });
      dispatch({ type: CHALLENGE_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    dispatch({ type: CHALLENGE_ACTIONS.SET_FILTERS, payload: newFilters });
  };

  // Search challenges
  const searchChallenges = async (query) => {
    try {
      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: true });
      
      const searchResults = await challengeService.searchChallenges(query, state.filters);
      
      dispatch({ type: CHALLENGE_ACTIONS.SET_CHALLENGES, payload: searchResults.challenges });
      
    } catch (error) {
      dispatch({ type: CHALLENGE_ACTIONS.SET_ERROR, payload: error.message });
    } finally {
      dispatch({ type: CHALLENGE_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: CHALLENGE_ACTIONS.CLEAR_ERROR });
  };

  // FUNÇÕES PARA SLIDESHOW DE DESAFIOS ATIVOS

  // Verificar se usuário está participando de um desafio
  const isUserParticipating = (challengeId) => {
    return state.userParticipations.some(
      participation => participation.challenge_id === challengeId || participation.id === challengeId
    );
  };

  // Obter participação específica do usuário
  const getUserParticipation = (challengeId) => {
    return state.userParticipations.find(
      participation => participation.challenge_id === challengeId || participation.id === challengeId
    );
  };

  // Obter total de participações ativas
  const getTotalActiveParticipations = () => {
    return state.userParticipations.filter(
      participation => participation.status === 'active'
    ).length;
  };

  // Verificar se usuário tem participações ativas
  const hasActiveParticipations = () => {
    return getTotalActiveParticipations() > 0;
  };

  // Obter nomes dos desafios ativos para o slideshow
  const getActiveChallengeNames = () => {
    const activeParticipations = state.userParticipations.filter(
      participation => participation.status === 'active'
    );
    
    return activeParticipations.map(p => p.title).join(' • ');
  };

  // NOVA FUNÇÃO: Debug do usuário atual
  const debugCurrentUser = () => {
    console.log('🔍 DEBUG - Estado atual do usuário:');
    console.log('   - isAuthenticated:', isAuthenticated);
    console.log('   - user:', user);
    console.log('   - user.email:', user?.email);
    console.log('   - userParticipations.length:', state.userParticipations.length);
    return user?.email;
  };

  // Context value
  const value = {
    ...state,
    loadChallenges,
    refreshChallenges,
    loadUserParticipations,
    joinChallenge,
    submitResult,
    addToBetSlip,
    removeFromBetSlip,
    updateBetSlipItem,
    clearBetSlip,
    confirmBets,
    updateFilters,
    searchChallenges,
    clearError,
    // FUNÇÕES PARA SLIDESHOW
    isUserParticipating,
    getUserParticipation,
    getTotalActiveParticipations,
    hasActiveParticipations,
    getActiveChallengeNames,
    debugCurrentUser,
    // ALIASES PARA COMPATIBILIDADE
    totalActiveParticipations: getTotalActiveParticipations(),
    activeParticipations: state.userParticipations.filter(p => p.status === 'active'),
  };

  return (
    <ChallengeContext.Provider value={value}>
      {children}
    </ChallengeContext.Provider>
  );
}

// Hook to use challenge context
export function useChallenges() {
  const context = useContext(ChallengeContext);
  if (!context) {
    throw new Error('useChallenges must be used within a ChallengeProvider');
  }
  return context;
}

export default ChallengeContext;
