import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Settings, Shield, Bell, Globe, Upload, X } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    general: {
      platform_name: '',
      platform_logo: '', 
      platform_logo_color: '',
      platform_logo_white: '',
      platform_logo_black: '',
      platform_description: '',
      support_email: '',
      maintenance_mode: false,
      registration_enabled: true
    },
    security: {},
    notifications: {},
    platform: {}
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const loadInitialSettings = async () => {
      setLoading(true)
      try {
        const response = await fetch('http://localhost:5001/api/admin/settings')
        if (response.ok) {
          const data = await response.json()
          console.log('Configurações carregadas:', data.settings)
          if (data.settings) {
            setSettings(prev => ({
                general: { ...prev.general, ...data.settings.general },
                security: { ...prev.security, ...data.settings.security },
                notifications: { ...prev.notifications, ...data.settings.notifications },
                platform: { ...prev.platform, ...data.settings.platform },
            }));
          }
        }
      } catch (error) {
        console.error('Falha ao carregar configurações:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialSettings()
  }, [])

  const handleSave = async (section, data, file = null) => {
    setSaving(true)
    let response;

    try {
      if (file) {
        const formData = new FormData();
        formData.append('platform_logo_file', file);
        
        for (const key in data) {
          formData.append(key, data[key]);
        }
        
        response = await fetch(`http://localhost:5001/api/admin/settings/${section}`, {
          method: 'PUT',
          body: formData,
        });

      } else {
        response = await fetch(`http://localhost:5001/api/admin/settings/${section}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
      }

      if (response.ok) {
        const updatedSettings = await fetch('http://localhost:5001/api/admin/settings');
        const updatedData = await updatedSettings.json();
        if (updatedData.settings) {
            setSettings(prev => ({ ...prev, ...updatedData.settings }));
        }

        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
          console.error("Falha ao salvar:", await response.text());
      }
    } catch (error) {
      console.error('Erro ao salvar:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Configurações do Sistema</h2>
        <p className="text-slate-600">Configure parâmetros globais da plataforma</p>
      </div>

      {saved && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <AlertDescription className="text-green-700">
            Configurações salvas com sucesso!
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="platform">Plataforma</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings 
            settings={settings.general}
            onSave={handleSave}
            saving={saving}
          />
        </TabsContent>
        <TabsContent value="security">
         <SecuritySettings 
           settings={settings.security}
           onSave={(data) => handleSave('security', data)}
           saving={saving}
         />
       </TabsContent>
       <TabsContent value="notifications">
         <NotificationSettings 
           settings={settings.notifications}
           onSave={(data) => handleSave('notifications', data)}
           saving={saving}
         />
       </TabsContent>
       <TabsContent value="platform">
         <PlatformSettings 
           settings={settings.platform}
           onSave={(data) => handleSave('platform', data)}
           saving={saving}
         />
       </TabsContent>
      </Tabs>
    </div>
  )
}

function LogoUploadSection({ logoType, currentLogo, onFileSelect, onRemove, description, bgColor = "bg-slate-100" }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className={`mt-2 flex items-center space-x-4 p-4 border-2 border-dashed rounded-lg ${bgColor}`}>
      {currentLogo ? (
        <div className="relative">
          <img 
            src={currentLogo} 
            alt={`Logo ${logoType}`} 
            className="h-16 w-auto rounded-md object-contain" 
          />
          <button 
            onClick={onRemove} 
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="w-3 h-3"/>
          </button>
        </div>
      ) : (
        <div className={`h-16 w-16 ${bgColor === "bg-gray-800" ? "bg-gray-600" : "bg-slate-200"} rounded-md flex items-center justify-center text-slate-400`}>
          <Globe className="w-8 h-8"/>
        </div>
      )}
      <div className="flex-grow">
        <p className="text-sm text-slate-500">{description}</p>
        <p className="text-xs text-slate-400">PNG recomendado, 72px de altura</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2" 
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {currentLogo ? 'Trocar Logo' : 'Selecionar Logo'}
        </Button>
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
}

function GeneralSettings({ settings, onSave, saving }) {
  const [formData, setFormData] = useState(settings);
  const [logoFiles, setLogoFiles] = useState({
    color: null,
    white: null,
    black: null
  });
  const [logoPreviews, setLogoPreviews] = useState({
    color: null,
    white: null,
    black: null
  });

  useEffect(() => {
    console.log('GeneralSettings - Settings recebidas:', settings);
    setFormData(settings);
    
    // Atualizar previews dos logos existentes
    const previews = {};
    
    // Logo colorido - verificar ambos os campos
    const colorLogo = settings.platform_logo_color || settings.platform_logo;
    if (colorLogo) {
      const fullUrl = colorLogo.startsWith('http') 
        ? colorLogo
        : `http://localhost:5001${colorLogo}`;
      previews.color = fullUrl;
      console.log('Preview color logo:', fullUrl);
    }
    
    // Logo branco
    if (settings.platform_logo_white) {
      const fullUrl = settings.platform_logo_white.startsWith('http') 
        ? settings.platform_logo_white
        : `http://localhost:5001${settings.platform_logo_white}`;
      previews.white = fullUrl;
      console.log('Preview white logo:', fullUrl);
    }
    
    // Logo preto
    if (settings.platform_logo_black) {
      const fullUrl = settings.platform_logo_black.startsWith('http') 
        ? settings.platform_logo_black
        : `http://localhost:5001${settings.platform_logo_black}`;
      previews.black = fullUrl;
      console.log('Preview black logo:', fullUrl);
    }
    
    setLogoPreviews(previews);
    console.log('Todos os previews configurados:', previews);
  }, [settings]);

  const handleLogoFileSelect = (logoType, file) => {
    if (file && file.type.startsWith('image/')) {
      console.log(`Arquivo selecionado para ${logoType}:`, file.name);
      setLogoFiles(prev => ({ ...prev, [logoType]: file }));
      setLogoPreviews(prev => ({ ...prev, [logoType]: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveLogo = (logoType) => {
    setLogoFiles(prev => ({ ...prev, [logoType]: null }));
    setLogoPreviews(prev => ({ ...prev, [logoType]: null }));
    
    if (logoType === 'color') {
      setFormData(prev => ({ ...prev, platform_logo_color: '', platform_logo: '' }));
    } else {
      setFormData(prev => ({ ...prev, [`platform_logo_${logoType}`]: '' }));
    }
  };

  const handleSave = async () => {
    console.log('Iniciando salvamento...');
    console.log('Arquivos de logo:', logoFiles);
    
    // Salvar dados básicos primeiro se não há arquivos
    if (Object.values(logoFiles).every(file => file === null)) {
      console.log('Salvando apenas dados do formulário');
      await onSave('general', formData, null);
      return;
    }

    // Salvar cada logo separadamente
    for (const [type, file] of Object.entries(logoFiles)) {
      if (file) {
        console.log(`Salvando logo ${type}:`, file.name);
        
        const formDataToSend = new FormData();
        
        // Determinar o nome do campo baseado no tipo
        let fileFieldName;
        if (type === 'color') {
          fileFieldName = 'platform_logo_color_file';
        } else {
          fileFieldName = `platform_logo_${type}_file`;
        }
        
        formDataToSend.append(fileFieldName, file);
        
        // Adicionar outros dados do formulário
        Object.keys(formData).forEach(key => {
          if (formData[key] !== null && formData[key] !== undefined) {
            formDataToSend.append(key, formData[key]);
          }
        });

        try {
          const response = await fetch('http://localhost:5001/api/admin/settings/general', {
            method: 'PUT',
            body: formDataToSend
          });

          if (response.ok) {
            console.log(`Logo ${type} salvo com sucesso`);
          } else {
            console.error(`Erro ao salvar logo ${type}:`, await response.text());
          }
        } catch (error) {
          console.error(`Erro na requisição do logo ${type}:`, error);
        }
      }
    }

    // Limpar arquivos após upload
    setLogoFiles({ color: null, white: null, black: null });
    
    // Recarregar configurações
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
           <Settings className="w-6 h-6 text-blue-600" />
           <div>
             <CardTitle>Configurações Gerais</CardTitle>
             <CardDescription>Configurações básicas da plataforma</CardDescription>
           </div>
         </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="platform_name">Nome da Plataforma</Label>
            <Input
              id="platform_name"
              value={formData.platform_name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, platform_name: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>Logotipos da Plataforma</Label>
            <div className="space-y-4">
              {/* Logo Colorido */}
              <div>
                <Label className="text-sm font-medium">Logo Colorido (Padrão)</Label>
                <LogoUploadSection
                  logoType="color"
                  currentLogo={logoPreviews.color}
                  onFileSelect={(file) => handleLogoFileSelect('color', file)}
                  onRemove={() => handleRemoveLogo('color')}
                  description="Use em fundos claros"
                />
              </div>

              {/* Logo Branco */}
              <div>
                <Label className="text-sm font-medium">Logo Branco</Label>
                <LogoUploadSection
                  logoType="white"
                  currentLogo={logoPreviews.white}
                  onFileSelect={(file) => handleLogoFileSelect('white', file)}
                  onRemove={() => handleRemoveLogo('white')}
                  description="Use em fundos escuros"
                  bgColor="bg-gray-800"
                />
              </div>

              {/* Logo Preto */}
              <div>
                <Label className="text-sm font-medium">Logo Preto</Label>
                <LogoUploadSection
                  logoType="black"
                  currentLogo={logoPreviews.black}
                  onFileSelect={(file) => handleLogoFileSelect('black', file)}
                  onRemove={() => handleRemoveLogo('black')}
                  description="Use em fundos claros com contraste"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="platform_description">Descrição</Label>
            <Input
              id="platform_description"
              value={formData.platform_description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, platform_description: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="support_email">Email de Suporte</Label>
            <Input
                id="support_email"
                type="email"
                value={formData.support_email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, support_email: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance_mode">Modo de Manutenção</Label>
              <p className="text-sm text-slate-500">Desabilita acesso de usuários</p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={formData.maintenance_mode || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, maintenance_mode: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="registration_enabled">Registro Habilitado</Label>
              <p className="text-sm text-slate-500">Permite novos registros</p>
            </div>
            <Switch
              id="registration_enabled"
              checked={formData.registration_enabled || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, registration_enabled: checked }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SecuritySettings({ settings, onSave, saving }) {
  const [formData, setFormData] = useState(settings)

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-red-600" />
          <div>
            <CardTitle>Configurações de Segurança</CardTitle>
            <CardDescription>Configurações de segurança e autenticação</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="two_factor_required">2FA Obrigatório</Label>
              <p className="text-sm text-slate-500">Exige autenticação de dois fatores</p>
            </div>
            <Switch
              id="two_factor_required"
              checked={formData.two_factor_required || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, two_factor_required: checked }))}
            />
          </div>
          
          <div>
            <Label htmlFor="password_min_length">Tamanho Mínimo da Senha</Label>
            <Input
              id="password_min_length"
              type="number"
              min="4"
              max="20"
              value={formData.password_min_length || 6}
              onChange={(e) => setFormData(prev => ({ ...prev, password_min_length: parseInt(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="session_timeout">Timeout da Sessão (horas)</Label>
            <Input
              id="session_timeout"
              type="number"
              min="1"
              max="168"
              value={formData.session_timeout || 24}
              onChange={(e) => setFormData(prev => ({ ...prev, session_timeout: parseInt(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="max_login_attempts">Máx. Tentativas de Login</Label>
            <Input
              id="max_login_attempts"
              type="number"
              min="3"
              max="10"
              value={formData.max_login_attempts || 5}
              onChange={(e) => setFormData(prev => ({ ...prev, max_login_attempts: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="kyc_required">KYC Obrigatório</Label>
              <p className="text-sm text-slate-500">Exige verificação de identidade</p>
            </div>
            <Switch
              id="kyc_required"
              checked={formData.kyc_required || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, kyc_required: checked }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
  
function NotificationSettings({ settings, onSave, saving }) {
  const [formData, setFormData] = useState(settings)

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-yellow-600" />
          <div>
            <CardTitle>Configurações de Notificações</CardTitle>
            <CardDescription>Configure notificações do sistema</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications">Notificações por Email</Label>
              <p className="text-sm text-slate-500">Enviar notificações por email</p>
            </div>
            <Switch
              id="email_notifications"
              checked={formData.email_notifications || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email_notifications: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push_notifications">Notificações Push</Label>
              <p className="text-sm text-slate-500">Enviar notificações push</p>
            </div>
            <Switch
              id="push_notifications"
              checked={formData.push_notifications || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, push_notifications: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="sms_notifications">Notificações SMS</Label>
              <p className="text-sm text-slate-500">Enviar notificações por SMS</p>
            </div>
            <Switch
              id="sms_notifications"
              checked={formData.sms_notifications || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sms_notifications: checked }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing_emails">Emails de Marketing</Label>
              <p className="text-sm text-slate-500">Enviar emails promocionais</p>
            </div>
            <Switch
              id="marketing_emails"
              checked={formData.marketing_emails || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, marketing_emails: checked }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PlatformSettings({ settings, onSave, saving }) {
  const [formData, setFormData] = useState(settings)
  
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(formData)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Globe className="w-6 h-6 text-green-600" />
          <div>
            <CardTitle>Configurações da Plataforma</CardTitle>
            <CardDescription>Configurações específicas do negócio</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="min_bet_amount">Aposta Mínima (R$)</Label>
            <Input
              id="min_bet_amount"
              type="number"
              step="0.01"
              min="1"
              value={formData.min_bet_amount || 5}
              onChange={(e) => setFormData(prev => ({ ...prev, min_bet_amount: parseFloat(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="max_bet_amount">Aposta Máxima (R$)</Label>
            <Input
              id="max_bet_amount"
              type="number"
              step="0.01"
              min="1"
              value={formData.max_bet_amount || 1000}
              onChange={(e) => setFormData(prev => ({ ...prev, max_bet_amount: parseFloat(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="platform_fee">Taxa da Plataforma (%)</Label>
            <Input
              id="platform_fee"
              type="number"
              step="0.1"
              min="0"
              max="20"
              value={formData.platform_fee || 5}
              onChange={(e) => setFormData(prev => ({ ...prev, platform_fee: parseFloat(e.target.value) }))}
            />
          </div>
          
          <div>
            <Label htmlFor="challenge_duration_limit">Duração Máxima do Desafio (dias)</Label>
            <Input
              id="challenge_duration_limit"
              type="number"
              min="1"
              max="365"
              value={formData.challenge_duration_limit || 30}
              onChange={(e) => setFormData(prev => ({ ...prev, challenge_duration_limit: parseInt(e.target.value) }))}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_payout">Pagamento Automático</Label>
              <p className="text-sm text-slate-500">Pagar vencedores automaticamente</p>
            </div>
            <Switch
              id="auto_payout"
              checked={formData.auto_payout || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, auto_payout: checked }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}