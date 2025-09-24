import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '../components/layout/Header';
import DevicesSection from '../components/settings/DevicesSection';
import { 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  CreditCard, 
  Globe, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX,
  Eye,
  EyeOff,
  Save,
  Trash2,
  LogOut,
  Settings as SettingsIcon,
  ChevronRight,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.profile?.bio || '',
    location: user?.profile?.location || '',
    birthDate: '',
    gender: '',
    weight: '',
    height: ''
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    challengeUpdates: true,
    paymentAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
    achievementAlerts: true
  });

  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showRealName: true,
    showLocation: true,
    showStats: true,
    allowFriendRequests: true,
    showOnlineStatus: true,
    dataSharing: false
  });

  // App settings state
  const [appSettings, setAppSettings] = useState({
    theme: 'dark',
    language: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    soundEffects: true,
    autoSync: true,
    offlineMode: false
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30',
    passwordLastChanged: '2024-01-15'
  });

  // Platform settings state - NOVA SEÇÃO
const [platformSettings, setPlatformSettings] = useState({
  platform_name: '',
  platform_description: '',
  platform_logo: null,
  platform_fee: 10
});

// Estados para upload de logo - NOVO
const [logoFile, setLogoFile] = useState(null);
const [logoPreview, setLogoPreview] = useState(null);
const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSave = async (section) => {
    setSaveStatus('saving');
    
    // Simulate API call
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 2000);
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    // Simulate account deletion
    setShowDeleteConfirm(false);
    setSaveStatus('deleting');
    
    setTimeout(() => {
      logout();
    }, 2000);
  };

// Função para upload de logo - NOVA
const handleLogoUpload = async (file) => {
  if (!file) return;
  
  setUploadingLogo(true);
  
  try {
    const formData = new FormData();
    formData.append('platform_logo_file', file);
    formData.append('section', 'general');
    
    const response = await fetch('http://localhost:5001/api/admin/settings/general', {
      method: 'PUT',
      body: formData
    });
    
    if (response.ok) {
      setSaveStatus('saved');
      // Atualizar preview
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target.result);
      reader.readAsDataURL(file);
      
      setTimeout(() => setSaveStatus(null), 2000);
    } else {
      throw new Error('Erro no upload');
    }
  } catch (error) {
    console.error('Erro no upload:', error);
    setSaveStatus('error');
    setTimeout(() => setSaveStatus(null), 2000);
  } finally {
    setUploadingLogo(false);
  }
};

// Função para lidar com seleção de arquivo - NOVA
const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (file) {
    setLogoFile(file);
    handleLogoUpload(file);
  }
};

  const sections = [
    { id: 'platform', label: 'Plataforma', icon: Globe }, // NOVA SEÇÃO
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
    { id: 'devices', label: 'Dispositivos', icon: Smartphone },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'app', label: 'Aplicativo', icon: SettingsIcon },
    { id: 'security', label: 'Segurança', icon: Shield }
  ];

  const renderProfileSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Informações Pessoais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-gray-300">Nome Completo</Label>
            <Input
              id="name"
              value={profileData.name}
              onChange={(e) => setProfileData({...profileData, name: e.target.value})}
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
          <div>
            <Label htmlFor="birthDate" className="text-gray-300">Data de Nascimento</Label>
            <Input
              id="birthDate"
              type="date"
              value={profileData.birthDate}
              onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
          <div>
            <Label htmlFor="gender" className="text-gray-300">Gênero</Label>
            <Select value={profileData.gender} onValueChange={(value) => setProfileData({...profileData, gender: value})}>
              <SelectTrigger className="mt-1 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
                <SelectItem value="prefer-not-to-say">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="location" className="text-gray-300">Localização</Label>
            <Input
              id="location"
              value={profileData.location}
              onChange={(e) => setProfileData({...profileData, location: e.target.value})}
              placeholder="Cidade, Estado"
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Informações Físicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weight" className="text-gray-300">Peso (kg)</Label>
            <Input
              id="weight"
              type="number"
              value={profileData.weight}
              onChange={(e) => setProfileData({...profileData, weight: e.target.value})}
              placeholder="70"
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
          <div>
            <Label htmlFor="height" className="text-gray-300">Altura (cm)</Label>
            <Input
              id="height"
              type="number"
              value={profileData.height}
              onChange={(e) => setProfileData({...profileData, height: e.target.value})}
              placeholder="175"
              className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="bio" className="text-gray-300">Biografia</Label>
        <Textarea
          id="bio"
          value={profileData.bio}
          onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
          placeholder="Conte um pouco sobre você e seus objetivos fitness..."
          className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
          rows={4}
        />
      </div>

      <Button onClick={() => handleSave('profile')} className="bg-green-600 hover:bg-green-700 text-white">
        <Save className="w-4 h-4 mr-2" />
        Salvar Alterações
      </Button>
    </div>
  );

  const renderPlatformSection = () => (
  <div className="space-y-6">
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">Configurações da Plataforma</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="platform_name" className="text-gray-300">Nome da Plataforma</Label>
          <Input
            id="platform_name"
            value={platformSettings.platform_name}
            onChange={(e) => setPlatformSettings({...platformSettings, platform_name: e.target.value})}
            placeholder="BetFit"
            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
          />
        </div>
        
        <div>
          <Label htmlFor="platform_description" className="text-gray-300">Descrição</Label>
          <Textarea
            id="platform_description"
            value={platformSettings.platform_description}
            onChange={(e) => setPlatformSettings({...platformSettings, platform_description: e.target.value})}
            placeholder="Plataforma de apostas fitness"
            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
            rows={3}
          />
        </div>
        
        <div>
          <Label className="text-gray-300">Logotipo da Plataforma</Label>
          <div className="mt-1 space-y-3">
            {logoPreview && (
              <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                <img src={logoPreview} alt="Preview" className="h-12 w-auto" />
              </div>
            )}
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <Button
                onClick={() => document.getElementById('logo-upload').click()}
                disabled={uploadingLogo}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {uploadingLogo ? 'Enviando...' : 'Escolher Logo'}
              </Button>
              <span className="text-sm text-gray-400">PNG, JPG até 2MB</span>
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="platform_fee" className="text-gray-300">Taxa da Plataforma (%)</Label>
          <Input
            id="platform_fee"
            type="number"
            value={platformSettings.platform_fee}
            onChange={(e) => setPlatformSettings({...platformSettings, platform_fee: Number(e.target.value)})}
            min="0"
            max="50"
            className="mt-1 bg-gray-800 border-gray-700 text-white focus:border-green-500"
          />
        </div>
      </div>
    </div>

    <Button onClick={() => handleSave('platform')} className="bg-green-600 hover:bg-green-700 text-white">
      <Save className="w-4 h-4 mr-2" />
      Salvar Configurações
    </Button>
  </div>
);

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Preferências de Notificação</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Notificações por Email</Label>
              <p className="text-sm text-gray-400">Receba atualizações importantes por email</p>
            </div>
            <Switch
              checked={notificationSettings.emailNotifications}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Notificações Push</Label>
              <p className="text-sm text-gray-400">Notificações em tempo real no dispositivo</p>
            </div>
            <Switch
              checked={notificationSettings.pushNotifications}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, pushNotifications: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">SMS</Label>
              <p className="text-sm text-gray-400">Notificações por mensagem de texto</p>
            </div>
            <Switch
              checked={notificationSettings.smsNotifications}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Tipos de Notificação</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Atualizações de Desafios</Label>
              <p className="text-sm text-gray-400">Novos desafios e resultados</p>
            </div>
            <Switch
              checked={notificationSettings.challengeUpdates}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, challengeUpdates: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Alertas de Pagamento</Label>
              <p className="text-sm text-gray-400">Transações e mudanças na carteira</p>
            </div>
            <Switch
              checked={notificationSettings.paymentAlerts}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, paymentAlerts: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Conquistas</Label>
              <p className="text-sm text-gray-400">Quando você alcança novos marcos</p>
            </div>
            <Switch
              checked={notificationSettings.achievementAlerts}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, achievementAlerts: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Relatórios Semanais</Label>
              <p className="text-sm text-gray-400">Resumo semanal de atividades</p>
            </div>
            <Switch
              checked={notificationSettings.weeklyReports}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyReports: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Emails de Marketing</Label>
              <p className="text-sm text-gray-400">Promoções e novidades</p>
            </div>
            <Switch
              checked={notificationSettings.marketingEmails}
              onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, marketingEmails: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      <Button onClick={() => handleSave('notifications')} className="bg-green-600 hover:bg-green-700 text-white">
        <Save className="w-4 h-4 mr-2" />
        Salvar Preferências
      </Button>
    </div>
  );

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Visibilidade do Perfil</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Label className="text-gray-300">Quem pode ver seu perfil?</Label>
            <Select value={privacySettings.profileVisibility} onValueChange={(value) => setPrivacySettings({...privacySettings, profileVisibility: value})}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="friends">Apenas Amigos</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Mostrar Nome Real</Label>
              <p className="text-sm text-gray-400">Exibir seu nome completo no perfil</p>
            </div>
            <Switch
              checked={privacySettings.showRealName}
              onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showRealName: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Mostrar Localização</Label>
              <p className="text-sm text-gray-400">Exibir sua cidade no perfil</p>
            </div>
            <Switch
              checked={privacySettings.showLocation}
              onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showLocation: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Mostrar Estatísticas</Label>
              <p className="text-sm text-gray-400">Exibir suas estatísticas de desempenho</p>
            </div>
            <Switch
              checked={privacySettings.showStats}
              onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showStats: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Status Online</Label>
              <p className="text-sm text-gray-400">Mostrar quando você está online</p>
            </div>
            <Switch
              checked={privacySettings.showOnlineStatus}
              onCheckedChange={(checked) => setPrivacySettings({...privacySettings, showOnlineStatus: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Interações Sociais</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Permitir Solicitações de Amizade</Label>
              <p className="text-sm text-gray-400">Outros usuários podem enviar convites</p>
            </div>
            <Switch
              checked={privacySettings.allowFriendRequests}
              onCheckedChange={(checked) => setPrivacySettings({...privacySettings, allowFriendRequests: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Dados e Privacidade</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Compartilhamento de Dados</Label>
              <p className="text-sm text-gray-400">Permitir uso de dados para melhorias</p>
            </div>
            <Switch
              checked={privacySettings.dataSharing}
              onCheckedChange={(checked) => setPrivacySettings({...privacySettings, dataSharing: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      <Button onClick={() => handleSave('privacy')} className="bg-green-600 hover:bg-green-700 text-white">
        <Save className="w-4 h-4 mr-2" />
        Salvar Configurações
      </Button>
    </div>
  );

  const renderDevicesSection = () => (
    <DevicesSection user={user} />
  );

  const renderPaymentsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Métodos de Pagamento</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 text-center">
            <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">Nenhum método de pagamento cadastrado</p>
            <Button className="mt-3 bg-green-600 hover:bg-green-700 text-white">
              Adicionar Cartão
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Configurações de Cobrança</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Label className="text-gray-300">Moeda Preferida</Label>
            <Select value={appSettings.currency} onValueChange={(value) => setAppSettings({...appSettings, currency: value})}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="BRL">Real Brasileiro (R$)</SelectItem>
                <SelectItem value="USD">Dólar Americano ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Aparência</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Label className="text-gray-300">Tema</Label>
            <Select value={appSettings.theme} onValueChange={(value) => setAppSettings({...appSettings, theme: value})}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="auto">Automático</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Efeitos Sonoros</Label>
              <p className="text-sm text-gray-400">Sons de notificação e interação</p>
            </div>
            <Switch
              checked={appSettings.soundEffects}
              onCheckedChange={(checked) => setAppSettings({...appSettings, soundEffects: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Localização</h3>
        <div className="space-y-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Label className="text-gray-300">Idioma</Label>
            <Select value={appSettings.language} onValueChange={(value) => setAppSettings({...appSettings, language: value})}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Label className="text-gray-300">Fuso Horário</Label>
            <Select value={appSettings.timezone} onValueChange={(value) => setAppSettings({...appSettings, timezone: value})}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                <SelectItem value="America/New_York">New York (GMT-5)</SelectItem>
                <SelectItem value="Europe/London">London (GMT+0)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={() => handleSave('app')} className="bg-green-600 hover:bg-green-700 text-white">
        <Save className="w-4 h-4 mr-2" />
        Salvar Configurações
      </Button>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Autenticação</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Autenticação de Dois Fatores</Label>
              <p className="text-sm text-gray-400">Adicione uma camada extra de segurança</p>
            </div>
            <Switch
              checked={securitySettings.twoFactorAuth}
              onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Alertas de Login</Label>
              <p className="text-sm text-gray-400">Notificar sobre novos logins</p>
            </div>
            <Switch
              checked={securitySettings.loginAlerts}
              onCheckedChange={(checked) => setSecuritySettings({...securitySettings, loginAlerts: checked})}
              className="data-[state=checked]:bg-green-600"
            />
          </div>

          <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <Label className="text-gray-300">Timeout de Sessão</Label>
            <Select value={securitySettings.sessionTimeout} onValueChange={(value) => setSecuritySettings({...securitySettings, sessionTimeout: value})}>
              <SelectTrigger className="mt-2 bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="15">15 minutos</SelectItem>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="never">Nunca</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Senha</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div>
              <Label className="text-white">Última alteração</Label>
              <p className="text-sm text-gray-400">15 de janeiro de 2024</p>
            </div>
            <Button variant="outline" size="sm" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              Alterar Senha
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Zona de Perigo</h3>
        <div className="space-y-4">
          <div className="border border-red-700/50 rounded-lg p-4 bg-red-900/20">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-red-400">Excluir Conta</Label>
                <p className="text-sm text-gray-400">Esta ação não pode ser desfeita</p>
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Button onClick={() => handleSave('security')} className="bg-green-600 hover:bg-green-700 text-white">
        <Save className="w-4 h-4 mr-2" />
        Salvar Configurações
      </Button>
    </div>
  );

  const renderSection = () => {
  switch (activeSection) {
    case 'platform': return renderPlatformSection(); // ADICIONAR ESTA LINHA
    case 'profile': return renderProfileSection();
    case 'notifications': return renderNotificationsSection();
    case 'privacy': return renderPrivacySection();
    case 'devices': return renderDevicesSection();
    case 'payments': return renderPaymentsSection();
    case 'app': return renderAppSection();
    case 'security': return renderSecuritySection();
    default: return renderProfileSection();
  }
};

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Header Principal */}
      <Header />
      
      {/* Header da Página de Configurações */}
      <div className="border-b border-gray-700/50 bg-[#1E1E1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <SettingsIcon className="w-6 h-6 text-green-500" />
              <h1 className="text-xl font-bold text-white">Configurações</h1>
            </div>
            
            {saveStatus && (
              <div className="flex items-center space-x-2">
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Salvando...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-500">Salvo!</span>
                  </>
                )}
                {saveStatus === 'deleting' && (
                  <>
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-red-400">Excluindo conta...</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
              
              <div className="pt-4 border-t border-gray-700/50">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-[#1E1E1E] border border-gray-700/50 rounded-lg p-6 shadow-lg">
              {renderSection()}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E1E1E] border border-gray-700/50 rounded-lg w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Excluir Conta</h3>
            </div>
            
            <p className="text-gray-400 mb-6">
              Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita e todos os seus dados serão perdidos permanentemente.
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Excluir Conta
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

