import React, { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import walletService from '../../services/walletService';

function PixPayment({ amount, onSuccess, onError, onCancel }) {
  const [pixData, setPixData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Create PIX payment when component mounts
  useEffect(() => {
    const createPixPayment = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get user ID (adjust based on your auth system)
        const userId = localStorage.getItem('userId') || 'current_user';
        const result = await walletService.createPixDeposit(userId, amount);
        
        if (result && !result.error) {
          setPixData(result);
          setPaymentStatus('pending');
          
          // Set timer for 5 minutes (300 seconds) - MercadoPago PIX default
          setTimeLeft(300);
        } else {
          setError(result?.error || 'Falha ao gerar código PIX');
        }
      } catch (error) {
        console.error('Error creating PIX payment:', error);
        setError(error.message || 'Erro ao processar pagamento PIX');
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (amount > 0) {
      createPixPayment();
    }
  }, [amount, onError]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && paymentStatus === 'pending') {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft <= 0 && paymentStatus === 'pending') {
      setPaymentStatus('expired');
    }
  }, [timeLeft, paymentStatus]);

  // Auto-check payment status
  useEffect(() => {
    if (!pixData?.paymentId || paymentStatus !== 'pending' || timeLeft <= 0) return;

    const checkPayment = async () => {
      if (isChecking) return; // Prevent multiple simultaneous checks
      
      try {
        setIsChecking(true);
        const status = await walletService.checkPixPaymentStatus(pixData.paymentId);
        
        if (status && status.status === 'approved') {
          setPaymentStatus('approved');
          onSuccess?.({
            paymentId: pixData.paymentId,
            amount: pixData.amount || amount,
            transactionId: pixData.transactionId || pixData.paymentId,
            method: 'pix'
          });
        } else if (status && (status.status === 'rejected' || status.status === 'cancelled')) {
          setPaymentStatus('rejected');
          setError('Pagamento PIX foi rejeitado ou cancelado');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Don't show error for status check failures, just log them
      } finally {
        setIsChecking(false);
      }
    };

    // Check every 5 seconds
    const interval = setInterval(checkPayment, 5000);
    return () => clearInterval(interval);
  }, [pixData, timeLeft, paymentStatus, onSuccess, isChecking, amount]);

  const handleCopyPixCode = async () => {
    if (!pixData?.pixCode) return;

    try {
      await walletService.copyToClipboard(pixData.pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy PIX code:', error);
      // Fallback: show alert with the code
      alert('Código PIX: ' + pixData.pixCode);
    }
  };

  const handleRetry = () => {
    setError(null);
    setPixData(null);
    setPaymentStatus('pending');
    setTimeLeft(0);
    
    // Trigger re-render to create new payment
    const createNewPayment = async () => {
      try {
        setIsLoading(true);
        const userId = localStorage.getItem('userId') || 'current_user';
        const result = await walletService.createPixDeposit(userId, amount);
        
        if (result && !result.error) {
          setPixData(result);
          setPaymentStatus('pending');
          setTimeLeft(300);
        } else {
          setError(result?.error || 'Falha ao gerar código PIX');
        }
      } catch (error) {
        setError(error.message || 'Erro ao processar pagamento PIX');
      } finally {
        setIsLoading(false);
      }
    };
    
    createNewPayment();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatAmount = (value) => {
    return walletService.formatCurrency(value || amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-400">Gerando código PIX...</span>
      </div>
    );
  }

  if (error && !pixData) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Erro ao gerar PIX</h3>
        <p className="text-gray-400 mb-4">{error}</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Voltar
          </button>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'expired' || timeLeft <= 0) {
    return (
      <div className="text-center p-8">
        <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Código PIX Expirado</h3>
        <p className="text-gray-400 mb-4">O código PIX expirou. Gere um novo código para continuar.</p>
        <div className="flex space-x-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Gerar Novo Código</span>
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'approved') {
    return (
      <div className="text-center p-8">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Pagamento Aprovado!</h3>
        <p className="text-gray-400 mb-4">
          Seu PIX de {formatAmount(pixData?.amount)} foi processado com sucesso.
        </p>
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 space-y-1">
            <p>ID da Transação: {pixData?.paymentId}</p>
            <p>Método: PIX</p>
            <p>Status: Aprovado</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Valor do depósito:</span>
          <span className="text-primary font-bold text-lg">{formatAmount(pixData?.amount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Taxa PIX:</span>
          <span className="text-green-400">Gratuito</span>
        </div>
      </div>

      {/* Timer and Status */}
      <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-400" />
            <span className="text-yellow-400 font-medium">
              Código expira em: {formatTime(timeLeft)}
            </span>
          </div>
          {isChecking && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              <span className="text-blue-400 text-sm">Verificando...</span>
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      <div className="text-center">
        <div className="bg-white rounded-lg p-4 inline-block mb-4">
          {pixData?.qrCodeBase64 ? (
            <img
              src={walletService.generateQRCodeDataURL(pixData.qrCodeBase64)}
              alt="QR Code PIX"
              className="w-48 h-48 mx-auto"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <QrCode className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </div>
        
        <p className="text-gray-400 text-sm mb-4">
          Escaneie o QR Code com o app do seu banco ou copie o código PIX
        </p>
      </div>

      {/* PIX Code */}
      {pixData?.pixCode && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-300">
            Código PIX (Copia e Cola)
          </label>
          
          <div className="flex space-x-2">
            <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3">
              <code className="text-xs text-gray-300 break-all font-mono">
                {pixData.pixCode}
              </code>
            </div>
            
            <button
              onClick={handleCopyPixCode}
              className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span className="hidden sm:inline">Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
        <h4 className="text-blue-400 font-medium mb-2">Como pagar:</h4>
        <ol className="text-sm text-gray-300 space-y-1">
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">1.</span>
            <span>Abra o app do seu banco</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">2.</span>
            <span>Escaneie o QR Code ou copie o código PIX</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">3.</span>
            <span>Confirme os dados e o valor</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">4.</span>
            <span>Finalize o pagamento</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-400 font-bold">5.</span>
            <span>O valor será creditado automaticamente</span>
          </li>
        </ol>
      </div>

      {/* Transaction Details */}
      {pixData?.paymentId && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h4 className="text-white font-semibold mb-3">Detalhes da Transação</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">ID do Pagamento:</span>
              <span className="text-white font-mono text-xs">{pixData.paymentId}</span>
            </div>
            {pixData.transactionId && (
              <div className="flex justify-between">
                <span className="text-gray-400">ID da Transação:</span>
                <span className="text-white font-mono text-xs">{pixData.transactionId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-yellow-400 capitalize">{paymentStatus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancelar
        </button>
        
        <button
          onClick={handleRetry}
          className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Atualizar Código</span>
        </button>
      </div>

      {/* Status Information */}
      <div className="text-center text-sm text-gray-400">
        <p>Aguardando confirmação do pagamento...</p>
        <p>O status será atualizado automaticamente quando o pagamento for confirmado.</p>
        {error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/20 rounded text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="text-xs text-gray-500 text-center">
        <p>🔒 Pagamento processado pelo MercadoPago</p>
        <p>Transação segura e criptografada</p>
      </div>
    </div>
  );
}

export default PixPayment;