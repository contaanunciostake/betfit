import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWallet } from '../../contexts/WalletContext';
import { useChallenges } from '../../contexts/ChallengeContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Wallet,
  Users,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    balance,
    realBalance,
    refreshWallet
  } = useWallet();
  const navigate = useNavigate();
  const { searchChallenges } = useChallenges();
  const { 
    platformName, 
    platformLogo, 
    platformLogoWhite, 
    platformLogoBlack 
  } = useSettings();

  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // FUNÇÃO PARA CRIAR URL COMPLETA
  const createImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `http://localhost:5001${imagePath}`;
  };

  // DETERMINAR QUAL LOGO USAR (prioridade: colorido > branco > preto)
  const getLogoUrl = () => {
    if (platformLogo) return createImageUrl(platformLogo);
    if (platformLogoWhite) return createImageUrl(platformLogoWhite);
    if (platformLogoBlack) return createImageUrl(platformLogoBlack);
    return null;
  };

  const logoUrl = getLogoUrl();

  const handleHeaderSearchSubmit = (e) => {
    e.preventDefault();
    if (searchChallenges) {
      searchChallenges(searchQuery);
    }
  };

  const handleRefreshBalance = async () => {
    if (!refreshWallet || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshWallet();
    } catch (error) {
      console.error('❌ [HEADER] Erro no refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const displayBalance = realBalance !== undefined ? realBalance : balance;

  const formatBalance = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount || 0);
  };

  return (
    <header className="bg-[#1E1E1E] border-b border-gray-700/50 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-6">
            {/* LÓGICA DO LOGOTIPO CORRIGIDA */}
            <Link to="/" className="flex items-center space-x-2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={platformName || 'Logo da Plataforma'} 
                  className="h-9 w-auto object-contain"
                  onError={(e) => {
                    console.error('Erro ao carregar logo:', logoUrl);
                    // Se falhar, esconde a imagem e mostra fallback
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <>
                  <div className="w-9 h-9 bg-green-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-xl">
                      {platformName ? platformName.charAt(0).toUpperCase() : 'B'}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {platformName || 'BetFit'}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            <form onSubmit={handleHeaderSearchSubmit} className="hidden lg:block relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Pesquisar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 w-48 bg-gray-800/50 border-gray-700/50 focus:border-green-500 text-white rounded-full text-sm h-9"
              />
            </form>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div 
                  className="hidden sm:flex items-center space-x-2 bg-gray-800/50 rounded-full px-3 py-1.5 cursor-pointer hover:bg-gray-700/80 transition-colors"
                  onClick={handleRefreshBalance}
                  title="Atualizar Saldo"
                >
                  <Wallet className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-white">{formatBalance(displayBalance)}</span>
                </div>
                <div className="relative">
                  <Button
                    variant="ghost"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-white hover:bg-gray-700/80 p-1.5 rounded-full"
                  >
                    <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </Button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-60 bg-[#282828] border border-gray-700/50 rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-700/50">
                        <p className="text-sm font-medium text-white">{user?.name}</p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                      </div>
                      <Link to="/profile" className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/80 flex items-center space-x-2"><Users className="w-4 h-4" /><span>Meu Perfil</span></Link>
                      <Link to="/wallet" className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/80 flex items-center space-x-2"><Wallet className="w-4 h-4" /><span>Carteira</span></Link>
                      <Link to="/settings" className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/80 flex items-center space-x-2"><Settings className="w-4 h-4" /><span>Configurações</span></Link>
                      <div className="border-t border-gray-700/50 mt-1 pt-1">
                        <button onClick={logout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 flex items-center space-x-2"><LogOut className="w-4 h-4" /><span>Sair</span></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button variant="ghost" size="sm" className="text-white hover:bg-gray-700/80" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700" onClick={() => navigate('/register')}>Registre-se</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;