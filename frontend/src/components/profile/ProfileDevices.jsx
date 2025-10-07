import React, { useState, useEffect } from 'react';
import { Activity, Heart, Zap, Watch, CheckCircle, XCircle, Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const ProfileDevices = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Configuração da API
  const API_URL = import.meta.env.VITE_API_URL || 
                  import.meta.env.REACT_APP_API_URL || 
                  'https://betfit-backend.onrender.com';

  // Dispositivos disponíveis
  const availableDevices = [
    {
      id: 'fitbit',
      name: 'Fitbit',
      icon: Activity,
      color: 'from-teal-400 to-cyan-500',
      description: 'Rastreie seus treinos e atividades diárias'
    },
    {
      id: 'strava',
      name: 'Strava',
      icon: Zap,
      color: 'from-orange-400 to-red-500',
      description: 'Sincronize suas corridas e pedaladas'
    },
    {
      id: 'apple_health',
      name: 'Apple Health',
      icon: Heart,
      color: 'from-pink-400 to-rose-500',
      description: 'Conecte seus dados do iPhone'
    },
    {
      id: 'google_fit',
      name: 'Google Fit',
      icon: Watch,
      color: 'from-blue-400 to-indigo-500',
      description: 'Sincronize seus dados do Android'
    }
  ];

  // Buscar conexões do usuário
  useEffect(() => {
    fetchConnections();
  }, [user]);

  const fetchConnections = async () => {
    if (!user?.email) {
      console.log('❌ [DEVICES] Email do usuário não disponível');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('📡 [DEVICES] Buscando conexões para:', user.email);

      const response = await fetch(
        `${API_URL}/api/fitness/connections/${encodeURIComponent(user.email)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );

      const data = await response.json();
      console.log('📊 [DEVICES] Resposta:', data);

      if (data.success) {
        setConnections(data.connections || []);
        console.log('✅ [DEVICES] Conexões carregadas:', data.connections?.length || 0);
      } else {
        console.warn('⚠️ [DEVICES] Sem conexões:', data.error);
        setConnections([]);
      }
    } catch (err) {
      console.error('❌ [DEVICES] Erro ao buscar conexões:', err);
      setError('Erro ao carregar dispositivos conectados');
      setConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Conectar Fitbit
  const handleConnectFitbit = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('🔗 [FITBIT] Iniciando conexão para:', user.email);
      
      // ✅ VERIFICAR SE user.email EXISTE
      if (!user?.email) {
        setError('Email do usuário não disponível. Faça login novamente.');
        return;
      }
      
      // ✅ CONSTRUIR URL COM user_email
      const url = `${API_URL}/api/fitbit/connect?user_email=${encodeURIComponent(user.email)}`;
      
      console.log('📡 [FITBIT] URL da requisição:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      console.log('📊 [FITBIT] Status da resposta:', response.status);
      
      const data = await response.json();
      
      console.log('📊 [FITBIT] Dados recebidos:', data);
      
      if (data.success && data.authorization_url) {
        console.log('✅ [FITBIT] Redirecionando para autorização...');
        console.log('🔗 [FITBIT] URL:', data.authorization_url);
        
        // ✅ REDIRECIONAR PARA AUTORIZAÇÃO DO FITBIT
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Erro ao gerar URL de autorização');
      }
    } catch (err) {
      console.error('❌ [FITBIT] Erro:', err);
      setError(err.message || 'Erro ao conectar Fitbit');
    } finally {
      setIsConnecting(false);
    }
  };

  // Conectar Strava
  const handleConnectStrava = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('🔗 [STRAVA] Iniciando conexão para:', user.email);
      
      if (!user?.email) {
        setError('Email do usuário não disponível');
        return;
      }
      
      const url = `${API_URL}/api/strava/connect?user_email=${encodeURIComponent(user.email)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Erro ao conectar Strava');
      }
    } catch (err) {
      console.error('❌ [STRAVA] Erro:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar dispositivo
  const handleDisconnect = async (platform) => {
    try {
      console.log('🔌 [DEVICES] Desconectando:', platform);
      
      const response = await fetch(`${API_URL}/api/fitness/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          user_email: user.email,
          platform: platform
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ [DEVICES] Dispositivo desconectado');
        setSuccessMessage(`${platform} desconectado com sucesso!`);
        fetchConnections(); // Recarregar conexões
        
        // Limpar mensagem após 3s
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('❌ [DEVICES] Erro ao desconectar:', err);
      setError(err.message);
    }
  };

  // Verificar se dispositivo está conectado
  const isDeviceConnected = (deviceId) => {
    return connections.some(conn => 
      conn.platform === deviceId && conn.is_active
    );
  };

  // Handler para conexão baseado no dispositivo
  const handleConnect = (deviceId) => {
    switch(deviceId) {
      case 'fitbit':
        handleConnectFitbit();
        break;
      case 'strava':
        handleConnectStrava();
        break;
      case 'apple_health':
        setError('Apple Health em breve! Use Fitbit ou Strava por enquanto.');
        break;
      case 'google_fit':
        setError('Google Fit em breve! Use Fitbit ou Strava por enquanto.');
        break;
      default:
        setError('Dispositivo não suportado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dispositivos Conectados</h2>
        <p className="text-gray-600 mt-1">
          Conecte seus dispositivos fitness para participar de desafios
        </p>
      </div>

      {/* Mensagens */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-800">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Fechar
          </button>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : (
        /* Grid de Dispositivos */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableDevices.map((device) => {
            const Icon = device.icon;
            const isConnected = isDeviceConnected(device.id);
            
            return (
              <div
                key={device.id}
                className={`
                  relative overflow-hidden rounded-xl border-2 transition-all
                  ${isConnected 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-200 bg-white hover:border-cyan-400'
                  }
                `}
              >
                {/* Gradient Background */}
                <div className={`
                  absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${device.color}
                  opacity-10 rounded-full -mr-16 -mt-16
                `} />

                <div className="relative p-6">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-3 rounded-xl bg-gradient-to-br ${device.color}
                      `}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{device.name}</h3>
                        <p className="text-sm text-gray-500">{device.description}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isConnected && (
                      <div className="flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Conectado
                      </div>
                    )}
                  </div>

                  {/* Botão de Ação */}
                  <button
                    onClick={() => isConnected ? handleDisconnect(device.id) : handleConnect(device.id)}
                    disabled={isConnecting}
                    className={`
                      w-full py-3 rounded-lg font-medium transition-all
                      ${isConnected
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : `bg-gradient-to-r ${device.color} text-white hover:shadow-lg`
                      }
                      ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    {isConnecting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin" />
                        Conectando...
                      </span>
                    ) : isConnected ? (
                      'Desconectar'
                    ) : (
                      'Conectar'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Informações Adicionais */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Por que conectar dispositivos?</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Validação automática de desafios completados
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Prêmios liberados instantaneamente
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Acompanhamento em tempo real do progresso
          </li>
        </ul>
      </div>

      {/* Debug Info (apenas em desenvolvimento) */}
      {import.meta.env.DEV && (
        <div className="bg-gray-100 rounded-lg p-4 text-xs">
          <p className="font-mono">API URL: {API_URL}</p>
          <p className="font-mono">User Email: {user?.email || 'N/A'}</p>
          <p className="font-mono">Conexões: {connections.length}</p>
        </div>
      )}
    </div>
  );
};

export default ProfileDevices;
