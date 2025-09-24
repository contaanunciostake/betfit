// Salve este código em: src/components/fitness/ConnectAppModal.js

import React from 'react';
import { ShieldAlert, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

// Mapeia categorias para um texto mais amigável
const categoryNames = {
  running: 'de Corrida',
  cycling: 'de Ciclismo',
  steps: 'de Contagem de Passos',
  walking: 'de Contagem de Passos',
  workouts: 'de Treino',
  default: 'de Fitness'
};

const ConnectAppModal = ({ isOpen, onClose, challenge }) => {
  const navigate = useNavigate();

  // Se o modal for renderizado antes de o desafio ser selecionado, não mostre nada
  if (!challenge) {
    return null;
  }

  const handleNavigate = () => {
    // Redireciona o usuário para a página de perfil/conexões
    // Certifique-se de que a rota '/profile/connections' existe no seu app de frontend
    navigate('/profile/devices');
    onClose();
  };
  
  const categoryName = categoryNames[challenge.required_app_category] || categoryNames.default;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <ShieldAlert className="w-6 h-6 mr-2 text-yellow-500" />
            Conexão Necessária
          </DialogTitle>
          <DialogDescription className="pt-2">
            Para garantir a validação automática e justa dos resultados, este desafio requer uma conexão com um aplicativo de fitness.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 p-4 bg-secondary rounded-lg border">
            <p className="font-semibold text-foreground">Desafio:</p>
            <p className="text-sm text-primary mb-2">{challenge.title}</p>
            <p className="font-semibold text-foreground">Tipo de App Requerido:</p>
            <p className="text-sm text-primary">Aplicativo {categoryName}</p>
            <p className="text-xs text-muted-foreground mt-2">
              (Ex: Apple Health, Google Fit, Strava, entre outros...)
            </p>
        </div>

        <p className="text-sm text-muted-foreground">
          Por favor, vá para o seu perfil e conecte um aplicativo compatível para poder participar deste e de outros desafios.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Voltar
          </Button>
          <Button onClick={handleNavigate}>
            <LinkIcon className="w-4 h-4 mr-2" />
            Ir para Conexões
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConnectAppModal;