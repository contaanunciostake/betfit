import apiClient from './api.js';
import authService from './authService.js';

class WalletService {
  constructor() {
    this.mpInstance = null;
    this.publicKey = null;
  }

  // Get wallet balance and info
  async getWalletInfo(userId) {
    try {
      const response = await apiClient.get(`/api/wallet/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get wallet info');
    }
  }

  // Get transaction history
  async getTransactions(userId, filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.offset) params.append('offset', filters.offset);

      const response = await apiClient.get(`/api/wallet/${userId}/transactions?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get transactions');
    }
  }

  // =================== MERCADOPAGO INTEGRATION ===================

  // Initialize MercadoPago SDK
async initializeMercadoPago() {
  try {
    // Get public key from backend
    const response = await apiClient.get('/api/payments/config');
    
    // Debug logs
    console.log('Response completa:', response);
    console.log('Type of response:', typeof response);
    console.log('Response.publicKey:', response?.publicKey);
    
    // Como seu apiClient retorna diretamente o JSON (não response.data),
    // devemos acessar diretamente as propriedades
    this.publicKey = response.publicKey;
    
    // Verificar se publicKey foi definida corretamente
    if (!this.publicKey) {
      console.error('Public key não encontrada. Response completa:', response);
      throw new Error('Public key não encontrada na resposta da API');
    }

    console.log('Public Key obtida com sucesso:', this.publicKey.substring(0, 20) + '...');

    // Load MercadoPago SDK if not already loaded
    if (!window.MercadoPago && this.publicKey) {
      console.log('Carregando SDK do MercadoPago...');
      await this.loadMercadoPagoSDK();
      this.mpInstance = new window.MercadoPago(this.publicKey);
      console.log('MercadoPago SDK inicializado com sucesso');
    } else if (window.MercadoPago && this.publicKey) {
      console.log('Reutilizando SDK do MercadoPago já carregado');
      this.mpInstance = new window.MercadoPago(this.publicKey);
    }

    return { success: true, instance: this.mpInstance };
  } catch (error) {
    console.error('Erro ao inicializar MercadoPago:', error);
    console.error('Stack trace:', error.stack);
    return { success: false, error: error.message };
  }
}
  // Load MercadoPago SDK
  loadMercadoPagoSDK() {
    return new Promise((resolve, reject) => {
      if (window.MercadoPago) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // PIX Deposit Methods - Corrigido para compatibilidade com o backend
// PIX Deposit Methods - CORRIGIDO
async createPixDeposit(userId, amount, description = 'Depósito BetFit') {
  try {
    // CORREÇÃO: Obter dados reais do usuário usando authService
    let userEmail, userName;
    
    // Primeiro, tentar obter dados do authService
    try {
      // Você precisa importar o authService no topo do arquivo
      // import authService from './authService.js';
      
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        userEmail = currentUser.email;
        userName = currentUser.name || currentUser.username || 'Usuário BetFit';
        console.log('🔍 [FRONTEND] Dados obtidos do authService:', { userEmail, userName });
      } else {
        throw new Error('Usuário não encontrado no authService');
      }
    } catch (authError) {
      console.warn('⚠️ [FRONTEND] Erro ao obter do authService, tentando localStorage:', authError);
      
      // Fallback para localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        userEmail = user.email;
        userName = user.name || user.username || 'Usuário BetFit';
        console.log('🔍 [FRONTEND] Dados obtidos do localStorage:', { userEmail, userName });
      } else {
        throw new Error('Usuário não autenticado - faça login novamente');
      }
    }

    // Validar se obtivemos os dados necessários
    if (!userEmail) {
      throw new Error('Email do usuário não encontrado');
    }

    console.log('🔍 [FRONTEND] Criando PIX deposit:', { userId, amount, userEmail, userName });

    const response = await apiClient.post('/api/payments/pix', {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      amount: parseFloat(amount),
      description
    });

    console.log('✅ [FRONTEND] Resposta da API PIX:', response);

    // Como seu apiClient retorna diretamente o JSON (não response.data),
    // devemos retornar diretamente o response
    return response;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Erro ao criar PIX:', error);
    
    // Melhor tratamento de erro
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message ||
                        'Failed to create PIX deposit';
    throw new Error(errorMessage);
  }
}


  // Credit Card Deposit Methods - Updated for MercadoPago
  // SUBSTITUA estas funções no seu walletService.js pelas versões corrigidas:

// Credit Card Deposit Methods - Updated for MercadoPago
// CORREÇÃO 1: Melhorar a criação do token do cartão
async createCardToken(cardData) {
  try {
    if (!this.mpInstance) {
      const initResult = await this.initializeMercadoPago();
      if (!initResult.success) {
        throw new Error('Failed to initialize MercadoPago');
      }
    }

    console.log('🔍 [FRONTEND] Criando token do cartão...');

    // CORREÇÃO: Validar dados do cartão antes de enviar
    const cleanCardData = {
      cardNumber: cardData.cardNumber.replace(/\s/g, ''),
      cardholderName: cardData.cardholderName.trim().toUpperCase(),
      cardExpirationMonth: String(cardData.expirationMonth).padStart(2, '0'),
      cardExpirationYear: cardData.expirationYear,
      securityCode: cardData.securityCode,
      identificationType: cardData.identificationType || 'CPF',
      identificationNumber: cardData.identificationNumber.replace(/\D/g, '')
    };

    // Validar dados básicos
    if (!cleanCardData.cardNumber || cleanCardData.cardNumber.length < 13) {
      throw new Error('Número do cartão inválido');
    }

    if (!cleanCardData.cardholderName || cleanCardData.cardholderName.length < 2) {
      throw new Error('Nome do portador é obrigatório');
    }

    if (!cleanCardData.cardExpirationMonth || !cleanCardData.cardExpirationYear) {
      throw new Error('Data de expiração é obrigatória');
    }

    if (!cleanCardData.securityCode || cleanCardData.securityCode.length < 3) {
      throw new Error('Código de segurança inválido');
    }

    console.log('🔍 [FRONTEND] Dados validados, criando token...', {
      cardNumber: cleanCardData.cardNumber.substring(0, 6) + '******' + cleanCardData.cardNumber.slice(-4),
      cardholderName: cleanCardData.cardholderName,
      month: cleanCardData.cardExpirationMonth,
      year: cleanCardData.cardExpirationYear
    });

    const cardToken = await this.mpInstance.createCardToken(cleanCardData);

    console.log('✅ [FRONTEND] Token criado:', cardToken);

    if (cardToken.error) {
      // Melhor tratamento de erros específicos do MercadoPago
      const errorMsg = this.getCardTokenErrorMessage(cardToken.error);
      throw new Error(errorMsg);
    }

    if (!cardToken.id) {
      throw new Error('Token não foi gerado corretamente');
    }

    return cardToken;
  } catch (error) {
    console.error('❌ [FRONTEND] Erro ao criar token do cartão:', error);
    throw new Error(error.message || 'Failed to create card token');
  }
}

// CORREÇÃO 2: Função para traduzir erros do MercadoPago
getCardTokenErrorMessage(error) {
  const errorMessages = {
    'E301': 'Número do cartão inválido',
    'E302': 'Código de segurança inválido',
    'E303': 'Mês de expiração inválido',
    'E304': 'Ano de expiração inválido',
    'E305': 'Nome do portador é obrigatório',
    'E306': 'Tipo de documento inválido',
    'E307': 'Número do documento inválido',
    'invalid_card_number': 'Número do cartão inválido',
    'invalid_security_code': 'Código de segurança inválido',
    'invalid_expiry_date': 'Data de expiração inválida',
    'invalid_cardholder_name': 'Nome do portador inválido'
  };

  const errorCode = error.code || error.type;
  return errorMessages[errorCode] || error.message || 'Erro ao processar dados do cartão';
}

// CORREÇÃO 3: Melhorar o createCardDeposit
async createCardDeposit(userId, amount, cardToken, description = 'Depósito BetFit') {
  try {
    // CORREÇÃO: Obter dados reais do usuário usando authService
    let userEmail, userName;
    
    // Primeiro, tentar obter dados do authService
    try {
      // Você precisa importar o authService no topo do arquivo
      // import authService from './authService.js';
      
      const currentUser = authService.getCurrentUser();
      
      if (currentUser) {
        userEmail = currentUser.email;
        userName = currentUser.name || currentUser.username || 'Usuário BetFit';
        console.log('🔍 [FRONTEND] Dados obtidos do authService:', { userEmail, userName });
      } else {
        throw new Error('Usuário não encontrado no authService');
      }
    } catch (authError) {
      console.warn('⚠️ [FRONTEND] Erro ao obter do authService, tentando localStorage:', authError);
      
      // Fallback para localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        userEmail = user.email;
        userName = user.name || user.username || 'Usuário BetFit';
        console.log('🔍 [FRONTEND] Dados obtidos do localStorage:', { userEmail, userName });
      } else {
        throw new Error('Usuário não autenticado - faça login novamente');
      }
    }

    // Validar se obtivemos os dados necessários
    if (!userEmail) {
      throw new Error('Email do usuário não encontrado');
    }

    console.log('🔍 [FRONTEND] Criando pagamento com cartão:', { 
      userId, 
      amount, 
      userEmail, 
      userName,
      tokenId: cardToken.id 
    });

    // CORREÇÃO: Validar token antes de enviar
    if (!cardToken || !cardToken.id) {
      throw new Error('Token do cartão é inválido');
    }

    const response = await apiClient.post('/api/payments/card', {
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      amount: parseFloat(amount),
      token: cardToken.id,
      description,
      installments: 1
    });

    console.log('✅ [FRONTEND] Resposta do pagamento com cartão:', response);

    // CORREÇÃO: Verificar se a resposta é válida
    if (!response || !response.success) {
      throw new Error(response?.error || 'Pagamento não foi processado');
    }

    return response;
    
  } catch (error) {
    console.error('❌ [FRONTEND] Erro ao criar pagamento com cartão:', error);
    
    const errorMessage = error.response?.data?.error || 
                        error.response?.data?.message || 
                        error.message ||
                        'Failed to create card deposit';
    throw new Error(errorMessage);
  }
}

// CORREÇÃO 4: Função para obter métodos de pagamento disponíveis
async getPaymentMethods() {
  try {
    const response = await apiClient.get('/api/payments/methods');
    console.log('✅ [FRONTEND] Métodos de pagamento:', response);
    return response;
  } catch (error) {
    console.error('❌ [FRONTEND] Erro ao buscar métodos:', error);
    throw new Error('Erro ao carregar métodos de pagamento');
  }
}

// CORREÇÃO 5: Validação mais robusta de cartão
validateCardData(cardData) {
  const errors = [];

  // Validar número do cartão
  const cardNumber = cardData.cardNumber.replace(/\s/g, '');
  if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
    errors.push('Número do cartão deve ter entre 13 e 19 dígitos');
  }

  // Validar usando algoritmo de Luhn
  if (cardNumber && !this.isValidCardNumber(cardNumber)) {
    errors.push('Número do cartão é inválido');
  }

  // Validar nome do portador
  if (!cardData.cardholderName || cardData.cardholderName.trim().length < 2) {
    errors.push('Nome do portador é obrigatório');
  }

  // Validar data de expiração
  const month = parseInt(cardData.expirationMonth);
  const year = parseInt(cardData.expirationYear);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  if (!month || month < 1 || month > 12) {
    errors.push('Mês de expiração inválido');
  }

  if (!year || year < currentYear || (year === currentYear && month < currentMonth)) {
    errors.push('Data de expiração inválida');
  }

  // Validar código de segurança
  if (!cardData.securityCode || cardData.securityCode.length < 3 || cardData.securityCode.length > 4) {
    errors.push('Código de segurança deve ter 3 ou 4 dígitos');
  }

  // Validar CPF se fornecido
  if (cardData.identificationNumber && !this.isValidCPF(cardData.identificationNumber)) {
    errors.push('CPF inválido');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// CORREÇÃO 6: Algoritmo de Luhn para validar cartão
isValidCardNumber(cardNumber) {
  if (!/^\d+$/.test(cardNumber)) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// CORREÇÃO 7: Detectar bandeira do cartão
getCardBrand(cardNumber) {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  const patterns = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$|^2(?:2(?:2[1-9]|[3-9][0-9])|[3-6][0-9][0-9]|7(?:[01][0-9]|20))[0-9]{12}$/,
    amex: /^3[47][0-9]{13}$/,
    diners: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    elo: /^((((636368)|(438935)|(504175)|(451416)|(636297))\d{0,10})|((5067)|(4576)|(4011))\d{0,12})$/
  };

  for (const [brand, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleanNumber)) {
      return brand;
    }
  }

  return 'unknown';
}

// Get MercadoPago public key - CORRIGIDO
async getMercadoPagoConfig() {
  try {
    const response = await apiClient.get('/api/payments/config');
    // Como seu apiClient retorna diretamente o JSON (não response.data)
    return response;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to get MercadoPago config');
  }
}

  // =================== EXISTING METHODS PRESERVED ===================

  async confirmCardPayment(paymentIntentId, paymentMethodId = null) {
    try {
      const response = await apiClient.post('/api/payments/deposit/card/confirm', {
        payment_intent_id: paymentIntentId,
        payment_method_id: paymentMethodId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to confirm card payment');
    }
  }

  // Stripe Customer Methods (mantido para compatibilidade)
  async createStripeCustomer(userId, email, name = null) {
    try {
      const response = await apiClient.post('/api/payments/customers', {
        user_id: userId,
        email,
        name
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create customer');
    }
  }

  async savePaymentMethod(paymentMethodId, customerId) {
    try {
      const response = await apiClient.post('/api/payments/payment-methods', {
        payment_method_id: paymentMethodId,
        customer_id: customerId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to save payment method');
    }
  }

  async getSavedCards(customerId) {
    try {
      const response = await apiClient.get(`/api/payments/payment-methods/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get saved cards');
    }
  }

  // PIX Withdrawal Methods
  async createPixWithdrawal(userId, amount, pixKey, description = 'Saque BetFit') {
    try {
      const response = await apiClient.post('/api/payments/withdraw/pix', {
        user_id: userId,
        amount: parseFloat(amount),
        pix_key: pixKey,
        description
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create PIX withdrawal');
    }
  }

  async validatePixKey(pixKey) {
    try {
      const response = await apiClient.post('/api/payments/validate-pix-key', {
        pix_key: pixKey
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate PIX key');
    }
  }

  // Bank Transfer Withdrawal Methods
  async createBankWithdrawal(userId, amount, bankData, description = 'Saque BetFit') {
    try {
      const response = await apiClient.post('/api/payments/withdraw/bank', {
        user_id: userId,
        amount: parseFloat(amount),
        bank_data: bankData,
        description
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create bank withdrawal');
    }
  }

  // Legacy methods for backward compatibility
  async getBalance() {
    try {
      // Retornar dados simulados baseados no usuário autenticado
      // Para novos usuários, começar com saldo zero
      const mockBalance = {
        balance: 0.00,
        available: 0.00,
        pending: 0.00,
        currency: 'BRL'
      };
      
      return { 
        balance: mockBalance.balance,
        data: mockBalance 
      };
    } catch (error) {
      throw error;
    }
  }

  async getPendingTransactions() {
    try {
      // Retornar transações pendentes vazias para novos usuários
      return {
        transactions: []
      };
    } catch (error) {
      throw error;
    }
  }

  async getDepositMethods() {
    return [
      { id: 'pix', name: 'PIX', enabled: true },
      { id: 'card', name: 'Cartão de Crédito', enabled: true }
    ];
  }

  async getWithdrawalMethods() {
    return [
      { id: 'pix', name: 'PIX', enabled: true }
    ];
  }

  async getPixKeys() {
    return [];
  }

  async getWalletLimits() {
    return {
      daily_deposit: 5000.00,
      daily_withdrawal: 2000.00,
      monthly_deposit: 50000.00,
      monthly_withdrawal: 20000.00
    };
  }

  async createDeposit(amount, method = 'pix') {
  try {
    // CORREÇÃO: Obter ID real do usuário
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?.user_id || currentUser?.email;
    
    if (!userId) {
      throw new Error('Usuário não autenticado - faça login novamente');
    }
    
    if (method === 'pix') {
      return await this.createPixDeposit(userId, amount);
    } else if (method === 'card') {
      return await this.createCardDeposit(userId, amount, {});
    }
  } catch (error) {
    throw error;
  }
}

async createWithdrawal(amount, method = 'pix', pixKey = null) {
  try {
    // CORREÇÃO: Obter ID real do usuário
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || currentUser?.user_id || currentUser?.email;
    
    if (!userId) {
      throw new Error('Usuário não autenticado - faça login novamente');
    }
    
    if (method === 'pix' && pixKey) {
      return await this.createPixWithdrawal(userId, amount, pixKey);
    }
  } catch (error) {
    throw error;
  }
}

  // Utility Methods
  formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  formatPixKey(pixKey, type) {
    switch (type) {
      case 'cpf':
        return pixKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
      case 'cnpj':
        return pixKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
      case 'phone':
        return pixKey.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3');
      case 'email':
      case 'random':
      default:
        return pixKey;
    }
  }

  getTransactionIcon(type) {
    const icons = {
      'deposit': '💰',
      'withdrawal': '💸',
      'bet': '🎯',
      'win': '🏆',
      'refund': '↩️',
      'bonus': '🎁',
      'fee': '💳'
    };
    return icons[type] || '💰';
  }

  getTransactionColor(type) {
    const colors = {
      'deposit': 'text-green-500',
      'withdrawal': 'text-red-500',
      'bet': 'text-blue-500',
      'win': 'text-green-600',
      'refund': 'text-yellow-500',
      'bonus': 'text-purple-500',
      'fee': 'text-gray-500'
    };
    return colors[type] || 'text-gray-500';
  }

  getStatusBadge(status) {
    const badges = {
      'pending': { text: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      'processing': { text: 'Processando', class: 'bg-blue-100 text-blue-800' },
      'approved': { text: 'Aprovado', class: 'bg-green-100 text-green-800' },
      'completed': { text: 'Concluído', class: 'bg-green-100 text-green-800' },
      'rejected': { text: 'Rejeitado', class: 'bg-red-100 text-red-800' },
      'cancelled': { text: 'Cancelado', class: 'bg-gray-100 text-gray-800' },
      'failed': { text: 'Falhou', class: 'bg-red-100 text-red-800' }
    };
    return badges[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
  }

  // Calculate fees for different payment methods - Updated for MercadoPago
  calculateFees(amount, method) {
    const fees = {
      pix: { percentage: 0, fixed: 0 }, // PIX é gratuito no MercadoPago
      card: { percentage: 0.035, fixed: 0.39 }, // 3.5% + R$ 0.39 para cartão
      bank: { percentage: 0, fixed: 2.50 } // Taxa fixa para transferência bancária
    };

    const fee = fees[method] || fees.pix;
    const feeAmount = (amount * fee.percentage) + fee.fixed;
    const totalAmount = amount + feeAmount;

    return {
      originalAmount: amount,
      feeAmount,
      totalAmount,
      feePercentage: fee.percentage * 100,
      fixedFee: fee.fixed
    };
  }

  // Validate amounts
  validateAmount(amount, min = 10, max = 10000) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, error: 'Valor deve ser maior que zero' };
    }
    
    if (numAmount < min) {
      return { valid: false, error: `Valor mínimo é ${this.formatCurrency(min)}` };
    }
    
    if (numAmount > max) {
      return { valid: false, error: `Valor máximo é ${this.formatCurrency(max)}` };
    }
    
    return { valid: true };
  }

  // Generate QR Code data URL from base64
  generateQRCodeDataURL(base64String) {
    return `data:image/png;base64,${base64String}`;
  }

  // Copy text to clipboard
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }

  // =================== MERCADOPAGO SPECIFIC HELPERS ===================

  // Format card number for display
  formatCardNumber(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  }

  // Format expiration date
  formatExpirationDate(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  }

  // Format CPF
  formatCPF(value) {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return v.substring(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  // Validate CPF
  isValidCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
    }

    let digit1 = 11 - (sum % 11);
    if (digit1 === 10 || digit1 === 11) digit1 = 0;

    if (parseInt(cleanCPF.charAt(9)) !== digit1) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
    }

    let digit2 = 11 - (sum % 11);
    if (digit2 === 10 || digit2 === 11) digit2 = 0;

    return parseInt(cleanCPF.charAt(10)) === digit2;
  }

  // Parse card data for MercadoPago
  parseCardDataForMP(cardData) {
    const expirationParts = cardData.expirationDate.split('/');
    
    return {
      cardNumber: cardData.cardNumber.replace(/\s/g, ''),
      cardholderName: cardData.cardholderName.toUpperCase(),
      expirationMonth: expirationParts[0],
      expirationYear: expirationParts[1] ? '20' + expirationParts[1] : '',
      securityCode: cardData.securityCode,
      identificationType: cardData.identificationType || 'CPF',
      identificationNumber: cardData.identificationNumber.replace(/\D/g, '')
    };
  }
}

// Create singleton instance
const walletService = new WalletService();

export default walletService;