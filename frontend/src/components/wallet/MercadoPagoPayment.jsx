import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import walletService from '../../services/walletService';

function MercadoPagoPayment({ amount, onSuccess, onError, onCancel }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCVV, setShowCVV] = useState(false);
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardholderName: '',
    expirationDate: '',
    securityCode: '',
    identificationType: 'CPF',
    identificationNumber: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);
  const [fees, setFees] = useState(null);

  // Calculate fees when amount changes
  useEffect(() => {
    if (amount > 0) {
      const feeData = walletService.calculateFees(amount, 'card');
      setFees(feeData);
    }
  }, [amount]);

  // Validate form
  useEffect(() => {
    const errors = {};
    
    // Card number validation (simplified)
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 13) {
      errors.cardNumber = 'Número do cartão inválido';
    }
    
    // Cardholder name validation
    if (!formData.cardholderName || formData.cardholderName.length < 3) {
      errors.cardholderName = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    // Expiration date validation
    if (!formData.expirationDate || !/^\d{2}\/\d{2}$/.test(formData.expirationDate)) {
      errors.expirationDate = 'Data de expiração inválida (MM/AA)';
    } else {
      const [month, year] = formData.expirationDate.split('/');
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      
      if (parseInt(month) < 1 || parseInt(month) > 12) {
        errors.expirationDate = 'Mês inválido';
      } else if (parseInt(year) < currentYear || 
                (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        errors.expirationDate = 'Cartão expirado';
      }
    }
    
    // Security code validation
    if (!formData.securityCode || formData.securityCode.length < 3) {
      errors.securityCode = 'Código de segurança inválido';
    }
    
    // CPF validation
    if (formData.identificationType === 'CPF' && 
        (!formData.identificationNumber || !walletService.isValidCPF(formData.identificationNumber))) {
      errors.identificationNumber = 'CPF inválido';
    }
    
    setFormErrors(errors);
    setIsFormValid(Object.keys(errors).length === 0);
  }, [formData]);

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    switch (field) {
      case 'cardNumber':
        formattedValue = walletService.formatCardNumber(value);
        break;
      case 'expirationDate':
        formattedValue = walletService.formatExpirationDate(value);
        break;
      case 'identificationNumber':
        if (formData.identificationType === 'CPF') {
          formattedValue = walletService.formatCPF(value);
        }
        break;
      case 'cardholderName':
        formattedValue = value.toUpperCase();
        break;
      case 'securityCode':
        formattedValue = value.replace(/\D/g, '').substring(0, 4);
        break;
      default:
        break;
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!isFormValid) {
      setError('Por favor, corrija os erros no formulário');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse card data for MercadoPago
      const cardData = walletService.parseCardDataForMP(formData);
      
      // Create card token
      const cardToken = await walletService.createCardToken(cardData);
      
      if (!cardToken.id) {
        throw new Error('Erro ao gerar token do cartão');
      }
      
      // Create payment
      const payment = await walletService.createCardDeposit(
        'current_user',
        amount,
        cardToken,
        'Depósito BetFit via Cartão'
      );
      
      if (payment && payment.paymentId) {
        onSuccess?.({
          paymentId: payment.paymentId,
          amount: payment.amount || amount,
          transactionId: payment.transactionId || payment.paymentId,
          method: 'card',
          status: payment.status || 'approved'
        });
      } else {
        throw new Error('Erro no processamento do pagamento');
      }
      
    } catch (error) {
      console.error('Erro no pagamento com cartão:', error);
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!fees) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-400">Calculando taxas...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Valor do depósito:</span>
          <span className="text-white font-semibold">
            {walletService.formatCurrency(fees.originalAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Taxa do cartão:</span>
          <span className="text-yellow-400">
            {walletService.formatCurrency(fees.feeAmount)}
          </span>
        </div>
        <div className="border-t border-gray-600 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Total a pagar:</span>
            <span className="text-primary font-bold text-lg">
              {walletService.formatCurrency(fees.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-white mb-4">
          <CreditCard className="h-5 w-5" />
          <span className="font-medium">Dados do Cartão</span>
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Número do Cartão
          </label>
          <input
            type="text"
            value={formData.cardNumber}
            onChange={(e) => handleInputChange('cardNumber', e.target.value)}
            placeholder="1234 5678 9012 3456"
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
              formErrors.cardNumber ? 'border-red-500' : 'border-gray-600'
            }`}
            maxLength="19"
          />
          {formErrors.cardNumber && (
            <p className="mt-1 text-sm text-red-400">{formErrors.cardNumber}</p>
          )}
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Nome no Cartão
          </label>
          <input
            type="text"
            value={formData.cardholderName}
            onChange={(e) => handleInputChange('cardholderName', e.target.value)}
            placeholder="NOME COMPLETO"
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
              formErrors.cardholderName ? 'border-red-500' : 'border-gray-600'
            }`}
          />
          {formErrors.cardholderName && (
            <p className="mt-1 text-sm text-red-400">{formErrors.cardholderName}</p>
          )}
        </div>

        {/* Expiration and CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Validade
            </label>
            <input
              type="text"
              value={formData.expirationDate}
              onChange={(e) => handleInputChange('expirationDate', e.target.value)}
              placeholder="MM/AA"
              className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                formErrors.expirationDate ? 'border-red-500' : 'border-gray-600'
              }`}
              maxLength="5"
            />
            {formErrors.expirationDate && (
              <p className="mt-1 text-sm text-red-400">{formErrors.expirationDate}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              CVV
            </label>
            <div className="relative">
              <input
                type={showCVV ? 'text' : 'password'}
                value={formData.securityCode}
                onChange={(e) => handleInputChange('securityCode', e.target.value)}
                placeholder="123"
                className={`w-full px-3 py-2 pr-10 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
                  formErrors.securityCode ? 'border-red-500' : 'border-gray-600'
                }`}
                maxLength="4"
              />
              <button
                type="button"
                onClick={() => setShowCVV(!showCVV)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCVV ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formErrors.securityCode && (
              <p className="mt-1 text-sm text-red-400">{formErrors.securityCode}</p>
            )}
          </div>
        </div>

        {/* Document */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            CPF do Portador
          </label>
          <input
            type="text"
            value={formData.identificationNumber}
            onChange={(e) => handleInputChange('identificationNumber', e.target.value)}
            placeholder="000.000.000-00"
            className={`w-full px-3 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary ${
              formErrors.identificationNumber ? 'border-red-500' : 'border-gray-600'
            }`}
            maxLength="14"
          />
          {formErrors.identificationNumber && (
            <p className="mt-1 text-sm text-red-400">{formErrors.identificationNumber}</p>
          )}
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-2 text-sm text-gray-400 bg-green-900/10 border border-green-500/20 rounded-lg p-3">
          <Lock className="h-4 w-4 mt-0.5 text-green-500" />
          <div>
            <p>Seus dados estão protegidos com criptografia SSL de 256 bits.</p>
            <p>Processamento seguro via MercadoPago.</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          disabled={isLoading}
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={!isFormValid || isLoading}
          className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processando...</span>
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4" />
              <span>Pagar {walletService.formatCurrency(fees.totalAmount)}</span>
            </>
          )}
        </button>
      </div>

      {/* Fee Breakdown */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Taxa do cartão: {fees.feePercentage}% + R$ {fees.fixedFee.toFixed(2)}</p>
        <p>• O valor será creditado imediatamente após confirmação</p>
        <p>• Pagamento processado pelo MercadoPago</p>
      </div>
    </form>
  );
}

export default MercadoPagoPayment;