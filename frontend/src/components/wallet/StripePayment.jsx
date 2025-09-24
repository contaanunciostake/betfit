import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import walletService from '../../services/walletService';

// Load Stripe with your publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_...');

const CardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#1f2937',
      '::placeholder': {
        color: '#9ca3af',
      },
      iconColor: '#10b981',
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
  hidePostalCode: true,
};

function CheckoutForm({ amount, onSuccess, onError, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Create payment intent when component mounts
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const result = await walletService.createCardDeposit('current_user', amount, {});
        setPaymentIntent(result);
      } catch (error) {
        setError(error.message);
        onError?.(error);
      }
    };

    if (amount > 0) {
      createPaymentIntent();
    }
  }, [amount, onError]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'BetFit User', // In real app, get from user profile
            },
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message);
        onError?.(stripeError);
      } else if (confirmedPayment.status === 'succeeded') {
        // Payment succeeded
        onSuccess?.({
          paymentIntent: confirmedPayment,
          amount: paymentIntent.amount,
          transactionId: paymentIntent.transaction_id
        });
      } else {
        setError('Payment was not completed successfully');
      }
    } catch (error) {
      setError(error.message);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  if (!paymentIntent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-gray-400">Preparando pagamento...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Valor do depósito:</span>
          <span className="text-white font-semibold">{paymentIntent.amount_formatted}</span>
        </div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Taxa do cartão:</span>
          <span className="text-yellow-400">{paymentIntent.fee_formatted}</span>
        </div>
        <div className="border-t border-gray-600 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold">Total a pagar:</span>
            <span className="text-primary font-bold text-lg">{paymentIntent.total_formatted}</span>
          </div>
        </div>
      </div>

      {/* Card Input */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-white mb-2">
          <CreditCard className="h-5 w-5" />
          <span className="font-medium">Dados do Cartão</span>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <CardElement
            options={CardElementOptions}
            onChange={handleCardChange}
          />
        </div>

        {/* Security Notice */}
        <div className="flex items-start space-x-2 text-sm text-gray-400">
          <Lock className="h-4 w-4 mt-0.5 text-green-500" />
          <div>
            <p>Seus dados estão protegidos com criptografia SSL de 256 bits.</p>
            <p>Processamento seguro via Stripe.</p>
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
          disabled={!stripe || !cardComplete || isLoading}
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
              <span>Pagar {paymentIntent.total_formatted}</span>
            </>
          )}
        </button>
      </div>

      {/* Fee Breakdown */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Taxa do cartão: {paymentIntent.fee_breakdown?.percentage}% + R$ {paymentIntent.fee_breakdown?.fixed}</p>
        <p>• O valor será creditado imediatamente após confirmação</p>
        <p>• Você pode salvar este cartão para próximos depósitos</p>
      </div>
    </form>
  );
}

function StripePayment({ amount, onSuccess, onError, onCancel }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm
        amount={amount}
        onSuccess={onSuccess}
        onError={onError}
        onCancel={onCancel}
      />
    </Elements>
  );
}

export default StripePayment;

