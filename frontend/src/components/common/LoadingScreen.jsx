import { Loader2 } from 'lucide-react';

const LoadingScreen = ({ message = 'Carregando...' }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 betfit-gradient rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">B</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <span className="text-lg font-semibold text-foreground">BetFit</span>
        </div>
        
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;

