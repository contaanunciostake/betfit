import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Initial state - agora usa o authService como fonte da verdade
const initialState = {
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  isLoading: false, // Carregamento inicial é síncrono
  error: null,
};

// Action types (simplificado)
const AUTH_ACTIONS = {
  REQUEST_START: 'REQUEST_START',
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  REQUEST_FAILURE: 'REQUEST_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER_DATA: 'UPDATE_USER_DATA',
  CLEAR_ERROR: 'CLEAR_ERROR',
  REFRESH_STATE: 'REFRESH_STATE' // Para sincronizar com localStorage
};

// Reducer (simplificado e otimizado)
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.REQUEST_START:
      return { 
        ...state, 
        isLoading: true, 
        error: null 
      };

    case AUTH_ACTIONS.AUTH_SUCCESS:
      return { 
        ...state, 
        user: action.payload, 
        isAuthenticated: true, 
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.REQUEST_FAILURE:
      return { 
        ...state, 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: action.payload 
      };

    case AUTH_ACTIONS.LOGOUT:
      return { 
        user: null, 
        isAuthenticated: false, 
        isLoading: false, 
        error: null 
      };

    case AUTH_ACTIONS.UPDATE_USER_DATA:
      return { 
        ...state, 
        user: { ...state.user, ...action.payload } 
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { 
        ...state, 
        error: null 
      };

    case AUTH_ACTIONS.REFRESH_STATE:
      return {
        ...state,
        user: authService.getCurrentUser(),
        isAuthenticated: authService.isAuthenticated()
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Monitorar mudanças no localStorage para sincronização
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' || e.key === 'accessToken') {
        console.log('Storage change detected, refreshing auth state');
        dispatch({ type: AUTH_ACTIONS.REFRESH_STATE });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Verificar impersonificação de admin na inicialização
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const adminToken = urlParams.get('admin_token');
    const userId = urlParams.get('user_id');
    
    if (adminToken && userId) {
      handleAdminImpersonation(adminToken, userId);
      // Limpar parâmetros da URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Função para lidar com impersonificação de admin
  const handleAdminImpersonation = async (adminToken, userId) => {
    dispatch({ type: AUTH_ACTIONS.REQUEST_START });

    try {
      // Simular dados do usuário baseado no userId
      const userData = {
        id: userId,
        name: userId === 'user_001' ? 'João Silva Teste' : 'Usuário Admin',
        email: userId === 'user_001' ? 'joao.teste@email.com' : 'admin@email.com',
        isAdminImpersonation: true,
        adminToken: adminToken
      };

      // Salvar dados via authService
      authService.saveAuthData(userData, adminToken);
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: userData 
      });
      
      console.log('Login via impersonificação realizado com sucesso:', userData);
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.REQUEST_FAILURE, payload: error.message });
    }
  };

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.REQUEST_START });
    
    try {
      const response = await authService.login(credentials);
      console.log('Login realizado com sucesso:', response.user?.email);
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.user 
      });
      
      return response;
    } catch (error) {
      console.error('Erro no login:', error);
      dispatch({ type: AUTH_ACTIONS.REQUEST_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REQUEST_START });
    
    try {
      const response = await authService.register(userData);
      console.log('Registro realizado com sucesso:', response.user?.email);
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.user 
      });
      
      return response;
    } catch (error) {
      console.error('Erro no registro:', error);
      dispatch({ type: AUTH_ACTIONS.REQUEST_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      console.log('Logout realizado com sucesso');
    } catch (error) {
      console.warn('Erro no logout:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Update user profile
  const updateUser = async (userData) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      dispatch({ type: AUTH_ACTIONS.UPDATE_USER_DATA, payload: updatedUser.user || updatedUser });
      console.log('Perfil do usuário atualizado:', updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };

  // Update local user data (sem API call)
  const updateUserLocal = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER_DATA, payload: userData });
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      return await authService.changePassword(passwordData);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      throw error;
    }
  };

  // OAuth login
  const oauthLogin = async (provider, code) => {
    dispatch({ type: AUTH_ACTIONS.REQUEST_START });

    try {
      const response = await authService.oauthLogin(provider, code);
      console.log('OAuth login realizado com sucesso:', response.user?.email);
      
      dispatch({ 
        type: AUTH_ACTIONS.AUTH_SUCCESS, 
        payload: response.user 
      });
      
      return response;
    } catch (error) {
      console.error('Erro no OAuth login:', error);
      dispatch({ type: AUTH_ACTIONS.REQUEST_FAILURE, payload: error.message });
      throw error;
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Refresh user data from server
  const refreshUser = async () => {
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      const user = await authService.fetchCurrentUser();
      if (user) {
        dispatch({ type: AUTH_ACTIONS.AUTH_SUCCESS, payload: user });
        console.log('Dados do usuário atualizados do servidor');
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      // Se falhar, sincronizar com localStorage
      dispatch({ type: AUTH_ACTIONS.REFRESH_STATE });
    }
  };

  // Request password reset
  const requestPasswordReset = async (email) => {
    try {
      return await authService.requestPasswordReset(email);
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (token, newPassword) => {
    try {
      return await authService.resetPassword(token, newPassword);
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      throw error;
    }
  };

  // Debug function para desenvolvimento
  const debugAuth = () => {
    const serviceDebug = authService.debugAuth();
    const contextDebug = {
      contextUser: state.user,
      contextIsAuth: state.isAuthenticated,
      contextError: state.error,
      contextLoading: state.isLoading
    };

    console.log('🔍 [AUTH-CONTEXT] Estado do contexto vs serviço:');
    console.log('   Contexto:', contextDebug);
    console.log('   Serviço:', serviceDebug);

    return { context: contextDebug, service: serviceDebug };
  };

  // Get current user email (para compatibilidade)
  const getCurrentUserEmail = () => {
    const email = state.user?.email;
    console.log('Email do usuário atual:', email);
    return email;
  };

  // Context value
  const value = {
    // Estado
    ...state,
    
    // Funções principais
    login,
    register,
    logout,
    
    // Funções de perfil
    updateUser,
    updateUserLocal,
    refreshUser,
    
    // Funções de senha
    changePassword,
    requestPasswordReset,
    resetPassword,
    
    // Outras funções
    oauthLogin,
    clearError,
    getCurrentUserEmail,
    
    // Debug (apenas em desenvolvimento)
    ...(process.env.NODE_ENV === 'development' && { debugAuth })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;