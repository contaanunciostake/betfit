import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 betfit-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">B</span>
              </div>
            </div>

            {/* Error Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Oops! Algo deu errado
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada 
              e está trabalhando para resolver o problema.
            </p>

            {/* Error Details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-secondary/50 border border-border rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-foreground mb-2">Detalhes do Erro:</h3>
                <pre className="text-xs text-muted-foreground overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={this.handleReset}
                className="w-full betfit-button-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
              
              <Button 
                onClick={this.handleReload}
                variant="outline"
                className="w-full"
              >
                Recarregar Página
              </Button>
            </div>

            {/* Support Info */}
            <div className="mt-8 p-4 bg-secondary/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Se o problema persistir, entre em contato com nosso suporte em{' '}
                <a 
                  href="mailto:suporte@betfit.com" 
                  className="text-primary hover:underline"
                >
                  suporte@betfit.com
                </a>
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

