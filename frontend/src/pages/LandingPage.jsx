import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// COMENTADO TEMPORARIAMENTE PARA TESTE DE PERFORMANCE
// import { useSettings } from '../contexts/SettingsContext';
import { Button } from '@/components/ui/button';
import LoginModal from '../components/auth/LoginModal';
import {
  Trophy,
  Target,
  Users,
  Shield,
  Zap,
  Award,
  ChevronRight,
  Play
} from 'lucide-react';

const LandingPage = () => {
  const { isAuthenticated } = useAuth();
  
  // VALORES ESTÁTICOS PARA TESTE - REABILITE useSettings() DEPOIS SE NECESSÁRIO
  const platformName = 'BetFit';
  const platform_logotipo_white = null;
  
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState('login');

  // Redirect authenticated users to challenges page
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/challenges');
    }
  }, [isAuthenticated, navigate]);

  const openLoginModal = (mode) => {
    setLoginModalMode(mode);
    setShowLoginModal(true);
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
      <header className="bg-gradient-to-r from-[#005C3B] to-[#008000] relative z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 relative">
            {/* Logo Dinâmico */}
            <div className="flex items-center space-x-2">
              {platform_logotipo_white ? (
                <img 
                  src={platform_logotipo_white} 
                  alt={platformName || 'Logo da Plataforma'} 
                  className="h-10 w-auto object-contain" 
                />
              ) : (
                <>
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                    <span className="text-[#005C3B] font-bold text-xl">
                      {platformName ? platformName.charAt(0).toUpperCase() : 'B'}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {platformName || 'BetFit'}
                  </span>
                </>
              )}
            </div>

            {/* Auth Buttons no canto superior direito */}
            <div className="flex items-center space-x-2">
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
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-[80vh] flex items-center overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `url('/betfit_landing_hero_professional.png')` }}
      >
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent z-10"></div>
        
        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-3xl text-left">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-green-600/20 border border-green-500/30 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm font-medium">
                Apostas Fitness BetFit
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-4 leading-tight italic">
              SEJA QUAL FOR O ESPORTE,
              SEJA QUAL FOR O MOMENTO.
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white mb-8 max-w-2xl italic">
              Transforme seus treinos em desafios emocionantes. Aposte em você mesmo, 
              compete com amigos e ganhe prêmios reais por atingir suas metas fitness.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-start space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200"
                onClick={() => openLoginModal('register')}
              >
                Começar Agora
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-xl backdrop-blur-sm"
              >
                <Play className="w-5 h-5 mr-2" />
                Ver Como Funciona
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl">
              {stats.map((stat, index) => (
                <div key={index} className="text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm text-white/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Por que escolher o {platformName || 'BetFit'}?
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              A plataforma mais completa para transformar seus objetivos fitness em conquistas reais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-white/70">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para o desafio?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de atletas que já transformaram seus treinos em conquistas
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-12 py-4 text-lg font-semibold rounded-xl shadow-2xl transform hover:scale-105 transition-all duration-200"
              onClick={() => openLoginModal('register')}
            >
              Criar Conta Grátis
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                {platform_logotipo_white ? (
                  <img 
                    src={platform_logotipo_white} 
                    alt={platformName || 'Logo da Plataforma'} 
                    className="h-8 w-auto object-contain" 
                  />
                ) : (
                  <>
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">
                        {platformName ? platformName.charAt(0).toUpperCase() : 'B'}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white">{platformName || 'BetFit'}</span>
                  </>
                )}
              </div>
              <p className="text-white/60 max-w-md">
                A plataforma que transforma seus objetivos fitness em conquistas reais através de desafios e apostas inteligentes.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Plataforma</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Como Funciona</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Desafios</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Comunidade</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Suporte</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Jogo Responsável</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-white/60">
              © 2024 {platformName || 'BetFit'}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>

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