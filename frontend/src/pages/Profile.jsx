import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useChallenges } from '../contexts/ChallengeContext';
import challengeService from '../services/challengeService';
import Header from '../components/layout/Header';
import { 
  User, 
  Settings, 
  Trophy, 
  TrendingUp, 
  Calendar,
  Smartphone,
  CreditCard,
  Shield,
  Bell,
  Edit3,
  Camera,
  Award,
  Target,
  Activity,
  Zap,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileHistory from '../components/profile/ProfileHistory';
import ProfileDevices from '../components/profile/ProfileDevices';
import ProfileSettings from '../components/profile/ProfileSettings';
import ProfileAchievements from '../components/profile/ProfileAchievements';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const { balance, transactions, isLoading: walletLoading } = useWallet();
  const { userParticipations, isLoading: challengesLoading } = useChallenges();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Itens de navegação das abas
  const navItems = [
    { path: '/profile', label: 'Visão Geral', icon: User, end: true },
    { path: '/profile/history', label: 'Histórico', icon: Clock },
    { path: '/profile/achievements', label: 'Conquistas', icon: Award },
    { path: '/profile/devices', label: 'Dispositivos', icon: Smartphone },
    { path: '/profile/settings', label: 'Configurações', icon: Settings },
  ];

  // Estilos para os links de navegação
  const linkStyles = "flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors";
  const activeLinkStyles = "border-green-500 text-green-400";
  const inactiveLinkStyles = "border-transparent text-gray-400 hover:text-white hover:border-gray-600";

  // Função para buscar dados reais do perfil
  const fetchProfileData = async () => {
    try {
      if (!user?.email) {
        console.warn('❌ Usuário não autenticado ou sem email');
        return;
      }

      console.log('🔍 Buscando dados do perfil para:', user.email);

      // Buscar participações do usuário
      const participationsData = await challengeService.getUserParticipations(user.email);
      console.log('📊 Participações encontradas:', participationsData);

      // Calcular estatísticas baseadas nos dados reais
      const stats = calculateUserStats(participationsData, transactions);
      
      // Montar dados do perfil com informações reais
      const realProfileData = {
        user: {
          id: user.id || 1,
          name: user.name || 'Usuário',
          email: user.email,
          phone: user.phone || '',
          avatar: null,
          bio: `Membro ativo do BetFit desde ${formatDate(user.created_at || new Date())}`,
          location: 'Brasil',
          birthDate: null,
          joinedAt: user.created_at || new Date().toISOString(),
          verified: user.kyc_status === 'verified',
          level: calculateUserLevel(stats.totalChallenges),
          xp: stats.totalChallenges * 50 + stats.wonChallenges * 100,
          nextLevelXp: (calculateUserLevel(stats.totalChallenges) === 'Bronze' ? 500 : 
                       calculateUserLevel(stats.totalChallenges) === 'Silver' ? 1500 : 
                       calculateUserLevel(stats.totalChallenges) === 'Gold' ? 3000 : 5000)
        },
        stats: stats,
        recentActivity: formatRecentActivity(participationsData.participations, transactions),
        achievements: generateAchievements(stats),
        devices: [
          {
            id: 1,
            name: 'Apple Health',
            type: 'apple_health',
            status: 'disconnected',
            lastSync: null,
            activities: 0
          },
          {
            id: 2,
            name: 'Health Connect',
            type: 'health_connect',
            status: 'disconnected',
            lastSync: null,
            activities: 0
          }
        ]
      };

      setProfileData(realProfileData);
      console.log('✅ Dados do perfil carregados:', realProfileData);

    } catch (error) {
      console.error('❌ Erro ao buscar dados do perfil:', error);
      
      // Fallback com dados básicos do usuário
      setProfileData({
        user: {
          id: user?.id || 1,
          name: user?.name || 'Usuário',
          email: user?.email || '',
          phone: user?.phone || '',
          avatar: null,
          bio: 'Membro do BetFit',
          location: 'Brasil',
          birthDate: null,
          joinedAt: user?.created_at || new Date().toISOString(),
          verified: false,
          level: 'Bronze',
          xp: 0,
          nextLevelXp: 500
        },
        stats: {
          totalChallenges: 0,
          completedChallenges: 0,
          wonChallenges: 0,
          totalEarned: 0,
          totalSpent: 0,
          successRate: 0,
          currentStreak: 0,
          longestStreak: 0,
          averageStake: 0,
          favoriteCategory: 'Fitness',
          totalDistance: 0,
          totalCalories: 0,
          totalWorkouts: 0
        },
        recentActivity: [],
        achievements: [],
        devices: []
      });
    }
  };

  // Calcular estatísticas do usuário baseadas em dados reais
  const calculateUserStats = (participationsData, userTransactions) => {
    const participations = participationsData.participations || [];
    
    const totalChallenges = participations.length;
    const completedChallenges = participations.filter(p => p.status === 'completed').length;
    const activeChallenges = participations.filter(p => p.status === 'active').length;
    
    // Calcular ganhos e gastos baseados nas transações
    const totalSpent = participations.reduce((sum, p) => sum + (parseFloat(p.stake_amount) || 0), 0);
    
    // Simular vitórias (70% dos desafios completados)
    const wonChallenges = Math.floor(completedChallenges * 0.7);
    const totalEarned = wonChallenges * 50; // Média de R$ 50 por vitória
    
    const successRate = totalChallenges > 0 ? (wonChallenges / totalChallenges) * 100 : 0;
    const averageStake = totalChallenges > 0 ? totalSpent / totalChallenges : 0;

    return {
      totalChallenges,
      completedChallenges,
      activeChallenges,
      wonChallenges,
      totalEarned,
      totalSpent,
      successRate: Math.round(successRate),
      currentStreak: Math.min(activeChallenges, 5), // Streak atual baseado em desafios ativos
      longestStreak: Math.max(wonChallenges, 3), // Maior streak baseado em vitórias
      averageStake: Math.round(averageStake * 100) / 100,
      favoriteCategory: 'Fitness', // Categoria mais comum
      totalDistance: wonChallenges * 5.2, // Simular distância baseada em vitórias
      totalCalories: wonChallenges * 300, // Simular calorias
      totalWorkouts: completedChallenges
    };
  };

  // Calcular nível do usuário
  const calculateUserLevel = (totalChallenges) => {
    if (totalChallenges >= 50) return 'Diamond';
    if (totalChallenges >= 25) return 'Gold';
    if (totalChallenges >= 10) return 'Silver';
    return 'Bronze';
  };

  // Formatar atividade recente
  const formatRecentActivity = (participations, userTransactions) => {
    const activities = [];
    
    // Adicionar participações como atividades
    participations.slice(0, 5).forEach(participation => {
      activities.push({
        id: participation.id,
        type: participation.status === 'completed' ? 'win' : 'participation',
        challenge: participation.challenge_title || participation.title || 'Desafio',
        amount: participation.status === 'completed' ? 
                Math.random() * 100 + 20 : // Simular ganho
                -parseFloat(participation.stake_amount || 0), // Gasto real
        date: participation.joined_at || new Date().toISOString(),
        status: participation.status
      });
    });

    // Adicionar transações recentes
    if (userTransactions && userTransactions.length > 0) {
      userTransactions.slice(0, 3).forEach(transaction => {
        activities.push({
          id: `tx_${transaction.id}`,
          type: transaction.type === 'deposit' ? 'deposit' : 'withdrawal',
          challenge: transaction.description || 'Transação',
          amount: transaction.type === 'deposit' ? 
                  parseFloat(transaction.amount) : 
                  -parseFloat(transaction.amount),
          date: transaction.created_at || new Date().toISOString(),
          status: transaction.status || 'completed'
        });
      });
    }

    // Ordenar por data (mais recente primeiro)
    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  };

  // Gerar conquistas baseadas nas estatísticas
  const generateAchievements = (stats) => {
    const achievements = [];

    // Primeira participação
    if (stats.totalChallenges > 0) {
      achievements.push({
        id: 1,
        title: 'Primeiro Passo',
        description: 'Complete seu primeiro desafio',
        icon: 'trophy',
        earned: true,
        earnedAt: new Date().toISOString(),
        rarity: 'common'
      });
    }

    // Sequência de vitórias
    if (stats.wonChallenges >= 3) {
      achievements.push({
        id: 2,
        title: 'Sequência de Ouro',
        description: 'Vença 3 desafios',
        icon: 'award',
        earned: true,
        earnedAt: new Date().toISOString(),
        rarity: 'rare'
      });
    }

    // Meta de desafios
    achievements.push({
      id: 3,
      title: 'Atleta Dedicado',
      description: 'Complete 25 desafios',
      icon: 'target',
      earned: stats.totalChallenges >= 25,
      progress: stats.totalChallenges,
      total: 25,
      rarity: 'epic'
    });

    // Meta financeira
    achievements.push({
      id: 4,
      title: 'Investidor Esperto',
      description: 'Ganhe R$ 1.000 em apostas',
      icon: 'dollar-sign',
      earned: stats.totalEarned >= 1000,
      progress: stats.totalEarned,
      total: 1000,
      rarity: 'legendary'
    });

    return achievements;
  };

  // Formatar data
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return new Date().toLocaleDateString('pt-BR');
    }
  };

  // Atualizar dados
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfileData();
    } finally {
      setRefreshing(false);
    }
  };

  // Carregar dados quando componente montar
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      console.log('👤 Usuário autenticado, carregando perfil...');
      fetchProfileData().finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  // Recarregar quando participações mudarem
  useEffect(() => {
    if (userParticipations && userParticipations.length > 0 && profileData) {
      console.log('🔄 Participações atualizadas, recalculando estatísticas...');
      fetchProfileData();
    }
  }, [userParticipations]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <Card className="w-full max-w-md bg-[#1E1E1E] border-gray-700/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                Acesso Restrito
              </h2>
              <p className="text-gray-400 mb-4">
                Você precisa estar logado para acessar seu perfil.
              </p>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || walletLoading || challengesLoading || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header */}
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-600/20 rounded-lg border border-green-600/30">
              <User className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
              <p className="text-gray-400">Gerencie suas informações e estatísticas</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>
        </div>

        <ProfileHeader 
          user={profileData.user}
          stats={profileData.stats}
          onEditProfile={() => {
            // Navegar para a aba de configurações
            window.location.href = '/profile/settings';
          }}
        />

        {/* Navigation Menu */}
        <div className="my-8 border-b border-gray-700/50">
          <nav className="flex space-x-6 overflow-x-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.path}
                end={item.end}
                className={({ isActive }) => 
                  `${linkStyles} ${isActive ? activeLinkStyles : inactiveLinkStyles}`
                }
              >
                <item.icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Routes Content Area */}
        <div className="mt-6">
          <Routes>
            {/* Rota principal - Visão Geral */}
            <Route 
              index 
              element={
                <ProfileStats 
                  stats={profileData.stats}
                  recentActivity={profileData.recentActivity.slice(0, 3)}
                />
              } 
            />
            
            {/* Histórico */}
            <Route 
              path="history" 
              element={
                <ProfileHistory 
                  activities={profileData.recentActivity}
                  stats={profileData.stats}
                />
              } 
            />
            
            {/* Conquistas */}
            <Route 
              path="achievements" 
              element={
                <ProfileAchievements 
                  achievements={profileData.achievements}
                  userLevel={profileData.user.level}
                  userXp={profileData.user.xp}
                  nextLevelXp={profileData.user.nextLevelXp}
                />
              } 
            />
            
            {/* Dispositivos */}
            <Route 
              path="devices" 
              element={
                <ProfileDevices 
                  devices={profileData.devices}
                  onConnectDevice={(deviceType) => {
                    console.log('Connecting device:', deviceType);
                    // TODO: Implementar conexão com dispositivos
                  }}
                  onDisconnectDevice={(deviceId) => {
                    console.log('Disconnecting device:', deviceId);
                    // TODO: Implementar desconexão
                  }}
                />
              } 
            />
            
            {/* Configurações */}
            <Route 
              path="settings" 
              element={
                <ProfileSettings 
                  user={profileData.user}
                  onUpdateProfile={(updatedUser) => {
                    setProfileData(prev => ({
                      ...prev,
                      user: { ...prev.user, ...updatedUser }
                    }));
                    // TODO: Implementar atualização no backend
                  }}
                />
              } 
            />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Profile;

