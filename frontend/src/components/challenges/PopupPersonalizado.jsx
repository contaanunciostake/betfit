import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Trophy, DollarSign } from 'lucide-react';

// Hook para gerenciar popups
export const usePopup = () => {
  const [popup, setPopup] = useState({
    show: false,
    type: 'success',
    title: '',
    message: '',
    details: null,
    duration: 5000
  });

  const showPopup = (type, title, message, details = null, duration = 5000) => {
    setPopup({
      show: true,
      type,
      title,
      message,
      details,
      duration
    });
  };

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, show: false }));
  };

  const showSuccess = (title, message, details = null) => {
    showPopup('success', title, message, details, 8000);
  };

  const showError = (title, message, details = null) => {
    showPopup('error', title, message, details, 0); // Não fecha automaticamente
  };

  const showBetSuccess = (challengeTitle, stakeAmount, feeInfo) => {
    showSuccess(
      '🎉 Aposta Confirmada!',
      `Você apostou R$ ${stakeAmount.toFixed(2)} no desafio "${challengeTitle}"`,
      {
        'Desafio': challengeTitle,
        'Valor Apostado': `R$ ${stakeAmount.toFixed(2)}`,
        'Taxa da Casa': `R$ ${feeInfo.house_fee.toFixed(2)} (${feeInfo.house_percentage}%)`,
        'Valor no Pool': `R$ ${feeInfo.net_stake.toFixed(2)}`,
        'Status': 'Confirmado ✅'
      }
    );
  };

  const showPrizeWin = (challengeTitle, prizeAmount, multiplier) => {
    showSuccess(
      '🏆 Parabéns! Você Ganhou!',
      `Desafio "${challengeTitle}" completado com sucesso!`,
      {
        'Desafio': challengeTitle,
        'Prêmio Recebido': `R$ ${prizeAmount.toFixed(2)}`,
        'Multiplicador': `${multiplier}x`,
        'Status': 'Prêmio Creditado ✅'
      }
    );
  };

  return {
    popup,
    showPopup,
    hidePopup,
    showSuccess,
    showError,
    showBetSuccess,
    showPrizeWin
  };
};

// Componente do Popup
const PopupPersonalizado = ({ popup, onClose }) => {
  useEffect(() => {
    if (popup.show && popup.duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, popup.duration);
      
      return () => clearTimeout(timer);
    }
  }, [popup.show, popup.duration, onClose]);

  if (!popup.show) return null;

  const getStyles = () => {
    switch (popup.type) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-500 to-emerald-600',
          border: 'border-green-300',
          icon: <CheckCircle className="w-6 h-6 text-white" />,
          textColor: 'text-white'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-r from-red-500 to-red-600',
          border: 'border-red-300',
          icon: <AlertCircle className="w-6 h-6 text-white" />,
          textColor: 'text-white'
        };
      case 'prize':
        return {
          bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          border: 'border-yellow-300',
          icon: <Trophy className="w-6 h-6 text-white" />,
          textColor: 'text-white'
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          border: 'border-blue-300',
          icon: <CheckCircle className="w-6 h-6 text-white" />,
          textColor: 'text-white'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 animate-in zoom-in duration-300">
        <div className={`${styles.bg} rounded-lg shadow-2xl border ${styles.border} overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/20">
            <div className="flex items-center space-x-3">
              {styles.icon}
              <h3 className={`text-lg font-bold ${styles.textColor}`}>
                {popup.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className={`text-sm ${styles.textColor} mb-4 leading-relaxed`}>
              {popup.message}
            </p>

            {/* Details */}
            {popup.details && (
              <div className="bg-white/10 rounded-lg p-3 space-y-2">
                <h4 className={`text-sm font-semibold ${styles.textColor} mb-2`}>
                  Detalhes:
                </h4>
                {Object.entries(popup.details).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-xs">
                    <span className="text-white/80">{key}:</span>
                    <span className={`font-medium ${styles.textColor}`}>{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/20 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Fechar
            </button>
          </div>

          {/* Progress bar para auto-close */}
          {popup.duration > 0 && (
            <div className="h-1 bg-white/20">
              <div 
                className="h-full bg-white/60 transition-all ease-linear"
                style={{
                  animation: `shrink ${popup.duration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default PopupPersonalizado;

