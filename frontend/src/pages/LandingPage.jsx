import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Users,
  Shield,
  Zap,
  Award,
  ChevronRight,
  Play,
  Menu,
  X
} from 'lucide-react';

// Mock Button component
const Button = ({ children, className, onClick, variant = 'default', size = 'default', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    outline: 'border border-input hover:bg-accent hover:text-accent-foreground'
  };
  
  const sizes = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md',
    lg: 'h-11 px-8 rounded-md'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Mock LoginModal component
const LoginModal = ({ isOpen, onClose, initialMode }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {initialMode === 'register' ? 'Criar Conta' : 'Fazer Login'}
        </h2>
        <p className="text-gray-600 mb-4">
          Modal de {initialMode === 'register' ? 'registro' : 'login'} seria implementado aqui.
        </p>
        <Button onClick={onClose} className="w-full">
          Fechar
        </Button>
      </div>
    </div>
  );
};

const LandingPage = () => {
  // Mock auth state
  const isAuthenticated = false;
  
  // VALORES ESTÁTICOS PARA TESTE - REABILITE useSettings() DEPOIS SE NECESSÁRIO
  const platformName = 'BetFit';
  const platform_logotipo_white = null;
  
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openLoginModal = (mode) => {
    setLoginModalMode(mode);
    setShowLoginModal(true);
    setMobileMenuOpen(false);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const features = [
    {
      icon: Trophy,
      title: 'Desafios Fitness',
      description: 'Participe de desafios de corrida, ciclismo, natação e muito mais'
    },
    {
      icon: Target,
      title: 'Metas Personalizadas',
      description: 'Defina suas próprias metas e acompanhe seu progresso'
    },
    {
      icon: Users,
      title: 'Comunidade Ativa',
      description: 'Conecte-se com outros atletas e compartilhe suas conquistas'
    },
    {
      icon: Shield,
      title: 'Apostas Seguras',
      description: 'Plataforma segura e confiável para suas apostas fitness'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Usuários Ativos' },
    { number: '500+', label: 'Desafios Concluídos' },
    { number: 'R$ 1M+', label: 'Em Prêmios' },
    { number: '50+', label: 'Modalidades' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-green-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#005C3B] to-[#008000] relative z-50 sticky top-0">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 relative">
            {/* Logo Dinâmico */}
            <div className="flex items-center space-x-2">
              {platform_logotipo_white ? (
                <img 
                  src={platform_logotipo_white} 
                  alt={platformName || 'Logo da Plataforma'} 
                  className="h-8 sm:h-10 w-auto object-contain" 
                />
              ) : (
                <>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-[#005C3B] font-bold text-lg sm:text-xl">
                      {platformName ? platformName.charAt(0).toUpperCase() : 'B'}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {platformName || 'BetFit'}
                  </span>
                </>
              )}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white border border-white/50 hover:bg-white/10 px-4 py-1.5 text-sm font-medium rounded-full"
                onClick={() => openLoginModal('register')}
              >
                Registrar-se
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-white border border-white/50 hover:bg-white/10 px-4 py-1.5 text-sm font-medium rounded-full"
                onClick={() => openLoginModal('login')}
              >
                Login
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                className="text-white p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="sm:hidden absolute top-full left-0 right-0 bg-[#005C3B] border-t border-white/20 shadow-lg">
              <div className="px-4 py-4 space-y-3">
                <Button
                  variant="ghost"
                  className="w-full text-white border border-white/50 hover:bg-white/10 py-3 text-base font-medium rounded-full"
                  onClick={() => openLoginModal('register')}
                >
                  Registrar-se
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-white border border-white/50 hover:bg-white/10 py-3 text-base font-medium rounded-full"
                  onClick={() => openLoginModal('login')}
                >
                  Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-[85vh] sm:min-h-[80vh] flex items-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('/betfit_landing_hero_professional.png')` }}
      >
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/70 to-transparent z-10"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-20">
          <div className="max-w-4xl text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-green-600/20 border border-green-500/30 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-6 sm:mb-8">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
              <span className="text-green-300 text-xs sm:text-sm font-medium">
                Apostas Fitness BetFit
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white mb-4 leading-tight italic">
              SEJA QUAL FOR O ESPORTE,
              <br className="hidden sm:block" />
              SEJA QUAL FOR O MOMENTO.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-8 max-w-2xl italic leading-relaxed">
              Transforme seus treinos em desafios emocionantes. Aposte em você mesmo, 
              compete com amigos e ganhe prêmios reais por atingir suas metas fitness.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-8 sm:mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200 active:scale-95"
                onClick={() => openLoginModal('register')}
              >
                Começar Agora
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg font-semibold rounded-xl backdrop-blur-sm active:scale-95 transition-all duration-200"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Ver Como Funciona
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 md:gap-8 max-w-3xl">
              {stats.map((stat, index) => (
                <div key={index} className="text-left">
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-xs sm:text-sm text-white/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Por que escolher o {platformName || 'BetFit'}?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/70 max-w-2xl mx-auto px-4">
              A plataforma mais completa para transformar seus objetivos fitness em conquistas reais
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group active:scale-95"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-white/70">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 sm:p-12 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Pronto para o desafio?
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-white/80 mb-6 sm:mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de atletas que já transformaram seus treinos em conquistas
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 sm:px-12 sm:py-4 text-base sm:text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200 active:scale-95"
              onClick={() => openLoginModal('register')}
            >
              Criar Conta Grátis
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 sm:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                {platform_logotipo_white ? (
                  <img 
                    src={platform_logotipo_white} 
                    alt={platformName || 'Logo da Plataforma'} 
                    className="h-6 sm:h-8 w-auto object-contain" 
                  />
                ) : (
                  <>
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-base">
                        {platformName ? platformName.charAt(0).toUpperCase() : 'B'}
                      </span>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-white">{platformName || 'BetFit'}</span>
                  </>
                )}
              </div>
              <p className="text-sm sm:text-base text-white/60 max-w-md">
                A plataforma que transforma seus objetivos fitness em conquistas reais através de desafios e apostas inteligentes.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">Plataforma</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Desafios</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Comunidade</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Suporte</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm sm:text-base">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Jogo Responsável</a></li>
                <li><a href="#" className="text-sm text-white/60 hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-xs sm:text-sm text-white/60">
              © 2024 {platformName || 'BetFit'}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </section>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={closeLoginModal} 
        initialMode={loginModalMode} 
      />
    </div>
  );
};

export default LandingPage;
