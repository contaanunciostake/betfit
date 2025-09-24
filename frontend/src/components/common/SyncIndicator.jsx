import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function SyncIndicator({ 
  isOnline = true, 
  lastSync = null, 
  isLoading = false,
  onRefresh = null,
  className = ""
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');

  useEffect(() => {
    if (isLoading) {
      setSyncStatus('syncing');
    } else if (!isOnline) {
      setSyncStatus('offline');
    } else if (lastSync) {
      const now = new Date();
      const syncTime = new Date(lastSync);
      const diffMs = now - syncTime;
      
      if (diffMs < 30000) { // Less than 30 seconds
        setSyncStatus('synced');
      } else if (diffMs < 120000) { // Less than 2 minutes
        setSyncStatus('stale');
      } else {
        setSyncStatus('outdated');
      }
    } else {
      setSyncStatus('unknown');
    }
  }, [isOnline, lastSync, isLoading]);

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Sincronizando...',
          animate: true
        };
      case 'synced':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Sincronizado',
          animate: false
        };
      case 'stale':
        return {
          icon: Wifi,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Dados recentes',
          animate: false
        };
      case 'outdated':
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Dados desatualizados',
          animate: false
        };
      case 'offline':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Offline',
          animate: false
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Status desconhecido',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const syncTime = new Date(lastSync);
    const diffMs = now - syncTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s atrás`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m atrás`;
    } else if (diffHours < 24) {
      return `${diffHours}h atrás`;
    } else {
      return syncTime.toLocaleDateString('pt-BR');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg border cursor-pointer
          ${config.bgColor} ${config.borderColor} hover:opacity-80 transition-opacity
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        <Icon 
          className={`w-4 h-4 ${config.color} ${config.animate ? 'animate-spin' : ''}`} 
        />
        <span className={`text-sm font-medium ${config.color}`}>
          {config.label}
        </span>
        {onRefresh && !isLoading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRefresh();
            }}
            className={`p-1 rounded hover:bg-white/50 ${config.color}`}
            title="Atualizar agora"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {showDetails && (
        <div className={`
          absolute top-full left-0 mt-2 p-3 rounded-lg border shadow-lg z-50
          bg-white border-gray-200 min-w-48
        `}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium ${config.color}`}>
                {config.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última sync:</span>
              <span className="font-medium text-gray-900">
                {formatLastSync()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conexão:</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className="w-full mt-2 px-3 py-1 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Atualizando...' : 'Atualizar Agora'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

