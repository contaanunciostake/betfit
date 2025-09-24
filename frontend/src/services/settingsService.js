// src/services/settingsService.js

import apiClient from './api.js';

/**
 * Cache simples para configurações para evitar muitas chamadas à API
 */
let settingsCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Verifica se o cache ainda é válido
 */
const isCacheValid = () => {
  return settingsCache && lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION;
};

/**
 * Busca todas as configurações do sistema da API.
 * @param {boolean} forceRefresh - Se true, ignora o cache e busca dados novos
 * @returns {Promise<Object>} Um objeto contendo todas as configurações da plataforma.
 */
export const getSystemSettings = async (forceRefresh = false) => {
  try {
    // Se há cache válido e não é refresh forçado, retorna o cache
    if (!forceRefresh && isCacheValid()) {
      console.log('⚙️ [SettingsService] Usando configurações do cache');
      return settingsCache;
    }

    console.log('⚙️ [SettingsService] Buscando configurações do servidor...');
    
    // Busca configurações da API
    const response = await apiClient.get('/api/settings');
    
    // Verifica se a resposta tem o formato esperado
    if (!response || typeof response !== 'object') {
      throw new Error('Resposta inválida da API de configurações');
    }

    // Converte array de configurações em objeto para facilitar o uso
    let settingsObject = {};
    
    if (Array.isArray(response)) {
      // Se receber um array (formato da sua tabela system_settings)
      response.forEach(setting => {
        if (setting.setting_key && setting.setting_value !== undefined) {
          settingsObject[setting.setting_key] = setting.setting_value;
        }
      });
    } else {
      // Se já receber um objeto
      settingsObject = response;
    }

    // Atualiza o cache
    settingsCache = settingsObject;
    lastFetchTime = Date.now();
    
    console.log('✅ [SettingsService] Configurações carregadas com sucesso:', settingsObject);
    
    return settingsObject;
    
  } catch (error) {
    console.error('❌ [SettingsService] Falha ao carregar as configurações do sistema:', error);
    
    // Se há cache anterior, usa ele em caso de erro
    if (settingsCache) {
      console.warn('⚠️ [SettingsService] Usando cache anterior devido ao erro');
      return settingsCache;
    }
    
    // Se não há cache, retorna objeto vazio
    return {}; 
  }
};

/**
 * Busca uma configuração específica
 * @param {string} key - Chave da configuração
 * @param {any} defaultValue - Valor padrão se não encontrar
 * @returns {Promise<any>} Valor da configuração
 */
export const getSetting = async (key, defaultValue = null) => {
  try {
    const settings = await getSystemSettings();
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch (error) {
    console.error(`❌ [SettingsService] Erro ao buscar configuração '${key}':`, error);
    return defaultValue;
  }
};

/**
 * Atualiza uma configuração específica
 * @param {string} key - Chave da configuração
 * @param {any} value - Novo valor
 * @returns {Promise<boolean>} True se atualizou com sucesso
 */
export const updateSetting = async (key, value) => {
  try {
    console.log(`⚙️ [SettingsService] Atualizando configuração '${key}' para:`, value);
    
    const response = await apiClient.put(`/api/settings/${key}`, {
      setting_value: value
    });
    
    // Limpa o cache para forçar um refresh na próxima busca
    settingsCache = null;
    lastFetchTime = null;
    
    console.log(`✅ [SettingsService] Configuração '${key}' atualizada com sucesso`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ [SettingsService] Erro ao atualizar configuração '${key}':`, error);
    return false;
  }
};

/**
 * Atualiza múltiplas configurações de uma vez
 * @param {Object} settings - Objeto com as configurações a atualizar
 * @returns {Promise<boolean>} True se todas foram atualizadas com sucesso
 */
export const updateMultipleSettings = async (settings) => {
  try {
    console.log('⚙️ [SettingsService] Atualizando múltiplas configurações:', settings);
    
    const response = await apiClient.put('/api/settings', { settings });
    
    // Limpa o cache
    settingsCache = null;
    lastFetchTime = null;
    
    console.log('✅ [SettingsService] Múltiplas configurações atualizadas com sucesso');
    
    return true;
    
  } catch (error) {
    console.error('❌ [SettingsService] Erro ao atualizar múltiplas configurações:', error);
    return false;
  }
};

/**
 * Força um refresh do cache de configurações
 * @returns {Promise<Object>} Configurações atualizadas
 */
export const refreshSettings = async () => {
  return await getSystemSettings(true);
};

/**
 * Limpa o cache de configurações
 */
export const clearSettingsCache = () => {
  settingsCache = null;
  lastFetchTime = null;
  console.log('🗑️ [SettingsService] Cache de configurações limpo');
};

/**
 * Configurações específicas para serem usadas diretamente nos componentes
 */

/**
 * Busca informações da plataforma (nome, logo, descrição)
 * @returns {Promise<Object>} Informações da plataforma
 */
export const getPlatformInfo = async () => {
  try {
    const settings = await getSystemSettings();
    
    return {
      name: settings.platform_name || 'BetFit',
      logo: settings.platform_logo || null,
      description: settings.platform_description || 'Plataforma de apostas fitness',
      supportEmail: settings.support_email || 'support@betfit.com'
    };
  } catch (error) {
    console.error('❌ [SettingsService] Erro ao buscar informações da plataforma:', error);
    return {
      name: 'BetFit',
      logo: null,
      description: 'Plataforma de apostas fitness',
      supportEmail: 'support@betfit.com'
    };
  }
};

/**
 * Busca configurações de apostas
 * @returns {Promise<Object>} Configurações de apostas
 */
export const getBettingSettings = async () => {
  try {
    const settings = await getSystemSettings();
    
    return {
      minBetAmount: Number(settings.min_bet_amount) || 10,
      maxBetAmount: Number(settings.max_bet_amount) || 10000,
      platformFee: Number(settings.platform_fee) || 10,
      autoPayout: settings.auto_payout === 'true' || settings.auto_payout === true,
    };
  } catch (error) {
    console.error('❌ [SettingsService] Erro ao buscar configurações de apostas:', error);
    return {
      minBetAmount: 10,
      maxBetAmount: 10000,
      platformFee: 10,
      autoPayout: true
    };
  }
};

/**
 * Busca configurações de segurança
 * @returns {Promise<Object>} Configurações de segurança
 */
export const getSecuritySettings = async () => {
  try {
    const settings = await getSystemSettings();
    
    return {
      twoFactorRequired: settings.two_factor_required === 'true' || settings.two_factor_required === true,
      passwordMinLength: Number(settings.password_min_length) || 6,
      sessionTimeout: Number(settings.session_timeout) || 24,
      maxLoginAttempts: Number(settings.max_login_attempts) || 5,
      kycRequired: settings.kyc_required === 'true' || settings.kyc_required === true,
    };
  } catch (error) {
    console.error('❌ [SettingsService] Erro ao buscar configurações de segurança:', error);
    return {
      twoFactorRequired: false,
      passwordMinLength: 6,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      kycRequired: false
    };
  }
};