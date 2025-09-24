// Device Service - Real data synchronization with OAuth2 devices
const API_BASE = process.env.REACT_APP_API_URL || 'https://zmhqivcmz8x1.manus.space';

class DeviceService {
  constructor() {
    this.syncInterval = null;
    this.listeners = new Set();
  }

  // Event listener management
  addEventListener(listener) {
    this.listeners.add(listener);
  }

  removeEventListener(listener) {
    this.listeners.delete(listener);
  }

  notifyListeners(event) {
    this.listeners.forEach(listener => listener(event));
  }

  // Get supported devices with OAuth2 configuration
  async getSupportedDevices() {
    try {
      const response = await fetch(`${API_BASE}/api/devices/supported`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          devices: data.devices
        };
      }
      
      throw new Error(data.error || 'Erro ao carregar dispositivos suportados');
    } catch (error) {
      console.error('DeviceService.getSupportedDevices:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's connected devices
  async getUserDevices(userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE}/api/devices/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          devices: data.devices || [],
          total: data.total || 0
        };
      }
      
      throw new Error(data.error || 'Erro ao carregar dispositivos do usuário');
    } catch (error) {
      console.error('DeviceService.getUserDevices:', error);
      return {
        success: false,
        error: error.message,
        devices: []
      };
    }
  }

  // Initiate OAuth2 connection flow
  async connectDevice(deviceType, userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE}/api/devices/connect/${deviceType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.notifyListeners({
          type: 'device_connection_initiated',
          deviceType,
          authUrl: data.auth_url,
          nativeAuth: data.native_auth
        });

        return {
          success: true,
          authUrl: data.auth_url,
          state: data.state,
          nativeAuth: data.native_auth,
          message: data.message
        };
      }
      
      throw new Error(data.error || 'Erro ao iniciar conexão');
    } catch (error) {
      console.error('DeviceService.connectDevice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disconnect device
  async disconnectDevice(deviceType, userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE}/api/devices/user/${userId}/${deviceType}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.notifyListeners({
          type: 'device_disconnected',
          deviceType,
          message: data.message
        });

        return {
          success: true,
          message: data.message
        };
      }
      
      throw new Error(data.error || 'Erro ao desconectar dispositivo');
    } catch (error) {
      console.error('DeviceService.disconnectDevice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Manual sync device data
  async syncDevice(deviceType, userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE}/api/devices/user/${userId}/${deviceType}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.success) {
        this.notifyListeners({
          type: 'device_synced',
          deviceType,
          data: data.data,
          message: data.message
        });

        return {
          success: true,
          message: data.message,
          data: data.data
        };
      }
      
      throw new Error(data.error || 'Erro ao sincronizar dispositivo');
    } catch (error) {
      console.error('DeviceService.syncDevice:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user activities from all connected devices
  async getUserActivities(userId = 'user_001', limit = 20) {
    try {
      const response = await fetch(`${API_BASE}/api/devices/activities/user/${userId}?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          activities: data.activities || [],
          total: data.total || 0
        };
      }
      
      throw new Error(data.error || 'Erro ao carregar atividades');
    } catch (error) {
      console.error('DeviceService.getUserActivities:', error);
      return {
        success: false,
        error: error.message,
        activities: []
      };
    }
  }

  // Validate activity for challenge
  async validateActivity(activityId, challengeId, userId = 'user_001') {
    try {
      const response = await fetch(`${API_BASE}/api/devices/validate-activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          activity_id: activityId,
          challenge_id: challengeId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.notifyListeners({
          type: 'activity_validated',
          activityId,
          challengeId,
          validation: data.validation
        });

        return {
          success: true,
          validation: data.validation
        };
      }
      
      throw new Error(data.error || 'Erro ao validar atividade');
    } catch (error) {
      console.error('DeviceService.validateActivity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get device health status
  async getDeviceHealth() {
    try {
      const response = await fetch(`${API_BASE}/api/devices/health`);
      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          status: data.status,
          services: data.oauth_services,
          stats: {
            connectedUsers: data.connected_users,
            totalDevices: data.total_devices,
            lastSync: data.last_sync
          }
        };
      }
      
      throw new Error(data.error || 'Erro ao verificar saúde dos dispositivos');
    } catch (error) {
      console.error('DeviceService.getDeviceHealth:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Format activity data for display
  formatActivity(activity) {
    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      date: new Date(activity.start_time).toLocaleDateString('pt-BR'),
      time: new Date(activity.start_time).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      duration: this.formatDuration(activity.duration),
      distance: activity.distance ? `${activity.distance.toFixed(1)} km` : null,
      calories: activity.calories ? `${activity.calories} cal` : null,
      heartRate: activity.avg_heart_rate ? `${activity.avg_heart_rate} bpm` : null,
      device: activity.device_name,
      verified: activity.verified,
      icon: this.getActivityIcon(activity.type)
    };
  }

  // Format duration in seconds to human readable
  formatDuration(seconds) {
    if (!seconds) return '0min';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  }

  // Get activity type icon
  getActivityIcon(type) {
    const icons = {
      running: '🏃‍♂️',
      cycling: '🚴‍♂️',
      swimming: '🏊‍♂️',
      walking: '🚶‍♂️',
      workout: '💪',
      yoga: '🧘‍♀️',
      hiking: '🥾',
      tennis: '🎾',
      football: '⚽',
      basketball: '🏀'
    };
    return icons[type] || '🏃‍♂️';
  }

  // Get device color
  getDeviceColor(deviceType) {
    const colors = {
      strava: '#FC4C02',
      google_fit: '#4285F4',
      fitbit: '#00B0B9',
      apple_health: '#000000',
      garmin: '#007CC3',
      samsung_health: '#1428A0'
    };
    return colors[deviceType] || '#666666';
  }

  // Legacy methods for compatibility
  async getDevices() {
    const result = await this.getUserDevices();
    return result.devices;
  }

  async connectDevice(provider, accessToken, refreshToken = null, expiresIn = null) {
    return await this.connectDevice(provider);
  }

  async disconnectDevice(deviceId) {
    // Extract device type from ID if needed
    const deviceType = deviceId.includes('_') ? deviceId.split('_')[0] : deviceId;
    return await this.disconnectDevice(deviceType);
  }

  async syncDevice(deviceId) {
    // Extract device type from ID if needed
    const deviceType = deviceId.includes('_') ? deviceId.split('_')[0] : deviceId;
    return await this.syncDevice(deviceType);
  }

  async getRecentActivities(limit = 10) {
    const result = await this.getUserActivities('user_001', limit);
    return result.activities;
  }
}

// Create singleton instance
const deviceService = new DeviceService();

export default deviceService;

