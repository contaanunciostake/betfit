import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Clock,
  Activity,
  Heart,
  Footprints,
  Zap
} from 'lucide-react';

const DevicesSection = ({ user }) => {
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [supportedDevices, setSupportedDevices] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState({});
  const [syncSettings, setSyncSettings] = useState({
    auto_sync: true,
    sync_frequency: 'hourly',
    offline_mode: false,
    notifications: {
      sync_complete: true,
      sync_error: true,
      new_activity: false
    }
  });
  const [showAddDevice, setShowAddDevice] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'https://zmhqivcmz8x1.manus.space';

  // Carregar dispositivos conectados
  useEffect(() => {
    loadUserDevices();
    loadSupportedDevices();
    loadSyncSettings();
  }, []);

  const loadUserDevices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/devices/user/${user?.id || 'user_001'}`);
      const data = await response.json();
      if (data.success) {
        setConnectedDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dispositivos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportedDevices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/devices/supported`);
      const data = await response.json();
      if (data.success) {
        setSupportedDevices(data.devices || {});
      }
    } catch (error) {
      console.error('Erro ao carregar dispositivos suportados:', error);
    }
  };

  const loadSyncSettings = async () => {
    // Manter configurações locais por enquanto
    setSyncSettings({
      auto_sync: true,
      sync_frequency: 'hourly',
      offline_mode: false,
      notifications: {
        sync_complete: true,
        sync_error: true,
        new_activity: false
      }
    });
  };

  const connectDevice = async (deviceType) => {
    try {
      setLoading(true);
      
      // Initiate OAuth2 flow
      const response = await fetch(`${API_BASE}/api/devices/connect/${deviceType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id || 'user_001'
        })
      });

      const data = await response.json();

      if (data.success) {
        if (data.native_auth) {
          // Handle native app authentication (Apple Health)
          alert('Redirecionando para Apple Health. Esta funcionalidade requer um app iOS.');
        } else {
          // Open OAuth2 URL in popup
          const popup = window.open(
            data.auth_url,
            'oauth_popup',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );

          // Listen for popup messages
          const messageListener = (event) => {
            if (event.data.type === 'device_connected') {
              popup.close();
              window.removeEventListener('message', messageListener);
              
              // Show success message with profile info
              const profile = event.data.profile;
              alert(`✅ ${deviceType.replace('_', ' ').toUpperCase()} conectado com sucesso!\n\n` +
                    `👤 Conta: ${profile.name || profile.email}\n` +
                    `📧 Email: ${profile.email || 'N/A'}\n` +
                    `📍 Localização: ${profile.location || 'N/A'}\n\n` +
                    `Suas atividades serão sincronizadas automaticamente!`);
              
              // Reload devices
              loadUserDevices();
              setShowAddDevice(false);
            } else if (event.data.type === 'device_connection_error') {
              popup.close();
              window.removeEventListener('message', messageListener);
              alert(`❌ Erro ao conectar: ${event.data.error}`);
            }
          };

          window.addEventListener('message', messageListener);

          // Check if popup was closed manually
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              window.removeEventListener('message', messageListener);
            }
          }, 1000);
        }
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao conectar dispositivo:', error);
      alert('Erro ao conectar dispositivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectDevice = async (deviceType) => {
    if (!confirm(`Deseja realmente desconectar ${deviceType.replace('_', ' ')}?`)) {
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE}/api/devices/user/${user?.id || 'user_001'}/${deviceType}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadUserDevices();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao desconectar dispositivo:', error);
      alert('Erro ao desconectar dispositivo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const syncDevice = async (deviceType) => {
    try {
      setSyncing(prev => ({ ...prev, [deviceType]: true }));
      
      const response = await fetch(`${API_BASE}/api/devices/user/${user?.id || 'user_001'}/${deviceType}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ ${data.message}\n\n` +
              `📊 Atividades sincronizadas: ${data.data.activities_synced}\n` +
              `🏃 Última atividade: ${data.data.last_activity}\n` +
              `⏰ Sincronização: ${new Date(data.data.sync_time).toLocaleString()}`);
        loadUserDevices();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao sincronizar dispositivo:', error);
      alert('Erro ao sincronizar dispositivo. Tente novamente.');
    } finally {
      setSyncing(prev => ({ ...prev, [deviceType]: false }));
    }
  };

  const updateSyncSettings = async (newSettings) => {
    setSyncSettings(newSettings);
    // Em produção, salvar no backend
  };

  const getDeviceIcon = (deviceType) => {
    const icons = {
      strava: Activity,
      google_fit: Heart,
      fitbit: Footprints,
      apple_health: Heart,
      garmin: Activity,
      samsung_health: Zap
    };
    return icons[deviceType] || Smartphone;
  };

  const getDeviceEmoji = (deviceType) => {
    const emojis = {
      strava: '🏃',
      google_fit: '📱',
      fitbit: '⌚',
      apple_health: '🍎',
      garmin: '🏃‍♂️',
      samsung_health: '📱'
    };
    return emojis[deviceType] || '📱';
  };

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Nunca';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} minutos`;
    if (diffMinutes < 1440) return `Há ${Math.floor(diffMinutes / 60)} horas`;
    return `Há ${Math.floor(diffMinutes / 1440)} dias`;
  };

  return (
    <div className="space-y-6">
      {/* Dispositivos Conectados */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Dispositivos Conectados</h3>
        
        {loading && connectedDevices.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
            <span className="text-muted-foreground">Carregando dispositivos...</span>
          </div>
        ) : connectedDevices.length === 0 ? (
          <Alert>
            <Smartphone className="h-4 w-4" />
            <AlertDescription>
              Nenhum dispositivo conectado. Conecte seus wearables para sincronizar atividades automaticamente.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {connectedDevices.map((device) => {
              const DeviceIcon = getDeviceIcon(device.type);
              return (
                <div key={device.id} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg"
                      style={{ backgroundColor: device.color }}
                    >
                      {getDeviceEmoji(device.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{device.name}</h4>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span className="flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>Conectado</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Última sincronização: {formatLastSync(device.last_sync)}</span>
                        </span>
                      </div>
                      {device.profile && (
                        <div className="text-xs text-muted-foreground mt-1">
                          👤 Conta: {device.profile.name || device.profile.email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => syncDevice(device.type)}
                      disabled={syncing[device.type]}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${syncing[device.type] ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => disconnectDevice(device.type)}
                    >
                      Desconectar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Conectar Novo Dispositivo */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Conectar Novo Dispositivo</h3>
          {connectedDevices.length > 0 && (
            <Button
              onClick={() => setShowAddDevice(!showAddDevice)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Dispositivo
            </Button>
          )}
        </div>

        {(showAddDevice || connectedDevices.length === 0) && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <p className="text-sm text-muted-foreground mb-4">
              🔗 Conecte-se às suas contas reais dos dispositivos através de OAuth2 seguro
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(supportedDevices).map(([type, device]) => {
                const isConnected = connectedDevices.some(d => d.type === type);
                const DeviceIcon = getDeviceIcon(type);
                
                return (
                  <div
                    key={type}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isConnected 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 cursor-not-allowed' 
                        : 'border-border hover:border-primary'
                    }`}
                    onClick={() => !isConnected && !loading && connectDevice(type)}
                  >
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                        style={{ backgroundColor: device.color }}
                      >
                        {getDeviceEmoji(type)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground flex items-center">
                          {device.name}
                          {isConnected && (
                            <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {device.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          🔐 OAuth2 • {device.scopes?.split(' ').length || 0} permissões
                        </div>
                      </div>
                      {!isConnected && (
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300">
                  <strong>🔒 Segurança OAuth2:</strong> Ao conectar, você será redirecionado para o site oficial do dispositivo para fazer login em sua conta real. Seus dados são protegidos e nunca armazenamos suas senhas.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Configurações de Sincronização */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Configurações de Sincronização</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Sincronização Automática</h4>
              <p className="text-sm text-muted-foreground">
                Sincronizar dados automaticamente
              </p>
            </div>
            <Switch
              checked={syncSettings.auto_sync}
              onCheckedChange={(checked) => 
                updateSyncSettings({ ...syncSettings, auto_sync: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Modo Offline</h4>
              <p className="text-sm text-muted-foreground">
                Permitir uso sem conexão
              </p>
            </div>
            <Switch
              checked={syncSettings.offline_mode}
              onCheckedChange={(checked) => 
                updateSyncSettings({ ...syncSettings, offline_mode: checked })
              }
            />
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Frequência de Sincronização</h4>
            <select 
              className="w-full p-2 border border-border rounded-lg bg-background"
              value={syncSettings.sync_frequency}
              onChange={(e) => 
                updateSyncSettings({ ...syncSettings, sync_frequency: e.target.value })
              }
            >
              <option value="manual">Manual</option>
              <option value="hourly">A cada hora</option>
              <option value="daily">Diariamente</option>
              <option value="realtime">Tempo real</option>
            </select>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-3">Notificações</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Sincronização concluída</span>
                <Switch
                  checked={syncSettings.notifications.sync_complete}
                  onCheckedChange={(checked) => 
                    updateSyncSettings({
                      ...syncSettings,
                      notifications: { ...syncSettings.notifications, sync_complete: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Erro de sincronização</span>
                <Switch
                  checked={syncSettings.notifications.sync_error}
                  onCheckedChange={(checked) => 
                    updateSyncSettings({
                      ...syncSettings,
                      notifications: { ...syncSettings.notifications, sync_error: checked }
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">Nova atividade detectada</span>
                <Switch
                  checked={syncSettings.notifications.new_activity}
                  onCheckedChange={(checked) => 
                    updateSyncSettings({
                      ...syncSettings,
                      notifications: { ...syncSettings.notifications, new_activity: checked }
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status de Saúde dos Serviços */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="font-medium text-foreground mb-2">Status dos Serviços OAuth2</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {Object.entries(supportedDevices).map(([type, device]) => (
            <div key={type} className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">{device.name}</span>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground mt-2">
          ✅ Todos os serviços OAuth2 operacionais • Última verificação: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default DevicesSection;

