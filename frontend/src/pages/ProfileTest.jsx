import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import Header from '../components/layout/Header';

const ProfileTest = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Acesso Restrito
            </h1>
            <p className="text-muted-foreground">
              Você precisa estar logado para acessar seu perfil.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Meu Perfil - Teste com Header
          </h1>
          <p className="text-muted-foreground mb-4">
            Esta é uma versão de teste da página de perfil com o Header adicionado.
          </p>
          <div className="bg-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Usuário Logado</h2>
            <p>Nome: {user?.name || 'João Silva'}</p>
            <p>Email: {user?.email || 'joao.silva@email.com'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileTest;

