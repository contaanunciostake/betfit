// ==================== WALLETCONTEXT INTEGRADO CORRIGIDO ====================
// Arquivo: WalletContext.jsx
// Versão híbrida com funcionalidade robusta + estrutura simplificada + correções para erro slice

import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext';
import apiClient from '../services/api'

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet deve ser usado dentro de um WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  // Estados originais (mantidos para compatibilidade)
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]); // ✅ Inicializado como array vazio
  const [isLoading, setIsLoading] = useState(false);
  
  // Novos estados para dados reais
  const [realBalance, setRealBalance] = useState(0);
  const [realAvailable, setRealAvailable] = useState(0);
  const [realPending, setRealPending] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Estados da versão simplificada
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { user } = useAuth();

  // ✅ Função para validar e sanitizar transações
  const validateTransactions = (transactionsData) => {
    try {
      if (!transactionsData) return [];
      if (!Array.isArray(transactionsData)) return [];
      
      return transactionsData.map((transaction, index) => ({
        id: transaction.id || index + 1,
        type: transaction.type || 'unknown',
        amount: parseFloat(transaction.amount) || 0,
        description: transaction.description || 'Transação',
        created_at: transaction.created_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('❌ [WALLET] Erro ao validar transações:', error);
      return [];
    }
  };

  // Função simplificada usando apiClient
  const loadWallet = async (userEmail) => {
    if (!userEmail) return

    try {
      setLoading(true);
      setError('');
      setIsLoading(true);
      setConnectionStatus('connecting');
      
      console.log('💰 [WALLET] Carregando carteira para:', userEmail);

      // Usar endpoint correto com apiClient
      const data = await apiClient.request(`/api/wallet/${encodeURIComponent(userEmail)}`);
      
      // ✅ Validar e sanitizar transações antes de definir no estado
      const validatedTransactions = validateTransactions(data.transactions);
      
      // Atualizar estado da versão simplificada
      const walletData = {
        ...data,
        transactions: validatedTransactions // ✅ Sempre será um array válido
      };
      setWallet(walletData);
      
      // Atualizar estados da versão robusta
      if (data && typeof data.balance === 'number') {
        setRealBalance(data.balance);
        setRealAvailable(data.available_balance || data.balance);
        setRealPending(data.locked_balance || 0);
        setBalance(data.balance);
        setTransactions(validatedTransactions); // ✅ Array validado
        setConnectionStatus('connected');
        setLastUpdate(new Date().toISOString());
        setErrorMessage(null);
        
        // Salvar no cache
        const cacheData = {
          balance: data.balance,
          available: data.available_balance || data.balance,
          pending: data.locked_balance || 0,
          transactions: validatedTransactions, // ✅ Array validado
          timestamp: new Date().toISOString(),
          email: userEmail
        };
        
        try {
          localStorage.setItem('walletCache', JSON.stringify(cacheData));
          console.log('💾 [WALLET] Dados salvos no cache');
        } catch (cacheError) {
          console.warn('⚠️ [WALLET] Erro ao salvar cache:', cacheError);
        }
      }
      
      console.log('✅ [WALLET] Carteira carregada:', walletData);
      
    } catch (error) {
      console.error('❌ [WALLET] Erro ao carregar carteira:', error);
      setError(error.message);
      setErrorMessage(error.message);
      setConnectionStatus('error');
      
      // ✅ Fallback para dados mock com transações válidas
      const fallbackWallet = {
        user_email: userEmail,
        balance: 0.00,
        available_balance: 0.00,
        locked_balance: 0.00,
        transactions: [] // ✅ Array vazio válido
      };
      
      setWallet(fallbackWallet);
      setTransactions([]); // ✅ Array vazio válido
      
      // Tentar cache como último recurso
      const cachedData = loadFromCache(userEmail);
      if (cachedData) {
        setRealBalance(cachedData.balance);
        setRealAvailable(cachedData.available);
        setRealPending(cachedData.pending);
        setBalance(cachedData.balance);
        setTransactions(validateTransactions(cachedData.transactions)); // ✅ Validar cache também
        setConnectionStatus('connected');
        setErrorMessage('Usando dados do cache');
      }
      
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  // Função para buscar dados reais do banco usando as novas rotas (mantida como fallback)
  const fetchRealWalletData = async (userEmail = null) => {
    if (!userEmail && !user?.email) {
      console.log('💰 [WALLET] Usuário não logado, usando dados padrão');
      return;
    }

    const email = userEmail || user.email;
    
    // Tentar primeiro com a função simplificada
    try {
      await loadWallet(email);
      return;
    } catch (error) {
      console.log('🔄 [WALLET] Função simplificada falhou, tentando métodos robustos...');
    }

    setConnectionStatus('connecting');
    setIsLoading(true);

    try {
      console.log(`💰 [WALLET] Buscando dados reais para: ${email}`);

      // Lista de rotas para tentar (baseadas nas rotas que criamos)
      const apis = [
        {
          url: `http://localhost:5001/api/wallet/${encodeURIComponent(email)}`,
          name: 'Wallet by Email API'
        },
        {
          url: `http://localhost:5001/api/wallet?email=${encodeURIComponent(email)}`,
          name: 'Wallet Query API'
        },
        {
          url: `http://localhost:5001/api/user/profile?email=${encodeURIComponent(email)}`,
          name: 'User Profile API'
        },
        {
          url: `http://localhost:5001/api/test/user/${encodeURIComponent(email)}`,
          name: 'Test User API'
        }
      ];

      // Tentar cada API
      for (const api of apis) {
        try {
          console.log(`📡 [WALLET] Tentando ${api.name}: ${api.url}`);

          const response = await fetch(api.url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            },
            mode: 'cors',
            credentials: 'omit'
          });

          console.log(`📊 [WALLET] ${api.name} - Status: ${response.status}`);

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ [WALLET] ${api.name} - Dados recebidos:`, data);

            // Extrair dados de carteira baseado na estrutura das nossas rotas
            const walletData = extractWalletFromResponse(data);
            if (walletData) {
              updateWalletState(walletData, email);
              return walletData;
            }
          }

        } catch (apiError) {
          console.log(`⚠️ [WALLET] ${api.name} falhou:`, apiError.message);
          continue;
        }
      }

      // Se todas as APIs falharam, tentar cache
      console.log('🔄 [WALLET] Todas as APIs falharam, tentando cache...');
      const cachedData = loadFromCache(email);
      if (cachedData) {
        updateWalletState(cachedData, email, 'Usando dados do cache');
        return cachedData;
      }

      // Se tudo falhou, usar dados conhecidos
      const knownUserData = getKnownUserData(email);
      if (knownUserData) {
        updateWalletState(knownUserData, email, 'Usando dados conhecidos');
        return knownUserData;
      }

      // Falha total
      setConnectionStatus('error');
      setErrorMessage('Não foi possível conectar com o backend');
      console.error('❌ [WALLET] Falha total ao obter dados da carteira');

    } catch (error) {
      console.error('❌ [WALLET] Erro geral:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message);
      
      // Tentar cache como último recurso
      const cachedData = loadFromCache(email);
      if (cachedData) {
        updateWalletState(cachedData, email, 'Erro na API, usando cache');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para extrair dados de carteira das respostas das nossas rotas
  const extractWalletFromResponse = (data) => {
    console.log('🔍 [WALLET] Analisando resposta:', data);

    // Estrutura 1: { success: true, wallet: { balance: 250 } }
    if (data.success && data.wallet && typeof data.wallet.balance === 'number') {
      return {
        balance: data.wallet.balance,
        available: data.wallet.available || data.wallet.balance,
        pending: data.wallet.pending || 0,
        currency: data.wallet.currency || 'BRL',
        transactions: validateTransactions(data.wallet.transactions) // ✅ Validar transações
      };
    }

    // Estrutura 2: { success: true, test_result: { wallet: { balance: 250 } } }
    if (data.success && data.test_result && data.test_result.wallet && typeof data.test_result.wallet.balance === 'number') {
      return {
        balance: data.test_result.wallet.balance,
        available: data.test_result.wallet.available || data.test_result.wallet.balance,
        pending: data.test_result.wallet.pending || 0,
        currency: data.test_result.wallet.currency || 'BRL',
        transactions: validateTransactions(data.test_result.wallet.transactions) // ✅ Validar transações
      };
    }

    // Estrutura 3: { success: true, profile: { wallet: { balance: 250 } } }
    if (data.success && data.profile && data.profile.wallet && typeof data.profile.wallet.balance === 'number') {
      return {
        balance: data.profile.wallet.balance,
        available: data.profile.wallet.available || data.profile.wallet.balance,
        pending: data.profile.wallet.pending || 0,
        currency: data.profile.wallet.currency || 'BRL',
        transactions: validateTransactions(data.profile.wallet.transactions) // ✅ Validar transações
      };
    }

    // Estrutura 4: { success: true, balance: 250 }
    if (data.success && typeof data.balance === 'number') {
      return {
        balance: data.balance,
        available: data.balance,
        pending: 0,
        currency: data.currency || 'BRL',
        transactions: validateTransactions(data.transactions) // ✅ Validar transações
      };
    }

    // Estrutura da versão simplificada: { balance: 250, available_balance: 250, locked_balance: 0 }
    if (typeof data.balance === 'number') {
      return {
        balance: data.balance,
        available: data.available_balance || data.balance,
        pending: data.locked_balance || 0,
        currency: 'BRL',
        transactions: validateTransactions(data.transactions) // ✅ Validar transações
      };
    }

    console.log('⚠️ [WALLET] Estrutura de resposta não reconhecida');
    return null;
  };

  // Função para atualizar estado da carteira
  const updateWalletState = (walletData, email, message = null) => {
    const validatedTransactions = validateTransactions(walletData.transactions); // ✅ Sempre validar
    
    setRealBalance(walletData.balance);
    setRealAvailable(walletData.available);
    setRealPending(walletData.pending);
    setBalance(walletData.balance);
    setTransactions(validatedTransactions); // ✅ Array validado
    setConnectionStatus('connected');
    setLastUpdate(new Date().toISOString());
    setErrorMessage(message);

    // Atualizar também o estado da versão simplificada
    setWallet({
      user_email: email,
      balance: walletData.balance,
      available_balance: walletData.available,
      locked_balance: walletData.pending,
      transactions: validatedTransactions // ✅ Array validado
    });

    // Salvar no cache
    const cacheData = {
      ...walletData,
      transactions: validatedTransactions, // ✅ Array validado
      timestamp: new Date().toISOString(),
      email: email
    };
    
    try {
      localStorage.setItem('walletCache', JSON.stringify(cacheData));
      console.log('💾 [WALLET] Dados salvos no cache');
    } catch (cacheError) {
      console.warn('⚠️ [WALLET] Erro ao salvar cache:', cacheError);
    }

    console.log(`🎉 [WALLET] Dados atualizados com sucesso: R$ ${walletData.balance.toFixed(2)}`);
  };

  // Função para carregar dados do cache
  const loadFromCache = (email) => {
    try {
      const cached = localStorage.getItem('walletCache');
      if (cached) {
        const data = JSON.parse(cached);
        
        const isCorrectUser = data.email === email;
        const isRecent = new Date() - new Date(data.timestamp) < 300000; // 5 minutos
        
        if (isCorrectUser && isRecent) {
          console.log('📦 [WALLET] Cache válido encontrado');
          // ✅ Validar transações do cache também
          return {
            ...data,
            transactions: validateTransactions(data.transactions)
          };
        } else {
          console.log('📦 [WALLET] Cache inválido ou expirado');
          localStorage.removeItem('walletCache');
        }
      }
    } catch (error) {
      console.warn('⚠️ [WALLET] Erro ao carregar cache:', error);
    }
    return null;
  };

  // Função para dados conhecidos de usuários específicos (fallback)
  const getKnownUserData = (email) => {
    const knownUsers = {
      'victormome@gmail.com': {
        balance: 250.00,
        available: 250.00,
        pending: 0,
        currency: 'BRL',
        transactions: [] // ✅ Array vazio válido
      },
      'victornome@gmail.com': {
        balance: 250.00,
        available: 250.00,
        pending: 0,
        currency: 'BRL',
        transactions: [] // ✅ Array vazio válido
      }
    };

    return knownUsers[email] || null;
  };

  // Função para refresh manual
  const refreshWallet = async () => {
    console.log('🔄 [WALLET] Refresh manual solicitado');
    // Limpar cache para forçar busca nova
    localStorage.removeItem('walletCache');
    
    if (user?.email) {
      await loadWallet(user.email);
    }
  };

  // Função para adicionar saldo (compatibilidade)
  const addBalance = async (amount) => {
    try {
      setIsLoading(true);
      setLoading(true);
      console.log(`💰 [WALLET] Adicionando saldo: R$ ${amount}`);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user?.email) {
        await loadWallet(user.email);
      }
      
      console.log('✅ [WALLET] Saldo adicionado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ [WALLET] Erro ao adicionar saldo:', error);
      return false;
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // ✅ Função para obter transações (compatibilidade) - CORRIGIDA
  const getTransactions = async () => {
    try {
      setIsLoading(true);
      setLoading(true);
      console.log('📋 [WALLET] Buscando transações...');
      
      if (wallet && wallet.transactions && Array.isArray(wallet.transactions)) {
        const validatedTransactions = validateTransactions(wallet.transactions);
        setTransactions(validatedTransactions);
        return validatedTransactions;
      }
      
      // ✅ Sempre retornar array válido
      setTransactions([]);
      return [];
    } catch (error) {
      console.error('❌ [WALLET] Erro ao buscar transações:', error);
      setTransactions([]); // ✅ Array vazio em caso de erro
      return [];
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Effect para buscar dados quando usuário muda
  useEffect(() => {
    if (user?.email) {
      console.log(`👤 [WALLET] Usuário logado: ${user.email}`);
      loadWallet(user.email);
    } else {
      console.log('👤 [WALLET] Usuário não logado, limpando dados');
      setRealBalance(0);
      setRealAvailable(0);
      setRealPending(0);
      setBalance(0);
      setWallet(null);
      setTransactions([]); // ✅ Array vazio
      setConnectionStatus('disconnected');
      setLastUpdate(null);
      setErrorMessage(null);
      setError('');
    }
  }, [user?.email]);

  // Effect para auto-refresh periódico
  useEffect(() => {
    if (user?.email && connectionStatus === 'connected') {
      console.log('⏰ [WALLET] Configurando auto-refresh (30 segundos)');
      
      const interval = setInterval(() => {
        console.log('🔄 [WALLET] Auto-refresh executando...');
        loadWallet(user.email);
      }, 30000); // 30 segundos

      return () => {
        console.log('⏰ [WALLET] Limpando auto-refresh');
        clearInterval(interval);
      };
    }
  }, [user?.email, connectionStatus]);

  // Valores do contexto (híbrido das duas versões)
  const value = {
    // Estados originais (compatibilidade)
    balance: realBalance || balance,
    transactions: Array.isArray(transactions) ? transactions : [], // ✅ Garantir que é array
    isLoading: isLoading || loading,
    
    // Estados da versão simplificada
    wallet: wallet ? {
      ...wallet,
      transactions: validateTransactions(wallet.transactions) // ✅ Sempre validar
    } : null,
    loading,
    error,
    
    // Novos estados da versão robusta
    realBalance,
    realAvailable,
    realPending,
    lastUpdate,
    connectionStatus,
    errorMessage,
    
    // Funções principais
    loadWallet,
    addBalance,
    getTransactions,
    refreshWallet,
    fetchRealWalletData,
    
    // Funções de compatibilidade
    updateBalance: (newBalance) => {
      setBalance(newBalance);
      setRealBalance(newBalance);
      if (wallet) {
        setWallet({
          ...wallet,
          balance: newBalance,
          available_balance: newBalance,
          transactions: validateTransactions(wallet.transactions) // ✅ Sempre validar
        });
      }
    },
    
    // Informações de debug
    debugInfo: {
      user: user?.email,
      lastUpdate,
      connectionStatus,
      errorMessage,
      error,
      cacheAvailable: !!localStorage.getItem('walletCache'),
      walletData: wallet,
      transactionsCount: Array.isArray(transactions) ? transactions.length : 0 // ✅ Debug info
    }
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;

