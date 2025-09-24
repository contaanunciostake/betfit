import { useState } from 'react';
import { 
  Settings, 
  User, 
  Lock, 
  Bell, 
  CreditCard,
  Shield,
  Eye,
  EyeOff,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const ProfileSettings = ({ user, onUpdateProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    bio: user.bio || '',
    location: user.location || '',
    birthDate: user.birthDate || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    challenges: true,
    results: true,
    marketing: false,
    security: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showStats: true,
    showAchievements: true,
    showActivity: true,
    allowMessages: true
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field, value) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePrivacyChange = (field, value) => {
    setPrivacy(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate save process
    setTimeout(() => {
      onUpdateProfile(formData);
      setIsEditing(false);
      setIsSaving(false);
    }, 1500);
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      location: user.location || '',
      birthDate: user.birthDate || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Configurações do Perfil</h1>
          <p className="text-gray-400">Gerencie suas informações pessoais, segurança e preferências</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-[#1E1E1E] border border-gray-700/50 rounded-lg p-1">
            <TabsTrigger 
              value="profile" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="flex items-center space-x-2 data-[state=active]:bg-green-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacidade</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Settings */}
          <TabsContent value="profile" className="mt-6">
            <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
              <CardHeader className="border-b border-gray-700/50">
                <CardTitle className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-green-500" />
                    <span>Informações Pessoais</span>
                  </div>
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)} 
                      variant="outline" 
                      size="sm"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleCancel} 
                        variant="outline" 
                        size="sm"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSave} 
                        size="sm" 
                        disabled={isSaving}
                        className="bg-green-600 text-white hover:bg-green-700"
                      >
                        {isSaving ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      {isEditing && (
                        <Button 
                          size="sm" 
                          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-green-600 hover:bg-green-700 shadow-lg"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Carregar Foto
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Nome Completo</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500 disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10 bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Telefone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10 bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500 disabled:opacity-60"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-gray-300">Data de Nascimento</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) => handleInputChange('birthDate', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10 bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location" className="text-gray-300">Localização</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => handleInputChange('location', e.target.value)}
                          disabled={!isEditing}
                          className="pl-10 bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500 disabled:opacity-60"
                          placeholder="Cidade, Estado"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio" className="text-gray-300">Biografia</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Conte um pouco sobre você..."
                        rows={3}
                        className="bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500 disabled:opacity-60 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Lock className="w-5 h-5 text-green-500" />
                    <span>Alterar Senha</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-gray-300">Senha Atual</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          placeholder="Digite sua senha atual"
                          className="bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-gray-300">Nova Senha</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        placeholder="Digite sua nova senha"
                        className="bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-300">Confirmar Nova Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        placeholder="Confirme sua nova senha"
                        className="bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500"
                      />
                    </div>

                    <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                      <Lock className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span>Autenticação de Dois Fatores</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">2FA via SMS</h4>
                      <p className="text-sm text-gray-400">
                        Adicione uma camada extra de segurança à sua conta
                      </p>
                    </div>
                    <Switch className="data-[state=checked]:bg-green-600" />
                  </div>
                  
                  <div className="mt-4 p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-orange-300">Recomendação de Segurança</h5>
                        <p className="text-sm text-orange-200/80">
                          Ative a autenticação de dois fatores para proteger sua conta contra acessos não autorizados.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
                <CardHeader className="border-b border-gray-700/50">
                  <CardTitle className="flex items-center space-x-2 text-white">
                    <Download className="w-5 h-5 text-green-500" />
                    <span>Dados da Conta</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-white">Exportar Dados</h4>
                        <p className="text-sm text-gray-400">
                          Baixe uma cópia de todos os seus dados
                        </p>
                      </div>
                      <Button 
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-red-400">Excluir Conta</h4>
                        <p className="text-sm text-gray-400">
                          Exclua permanentemente sua conta e todos os dados
                        </p>
                      </div>
                      <Button 
                        variant="destructive"
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="mt-6">
            <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
              <CardHeader className="border-b border-gray-700/50">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Bell className="w-5 h-5 text-green-500" />
                  <span>Preferências de Notificação</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-white mb-4">Canais de Notificação</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Email</h5>
                          <p className="text-sm text-gray-400">Receber notificações por email</p>
                        </div>
                        <Switch 
                          checked={notifications.email}
                          onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Push</h5>
                          <p className="text-sm text-gray-400">Notificações push no navegador</p>
                        </div>
                        <Switch 
                          checked={notifications.push}
                          onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">SMS</h5>
                          <p className="text-sm text-gray-400">Notificações por mensagem de texto</p>
                        </div>
                        <Switch 
                          checked={notifications.sms}
                          onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-700/50 pt-6">
                    <h4 className="font-medium text-white mb-4">Tipos de Notificação</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Desafios</h5>
                          <p className="text-sm text-gray-400">Novos desafios e convites</p>
                        </div>
                        <Switch 
                          checked={notifications.challenges}
                          onCheckedChange={(checked) => handleNotificationChange('challenges', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Resultados</h5>
                          <p className="text-sm text-gray-400">Resultados de desafios e apostas</p>
                        </div>
                        <Switch 
                          checked={notifications.results}
                          onCheckedChange={(checked) => handleNotificationChange('results', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Marketing</h5>
                          <p className="text-sm text-gray-400">Promoções e novidades da plataforma</p>
                        </div>
                        <Switch 
                          checked={notifications.marketing}
                          onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Segurança</h5>
                          <p className="text-sm text-gray-400">Alertas de segurança e login</p>
                        </div>
                        <Switch 
                          checked={notifications.security}
                          onCheckedChange={(checked) => handleNotificationChange('security', checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="mt-6">
            <Card className="bg-[#1E1E1E] border-gray-700/50 shadow-lg">
              <CardHeader className="border-b border-gray-700/50">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span>Configurações de Privacidade</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="profileVisibility" className="text-gray-300">Visibilidade do Perfil</Label>
                    <Select 
                      value={privacy.profileVisibility}
                      onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-700/50 text-white focus:border-green-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1E1E1E] border-gray-700/50">
                        <SelectItem value="public" className="text-white hover:bg-gray-700">Público</SelectItem>
                        <SelectItem value="friends" className="text-white hover:bg-gray-700">Apenas Amigos</SelectItem>
                        <SelectItem value="private" className="text-white hover:bg-gray-700">Privado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Mostrar Estatísticas</h5>
                        <p className="text-sm text-gray-400">Permitir que outros vejam suas estatísticas</p>
                      </div>
                      <Switch 
                        checked={privacy.showStats}
                        onCheckedChange={(checked) => handlePrivacyChange('showStats', checked)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Mostrar Conquistas</h5>
                        <p className="text-sm text-gray-400">Exibir suas conquistas no perfil público</p>
                      </div>
                      <Switch 
                        checked={privacy.showAchievements}
                        onCheckedChange={(checked) => handlePrivacyChange('showAchievements', checked)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Mostrar Atividade</h5>
                        <p className="text-sm text-gray-400">Permitir que outros vejam sua atividade recente</p>
                      </div>
                      <Switch 
                        checked={privacy.showActivity}
                        onCheckedChange={(checked) => handlePrivacyChange('showActivity', checked)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-white">Permitir Mensagens</h5>
                        <p className="text-sm text-gray-400">Receber mensagens de outros usuários</p>
                      </div>
                      <Switch 
                        checked={privacy.allowMessages}
                        onCheckedChange={(checked) => handlePrivacyChange('allowMessages', checked)}
                        className="data-[state=checked]:bg-green-600"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfileSettings;

