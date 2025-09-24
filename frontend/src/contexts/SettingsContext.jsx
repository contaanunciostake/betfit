import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSystemSettings } from '../services/settingsService';
import LoadingScreen from '../components/common/LoadingScreen';

// Configurações padrão para fallback
const DEFAULT_SETTINGS = {
  platform_name: 'BetFit',
  platform_description: 'Plataforma de apostas fitness',
  platform_logo: null,
  platform_logo_color: null, // ADICIONAR - logo colorido principal
  platform_logo_white: null,
  platform_logo_black: null,
  support_email: 'support@betfit.com',
  maintenance_mode: false,
  registration_enabled: true,
  two_factor_required: false,
  password_min_length: 6,
  session_timeout: 24,
  max_login_attempts: 5,
  kyc_required: false,
  email_notifications: true,
  push_notifications: true,
  sms_notifications: false,
  marketing_emails: false,
  min_bet_amount: 10,
  max_bet_amount: 10000,
  platform_fee: 10,
  auto_payout: true,
  max_participation_period: 365,
  min_participation_period: 365,
  min_participants: 2,
  max_participants: 100,
  challenge_expiry_days: 90,
  auto_complete_on_goal: true
};

// Cria o contexto
const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  isLoadingSettings: false,
  refreshSettings: () => {},
  getSetting: (key, defaultValue) => defaultValue,
  formatSetting: (key, type = 'string') => null,
});

// Hook para consumir o contexto
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings deve ser usado dentro de um SettingsProvider');
  }
  return context;
};

// Componente Provedor melhorado
export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para carregar configurações
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('⚙️ [SettingsProvider] Carregando configurações do sistema...');
      
      const fetchedSettings = await getSystemSettings();
      
      // Combina configurações padrão com as do servidor
      const mergedSettings = { ...DEFAULT_SETTINGS, ...fetchedSettings };
      
      setSettings(mergedSettings);
      
      console.log('✅ [SettingsProvider] Configurações carregadas:', mergedSettings);
      
    } catch (error) {
      console.error("❌ [SettingsProvider] Erro ao carregar configurações:", error);
      setError(error.message);
      
      // Em caso de erro, usa configurações padrão
      setSettings(DEFAULT_SETTINGS);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega configurações na inicialização
  useEffect(() => {
    loadSettings();
  }, []);

  // Função para refresh manual das configurações
  const refreshSettings = async () => {
    await loadSettings();
  };

  // Função utilitária para obter uma configuração específica
  const getSetting = (key, defaultValue = null) => {
    const value = settings[key];
    return value !== undefined && value !== null ? value : defaultValue;
  };

  // Função para formatar configurações em tipos específicos
  const formatSetting = (key, type = 'string') => {
    const value = getSetting(key);
    
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (type) {
      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
        
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
        
      case 'currency':
        const currencyNum = Number(value) || 0;
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(currencyNum);
        
      case 'percentage':
        return `${Number(value) || 0}%`;
        
      case 'url':
        if (!value || value === '') return null;
        
        // Se já começar com http/https, retorna como está
        if (value.startsWith('http://') || value.startsWith('https://')) {
          return value;
        }
        
        // Se começar com /, adiciona apenas o domínio
        if (value.startsWith('/')) {
          return `http://localhost:5001${value}`;
        }
        
        // Se não começar com /, trata como path relativo e adiciona /
        return `http://localhost:5001/${value}`;
        
      default:
        return String(value);
    }
  };

  // Mostra loading na primeira carga apenas
  if (isLoading && Object.keys(settings).length === Object.keys(DEFAULT_SETTINGS).length) {
    return <LoadingScreen message="Carregando configurações da plataforma..." />;
  }

  // VALORES DO CONTEXTO COM LÓGICA CORRIGIDA PARA LOGOS
  const value = {
    settings,
    isLoadingSettings: isLoading,
    refreshSettings,
    getSetting,
    formatSetting,
    error,
    
    // Atalhos para configurações mais usadas
    platformName: getSetting('platform_name', 'BetFit'),
    
    // LÓGICA CORRIGIDA PARA LOGOS
    // Logo principal: prioriza platform_logo_color, depois platform_logo
    platformLogo: formatSetting('platform_logo_color', 'url') || formatSetting('platform_logo', 'url'),
    
    // Logos específicos
    platformLogoWhite: formatSetting('platform_logo_white', 'url'),
    platformLogoBlack: formatSetting('platform_logo_black', 'url'),
    
    // Outras configurações
    platformDescription: getSetting('platform_description', 'Plataforma de apostas fitness'),
    maintenanceMode: formatSetting('maintenance_mode', 'boolean'),
    registrationEnabled: formatSetting('registration_enabled', 'boolean'),
    minBetAmount: formatSetting('min_bet_amount', 'number'),
    maxBetAmount: formatSetting('max_bet_amount', 'number'),
    platformFee: formatSetting('platform_fee', 'number'),
    
    // Configurações de segurança
    twoFactorRequired: formatSetting('two_factor_required', 'boolean'),
    passwordMinLength: formatSetting('password_min_length', 'number'),
    sessionTimeout: formatSetting('session_timeout', 'number'),
    maxLoginAttempts: formatSetting('max_login_attempts', 'number'),
    kycRequired: formatSetting('kyc_required', 'boolean'),
    
    // Configurações de notificação
    emailNotifications: formatSetting('email_notifications', 'boolean'),
    pushNotifications: formatSetting('push_notifications', 'boolean'),
    smsNotifications: formatSetting('sms_notifications', 'boolean'),
    marketingEmails: formatSetting('marketing_emails', 'boolean'),
    
    // Configurações da plataforma
    autoPayout: formatSetting('auto_payout', 'boolean'),
    maxParticipationPeriod: formatSetting('max_participation_period', 'number'),
    minParticipationPeriod: formatSetting('min_participation_period', 'number'),
    minParticipants: formatSetting('min_participants', 'number'),
    maxParticipants: formatSetting('max_participants', 'number'),
    challengeExpiryDays: formatSetting('challenge_expiry_days', 'number'),
    autoCompleteOnGoal: formatSetting('auto_complete_on_goal', 'boolean'),
    
    // Email de suporte
    supportEmail: getSetting('support_email', 'support@betfit.com'),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};