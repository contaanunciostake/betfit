import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useChallenges } from '../../contexts/ChallengeContext';
import Header from './Header';
import Footer from './Footer';
import LiveTicker from './LiveTicker';
import OddsBox from '../challenges/OddsBox';
import BetSlip from '../betting/BetSlip';
import LoadingScreen from '../common/LoadingScreen';
import LoginModal from '../auth/LoginModal';
import SyncIndicator from '../common/SyncIndicator';
import ChallengeModal from '../challenges/ChallengeModal';
import ConnectAppModal from '../fitness/ConnectAppModal';
import {
  Filter,
  Grid,
  List,
  Loader2,
  Trophy,
  Database,
  RefreshCw,
  Search,
  Star,
  Clock,
  Users,
  Target,
  Zap,
  Activity,
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Wallet,
  LogOut,
  Settings,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// CORREÇÃO: Definir API_BASE_URL corretamente
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://betfit-backend.onrender.com';

console.log('🌐 MainLayout Config:', {
  hostname: window.location.hostname,
  apiUrl: import.meta.env.VITE_API_BASE_URL,
  environment: import.meta.env.VITE_ENVIRONMENT
});

const MainLayout = ({ children }) => {
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();
  const {
    balance,
    realBalance,
    connectionStatus,
    lastUpdate,
    errorMessage,
    refreshWallet
  } = useWallet();
  const navigate = useNavigate();
  const {
    challenges: contextChallenges,
    userParticipations,
    betSlip,
    isLoading: challengesLoading,
    error,
    addToBetSlip,
    removeFromBetSlip,
    updateBetSlipItem,
    clearBetSlip,
    confirmBets,
    updateFilters,
    searchChallenges,
    refreshChallenges,
    clearError
  } = useChallenges();

  // UI States
  const [viewMode, setViewMode] = useState('table');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSync, setLastSync] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('available'); // available, unavailable, completed, my_active

  // Real Data States
  const [realCategories, setRealCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [realChallenges, setRealChallenges] = useState([]);
  const [loadingRealChallenges, setLoadingRealChallenges] = useState(true);
  const [realChallengesError, setRealChallengesError] = useState('');
  const [dataSource, setDataSource] = useState('unknown');
  const [lastRealDataUpdate, setLastRealDataUpdate] = useState(null);
  const [realUserParticipations, setRealUserParticipations] = useState([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);

  // Fitness Connection States
  const [fitnessConnections, setFitnessConnections] = useState([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [showConnectAppModal, setShowConnectAppModal] = useState(false);
  const [challengeForConnection, setChallengeForConnection] = useState(null);

  // Categories with icons
  const defaultCategories = [
    { id: 'all', name: 'Todos os Desafios', icon: Trophy, color: 'text-yellow-500' },
    { id: 'running', name: 'Corrida', icon: Activity, color: 'text-blue-500' },
    { id: 'cycling', name: 'Ciclismo', icon: Target, color: 'text-green-500' },
    { id: 'steps', name: 'Passos', icon: MapPin, color: 'text-purple-500' },
    { id: 'workouts', name: 'Treinos', icon: Zap, color: 'text-red-500' },
    { id: 'calories', name: 'Calorias', icon: TrendingUp, color: 'text-orange-500' },
    { id: 'swimming', name: 'Natação', icon: Award, color: 'text-cyan-500' },
  ];

  // Load categories from database
const loadCategoriesFromDatabase = async () => {
    console.log('📂 [CATEGORIES] Carregando categorias do banco...');
    setLoadingCategories(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories?_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.categories) {
        const activeCategories = data.categories.filter(cat => cat.is_active === 1 || cat.is_active === true);
        
        const mappedCategories = [
          { id: 'all', name: 'Todos os Desafios', icon: Trophy, color: 'text-yellow-500' },
          ...activeCategories.map(cat => ({
            id: cat.name.toLowerCase().replace(/\s+/g, ''), 
            name: cat.name,
            icon: getIconForCategory(cat.icon),
            color: getCategoryColor(cat.color),
            description: cat.description,
            originalName: cat.name,
            is_active: cat.is_active
          }))
        ];
        
        setRealCategories(mappedCategories);
        console.log(`✅ [CATEGORIES] ${activeCategories.length} categorias ATIVAS carregadas do banco (${data.categories.length} total)`);
      }
    } catch (error) {
      console.error('❌ [CATEGORIES] Erro ao carregar categorias:', error);
      setRealCategories(defaultCategories);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Helper functions for mapping
  const getIconForCategory = (iconName) => {
    const iconMap = {
      'running': Activity,
      'bike': Target,
      'walking': MapPin,
      'dumbbell': Zap,
      'heart': TrendingUp,
      'waves': Award,
      'trophy': Trophy,
      'caminhada': MapPin,
      'corrida': Activity,
      'ciclismo': Target,
      'fitness': Zap,
      'natação': Award,
      'yoga': TrendingUp,
      'voador': Trophy
    };
    return iconMap[iconName?.toLowerCase()] || Trophy;
  };

  const getCategoryColor = (hexColor) => {
    const colorMap = {
      '#ef4444': 'text-red-500',
      '#22c55e': 'text-green-500',
      '#f59e0b': 'text-yellow-500',
      '#8b5cf6': 'text-purple-500',
      '#06b6d4': 'text-cyan-500',
      '#3b82f6': 'text-blue-500'
    };
    return colorMap[hexColor] || 'text-gray-500';
  };

  const categories = realCategories.length > 0 ? realCategories : defaultCategories;

  // Load categories on mount
  useEffect(() => {
    loadCategoriesFromDatabase();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update last sync when challenges change
  useEffect(() => {
    if (contextChallenges && contextChallenges.length > 0) {
      setLastSync(new Date());
    }
  }, [contextChallenges]);

  // Utility function to calculate time left
  const calculateTimeLeft = (endDate) => {
    if (!endDate) return '24h 0m';
    try {
      const end = new Date(endDate);
      const now = new Date();
      const diff = end - now;
      if (diff <= 0) return '0h 0m';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error(`[DEBUG] Erro em calculateTimeLeft para ${endDate}:`, error);
      return '24h 0m';
    }
  };

  // Extract fetchFitnessConnections as a separate function
  const fetchFitnessConnections = async () => {
    if (isAuthenticated && user?.email) {
      setLoadingConnections(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/fitness/connections/${user.email}`);
        if (!response.ok) throw new Error('Falha ao buscar conexões');
        const data = await response.json();
        if (data.success) {
          const activeConnections = data.connections.filter(conn => conn.is_active);
          setFitnessConnections(activeConnections);
          console.log('✅ [FITNESS] Conexões de app encontradas:', activeConnections);
        }
      } catch (error) {
        console.error('❌ [FITNESS] Erro ao buscar conexões:', error);
      } finally {
        setLoadingConnections(false);
      }
    } else {
      setFitnessConnections([]);
    }
  };

  // Fetch real user participations from database
  const fetchUserParticipations = async () => {
    if (!isAuthenticated || !user?.email) {
      setRealUserParticipations([]);
      return;
    }

    setLoadingParticipations(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/my-participations?user_email=${user.email}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.participations) {
        const activeParticipations = data.participations.filter(p => 
          p.status === 'active' && 
          p.is_active === true
        );
        
        setRealUserParticipations(activeParticipations);
        console.log(`✅ [USER-PARTICIPATIONS] ${activeParticipations.length} participações ativas carregadas:`, activeParticipations);
      } else {
        setRealUserParticipations([]);
        console.log('ℹ️ [USER-PARTICIPATIONS] Nenhuma participação encontrada');
      }
    } catch (error) {
      console.error('❌ [USER-PARTICIPATIONS] Erro ao buscar participações:', error);
      setRealUserParticipations([]);
    } finally {
      setLoadingParticipations(false);
    }
  };

  // Fetch fitness connections for authenticated users
  useEffect(() => {
    fetchFitnessConnections();
    fetchUserParticipations(); // Add this call
  }, [isAuthenticated, user]);

  // Load real challenges from database
  const loadRealChallengesFromDatabase = async () => {
    console.log('🎮 [MAIN-LAYOUT] Carregando desafios reais da API...');
    setLoadingRealChallenges(true);
    setRealChallengesError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges?_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.challenges) {
        throw new Error(data.error || 'Erro ao buscar dados reais');
      }

      const formattedChallenges = data.challenges.map(challenge => ({
        ...challenge,
        participant_count: challenge.current_participants || challenge.participants_count || 0,
        total_pool: challenge.total_pool || challenge.pool_size || 0,
        time_left: calculateTimeLeft(challenge.end_date || challenge.end_at),
        category_name: challenge.category_name || challenge.category,
        is_solo: challenge.is_solo !== undefined ? challenge.is_solo : true,
        validation_type: challenge.validation_type || 'automatic',
        participants: challenge.current_participants || challenge.participants_count || 0,
        pool_size: challenge.total_pool || challenge.pool_size || 0
      }));
      
      setRealChallenges(formattedChallenges);
      setDataSource('real_database');
      setLastRealDataUpdate(new Date());
      
      console.log(`✅ [MAIN-LAYOUT] ${formattedChallenges.length} desafios reais carregados:`, formattedChallenges);
      
    } catch (error) {
      console.error('❌ [MAIN-LAYOUT] Erro ao carregar dados reais:', error);
      setRealChallengesError(error.message);
      setDataSource('error');
      
      if (contextChallenges && contextChallenges.length > 0) {
        console.log('⚠️ [MAIN-LAYOUT] Usando fallback para dados do contexto');
        setRealChallenges(contextChallenges);
        setDataSource('context_fallback');
      }
    } finally {
      setLoadingRealChallenges(false);
    }
  };

  // Load real data on component mount
  useEffect(() => {
    loadRealChallengesFromDatabase();
  }, []);

  // Update data when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 [VISIBILITY] Aba ficou visível. Recarregando dados...');
        loadRealChallengesFromDatabase();
        fetchFitnessConnections();
        loadCategoriesFromDatabase();
        fetchUserParticipations(); // Add this call
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user]);

  // Refresh real challenges
  const handleRefreshRealChallenges = async () => {
    await loadRealChallengesFromDatabase();
    await fetchUserParticipations(); // Also refresh participations
  };

  if (authLoading) {
    return <LoadingScreen message="Inicializando BetFit..." />;
  }

  // Check if user has required fitness connection for challenge
  const hasRequiredConnection = (challenge) => {
    if (!challenge.required_app_category) {
      return true;
    }
    
    const requiredPlatforms = {
      running: ['apple_health', 'health_connect', 'strava', 'teste'],
      cycling: ['apple_health', 'health_connect', 'strava', 'teste'],
      steps: ['apple_health', 'health_connect', 'google_fit', 'teste'],
      walking: ['apple_health', 'health_connect', 'google_fit', 'teste'],
      workouts: ['apple_health', 'health_connect', 'teste'],
    }[challenge.required_app_category];
    
    if (!requiredPlatforms) return true;

    return fitnessConnections.some(conn => requiredPlatforms.includes(conn.platform));
  };

  // Handle challenge join with fitness connection check
  const handleJoinChallenge = (challenge) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!hasRequiredConnection(challenge)) {
      setChallengeForConnection(challenge);
      setShowConnectAppModal(true);
      return;
    }

    const existingBet = betSlip.find(bet => bet.challenge.id === challenge.id);
    if (!existingBet) {
      addToBetSlip(challenge);
    }
  };

  // Check if user is participating in a challenge - updated to use real data
  const isUserParticipating = (challengeId) => {
    // Use real participations first, fallback to context if needed
    const participationsToUse = realUserParticipations.length > 0 ? realUserParticipations : userParticipations;
    
    return participationsToUse && participationsToUse.some(participation => 
      participation.challenge_id === challengeId && 
      participation.status === 'active'
    );
  };

  // Get user's active challenges - updated to use real data
  const getUserActiveChallenges = () => {
    // Use real participations first, fallback to context if needed
    const participationsToUse = realUserParticipations.length > 0 ? realUserParticipations : userParticipations;
    
    if (!participationsToUse || participationsToUse.length === 0) {
      return [];
    }

    return participationsToUse
      .filter(participation => participation.status === 'active')
      .map(participation => {
        // Try to find the challenge in real challenges first, then context
        const challenge = realChallenges.find(c => c.id === participation.challenge_id) || 
                         contextChallenges.find(c => c.id === participation.challenge_id);
        
        return {
          ...participation,
          challenge: challenge || {
            id: participation.challenge_id,
            title: participation.challenge_title || participation.challenge_name || 'Desafio',
            category: participation.challenge_category || 'fitness'
          }
        };
      })
      .slice(0, 5);
  };

  // Modal handlers
  const handleChallengeClick = (challenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const handleCloseChallengeModal = () => {
    setShowChallengeModal(false);
    setSelectedChallenge(null);
  };

  // Bet slip handlers
  const handleUpdateBet = (betId, updatedBet) => {
    updateBetSlipItem(betId, updatedBet);
  };

  const handleRemoveBet = (betId) => {
    removeFromBetSlip(betId);
  };

  const handleClearAllBets = () => {
    clearBetSlip();
  };

  const handleConfirmBets = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    try {
      await confirmBets();
      alert(`${betSlip.length} apostas confirmadas com sucesso!`);
      await handleRefreshRealChallenges();
    } catch (error) {
      alert(`Erro ao confirmar apostas: ${error.message}`);
    }
  };

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    updateFilters({ [filterType]: value });
  };

  // Calculate statistics
  const calculateTotalStats = () => {
    const challengesToUse = realChallenges.length > 0 ? realChallenges : contextChallenges;
    if (!challengesToUse || challengesToUse.length === 0) {
      return { totalChallenges: 0, totalPool: 0, totalParticipants: 0 };
    }
    
    return {
      totalChallenges: challengesToUse.length,
      totalPool: challengesToUse.reduce((total, c) => total + (c.total_pool || c.pool_size || 0), 0),
      totalParticipants: challengesToUse.reduce((total, c) => total + (c.participant_count || c.participants || 0), 0)
    };
  };

  const stats = calculateTotalStats();

  // Filter challenges by category and status
  const filteredChallenges = () => {
    const challengesToUse = realChallenges.length > 0 ? realChallenges : contextChallenges;
    if (!challengesToUse) return [];
    
    // First filter by category
    let filtered = challengesToUse;
    if (selectedCategory !== 'all') {
      filtered = challengesToUse.filter(challenge => {
        const challengeCategory = (challenge.category || challenge.category_name || '').toLowerCase();
        const selectedCategoryLower = selectedCategory.toLowerCase();
        
        if (challengeCategory === selectedCategoryLower) return true;
        
        const categoryMappings = {
          'caminhada': ['walking', 'steps', 'passos'],
          'corrida': ['running', 'run'],
          'ciclismo': ['cycling', 'bike'],
          'fitness': ['workouts', 'treinos', 'fitness'],
          'natação': ['swimming', 'swim'],
          'yoga': ['yoga', 'meditation'],
          'voador': ['flying', 'voador']
        };
        
        for (const [key, alternatives] of Object.entries(categoryMappings)) {
          if (selectedCategoryLower === key && alternatives.includes(challengeCategory)) return true;
          if (alternatives.includes(selectedCategoryLower) && challengeCategory === key) return true;
        }
        
        return false;
      });
    }

    // Then filter by status/tab
    return filtered.filter(challenge => {
      const now = new Date();
      const endDateStr = challenge.end_date.includes('Z') ? challenge.end_date : challenge.end_date + 'Z';
      const endDate = new Date(endDateStr);
      const endDateBR = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
      const isExpired = endDateBR.getTime() <= now.getTime();
      const isCompleted = challenge.status === 'completed' || challenge.status === 'finished';
      
      switch (activeTab) {
        case 'available':
          return !isExpired && !isCompleted && challenge.status !== 'pending';
        case 'my_active':
          // Show only challenges the user is actively participating in
          return isUserParticipating(challenge.id);
        default:
          return !isExpired && !isCompleted && challenge.status !== 'pending';
      }
    });
  };

  // Get challenge counts for each tab
  const getChallengeStats = () => {
    const challengesToUse = realChallenges.length > 0 ? realChallenges : contextChallenges;
    if (!challengesToUse) return { available: 0, my_active: 0 };
    
    let available = 0, my_active = 0;
    
    challengesToUse.forEach(challenge => {
      const now = new Date();
      const endDateStr = challenge.end_date.includes('Z') ? challenge.end_date : challenge.end_date + 'Z';
      const endDate = new Date(endDateStr);
      const endDateBR = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
      const isExpired = endDateBR.getTime() <= now.getTime();
      const isCompleted = challenge.status === 'completed' || challenge.status === 'finished';
      
      // Count user's active challenges
      if (isUserParticipating(challenge.id)) {
        my_active++;
      }
      
      // Count available challenges
      if (!isExpired && !isCompleted && challenge.status !== 'pending') {
        available++;
      }
    });
    
    return { available, my_active };
  };

  // Debug filtered challenges
  useEffect(() => {
    const filtered = filteredChallenges();
    const stats = getChallengeStats();
    console.log(`🔍 [FILTER] Categoria: "${selectedCategory}", Tab: "${activeTab}"`);
    console.log(`🔍 [FILTER] Stats: Disponíveis: ${stats.available}, Indisponíveis: ${stats.unavailable}, Finalizados: ${stats.completed}`);
    console.log(`🔍 [FILTER] Desafios filtrados: ${filtered.length}/${(realChallenges.length > 0 ? realChallenges : contextChallenges).length}`);
    if (filtered.length > 0) {
      console.log('📋 [FILTER] Categorias dos desafios filtrados:', 
        filtered.map(c => c.category || c.category_name).join(', '));
    }
  }, [selectedCategory, activeTab, realChallenges, contextChallenges]);

  // Determine which challenges to display and loading states
  const challengesToDisplay = filteredChallenges();
  const isLoadingChallenges = loadingRealChallenges || challengesLoading;
  const challengesError = realChallengesError || error;

  // Get data source indicator color
  const getDataSourceColor = () => {
    switch (dataSource) {
      case 'real_database':
        return 'text-green-600 font-bold';
      case 'context_fallback':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* USAR O HEADER SEPARADO */}
      <Header />
      <LiveTicker />
      
      <main className="flex-1 bg-gray-900">
        <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-6">
            {/* Left Sidebar - Categories - Hidden on mobile, show as drawer or move to top */}
            <div className="hidden lg:block lg:col-span-3">
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-green-700 px-4 py-3">
                  <h3 className="text-white font-semibold flex items-center">
                    <Trophy className="w-4 h-4 mr-2" />
                    EM ALTA
                  </h3>
                </div>
                
                <div className="p-2">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    const isActive = selectedCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center px-3 py-2 rounded text-sm transition-colors ${
                          isActive 
                            ? 'bg-green-700 text-white' 
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <IconComponent className={`w-4 h-4 mr-3 ${category.color}`} />
                        {category.name}
                      </button>
                    );
                  })}
                </div>

                {/* Statistics */}
                <div className="border-t border-gray-700 p-4">
                  <h4 className="text-white font-medium mb-3">Estatísticas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Desafios Ativos:</span>
                      <span className="text-white font-medium">{stats.totalChallenges}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Total em Pools:</span>
                      <span className="text-green-400 font-medium">R$ {stats.totalPool.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Participantes:</span>
                      <span className="text-white font-medium">{stats.totalParticipants}</span>
                    </div>
                  </div>
                </div>

                {/* Active Challenges for authenticated users - moved to sidebar */}
                {isAuthenticated && getUserActiveChallenges().length > 0 && (
                  <div className="border-t border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        Meus Desafios Ativos
                      </h4>
                      <span className="text-xs text-gray-400">
                        {getUserActiveChallenges().length} ativos
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getUserActiveChallenges().map((participation) => (
                        <div
                          key={participation.challenge_id}
                          className="bg-green-700 text-white px-2 py-1 rounded-full text-xs"
                        >
                          {participation.challenge.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Categories - Horizontal scroll on mobile */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700">
              {/* CSS customizado para scrollbar */}
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  height: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: rgba(75, 85, 99, 0.3);
                  border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #16a34a;
                  border-radius: 10px;
                  transition: background-color 0.3s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #15803d;
                }
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #16a34a rgba(75, 85, 99, 0.3);
                }
              `}</style>
              
              <div className="overflow-x-auto custom-scrollbar">
                <div className="flex items-center px-4 py-3 space-x-4 min-w-max">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    const isActive = selectedCategory === category.id;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex flex-col items-center p-3 rounded-lg transition-all duration-300 min-w-[70px] flex-shrink-0 group ${
                          isActive 
                            ? 'bg-green-600 text-white shadow-lg shadow-green-500/30 transform scale-105' 
                            : 'text-gray-400 hover:text-white hover:bg-green-600 hover:shadow-md hover:shadow-green-500/20 hover:transform hover:scale-105'
                        }`}
                      >
                        <div className={`w-6 h-6 mb-1 transition-all duration-300 ${
                          isActive 
                            ? 'text-white' 
                            : `${category.color} group-hover:text-white`
                        }`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium truncate max-w-[60px] transition-colors duration-300 ${
                          isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                        }`}>
                          {category.shortName || category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
        
        {/* Scroll indicator dots */}
        <div className="flex justify-center pb-1">
          <div className="flex space-x-1">
            {Array.from({ length: Math.ceil(categories.length / 4) }).map((_, index) => (
              <div
                key={index}
                className="w-1.5 h-1.5 rounded-full bg-gray-600 transition-colors duration-300"
              />
            ))}
          </div>
        </div>
      </div>

            {/* Center Column - Main Content */}
            <div className="lg:col-span-6">
              {/* Promotional Banners - Stack on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div 
                  className="relative bg-gray-800 rounded-lg overflow-hidden border border-green-700 min-h-[120px] sm:min-h-[160px] bg-cover bg-center"
                  style={{ backgroundImage: `url('/challenge-banner.png')` }}
                >
                  <div className="absolute inset-0 bg-black/60"></div>
                  <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col justify-center">
                    <h3 className="font-bold text-base sm:text-lg mb-2 text-green-400">Novos Desafios</h3>
                    <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4">
                      Descubra por que o extraordinário acontece aqui
                    </p>
                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 w-fit text-xs sm:text-sm">
                      Registre-se
                    </Button>
                  </div>
                </div>
                
                <div 
                  className="relative bg-gray-800 rounded-lg overflow-hidden border border-green-700 min-h-[120px] sm:min-h-[160px] bg-cover bg-center"
                  style={{ backgroundImage: `url('/loyalty-banner.png')` }}
                >
                  <div className="absolute inset-0 bg-black/60"></div>
                  <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col justify-center">
                    <h3 className="font-bold text-base sm:text-lg mb-2 text-green-400">Fidelidade BetFit</h3>
                    <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4">
                      Faça parte do clube e aumente seus ganhos
                    </p>
                    <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 w-fit text-xs sm:text-sm">
                      Registre-se
                    </Button>
                  </div>
                </div>
              </div>

              {/* Sports Icons Row - Hidden on mobile since we have categories above */}
              <div className="hidden sm:block bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  {categories.slice(1).map((category) => {
                    const IconComponent = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-700 transition-colors group"
                      >
                        <IconComponent className={`w-6 h-6 mb-1 ${category.color} group-hover:scale-110 transition-transform`} />
                        <span className="text-xs text-gray-300 group-hover:text-white">
                          {category.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Challenges Section */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
                  <h3 className="text-white font-semibold flex items-center justify-center lg:justify-start w-full lg:w-auto">
                    <Trophy className="w-4 h-4 mr-2 text-green-500" />
                    {selectedCategory === 'all' ? 'TODOS OS DESAFIOS' : categories.find(c => c.id === selectedCategory)?.name.toUpperCase()}
                  </h3>
                  <div className="hidden lg:flex items-center space-x-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleRefreshRealChallenges}
                      className="text-gray-300 hover:text-white"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Challenge Status Tabs */}
                <div className="bg-gray-750 border-b border-gray-600">
                  <div className="flex justify-center lg:justify-start">
                    {(() => {
                      const stats = getChallengeStats();
                      const tabs = [
                        { 
                          id: 'available', 
                          label: 'Disponíveis', 
                          count: stats.available,
                          icon: Clock,
                          color: 'text-green-500'
                        },
                        { 
                          id: 'my_active', 
                          label: 'Meus Ativos', 
                          count: stats.my_active,
                          icon: Star,
                          color: 'text-yellow-500',
                          showOnlyWhenAuthenticated: true
                        }
                      ];

                      return tabs
                        .filter(tab => !tab.showOnlyWhenAuthenticated || isAuthenticated)
                        .map((tab) => {
                        const IconComponent = tab.icon;
                        const isActive = activeTab === tab.id;
                        
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                              isActive
                                ? 'border-green-500 text-white bg-gray-700'
                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:bg-gray-700/50'
                            }`}
                          >
                            <IconComponent className={`w-4 h-4 mr-2 ${isActive ? tab.color : 'text-gray-500'}`} />
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              isActive 
                                ? 'bg-green-600 text-white' 
                                : 'bg-gray-600 text-gray-300'
                            }`}>
                              {tab.count}
                            </span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* User's Active Challenges in Current Tab */}
                {isAuthenticated && getUserActiveChallenges().length > 0 && (() => {
                  // Filter user's challenges by current tab
                  const userChallengesInTab = getUserActiveChallenges().filter(participation => {
                    const challenge = participation.challenge;
                    if (!challenge || !challenge.end_date) return false;
                    
                    const now = new Date();
                    const endDateStr = challenge.end_date.includes('Z') ? challenge.end_date : challenge.end_date + 'Z';
                    const endDate = new Date(endDateStr);
                    const endDateBR = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
                    const isExpired = endDateBR.getTime() <= now.getTime();
                    const isCompleted = challenge.status === 'completed' || challenge.status === 'finished';
                    
                    switch (activeTab) {
                      case 'available':
                        return !isExpired && !isCompleted && challenge.status !== 'pending';
                      case 'unavailable':
                        return isExpired && !isCompleted;
                      case 'completed':
                        return isCompleted || challenge.status === 'pending';
                      default:
                        return false;
                    }
                  });

                  if (userChallengesInTab.length === 0) return null;

                  return (
                    <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-green-400 font-medium flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          Meus Desafios Ativos nesta Categoria
                        </h4>
                        <span className="text-xs text-green-300 bg-green-700/50 px-2 py-1 rounded-full">
                          {userChallengesInTab.length} {userChallengesInTab.length === 1 ? 'desafio' : 'desafios'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {userChallengesInTab.map((participation) => (
                          <div
                            key={participation.challenge_id}
                            className="flex items-center justify-between bg-green-800/40 border border-green-600/30 rounded-lg p-3 hover:bg-green-800/60 transition-colors cursor-pointer"
                            onClick={() => handleChallengeClick(participation.challenge)}
                          >
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                <Trophy className="w-3 h-3 text-white" />
                              </div>
                              <div>
                                <div className="text-white text-sm font-medium">
                                  {participation.challenge.title}
                                </div>
                                <div className="text-green-300 text-xs">
                                  {participation.challenge.category || 'Fitness'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-400 text-xs font-medium">
                                Participando
                              </div>
                              {participation.challenge.pool_size && (
                                <div className="text-green-300 text-xs">
                                  Pool: R$ {participation.challenge.pool_size.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Table Headers - Desktop only */}
                <div className="hidden lg:block bg-gray-750 px-4 py-2 border-b border-gray-600 sticky top-0 z-10">
                  <div className="grid grid-cols-12 gap-4 text-xs text-gray-400 font-medium">
                    <div className="col-span-1">DATA</div>
                    <div className="col-span-1">TEMPO RESTANTE</div>
                    <div className="col-span-3">DESAFIO</div>
                    <div className="col-span-2 text-center">PARTICIPANTES</div>
                    <div className="col-span-2 text-center">POOL</div>
                    <div className="col-span-1 text-center">ODDS</div>
                    <div className="col-span-2 text-center">AÇÕES</div>
                  </div>
                </div>

                {/* Error message */}
                {challengesError && (
                  <div className="p-4 bg-red-900/20 border-l-4 border-red-500">
                    <p className="text-red-400 font-medium">{challengesError}</p>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearError}
                        className="text-red-400 hover:text-red-300"
                      >
                        Limpar Erro
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRefreshRealChallenges}
                        className="text-red-400 hover:text-red-300"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Tentar Novamente
                      </Button>
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {isLoadingChallenges && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin mr-3" />
                    <span className="text-gray-400">Carregando desafios...</span>
                  </div>
                )}

                {/* Challenges List - Responsive Layout */}
                {!isLoadingChallenges && challengesToDisplay && challengesToDisplay.length > 0 && (
                  <div className="space-y-3 lg:space-y-0 lg:divide-y lg:divide-gray-700 max-h-[600px] overflow-y-auto">
                    {challengesToDisplay.map((challenge, index) => {
                      const now = new Date();
                      const endDateStr = challenge.end_date.includes('Z') ? challenge.end_date : challenge.end_date + 'Z';
                      const endDate = new Date(endDateStr);
                      const endDateBR = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
                      const isExpired = endDateBR.getTime() <= now.getTime();
                      const isCompleted = challenge.status === 'completed' || challenge.status === 'finished';
                      const isUnavailable = isExpired || isCompleted;
                      
                      return (
                        <div key={challenge.id}>
                          {/* Mobile Card Layout */}
                          <div
                            className={`lg:hidden bg-gray-750 rounded-lg p-4 transition-all duration-300 cursor-pointer ${
                              activeTab === 'available' 
                                ? 'hover:bg-gradient-to-r hover:from-green-700/20 hover:to-green-600/20 hover:border-l-4 hover:border-green-500' 
                                : 'bg-gray-800/50 opacity-75 hover:bg-gray-700/60 hover:opacity-90'
                            } ${index > 0 ? 'border-t border-gray-600' : ''}`}
                            onClick={() => handleChallengeClick(challenge)}
                          >
                            {/* Primeira Linha: Header + Odds */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center flex-1">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                                  activeTab === 'available' ? 'bg-green-600' : 'bg-gray-600'
                                }`}>
                                  <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className={`font-medium text-sm ${
                                    activeTab === 'available' ? 'text-white' : 'text-gray-400'
                                  }`}>
                                    {challenge.title}
                                  </div>
                                  <div className="flex items-center text-xs text-gray-400 space-x-2">
                                    <span>{challenge.category_name || challenge.category}</span>
                                    <span>•</span>
                                    <span>{challenge.participant_count || challenge.participants || 0} participantes</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                2.50
                              </div>
                            </div>

                            {/* Segunda Linha: Pool + Tempo + Botão */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-1">
                                  <div className="text-green-400 font-medium text-sm">
                                    R$ {(challenge.total_pool || challenge.pool_size || 0).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-gray-400">pool total</div>
                                </div>
                                <div className="text-xs">
                                  {(() => {
                                    const now = new Date();
                                    const endDateStr = challenge.end_date.includes('Z') ? challenge.end_date : challenge.end_date + 'Z';
                                    const endDate = new Date(endDateStr);
                                    const endDateBR = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
                                    const timeDiff = endDateBR.getTime() - now.getTime();
                                    
                                    if (timeDiff <= 0) {
                                      return <span className="text-red-400 font-medium">Expirado</span>;
                                    }
                                    
                                    if (challenge.status === 'completed' || challenge.status === 'finished') {
                                      return <span className="text-yellow-400 font-medium">Concluído</span>;
                                    }
                                    
                                    if (challenge.status === 'pending') {
                                      return <span className="text-blue-400 font-medium">Em Andamento</span>;
                                    }
                                    
                                    if (challenge.status === 'active') {
                                      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                                      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                                      
                                      if (days > 0) {
                                        return <span className="text-green-400 font-medium">{days}d {hours}h restantes</span>;
                                      } else if (hours > 0) {
                                        return <span className="text-green-400 font-medium">{hours}h {minutes}m restantes</span>;
                                      } else if (minutes > 0) {
                                        return <span className="text-yellow-400 font-medium">{minutes}m restantes</span>;
                                      }
                                    }
                                    
                                    return <span className="text-gray-400 font-medium">{challenge.status || 'Indefinido'}</span>;
                                  })()}
                                </div>
                              </div>
                              
                              <div className="flex-shrink-0">
                                {(() => {
                                  if (activeTab === 'my_active') {
                                    return (
                                      <span className="text-xs text-green-400 font-medium bg-green-700/30 px-3 py-1.5 rounded-full">
                                        Participando
                                      </span>
                                    );
                                  }
                                  
                                  // Tab 'available'
                                  if (isUserParticipating(challenge.id)) {
                                    return (
                                      <span className="text-xs text-green-400 font-medium bg-green-700/30 px-3 py-1.5 rounded-full">
                                        Participando
                                      </span>
                                    );
                                  }
                                  
                                  return (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJoinChallenge(challenge);
                                      }}
                                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 h-8 font-medium"
                                    >
                                      Participar
                                    </Button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Desktop Row Layout */}
                          <div
                            className={`hidden lg:block px-4 py-3 transition-all duration-300 cursor-pointer group ${
                              activeTab === 'available' 
                                ? 'hover:bg-gradient-to-r hover:from-green-700/20 hover:to-green-600/20 hover:border-l-4 hover:border-green-500 hover:shadow-lg hover:shadow-green-500/20' 
                                : 'bg-gray-800/50 opacity-75 hover:bg-gray-700/60 hover:opacity-90'
                            }`}
                            onClick={() => handleChallengeClick(challenge)}
                          >
                            <div className="grid grid-cols-12 gap-4 items-center">
                              {/* Date */}
                              <div className="col-span-1">
                                <div className="text-xs text-gray-400">
                                  {new Date(challenge.start_date + 'Z').toLocaleDateString('pt-BR', {
                                    weekday: 'short',
                                    day: '2-digit',
                                    month: 'short',
                                    timeZone: 'America/Sao_Paulo'
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(challenge.start_date + 'Z').toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'America/Sao_Paulo'
                                  })}
                                </div>
                              </div>

                              {/* Time Remaining */}
                              <div className="col-span-1">
                                <div className="text-xs">
                                  {(() => {
                                    const now = new Date();
                                    const endDateStr = challenge.end_date.includes('Z') ? challenge.end_date : challenge.end_date + 'Z';
                                    const endDate = new Date(endDateStr);
                                    const endDateBR = new Date(endDate.getTime() - (3 * 60 * 60 * 1000));
                                    const timeDiff = endDateBR.getTime() - now.getTime();
                                    
                                    if (timeDiff <= 0) {
                                      return <span className="text-red-400">Expirado</span>;
                                    }
                                    
                                    if (challenge.status === 'completed' || challenge.status === 'finished') {
                                      return <span className="text-yellow-400">Concluído</span>;
                                    }
                                    
                                    if (challenge.status === 'pending') {
                                      return <span className="text-blue-400">Em Andamento</span>;
                                    }
                                    
                                    if (challenge.status === 'active') {
                                      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                                      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
                                      
                                      if (days > 0) {
                                        return <span className="text-green-400">{days}d {hours}h</span>;
                                      } else if (hours > 0) {
                                        return <span className="text-green-400">{hours}h {minutes}m</span>;
                                      } else if (minutes > 0) {
                                        return <span className="text-yellow-400">{minutes}m</span>;
                                      }
                                    }
                                    
                                    return <span className="text-gray-400">{challenge.status || 'Indefinido'}</span>;
                                  })()}
                                </div>
                              </div>

                              {/* Challenge Info */}
                              <div className="col-span-3">
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 transition-all duration-300 ${
                                    activeTab === 'available' ? 'bg-green-600 group-hover:bg-green-500 group-hover:scale-110' : 'bg-gray-600'
                                  }`}>
                                    <Trophy className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className={`font-medium text-sm transition-colors duration-300 ${
                                      activeTab === 'available' ? 'text-white group-hover:text-green-300' : 'text-gray-400'
                                    }`}>
                                      {challenge.title}
                                    </div>
                                    <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                                      {challenge.category_name || challenge.category}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Participants */}
                              <div className="col-span-2 text-center">
                                <div className="text-white font-medium group-hover:text-green-300 transition-colors duration-300">
                                  {challenge.participant_count || challenge.participants || 0}
                                </div>
                                <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">participantes</div>
                              </div>

                              {/* Pool */}
                              <div className="col-span-2 text-center">
                                <div className="text-green-400 font-medium group-hover:text-green-300 group-hover:scale-105 transition-all duration-300">
                                  R$ {(challenge.total_pool || challenge.pool_size || 0).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300">pool total</div>
                              </div>

                              {/* Odds */}
                              <div className="col-span-1 text-center">
                                <div className="bg-green-600 text-white px-2 py-1 rounded text-sm font-medium group-hover:bg-green-500 group-hover:scale-105 transition-all duration-300">
                                  2.50
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="col-span-2 text-center">
                                <div className="flex space-x-2 justify-center">
                                  {(() => {
                                    if (activeTab === 'my_active') {
                                      return (
                                        <span className="text-xs text-green-400 font-medium">
                                          Participando
                                        </span>
                                      );
                                    }
                                    
                                    // Tab 'available'
                                    if (isUserParticipating(challenge.id)) {
                                      return (
                                        <span className="text-xs text-green-400 font-medium">
                                          Participando
                                        </span>
                                      );
                                    }
                                    
                                    return (
                                      <Button
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleJoinChallenge(challenge);
                                        }}
                                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                                      >
                                        Participar
                                      </Button>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty state */}
                {!isLoadingChallenges && (!challengesToDisplay || challengesToDisplay.length === 0) && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      {(() => {
                        switch (activeTab) {
                          case 'available':
                            return <Clock className="w-8 h-8 text-green-500" />;
                          case 'my_active':
                            return <Star className="w-8 h-8 text-yellow-500" />;
                          default:
                            return <Filter className="w-8 h-8 text-gray-500" />;
                        }
                      })()}
                    </div>
                    <h3 className="font-semibold text-white mb-2">
                      {(() => {
                        switch (activeTab) {
                          case 'available':
                            return 'Nenhum desafio disponível';
                          case 'my_active':
                            return 'Você não tem desafios ativos';
                          default:
                            return 'Nenhum desafio encontrado';
                        }
                      })()}
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {(() => {
                        switch (activeTab) {
                          case 'available':
                            return 'Não há desafios disponíveis para participar nesta categoria';
                          case 'my_active':
                            return 'Você ainda não está participando de nenhum desafio. Que tal começar agora?';
                          default:
                            return 'Nenhum desafio disponível nesta categoria';
                        }
                      })()}
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSelectedCategory('all');
                          setActiveTab(activeTab === 'my_active' ? 'available' : 'available');
                          updateFilters({ category: 'all', sortBy: 'popular' });
                        }}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        {activeTab === 'my_active' ? 'Ver Desafios Disponíveis' : 'Ver Todos Disponíveis'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleRefreshRealChallenges}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Recarregar Dados
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Bet Slip - Fixed position on mobile */}
            <div className="lg:col-span-3">
              <div className="lg:sticky lg:top-4">
                <BetSlip
                  bets={betSlip}
                  onUpdateBet={handleUpdateBet}
                  onRemoveBet={handleRemoveBet}
                  onClearAll={handleClearAllBets}
                  onConfirm={handleConfirmBets}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Challenge Modal */}
      <ChallengeModal
        challenge={selectedChallenge}
        isOpen={showChallengeModal}
        onClose={handleCloseChallengeModal}
        onJoin={handleJoinChallenge}
      />

      {/* Fitness Connection Modal */}
      <ConnectAppModal
        isOpen={showConnectAppModal}
        onClose={() => setShowConnectAppModal(false)}
        challenge={challengeForConnection}
      />
      
      <Footer />
    </div>
  );
};

export default MainLayout;
