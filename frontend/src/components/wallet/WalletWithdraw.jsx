import { useState } from 'react';
import { 
  ArrowUpRight,
  DollarSign,
  Smartphone,
  CreditCard,
  Shield,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

const WalletWithdraw = ({ balance }) => {
  const [amount, setAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('email');

  const quickAmounts = [100, 200, 500, 1000];
  const minWithdraw = 50;
  const maxWithdraw = balance.available;

  const handleQuickAmount = (value) => {
    if (value <= maxWithdraw) {
      setAmount(value.toString());
    }
  };

  const handleMaxAmount = () => {
    setAmount(maxWithdraw.toString());
  };

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (!amount || withdrawAmount < minWithdraw) {
      alert(`Valor mínimo para saque é ${formatCurrency(minWithdraw)}`);
      return;
    }

    if (withdrawAmount > maxWithdraw) {
      alert('Saldo insuficiente');
      return;
    }

    if (withdrawMethod === 'pix' && !pixKey) {
      alert('Informe sua chave PIX');
      return;
    }

    setIsProcessing(true);

    try {
      // Get user email from localStorage or context
      const userEmail = localStorage.getItem('userEmail') || '';

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/withdraw/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: userEmail,
          amount: withdrawAmount,
          pix_key: pixKey
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Saque solicitado com sucesso! Você receberá R$ ${data.amount.toFixed(2)}. ${data.estimated_time === 'Imediato' ? 'Aprovado automaticamente!' : 'Aguardando aprovação manual.'}`);
        setAmount('');
        setPixKey('');
        // Refresh balance if callback provided
        if (typeof window.refreshWallet === 'function') {
          window.refreshWallet();
        }
      } else {
        alert(data.error || 'Erro ao processar saque');
      }
    } catch (error) {
      alert('Erro de conexão. Tente novamente.');
      console.error('Erro ao processar saque:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(numValue);
  };

  const calculateFee = (amount) => {
    // Novo sistema: 2% com mínimo de R$5 para PIX
    return Math.max(amount * 0.02, 5.00);
  };

  const getNetAmount = () => {
    const withdrawAmount = parseFloat(amount) || 0;
    const fee = calculateFee(withdrawAmount);
    return withdrawAmount - fee;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Available Balance */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Saldo Disponível para Saque</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(balance.available)}</p>
            {balance.pending > 0 && (
              <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                {formatCurrency(balance.pending)} pendente de confirmação
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdraw Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowUpRight className="w-5 h-5 text-primary" />
            <span>Sacar Fundos</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Transfira seus ganhos para sua conta bancária
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-4">
            <Label htmlFor="withdrawAmount">Valor do Saque</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="withdrawAmount"
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg"
                min={minWithdraw}
                max={maxWithdraw}
                step="0.01"
              />
            </div>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((value) => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAmount(value)}
                  disabled={value > maxWithdraw}
                  className="text-sm"
                >
                  R$ {value}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleMaxAmount}
              className="w-full"
            >
              Sacar Tudo ({formatCurrency(maxWithdraw)})
            </Button>
            
            {amount && (
              <div className="p-3 bg-card border rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Valor solicitado:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
                {calculateFee(parseFloat(amount)) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de saque:</span>
                    <span className="text-red-500">-{formatCurrency(calculateFee(parseFloat(amount)))}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Valor líquido:</span>
                  <span className="text-primary">{formatCurrency(getNetAmount())}</span>
                </div>
              </div>
            )}
          </div>

          {/* Withdraw Methods */}
          <Tabs value={withdrawMethod} onValueChange={setWithdrawMethod}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pix" className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4" />
                <span>PIX</span>
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Transferência</span>
              </TabsTrigger>
            </TabsList>

            {/* PIX Withdraw */}
            <TabsContent value="pix" className="space-y-4">
              <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-400">Saque PIX</span>
                </div>
                <p className="text-sm text-green-600 dark:text-green-500">
                  Taxa: 2% (mín. R$5). Processamento imediato para valores abaixo de R$1.000.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    placeholder="email@exemplo.com, CPF, telefone ou chave aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A chave PIX deve estar no mesmo CPF da conta BetFit
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Bank Transfer */}
            <TabsContent value="bank" className="space-y-4">
              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700 dark:text-yellow-400">Transferência Bancária</span>
                </div>
                <p className="text-sm text-yellow-600 dark:text-yellow-500">
                  Taxa de 2,5% (mín. R$ 2,50). Processamento em 1-2 dias úteis.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank">Banco</Label>
                    <Input
                      id="bank"
                      placeholder="Nome do banco"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="agency">Agência</Label>
                    <Input
                      id="agency"
                      placeholder="0000"
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account">Conta</Label>
                    <Input
                      id="account"
                      placeholder="00000-0"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountType">Tipo</Label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option value="checking">Corrente</option>
                      <option value="savings">Poupança</option>
                    </select>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Withdraw Button */}
          <Button
            className="w-full betfit-button-primary"
            onClick={handleWithdraw}
            disabled={!amount || parseFloat(amount) < minWithdraw || parseFloat(amount) > maxWithdraw || isProcessing}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4 mr-2" />
                Solicitar Saque
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Important Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Informações importantes:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• Valor mínimo para saque: {formatCurrency(minWithdraw)}</li>
            <li>• PIX: Gratuito, processamento em até 2 horas</li>
            <li>• Transferência: Taxa de 2,5% (mín. R$ 2,50), 1-2 dias úteis</li>
            <li>• Saques só podem ser feitos para contas no mesmo CPF</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default WalletWithdraw;

