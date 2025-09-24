// SUBSTITUA o arquivo WalletDeposit.jsx pelo código corrigido abaixo:

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, DollarSign, AlertCircle, CheckCircle, Info } from 'lucide-react';
import PixPayment from './PixPayment';
import MercadoPagoPayment from './MercadoPagoPayment'; // ADICIONAR ESTA LINHA
import walletService from '../../services/walletService';

function WalletDeposit() {
  const [selectedMethod, setSelectedMethod] = useState('pix');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState('form'); // 'form', 'payment', 'success'
  const [error, setError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize MercadoPago when component mounts
  useEffect(() => {
    const initMP = async () => {
      try {
        const result = await walletService.initializeMercadoPago();
        if (result.success) {
          setIsInitialized(true);
        } else {
          setError('Erro ao inicializar sistema de pagamento');
        }
      } catch (error) {
        console.error('Erro ao inicializar MercadoPago:', error);
        setError('Erro ao carregar sistema de pagamento');
      }
    };

    initMP();
  }, []);

  const paymentMethods = [
    {
      id: 'pix',
      name: 'PIX',
      icon: Smartphone,
      description: 'Instantâneo e gratuito',
      fee: 'Gratuito',
      time: 'Imediato',
      available: true
    },
    {
      id: 'card',
      name: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Visa, Mastercard, Elo',
      fee: '3,5% + R$ 0,39',
      time: 'Imediato',
      available: true, // MUDOU DE false PARA true
      // comingSoon: true // REMOVIDO ESTA LINHA
    }
  ];

  const quickAmounts = [50, 100, 200, 500];

  const handleAmountChange = (value) => {
    setAmount(value);
    setError('');
  };

  const validateAndProceed = () => {
    // Check if MercadoPago is initialized
    if (!isInitialized && selectedMethod === 'card') {
      setError('Sistema de pagamento ainda não foi inicializado. Tente novamente.');
      return;
    }

    const validation = walletService.validateAmount(parseFloat(amount));
    
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Check if selected method is available
    const method = paymentMethods.find(m => m.id === selectedMethod);
    if (!method?.available) {
      setError('Método de pagamento não disponível no momento');
      return;
    }

    setStep('payment');
  };

  const handlePaymentSuccess = (result) => {
    setPaymentResult({
      ...result,
      amount: result.amount || parseFloat(amount),
      method: selectedMethod
    });
    setStep('success');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(error?.message || 'Erro no pagamento');
    setStep('form');
  };

  const handleCancel = () => {
    setStep('form');
    setError('');
  };

  const handleNewDeposit = () => {
    setStep('form');
    setAmount('');
    setError('');
    setPaymentResult(null);
    setSelectedMethod('pix'); // Reset to PIX
  };

  const calculateTotal = () => {
    const numAmount = parseFloat(amount) || 0;
    const fees = walletService.calculateFees(numAmount, selectedMethod);
    return fees;
  };

  const getMethodDisplayName = (methodId) => {
    switch (methodId) {
      case 'pix':
        return 'PIX';
      case 'card':
        return 'Cartão de Crédito';
      default:
        return methodId;
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center p-8">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Depósito Realizado!</h3>
        <p className="text-gray-400 mb-4">
          Seu depósito de {walletService.formatCurrency(paymentResult?.amount || 0)} foi processado com sucesso.
        </p>
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 space-y-1">
            <p>ID da Transação: {paymentResult?.transactionId || paymentResult?.paymentId}</p>
            <p>Método: {getMethodDisplayName(paymentResult?.method)}</p>
            <p>Status: Aprovado</p>
            {paymentResult?.paymentId && (
              <p>ID do Pagamento: {paymentResult.paymentId}</p>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleNewDeposit}
            className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Fazer Novo Depósito
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Ir para Carteira
          </button>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">
            Depósito via {getMethodDisplayName(selectedMethod)}
          </h3>
          <p className="text-gray-400">
            Complete o pagamento para creditar {walletService.formatCurrency(parseFloat(amount))} na sua conta
          </p>
        </div>

        {selectedMethod === 'pix' ? (
          <PixPayment
            amount={parseFloat(amount)}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleCancel}
          />
        ) : selectedMethod === 'card' ? (
          // SUBSTITUIR A SEÇÃO ANTIGA PELO COMPONENTE MERCADOPAGO
          <MercadoPagoPayment
            amount={parseFloat(amount)}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onCancel={handleCancel}
          />
        ) : (
          <div className="text-center p-8">
            <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Método não suportado</h3>
            <p className="text-gray-400 mb-4">
              Este método de pagamento não está disponível.
            </p>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Método de Pagamento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            const isDisabled = !method.available;

            return (
              <button
                key={method.id}
                onClick={() => method.available && setSelectedMethod(method.id)}
                disabled={isDisabled}
                className={`p-4 rounded-lg border-2 transition-all text-left relative ${
                  isSelected && method.available
                    ? 'border-primary bg-primary/10'
                    : method.available
                    ? 'border-gray-700 bg-gray-800 hover:border-gray-600'
                    : 'border-gray-700 bg-gray-900 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-6 w-6 mt-1 ${
                    isSelected && method.available
                      ? 'text-primary'
                      : method.available
                      ? 'text-gray-400'
                      : 'text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-semibold ${
                        method.available ? 'text-white' : 'text-gray-500'
                      }`}>
                        {method.name}
                      </h4>
                      {method.comingSoon && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                          Em breve
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${
                      method.available ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {method.description}
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className={method.available ? 'text-gray-500' : 'text-gray-600'}>
                        Taxa: {method.fee}
                      </span>
                      <span className={method.available ? 'text-gray-500' : 'text-gray-600'}>
                        Tempo: {method.time}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Info Notice */}
      {!isInitialized && (
        <div className="flex items-center space-x-2 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <Info className="h-5 w-5 text-blue-400" />
          <span className="text-blue-400 text-sm">
            Carregando sistema de pagamento...
          </span>
        </div>
      )}

      {/* Amount Input */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Valor do Depósito</h3>
        
        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              onClick={() => handleAmountChange(quickAmount.toString())}
              className={`p-3 border rounded-lg text-white transition-colors ${
                amount === quickAmount.toString()
                  ? 'bg-primary border-primary'
                  : 'bg-gray-800 border-gray-700 hover:bg-gray-700'
              }`}
            >
              R$ {quickAmount}
            </button>
          ))}
        </div>

        {/* Custom Amount Input */}
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Digite o valor"
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
            min="10"
            max="10000"
            step="0.01"
          />
        </div>

        {/* Amount Validation */}
        <div className="mt-2 text-sm text-gray-400">
          <p>Valor mínimo: R$ 10,00 • Valor máximo: R$ 10.000,00</p>
        </div>
      </div>

      {/* Fee Calculation */}
      {amount && parseFloat(amount) > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="font-semibold text-white mb-3">Resumo do Depósito</h4>
          {(() => {
            const fees = calculateTotal();
            return (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Valor do depósito:</span>
                  <span className="text-white">{walletService.formatCurrency(fees.originalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    Taxa ({selectedMethod === 'pix' ? 'Gratuito' : '3,5% + R$ 0,39'}):
                  </span>
                  <span className={fees.feeAmount > 0 ? 'text-yellow-400' : 'text-green-400'}>
                    {fees.feeAmount > 0 ? walletService.formatCurrency(fees.feeAmount) : 'Gratuito'}
                  </span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span className="text-white font-semibold">Total a pagar:</span>
                    <span className="text-primary font-bold">{walletService.formatCurrency(fees.totalAmount)}</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-900/20 border border-red-500/20 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Continue Button */}
      <button
        onClick={validateAndProceed}
        disabled={!amount || parseFloat(amount) <= 0 || !isInitialized}
        className="w-full px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <span>
          {selectedMethod === 'pix' 
            ? 'Continuar com PIX' 
            : selectedMethod === 'card' 
            ? 'Continuar com Cartão' 
            : 'Continuar'
          }
        </span>
      </button>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>🔒 Transação segura processada pelo MercadoPago</p>
        <p>Seus dados estão protegidos com criptografia SSL</p>
        <p>Todos os pagamentos são processados de forma segura</p>
      </div>
    </div>
  );
}

export default WalletDeposit;