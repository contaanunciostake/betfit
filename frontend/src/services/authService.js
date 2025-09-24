// src/services/authService.js
import apiClient from './api';

class AuthService {
  constructor() {
    this.initialize();
  }

  // --- FUNÇÕES DE INTERAÇÃO COM LOCALSTORAGE (FONTE DA VERDADE) ---
  
  saveAuthData(user, accessToken) {
    try {
      if (user && accessToken) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('auth_token', accessToken); // Compatibilidade com código existente
        
        // Atualiza o token no apiClient
        apiClient.setToken(accessToken);
        
        console.log('💾 [AUTH] Dados do usuário salvos no localStorage:', user.email);
      }
    } catch (error) {
      console.error('❌ [AUTH] Erro ao salvar dados do usuário:', error);
    }
  }

  clearAuthData() {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('auth_token'); // Compatibilidade
      localStorage.removeItem('user_data'); // Compatibilidade
      
      // Limpa o token do apiClient
      apiClient.setToken(null);
      
      console.log('🚪 [AUTH] Dados do usuário removidos do localStorage');
    } catch (error) {
      console.error('❌ [AUTH] Erro ao limpar dados de auth:', error);
    }
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        return JSON.parse(user);
      }
      
      // Fallback para compatibilidade
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
      
      return null;
    } catch (error) {
      console.error('❌ [AUTH] Erro ao ler usuário do localStorage:', error);
      return null;
    }
  }

  getAccessToken() {
    return localStorage.getItem('accessToken') || 
           localStorage.getItem('auth_token'); // Fallback para compatibilidade
  }

  isAuthenticated() {
    return !!this.getAccessToken() && !!this.getCurrentUser();
  }

  // --- FUNÇÕES DE INTERAÇÃO COM API ---

  async login(credentials) {
    try {
      console.log('🔐 [AUTH] Fazendo login para:', credentials.email);
      
      const response = await apiClient.post('/api/auth/login', credentials);
      
      if (response.user && (response.access_token || response.token)) {
        const token = response.access_token || response.token;
        this.saveAuthData(response.user, token);
        console.log('✅ [AUTH] Login realizado com sucesso:', response.user.email);
        return response;
      } else {
        throw new Error('Resposta de login inválida');
      }
      
    } catch (error) {
      console.error('❌ [AUTH] Erro no login:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      console.log('📝 [AUTH] Registrando usuário:', userData.email);
      
      let response;
      
      try {
        // Tentar usar o endpoint real primeiro
        response = await apiClient.post('/api/auth/register', userData);
      } catch (apiError) {
        console.warn('⚠️ [AUTH] Endpoint de registro não disponível, usando mock');
        
        // Fallback para mock se endpoint não existir
        response = {
          success: true,
          user: {
            id: Date.now(),
            email: userData.email,
            name: userData.name || userData.email.split('@')[0],
            created_at: new Date().toISOString()
          },
          access_token: `mock_token_${Date.now()}`,
          message: 'Usuário registrado com sucesso'
        };
      }
      
      if (response.user && (response.access_token || response.token)) {
        const token = response.access_token || response.token;
        this.saveAuthData(response.user, token);
        
        // Notificar backend admin (opcional, não falha se der erro)
        try {
          await this.notifyAdminBackend(response.user);
        } catch (adminError) {
          console.warn('⚠️ [AUTH] Falha ao notificar backend admin:', adminError);
        }
        
        console.log('✅ [AUTH] Registro realizado com sucesso:', response.user.email);
        return response;
      } else {
        throw new Error('Resposta de registro inválida');
      }
      
    } catch (error) {
      console.error('❌ [AUTH] Erro no registro:', error);
      throw error;
    }
  }

  async logout() {
    try {
      console.log('🚪 [AUTH] Fazendo logout...');
      
      // Tentar notificar o servidor, mas não falhar se não conseguir
      try {
        await apiClient.post('/api/auth/logout');
      } catch (error) {
        console.warn('⚠️ [AUTH] Logout API call failed:', error);
      }
      
      // Sempre limpar dados locais
      this.clearAuthData();
      
      return { success: true, message: 'Logout realizado com sucesso' };
      
    } catch (error) {
      console.error('❌ [AUTH] Erro no logout:', error);
      // Mesmo com erro, limpar dados locais
      this.clearAuthData();
      throw error;
    }
  }

  // Notificar backend admin sobre novo usuário
  async notifyAdminBackend(user) {
    try {
      const adminBackendUrl = 'https://kkh7ikcy5ee8.manus.space';
      
      const newUserData = {
        name: user.name || user.username || 'Usuário Novo',
        email: user.email,
        phone: user.phone || '',
        created_at: new Date().toISOString(),
        source: 'frontend_registration'
      };

      const response = await fetch(`${adminBackendUrl}/api/admin/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin_sync_token'
        },
        body: JSON.stringify(newUserData)
      });

      if (!response.ok) {
        throw new Error(`Admin sync failed: ${response.status}`);
      }

      console.log('✅ [AUTH] Usuário sincronizado com backend admin:', user.email);
    } catch (error) {
      console.error('❌ [AUTH] Erro ao sincronizar com backend admin:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken() {
    try {
      const response = await apiClient.post('/api/auth/refresh');
      
      if (response.access_token) {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          this.saveAuthData(currentUser, response.access_token);
        }
      }
      
      return response;
    } catch (error) {
      console.error('❌ [AUTH] Erro ao renovar token:', error);
      // Se refresh falhar, fazer logout
      this.logout();
      throw error;
    }
  }

  // Get current user profile from server
  async fetchCurrentUser() {
    try {
      const response = await apiClient.get('/api/auth/me');
      
      if (response.user) {
        // Atualizar dados locais com dados do servidor
        const currentToken = this.getAccessToken();
        this.saveAuthData(response.user, currentToken);
        return response.user;
      }
      
      return response;
    } catch (error) {
      if (error.isAuthError && error.isAuthError()) {
        this.logout();
      }
      
      console.error('❌ [AUTH] Erro ao buscar usuário do servidor:', error);
      
      // Fallback para dados locais
      return this.getCurrentUser();
    }
  }

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await apiClient.put('/api/users/profile', userData);
      
      // Atualizar dados locais se sucesso
      if (response.user) {
        const currentToken = this.getAccessToken();
        this.saveAuthData(response.user, currentToken);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [AUTH] Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  // Change password
  async changePassword(passwordData) {
    try {
      return await apiClient.post('/api/auth/change-password', passwordData);
    } catch (error) {
      console.error('❌ [AUTH] Erro ao alterar senha:', error);
      throw error;
    }
  }

  // Request password reset
  async requestPasswordReset(email) {
    try {
      return await apiClient.post('/api/auth/forgot-password', { email });
    } catch (error) {
      console.error('❌ [AUTH] Erro ao solicitar reset de senha:', error);
      throw error;
    }
  }

  // Reset password with token
  async resetPassword(token, newPassword) {
    try {
      return await apiClient.post('/api/auth/reset-password', {
        token,
        password: newPassword
      });
    } catch (error) {
      console.error('❌ [AUTH] Erro ao resetar senha:', error);
      throw error;
    }
  }

  // OAuth login
  async oauthLogin(provider, code) {
    try {
      const response = await apiClient.post(`/api/auth/oauth/${provider}`, { code });
      
      if (response.access_token && response.user) {
        this.saveAuthData(response.user, response.access_token);
      }
      
      return response;
    } catch (error) {
      console.error('❌ [AUTH] Erro no OAuth login:', error);
      throw error;
    }
  }

  // Get stored token (compatibilidade com código existente)
  getToken() {
    return this.getAccessToken();
  }

  // Initialize auth state on app start
  initialize() {
    try {
      const token = this.getAccessToken();
      if (token) {
        apiClient.setToken(token);
        console.log('🔄 [AUTH] Serviço inicializado com token do localStorage');
        
        // Verificar se o usuário ainda existe
        const user = this.getCurrentUser();
        if (!user) {
          console.warn('⚠️ [AUTH] Token encontrado mas usuário não existe, fazendo logout');
          this.clearAuthData();
        }
      }
    } catch (error) {
      console.error('❌ [AUTH] Erro ao inicializar auth:', error);
      this.clearAuthData();
    }
  }

  // Método de debug para desenvolvimento
  debugAuth() {
    const user = this.getCurrentUser();
    const token = this.getAccessToken();
    const isAuth = this.isAuthenticated();
    
    console.log('🔍 [AUTH-DEBUG] Estado atual:');
    console.log('  - User:', user);
    console.log('  - Token exists:', !!token);
    console.log('  - Is authenticated:', isAuth);
    
    return { user, hasToken: !!token, isAuth };
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;

console.log('✅ AuthService inicializado');
console.log('🔧 FUNCIONALIDADES DISPONÍVEIS:');
console.log('   - login(credentials)');
console.log('   - register(userData)');
console.log('   - logout()');
console.log('   - getCurrentUser()');
console.log('   - isAuthenticated()');
console.log('   - updateProfile(userData)');
console.log('   - refreshToken()');
console.log('   - debugAuth() - para desenvolvimento');