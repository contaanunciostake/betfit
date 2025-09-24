import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Smartphone, 
  Apple, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Shield,
  Clock,
  Zap,
  Plus,
  Loader2,
  Power,
  ExternalLink,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProfileDevices = ({ devices = [], onConnectDevice, onDisconnectDevice }) => {
  const { user } = useAuth();
  const [fitnessConnections, setFitnessConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastSync, setLastSync] = useState(null);

  // Verificar se é app nativo
  const isNativeApp = () => {
    return window.webkit?.messageHandlers?.healthKit !== undefined;
  };

  const isWebBrowser = () => {
    return !isNativeApp();
  };

  // Dispositivos disponíveis - ADICIONADO APLICATIVO TESTE
  const availableDevices = [
    {
      id: 'apple_health',
      name: 'Apple Saúde (HealthKit)',
      type: 'apple_health',
      description: 'Conecte seu dispositivo Apple Health para validação automática',
      icon: Apple,
      emoji: '❤️',
      color: 'text-red-500',
      platform: 'iPhone',
      required: true,
      nativeOnly: true
    },
    {
      id: 'health_connect',
      name: 'Health Connect',
      type: 'health_connect',
      description: 'Para dispositivos Android compatíveis',
      icon: Activity,
      emoji: '📱',
      color: 'text-green-500',
      platform: 'Android',
      required: false,
      nativeOnly: true
    },
    {
      id: 'strava',
      name: 'Strava',
      type: 'strava',
      description: 'Conecte sua conta Strava para sincronizar atividades',
      icon: Activity,
      emoji: '🏃',
      color: 'text-orange-500',
      platform: 'Web/Mobile',
      required: false,
      nativeOnly: false
    },
    // APLICATIVO TESTE CORRIGIDO
    {
      id: 'teste',
      name: 'Teste',
      type: 'teste',
      description: 'Aplicativo de teste para simular vitórias e derrotas',
      icon: TestTube,
      emoji: '🧪',
      color: 'text-purple-500',
      platform: 'Web/Mobile',
      required: false,
      nativeOnly: false,
      isMock: true
    }
  ];

  // CORREÇÃO PRINCIPAL: Carregar conexões com melhor tratamento de erros e debug
  const loadFitnessConnections = async (forceReload = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!user?.email) {
        console.warn('❌ Usuário não autenticado');
        setFitnessConnections([]);
        return;
      }

      console.log('🔍 [LOAD_CONNECTIONS] Carregando conexões para:', user.email, forceReload ? '(forçado)' : '');
      
      // CORREÇÃO: Tentar carregar do backend primeiro COM MELHOR DEBUG
      let backendConnections = [];
      let backendSuccess = false;
      
      try {
        const token = localStorage.getItem('token');
        const url = `http://localhost:5001/api/fitness/connections/${user.email}`;
        
        console.log('📡 [LOAD_CONNECTIONS] Fazendo requisição para:', url);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📡 [LOAD_CONNECTIONS] Status da resposta:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 [LOAD_CONNECTIONS] Dados recebidos do backend:', data);
          
          if (data.success && data.connections) {
            backendConnections = data.connections.filter(conn => conn.is_active);
            backendSuccess = true;
            console.log('✅ [LOAD_CONNECTIONS] Conexões ativas do backend:', backendConnections.length);
            
            // CORREÇÃO: Garantir que cada conexão tenha um ID único
            backendConnections = backendConnections.map(conn => ({
              ...conn,
              id: conn.id || `${conn.platform}_${conn.user_id || user.id}`,
              display_name: getDeviceDisplayName(conn.platform)
            }));
            
          } else {
            console.warn('⚠️ [LOAD_CONNECTIONS] Resposta do backend sem conexões:', data);
          }
        } else {
          const errorText = await response.text();
          console.warn('⚠️ [LOAD_CONNECTIONS] Resposta não OK:', response.status, errorText);
        }
      } catch (backendError) {
        console.warn('⚠️ [LOAD_CONNECTIONS] Erro no backend:', backendError.message);
      }

      // CORREÇÃO: Se backend funcionou, usar dados do backend
      if (backendSuccess && backendConnections.length > 0) {
        setFitnessConnections(backendConnections);
        setLastSync(new Date());
        saveToLocalStorage(backendConnections);
        console.log('✅ [LOAD_CONNECTIONS] Usando dados do backend:', backendConnections);
        return;
      }

      // Fallback para localStorage apenas se backend não retornou dados
      console.log('📱 [LOAD_CONNECTIONS] Tentando carregar do localStorage...');
      const storageKey = `fitness_connections_${user.email}`;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          const connections = parsedData.connections || parsedData;
          const activeConnections = connections.filter(conn => conn.is_active);
          
          // CORREÇÃO: Garantir que conexões do localStorage tenham IDs
          const formattedConnections = activeConnections.map(conn => ({
            ...conn,
            id: conn.id || `${conn.platform}_${conn.user_id || user.id}`,
            display_name: getDeviceDisplayName(conn.platform)
          }));
          
          setFitnessConnections(formattedConnections);
          setLastSync(new Date(parsedData.lastUpdate || Date.now()));
          console.log('📱 [LOAD_CONNECTIONS] Conexões carregadas do localStorage:', formattedConnections.length);
        } catch (parseError) {
          console.error('❌ [LOAD_CONNECTIONS] Erro ao parsear localStorage:', parseError);
          setFitnessConnections([]);
        }
      } else {
        setFitnessConnections([]);
        console.log('📝 [LOAD_CONNECTIONS] Nenhuma conexão encontrada');
      }
      
    } catch (error) {
      console.error('❌ [LOAD_CONNECTIONS] Erro geral:', error);
      setError('Erro ao carregar dispositivos conectados');
      setFitnessConnections([]);
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Função para obter nome de exibição do dispositivo
  const getDeviceDisplayName = (platform) => {
    const deviceMap = {
      'teste': 'Teste',
      'apple_health': 'Apple Saúde',
      'health_connect': 'Health Connect',
      'strava': 'Strava'
    };
    return deviceMap[platform] || platform;
  };

  // CORREÇÃO: Salvar no localStorage com formato consistente
  const saveToLocalStorage = (connections) => {
    try {
      const storageKey = `fitness_connections_${user.email}`;
      const dataToSave = {
        connections,
        lastUpdate: new Date().toISOString(),
        version: '2.0'
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
      console.log('💾 [SAVE_STORAGE] Conexões salvas no localStorage:', connections.length);
    } catch (error) {
      console.error('❌ [SAVE_STORAGE] Erro ao salvar no localStorage:', error);
    }
  };

  // Carregar conexões existentes - CORREÇÃO: Melhor controle de carregamento
  useEffect(() => {
    if (user?.email) {
      console.log('👤 [USEEFFECT] Usuário autenticado, carregando conexões...');
      loadFitnessConnections();
    } else {
      console.log('👤 [USEEFFECT] Usuário não autenticado');
      setFitnessConnections([]);
    }
  }, [user?.email]);

  // Verificar se dispositivo está conectado
  const isDeviceConnected = (deviceType) => {
    const connected = fitnessConnections.some(conn => 
      conn.platform === deviceType && conn.is_active
    );
    console.log(`🔍 [IS_CONNECTED] Dispositivo ${deviceType} conectado:`, connected);
    return connected;
  };

  // CORREÇÃO PRINCIPAL: Conectar dispositivo com recarregamento forçado
  const handleConnectDevice = async (device) => {
    try {
      setConnecting(device.id);
      setError(null);
      setSuccess(null);

      // 1. VERIFICAR LOGIN OBRIGATÓRIO
      if (!user?.email) {
        throw new Error('Faça login primeiro para conectar dispositivos');
      }

      console.log('🔗 [CONNECT] Conectando dispositivo:', device.name);

      // 2. VALIDAÇÃO ESPECÍFICA POR TIPO
      if (device.type === 'apple_health') {
        await connectHealthKit(device);
      } else if (device.type === 'health_connect') {
        await connectHealthConnect(device);
      } else if (device.type === 'strava') {
        await connectStrava(device);
      } else if (device.type === 'teste') {
        await connectTestApp(device);
      }

      // 3. CORREÇÃO PRINCIPAL: RECARREGAR CONEXÕES COM DELAY E FORÇA
      console.log('🔄 [CONNECT] Recarregando conexões após conexão...');
      
      // Aguardar um pouco para o backend processar
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Forçar recarregamento
      await loadFitnessConnections(true);
      
      if (onConnectDevice) {
        onConnectDevice(device.type);
      }

    } catch (error) {
      console.error('❌ [CONNECT] Erro ao conectar dispositivo:', error);
      setError(error.message || `Erro ao conectar ${device.name}`);
    } finally {
      setConnecting(null);
    }
  };

  // CORREÇÃO PRINCIPAL: Conectar aplicativo de teste com registro no backend
  const connectTestApp = async (device) => {
    try {
      console.log('🧪 [CONNECT_TEST] Conectando aplicativo de teste...');
      
      // 1. VERIFICAR LOGIN OBRIGATÓRIO
      if (!user?.email) {
        throw new Error('Faça login primeiro para conectar o aplicativo de teste');
      }

      // 2. SIMULAR DELAY DE CONEXÃO
      await new Promise(resolve => setTimeout(resolve, 1500));

      // 3. CRIAR CONEXÃO MOCK
      const mockConnection = {
        user_email: user.email,
        platform: 'teste',
        device_id: `teste_${Math.random().toString(36).substr(2, 9)}`,
        is_active: true,
        connected_at: new Date().toISOString(),
        last_sync: new Date().toISOString(),
        permissions: ['mock_activities', 'mock_challenges'],
        metadata: {
          total_activities: 0,
          total_wins: 0,
          total_losses: 0,
          last_activity: null
        }
      };

      // 4. CORREÇÃO PRINCIPAL: REGISTRAR NO BACKEND PRIMEIRO
      let backendConnection = null;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/fitness/connect-test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(mockConnection)
        });

        console.log('📡 [CONNECT_TEST] Resposta do backend:', response.status);

        if (response.ok) {
          const result = await response.json();
          console.log('📡 [CONNECT_TEST] Resultado do backend:', result);
          
          if (result.success) {
            backendConnection = result.connection;
            console.log('✅ [CONNECT_TEST] Dispositivo teste registrado no backend:', backendConnection);
          } else {
            throw new Error(result.error || 'Falha ao registrar no backend');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Erro HTTP ${response.status}`);
        }
      } catch (backendError) {
        console.warn('⚠️ [CONNECT_TEST] Erro no backend:', backendError.message);
        // Se o backend falhar, usar dados locais mas avisar o usuário
        backendConnection = { ...mockConnection, id: `local_${Date.now()}` };
        setError('Dispositivo conectado localmente. Verifique a conexão com o servidor para sincronização completa.');
      }

      // 5. CORREÇÃO: ATUALIZAR ESTADO IMEDIATAMENTE
      const connectionToSave = {
        ...backendConnection,
        id: backendConnection.id || `teste_${Date.now()}`,
        display_name: 'Teste',
        is_active: true
      };
      
      // Atualizar estado local imediatamente
      const updatedConnections = [...fitnessConnections, connectionToSave];
      setFitnessConnections(updatedConnections);
      saveToLocalStorage(updatedConnections);
      setLastSync(new Date());

      // 6. INICIAR SIMULAÇÃO DE ATIVIDADES
      startMockActivitySimulation(user.email);

      setSuccess(`Aplicativo de teste conectado com sucesso! Agora você pode simular vitórias e derrotas.`);
      console.log('✅ [CONNECT_TEST] Aplicativo de teste conectado:', connectionToSave);
      
      return connectionToSave;

    } catch (error) {
      console.error('❌ [CONNECT_TEST] Erro ao conectar aplicativo de teste:', error);
      throw error;
    }
  };

  // Simulação de atividades
  const startMockActivitySimulation = (userEmail) => {
    console.log('🎮 [MOCK_SIM] Iniciando simulação para:', userEmail);
    
    const intervalId = setInterval(() => {
      simulateMockActivity(userEmail);
    }, 45000);

    localStorage.setItem(`mock_simulation_${userEmail}`, intervalId.toString());
    setTimeout(() => simulateMockActivity(userEmail), 5000);
  };

  const simulateMockActivity = async (userEmail) => {
    const activities = [
      { type: 'corrida', distance: Math.floor(Math.random() * 10) + 1, duration: Math.floor(Math.random() * 60) + 10 },
      { type: 'caminhada', distance: Math.floor(Math.random() * 5) + 1, duration: Math.floor(Math.random() * 30) + 15 },
      { type: 'ciclismo', distance: Math.floor(Math.random() * 20) + 5, duration: Math.floor(Math.random() * 90) + 20 }
    ];

    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const isWin = Math.random() > 0.3;

    const mockData = {
      user_email: userEmail,
      platform: 'teste',
      activity_type: randomActivity.type,
      distance: randomActivity.distance,
      duration: randomActivity.duration,
      calories: Math.floor(randomActivity.duration * 8),
      timestamp: new Date().toISOString(),
      result: isWin ? 'win' : 'loss'
    };

    const resultEmoji = isWin ? '🏆' : '😔';
    const resultText = isWin ? 'Vitória' : 'Derrota';
    
    setSuccess(
      `${resultEmoji} Atividade simulada: ${randomActivity.type} - ${randomActivity.distance}km em ${randomActivity.duration}min (${resultText})`
    );

    await sendMockDataToBackend(mockData);
  };

  const sendMockDataToBackend = async (mockData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/fitness/mock-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(mockData)
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.challenge_validations?.completed_challenges?.length > 0) {
          const challenge = result.challenge_validations.completed_challenges[0];
          setTimeout(() => {
            setSuccess(
              `🏆 Parabéns! Você completou o "${challenge.challenge_title}" e ganhou R$ ${challenge.prize_amount.toFixed(2)}!`
            );
          }, 2000);
        }

        console.log('✅ [MOCK_BACKEND] Dados enviados:', result);
        return result;
      }
    } catch (error) {
      console.error('❌ [MOCK_BACKEND] Erro:', error);
    }
  };

  const stopMockActivitySimulation = (userEmail) => {
    const intervalId = localStorage.getItem(`mock_simulation_${userEmail}`);
    if (intervalId) {
      clearInterval(parseInt(intervalId));
      localStorage.removeItem(`mock_simulation_${userEmail}`);
    }
  };

  // Conectar outros dispositivos (simplificado)
  const connectHealthKit = async (device) => {
    if (!isNativeApp()) {
      throw new Error('HealthKit disponível apenas no app móvel oficial.');
    }
    throw new Error('HealthKit ainda não implementado nesta versão');
  };

  const connectHealthConnect = async (device) => {
    if (!isNativeApp()) {
      throw new Error('Health Connect disponível apenas no app móvel oficial.');
    }
    throw new Error('Health Connect ainda não implementado nesta versão');
  };

  const connectStrava = async (device) => {
    throw new Error('Strava ainda não implementado nesta versão');
  };

  // Desconectar dispositivo
  const handleDisconnectDevice = async (device) => {
    try {
      const confirmed = window.confirm(
        `Tem certeza que deseja desconectar ${device.name}?`
      );

      if (!confirmed) return;

      setConnecting(device.id);

      if (device.type === 'teste') {
        stopMockActivitySimulation(user.email);
      }

      // Desconectar no backend
      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:5001/api/fitness/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            user_email: user.email,
            platform: device.type
          })
        });
      } catch (error) {
        console.warn('Erro ao desconectar no backend:', error);
      }

      // Remover localmente
      const updatedConnections = fitnessConnections.filter(conn => conn.platform !== device.type);
      setFitnessConnections(updatedConnections);
      saveToLocalStorage(updatedConnections);
      setLastSync(new Date());
      
      setSuccess(`${device.name} desconectado com sucesso.`);
      
      setTimeout(() => loadFitnessConnections(true), 500);
      
      if (onDisconnectDevice) {
        onDisconnectDevice(device.id);
      }

    } catch (error) {
      console.error('Erro ao desconectar:', error);
      setError(error.message || `Erro ao desconectar ${device.name}`);
    } finally {
      setConnecting(null);
    }
  };

  // Encontrar dispositivo por conexão
  const findDeviceByConnection = (connection) => {
    return availableDevices.find(device => device.type === connection.platform);
  };

  // Limpar mensagens
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (user?.email) {
        stopMockActivitySimulation(user.email);
      }
    };
  }, [user?.email]);

  const activeConnections = fitnessConnections.filter(conn => conn.is_active);

  console.log('🔍 [RENDER] Estado atual:', {
    fitnessConnections: fitnessConnections.length,
    activeConnections: activeConnections.length,
    isLoading,
    user: user?.email
  });

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* Dispositivos Conectados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Dispositivos Conectados</span>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {activeConnections.length} ativos
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFitnessConnections(true)}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando dispositivos...</span>
            </div>
          ) : activeConnections.length === 0 ? (
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
              <Smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">Nenhum dispositivo conectado</h3>
              <p className="mt-1 text-sm text-muted-foreground">Conecte seus dispositivos para validação automática de atividades.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeConnections.map(connection => {
                const device = findDeviceByConnection(connection);
                if (!device) return null;

                const IconComponent = device.icon;
                
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{device.emoji}</span>
                        <IconComponent className={`w-6 h-6 ${device.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{device.name}</h3>
                          <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Conectado
                          </Badge>
                          {device.isMock && (
                            <Badge variant="outline" className="text-xs text-purple-600">
                              Mock
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{device.platform}</p>
                        {connection.last_sync && (
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              Última sincronização: {new Date(connection.last_sync).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDisconnectDevice(device)}
                      disabled={connecting === device.id}
                    >
                      {connecting === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Desconectar'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispositivos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-primary" />
            <span>Dispositivos Disponíveis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availableDevices.map(device => {
              const isConnected = isDeviceConnected(device.type);
              const IconComponent = device.icon;
              const requiresNativeApp = device.nativeOnly && isWebBrowser();
              
              if (isConnected) return null;
              
              return (
                <div key={device.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{device.emoji}</span>
                      <div className="p-2 bg-muted rounded-lg">
                        <IconComponent className={`w-6 h-6 ${device.color}`} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-foreground">{device.name}</h4>
                        {device.required && (
                          <Badge variant="outline" className="text-xs">
                            Recomendado
                          </Badge>
                        )}
                        {device.isMock && (
                          <Badge variant="outline" className="text-xs text-purple-600">
                            Mock
                          </Badge>
                        )}
                        {requiresNativeApp && (
                          <Badge variant="outline" className="text-xs text-orange-600">
                            App Móvel
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{device.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plataforma: {device.platform}
                      </p>
                    </div>
                  </div>
                  {requiresNativeApp ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>App Móvel</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleConnectDevice(device)}
                      disabled={connecting === device.id}
                      size="sm"
                      className="flex items-center space-x-2"
                    >
                      {connecting === device.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      <span>
                        {connecting === device.id ? 'Conectando...' : 'Conectar'}
                      </span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status da Sincronização */}
      {lastSync && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Última atualização: {lastSync.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sistema ativo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfileDevices;

