// CHALLENGESERVICE ATUALIZADO COM TAXA DINÂMICA

import apiClient from './api.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

class ChallengeService {
  constructor() {
    this.cache = new Map();
    this.lastSync = null;
    this.syncInterval = null;
    this.listeners = new Set();
    this.fitnessConnections = new Map();
    this.platformSettings = null; // CACHE PARA CONFIGURAÇÕES DA PLATAFORMA
  }

  // ==================== MÉTODOS PARA TAXA DINÂMICA ====================

  // Carregar configurações da plataforma (incluindo taxa)
  async loadPlatformSettings() {
    try {
      console.log('⚙️ Carregando configurações da plataforma...');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.platformSettings = data.settings || {};
      
      console.log('✅ Configurações da plataforma carregadas:', this.platformSettings);
      
      return this.platformSettings;
    } catch (error) {
      console.error('❌ Erro ao carregar configurações:', error);
      // Fallback com configurações padrão
      this.platformSettings = {
        platform: { platform_fee: 10 },
        general: { min_bet_amount: 10, max_bet_amount: 1000 }
      };
      return this.platformSettings;
    }
  }

  // Obter taxa da plataforma dinamicamente
  async getPlatformFee() {
    try {
      // Se não tem cache das configurações, carregar
      if (!this.platformSettings) {
        await this.loadPlatformSettings();
      }

      // Buscar taxa nas configurações
      const platformFee = this.platformSettings?.platform?.platform_fee || 
                         this.platformSettings?.general?.platform_fee ||
                         10; // Fallback para 10%

      console.log('💰 Taxa da plataforma obtida:', platformFee);
      return parseFloat(platformFee);
    } catch (error) {
      console.error('❌ Erro ao obter taxa da plataforma:', error);
      return 10; // Fallback padrão
    }
  }

  // Calcular valores com taxa dinâmica
  async calculatePoolValues(totalStakes) {
    const platformFee = await this.getPlatformFee();
    const feeAmount = totalStakes * (platformFee / 100);
    const availablePool = totalStakes - feeAmount;
    
    return {
      totalStakes: parseFloat(totalStakes),
      platformFee: platformFee,
      feeAmount: parseFloat(feeAmount.toFixed(2)),
      availablePool: parseFloat(availablePool.toFixed(2)),
      feePercentage: platformFee
    };
  }

  // ==================== MÉTODOS EXISTENTES (atualizados) ====================

  // Get all challenges with pool calculations
  async getChallenges(filters = {}) {
    try {
      console.log('🎮 Buscando desafios...');
      
      const response = await fetch(`${API_BASE_URL}/api/challenges`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // PROCESSAR CADA DESAFIO COM CÁLCULOS DINÂMICOS
      const processedChallenges = await Promise.all(
        (data.challenges || []).map(async (challenge) => {
          const poolCalculations = await this.calculatePoolValues(challenge.total_pool || 0);
          
          return {
            ...challenge,
            // Adicionar cálculos dinâmicos
            pool_calculations: poolCalculations,
            available_pool: poolCalculations.availablePool,
            platform_fee_amount: poolCalculations.feeAmount,
            current_platform_fee: poolCalculations.platformFee
          };
        })
      );
      
      this.updateCache('challenges', processedChallenges);
      this.lastSync = new Date();
      this.notifyListeners('challenges_updated', processedChallenges);
      
      return { 
        challenges: processedChallenges,
        success: true,
        total: processedChallenges.length
      };
    } catch (error) {
      console.error('❌ Erro ao buscar desafios:', error);
      if (this.cache.has('challenges')) {
        console.log('📦 Usando cache de desafios');
        return { challenges: this.cache.get('challenges') };
      }
      throw error;
    }
  }

  // Join a challenge with dynamic fee calculation
  async joinChallenge(challengeId, stakeAmount, userEmail = null) {
    try {
      console.log(`🎮 Participando do desafio ${challengeId} com aposta R$ ${stakeAmount}...`);
      
      if (!userEmail) {
        const userData = this.getUserInfo();
        userEmail = userData?.email;
        
        if (!userEmail) {
          throw new Error('Usuário não autenticado. Faça login para participar de desafios.');
        }
      }

      // Carregar taxa atual para enviar no request
      const currentPlatformFee = await this.getPlatformFee();
      const poolCalculations = await this.calculatePoolValues(stakeAmount);
      
      console.log('💰 Cálculos da aposta:', poolCalculations);
      
      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          stake_amount: stakeAmount,
          user_email: userEmail,
          // ENVIAR DADOS CALCULADOS PARA O BACKEND
          platform_fee: currentPlatformFee,
          fee_amount: poolCalculations.feeAmount,
          net_amount: poolCalculations.availablePool
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Participação registrada:', data);
      
      // Invalidar cache para forçar atualização
      this.cache.delete('challenges');
      this.forceRefresh();
      this.notifyListeners('challenge_joined', {
        challengeId,
        stakeAmount,
        poolCalculations,
        participation: data.participation
      });
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao participar do desafio:', error);
      throw error;
    }
  }

  // MÉTODO ATUALIZADO: getMyParticipations com cálculos de pool
  async getMyParticipations(userEmail = null) {
    try {
      console.log('🔍 [SERVICE] Buscando participações do usuário...');
      
      let finalUserEmail = userEmail;
      
      if (!finalUserEmail) {
        const userData = this.getUserInfo();
        finalUserEmail = userData?.email;
      }
      
      if (!finalUserEmail) {
        console.warn('❌ [SERVICE] Email do usuário não encontrado');
        return {
          success: false,
          participations: [],
          total: 0
        };
      }
      
      console.log('📧 [SERVICE] Usando email:', finalUserEmail);
      
      const params = new URLSearchParams();
      params.append('user_email', finalUserEmail);
      
      const url = `${API_BASE_URL}/api/challenges/my-participations?${params.toString()}`;
      console.log('🌐 [SERVICE] URL da requisição:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [SERVICE] Dados recebidos da API:', data);
        
        if (data && data.participations) {
          console.log('✅ [SERVICE] Participações encontradas:', data.participations.length);
          
          // PROCESSAR PARTICIPAÇÕES COM CÁLCULOS DINÂMICOS
          const processedParticipations = await Promise.all(
            data.participations.map(async (p) => {
              const poolCalculations = await this.calculatePoolValues(
                parseFloat(p.challenge_total_pool || 0)
              );
              
              return {
                id: p.id,
                challenge_id: p.challenge_id,
                title: p.challenge_title || 'Desafio',
                challenge_title: p.challenge_title || 'Desafio',
                stake_amount: parseFloat(p.stake_amount || 0),
                status: p.status,
                joined_at: p.joined_at,
                completed_at: p.completed_at,
                challenge_category: p.challenge_category || 'fitness',
                challenge_description: p.challenge_description || '',
                user_email: p.user_email,
                is_active: p.status === 'active',
                is_completed: p.status === 'completed',
                // ADICIONAR CÁLCULOS DINÂMICOS
                pool_calculations: poolCalculations,
                available_pool: poolCalculations.availablePool,
                platform_fee_amount: poolCalculations.feeAmount,
                current_platform_fee: poolCalculations.platformFee
              };
            })
          );

          console.log('✅ [SERVICE] Participações processadas:', processedParticipations);

          return {
            success: true,
            participations: processedParticipations,
            active_participations: processedParticipations.filter(p => p.is_active),
            completed_participations: processedParticipations.filter(p => p.is_completed),
            total: processedParticipations.length,
            active_count: processedParticipations.filter(p => p.is_active).length,
            completed_count: processedParticipations.filter(p => p.is_completed).length
          };
        }
      } else {
        console.error('❌ [SERVICE] Erro na resposta da API:', response.status, response.statusText);
      }
      
      console.log('⚠️ [SERVICE] API não funcionou, retornando array vazio');
      return {
        success: false,
        participations: [],
        active_participations: [],
        completed_participations: [],
        total: 0,
        active_count: 0,
        completed_count: 0
      };
      
    } catch (error) {
      console.error('❌ [SERVICE] Erro ao buscar participações:', error);
      
      return {
        success: false,
        participations: [],
        active_participations: [],
        completed_participations: [],
        total: 0,
        active_count: 0,
        completed_count: 0
      };
    }
  }

  // ALIAS: Manter compatibilidade
  async getUserParticipations(userEmail = null) {
    return this.getMyParticipations(userEmail);
  }

  // Submit result with dynamic calculations
  async submitResult(challengeId, resultData, userEmail = null) {
    try {
      if (!userEmail) {
        const userData = this.getUserInfo();
        userEmail = userData?.email;
        
        if (!userEmail) {
          throw new Error('Usuário não autenticado');
        }
      }

      const currentPlatformFee = await this.getPlatformFee();

      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          ...resultData,
          user_email: userEmail,
          platform_fee: currentPlatformFee // Incluir taxa atual
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Resultado enviado:', data);

      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar resultado:', error);
      throw error;
    }
  }

  // Get global activity
  async getGlobalActivity(limit = 20) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/challenges/activity?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar atividade global:', error);
      return { activities: [] };
    }
  }

  // Search challenges with dynamic fee calculations
  async searchChallenges(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.category && filters.category !== 'all') params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sort', filters.sortBy);

      const response = await fetch(`${API_BASE_URL}/api/challenges/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // PROCESSAR RESULTADOS COM CÁLCULOS DINÂMICOS
      const processedChallenges = await Promise.all(
        (data.challenges || []).map(async (challenge) => {
          const poolCalculations = await this.calculatePoolValues(challenge.total_pool || 0);
          
          return {
            ...challenge,
            pool_calculations: poolCalculations,
            available_pool: poolCalculations.availablePool,
            platform_fee_amount: poolCalculations.feeAmount,
            current_platform_fee: poolCalculations.platformFee
          };
        })
      );
      
      return { 
        challenges: processedChallenges,
        success: true,
        total: processedChallenges.length 
      };
    } catch (error) {
      console.error('❌ Erro ao buscar desafios:', error);
      return { challenges: [] };
    }
  }

  // ==================== MÉTODOS FITNESS (mantidos) ====================

  async connectFitnessApp(platform, permissions = []) {
    try {
      const userData = this.getUserInfo();
      if (!userData?.email) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`🔗 Conectando ao ${platform}...`);

      const response = await fetch(`${API_BASE_URL}/api/fitness/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_email: userData.email,
          platform: platform,
          permissions: permissions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao conectar com ${platform}`);
      }

      const data = await response.json();
      console.log(`✅ Conectado ao ${platform}:`, data);

      this.fitnessConnections.set(platform, data.connection);

      this.notifyListeners('fitness_connected', {
        platform,
        connection: data.connection
      });

      return data;
    } catch (error) {
      console.error(`❌ Erro ao conectar com ${platform}:`, error);
      throw error;
    }
  }

  async disconnectFitnessApp(platform) {
    try {
      const userData = this.getUserInfo();
      if (!userData?.email) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`🔌 Desconectando do ${platform}...`);

      const response = await fetch(`${API_BASE_URL}/api/fitness/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_email: userData.email,
          platform: platform
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ao desconectar do ${platform}`);
      }

      const data = await response.json();
      console.log(`✅ Desconectado do ${platform}`);

      this.fitnessConnections.delete(platform);

      this.notifyListeners('fitness_disconnected', {
        platform
      });

      return data;
    } catch (error) {
      console.error(`❌ Erro ao desconectar do ${platform}:`, error);
      throw error;
    }
  }

  async sendFitnessData(platform, fitnessData) {
    try {
      const userData = this.getUserInfo();
      if (!userData?.email) {
        throw new Error('Usuário não autenticado');
      }

      console.log(`📊 Enviando ${fitnessData.length} dados de fitness do ${platform}...`);

      const response = await fetch(`${API_BASE_URL}/api/fitness/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          user_email: userData.email,
          platform: platform,
          data: fitnessData
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao enviar dados de fitness');
      }

      const data = await response.json();
      console.log(`✅ Dados de fitness enviados:`, data);

      if (data.validated_challenges && data.validated_challenges.length > 0) {
        console.log(`🏆 ${data.validated_challenges.length} desafios validados automaticamente!`);
        
        this.notifyListeners('challenges_auto_validated', {
          validatedChallenges: data.validated_challenges
        });

        this.getMyParticipations();
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao enviar dados de fitness:', error);
      throw error;
    }
  }

  async getFitnessConnections() {
    try {
      const userData = this.getUserInfo();
      if (!userData?.email) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${API_BASE_URL}/api/fitness/connections/${userData.email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Conexões de fitness:', data);

      data.connections.forEach(conn => {
        this.fitnessConnections.set(conn.platform, conn);
      });

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar conexões de fitness:', error);
      return { connections: [], total: 0 };
    }
  }

  async getFitnessData(filters = {}) {
    try {
      const userData = this.getUserInfo();
      if (!userData?.email) {
        throw new Error('Usuário não autenticado');
      }

      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `${API_BASE_URL}/api/fitness/data/${userData.email}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Dados de fitness:', data);

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar dados de fitness:', error);
      return { data: [], total: 0 };
    }
  }

  isConnectedTo(platform) {
    const connection = this.fitnessConnections.get(platform);
    return connection && connection.is_active;
  }

  getConnectedPlatforms() {
    const connected = [];
    for (const [platform, connection] of this.fitnessConnections.entries()) {
      if (connection.is_active) {
        connected.push(platform);
      }
    }
    return connected;
  }

  // ==================== MÉTODOS FALTANTES PARA O MODAL ====================

  // ATUALIZADO: Get house percentage com carregamento dinâmico
  async getHousePercentage() {
    try {
      console.log('🏠 Buscando configuração da taxa da casa...');
      
      const platformFee = await this.getPlatformFee();
      
      return {
        success: true,
        house_percentage: platformFee
      };
    } catch (error) {
      console.error('❌ Erro ao buscar taxa da casa:', error);
      return {
        success: true,
        house_percentage: 10.0 // Fallback
      };
    }
  }

  // Get specific challenge by ID com cálculos dinâmicos
  async getChallenge(challengeId) {
    try {
      console.log(`🎮 Buscando desafio ${challengeId}...`);
      
      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // ADICIONAR CÁLCULOS DINÂMICOS
      const poolCalculations = await this.calculatePoolValues(data.challenge?.total_pool || 0);
      
      const challengeWithCalculations = {
        ...data,
        challenge: {
          ...data.challenge,
          pool_calculations: poolCalculations,
          available_pool: poolCalculations.availablePool,
          platform_fee_amount: poolCalculations.feeAmount,
          current_platform_fee: poolCalculations.platformFee
        }
      };
      
      console.log('✅ Desafio carregado com cálculos:', challengeWithCalculations);
      
      return challengeWithCalculations;
    } catch (error) {
      console.error(`❌ Erro ao buscar desafio ${challengeId}:`, error);
      throw error;
    }
  }

  async completeChallenge(challengeId, resultData, userEmail = null) {
    try {
      if (!userEmail) {
        const userData = this.getUserInfo();
        userEmail = userData?.email;
        
        if (!userEmail) {
          throw new Error('Usuário não autenticado. Faça login para completar desafios.');
        }
      }

      console.log(`🏆 Completando desafio ${challengeId}...`, resultData);
      
      const currentPlatformFee = await this.getPlatformFee();
      
      const requestBody = {
        email: userEmail,
        user_email: userEmail,
        result_value: resultData.result_value || resultData.score || 0,
        device_type: resultData.device_type || 'manual',
        is_simulation: resultData.is_simulation || false,
        platform_fee: currentPlatformFee, // INCLUIR TAXA ATUAL
        ...resultData
      };

      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Desafio completado:', data);
      
      this.cache.delete('challenges'); // Invalidar cache
      this.forceRefresh();
      this.notifyListeners('challenge_completed', {
        challengeId,
        completion: data.completion,
        isWinner: data.completion?.is_winner || false,
        prizeAmount: data.completion?.prize_amount || 0
      });
      
      return data;
    } catch (error) {
      console.error(`❌ Erro ao completar desafio ${challengeId}:`, error);
      throw error;
    }
  }

  async getUserParticipation(challengeId, userEmail = null) {
    try {
      if (!userEmail) {
        const userData = this.getUserInfo();
        userEmail = userData?.email;
        
        if (!userEmail) {
          console.log('👤 Usuário não autenticado');
          return { success: false, participation: null };
        }
      }

      console.log(`👤 Verificando participação no desafio ${challengeId}...`);
      
      const allParticipations = await this.getMyParticipations(userEmail);
      
      if (allParticipations.success && allParticipations.participations) {
        const participation = allParticipations.participations.find(p => 
          p.challenge_id === challengeId || p.challenge_id === parseInt(challengeId)
        );
        
        if (participation) {
          console.log('✅ Participação encontrada:', participation);
          return { success: true, participation };
        }
      }

      const response = await fetch(`${API_BASE_URL}/api/challenges/${challengeId}/participation/${userEmail}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 404) {
        console.log('👤 Usuário não está participando');
        return { success: true, participation: null };
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Participação encontrada via API específica:', data);
      
      return {
        success: true,
        participation: data.participation
      };
    } catch (error) {
      console.error(`❌ Erro ao verificar participação no desafio ${challengeId}:`, error);
      return { success: false, participation: null };
    }
  }

  async refreshUserBalance(userEmail = null) {
    try {
      if (!userEmail) {
        const userData = this.getUserInfo();
        userEmail = userData?.email;
        
        if (!userEmail) {
          throw new Error('Usuário não autenticado');
        }
      }

      console.log('💰 Atualizando saldo do usuário...');
      
      const response = await fetch(`${API_BASE_URL}/api/wallet/${userEmail}/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Saldo atualizado:', data);
      
      this.notifyListeners('balance_updated', {
        balance: data.balance,
        userEmail
      });
      
      return data;
    } catch (error) {
      console.error('❌ Erro ao atualizar saldo:', error);
      throw error;
    }
  }

  // ==================== MÉTODOS UTILITÁRIOS ====================

  updateCache(key, data) {
    this.cache.set(key, data);
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error in challenge listener:', error);
      }
    });
  }

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  getUserInfo() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        const userData = localStorage.getItem('user');
        if (userData) {
          return JSON.parse(userData);
        }
        return null;
      }
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          return JSON.parse(userData);
        }
      } catch (e) {
        console.error('Erro ao parsear dados do usuário:', e);
      }
      return null;
    }
  }

  reset() {
    this.cache.clear();
    this.lastSync = null;
    this.stopAutoSync();
    this.listeners.clear();
    this.fitnessConnections.clear();
    this.platformSettings = null; // LIMPAR CACHE DE CONFIGURAÇÕES
  }

  // MÉTODOS DE SINCRONIZAÇÃO E CACHE
  async getChallengesWithSync(filters = {}) {
    try {
      if (this.cache.has('challenges') && this.isRecentSync()) {
        const cached = this.cache.get('challenges');
        this.getChallenges(filters).catch(console.error);
        return { challenges: cached };
      }
      
      return await this.getChallenges(filters);
    } catch (error) {
      throw error;
    }
  }

  isRecentSync() {
    if (!this.lastSync) return false;
    const now = new Date();
    const diffMs = now - this.lastSync;
    return diffMs < 30000;
  }

  async forceRefresh(filters = {}) {
    this.cache.delete('challenges');
    this.platformSettings = null; // LIMPAR CACHE DE CONFIGURAÇÕES
    this.lastSync = null;
    return await this.getChallenges(filters);
  }

  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(async () => {
      try {
        await this.getChallenges();
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, intervalMs);
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create singleton instance
const challengeService = new ChallengeService();

export default challengeService;

console.log("✅ ChallengeService atualizado com TAXA DINÂMICA!");
console.log("💰 NOVOS RECURSOS PARA TAXA:");
console.log("   - loadPlatformSettings() - carrega configurações do admin");
console.log("   - getPlatformFee() - obtém taxa atual do banco");
console.log("   - calculatePoolValues() - calcula valores com taxa dinâmica");
console.log("🔧 MÉTODOS ATUALIZADOS:");
console.log("   - getChallenges() - inclui cálculos dinâmicos");
console.log("   - joinChallenge() - usa taxa atual");
console.log("   - getMyParticipations() - mostra valores reais");
console.log("📊 DADOS RETORNADOS:");
console.log("   - pool_calculations: {totalStakes, platformFee, feeAmount, availablePool}");
console.log("   - available_pool: valor líquido após taxa");
console.log("   - current_platform_fee: taxa atual em %");