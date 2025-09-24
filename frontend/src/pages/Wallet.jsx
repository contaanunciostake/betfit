import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import Header from '../components/layout/Header';
import { 
  Wallet as WalletIcon,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Minus,
  Eye,
  EyeOff,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  PiggyBank,
  Target,
  BarChart3,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import WalletBalance from '../components/wallet/WalletBalance';
import WalletTransactions from '../components/wallet/WalletTransactions';
import WalletDeposit from '../components/wallet/WalletDeposit';
import WalletWithdraw from '../components/wallet/WalletWithdraw';
import WalletStats from '../components/wallet/WalletStats';
import WalletGoals from '../components/wallet/WalletGoals';

const Wallet = () => {
  const { user, isAuthenticated } = useAuth();
  const { balance, transactions, isLoading } = useWallet();
  const [activeTab, setActiveTab] = useState('overview');
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    // Simulate loading wallet data
    const timer = setTimeout(() => {
      // setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-center">
                <WalletIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Acesso Restrito
                </h2>
                <p className="text-gray-400 mb-4">
                  Você precisa estar logado para acessar sua carteira.
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Fazer Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando carteira...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Wallet Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-600/20 rounded-lg border border-green-600/30">
              <WalletIcon className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Minha Carteira</h1>
              <p className="text-gray-400">Gerencie seus fundos e transações</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBalance(!showBalance)}
              className="flex items-center space-x-2 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-gray-300"
            >
              {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showBalance ? 'Ocultar' : 'Mostrar'}</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center space-x-2 bg-gray-800 border-gray-600 text-white hover:bg-gray-700 hover:text-gray-300"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Wallet Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:inline-flex bg-gray-800 border border-gray-700">
            <TabsTrigger 
              value="overview" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-700 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-700 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Transações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="deposit" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-700 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Depositar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="withdraw" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-700 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              <Minus className="w-4 h-4" />
              <span className="hidden sm:inline">Sacar</span>
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-700 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Estatísticas</span>
            </TabsTrigger>
            <TabsTrigger 
              value="goals" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-700 data-[state=active]:text-white text-gray-300 hover:text-white"
            >
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Metas</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <WalletBalance 
              balance={{ total: balance || 0, available: balance || 0, pending: 0 }}
              showBalance={showBalance}
              stats={{}}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WalletTransactions 
                transactions={transactions.slice(0, 5)}
                showAll={false}
              />
              <WalletStats stats={{}} />
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <WalletTransactions 
              transactions={transactions}
              showAll={true}
            />
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit">
            <WalletDeposit />
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw">
            <WalletWithdraw balance={{ total: balance || 0, available: balance || 0, pending: 0 }} />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <WalletStats stats={{}} detailed={true} />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <WalletGoals goals={[]} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;

