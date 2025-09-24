import { Heart, Shield, Zap } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 betfit-gradient rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-2xl font-bold text-foreground">BetFit</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              A primeira plataforma de apostas fitness com validação automática via wearables. 
              Transforme seus treinos em desafios emocionantes e ganhe dinheiro sendo saudável.
            </p>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Shield className="w-4 h-4 text-primary" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-accent" />
                <span>Validação Automática</span>
              </div>
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4 text-destructive" />
                <span>Saúde em Primeiro</span>
              </div>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Plataforma</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Como Funciona</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Desafios</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Ranking</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Conectar Dispositivos</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground mb-4 md:mb-0">
            © 2024 BetFit. Todos os direitos reservados.
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Jogue com responsabilidade</span>
            <span>•</span>
            <span>+18 anos</span>
            <span>•</span>
            <span>Licenciado no Brasil</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

