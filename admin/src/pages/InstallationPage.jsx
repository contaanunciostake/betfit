import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Server, 
  Globe, 
  Database, 
  Shield, 
  Github, 
  Download, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Terminal,
  Cloud,
  Lock,
  Zap
} from 'lucide-react'

export default function InstallationPage() {
  const [activeTab, setActiveTab] = useState('config')
  const [installationStep, setInstallationStep] = useState(0)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showDbPassword, setShowDbPassword] = useState(false)
  
  const [config, setConfig] = useState({
    // Configurações do Domínio
    domain: '',
    subdomain: '',
    
    // Configurações do VPS
    vpsIp: '',
    vpsUser: 'root',
    vpsPassword: '',
    vpsPort: '22',
    
    // Configurações do Banco de Dados
    dbName: 'betfit_db',
    dbUser: 'betfit_user',
    dbPassword: '',
    
    // Configurações do Admin
    adminName: 'Administrador BetFit',
    adminEmail: 'admin@betfit.com',
    adminPassword: '',
    
    // Configurações do GitHub
    githubToken: '',
    githubRepo: 'betfit-platform',
    githubUser: '',
    
    // Configurações SSL
    enableSSL: true,
    email: '',
    
    // Configurações de Pagamento
    pixMerchantId: '',
    pixApiKey: '',
    stripePublishableKey: '',
    stripeSecretKey: '',
  })

  const installationSteps = [
    { id: 1, title: 'Preparação dos Arquivos', description: 'Preparando arquivos para deploy' },
    { id: 2, title: 'Upload para GitHub', description: 'Enviando código para repositório' },
    { id: 3, title: 'Conexão com VPS', description: 'Conectando ao servidor' },
    { id: 4, title: 'Instalação de Dependências', description: 'Instalando Docker, Node.js, etc.' },
    { id: 5, title: 'Configuração do Banco', description: 'Configurando PostgreSQL' },
    { id: 6, title: 'Deploy da Aplicação', description: 'Fazendo deploy dos containers' },
    { id: 7, title: 'Configuração SSL', description: 'Configurando certificados HTTPS' },
    { id: 8, title: 'Configuração Final', description: 'Finalizando configurações' },
  ]

  const handleInputChange = (field, value) => {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  const generatePassword = (length = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const startInstallation = async () => {
    setIsInstalling(true)
    setActiveTab('progress')
    
    // Simular processo de instalação
    for (let i = 0; i < installationSteps.length; i++) {
      setInstallationStep(i)
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    setInstallationStep(installationSteps.length)
    setIsInstalling(false)
  }

  const downloadInstallScript = () => {
    const script = generateInstallScript()
    const blob = new Blob([script], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'install-betfit.sh'
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateInstallScript = () => {
    return `#!/bin/bash
# BetFit Platform Installation Script
# Generated automatically by BetFit Admin Panel

set -e

echo "🚀 Starting BetFit Platform Installation..."

# Configuration
DOMAIN="${config.domain}"
DB_NAME="${config.dbName}"
DB_USER="${config.dbUser}"
DB_PASSWORD="${config.dbPassword}"
ADMIN_EMAIL="${config.adminEmail}"
ADMIN_PASSWORD="${config.adminPassword}"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone repository
echo "📥 Cloning BetFit repository..."
git clone https://github.com/${config.githubUser}/${config.githubRepo}.git /opt/betfit
cd /opt/betfit

# Setup environment variables
echo "⚙️ Setting up environment variables..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@postgres:5432/$DB_NAME
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD

# Admin Configuration
ADMIN_EMAIL=$ADMIN_EMAIL
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Domain Configuration
DOMAIN=$DOMAIN
FRONTEND_URL=https://$DOMAIN
BACKEND_URL=https://api.$DOMAIN

# Payment Configuration
PIX_MERCHANT_ID=${config.pixMerchantId}
PIX_API_KEY=${config.pixApiKey}
STRIPE_PUBLISHABLE_KEY=${config.stripePublishableKey}
STRIPE_SECRET_KEY=${config.stripeSecretKey}

# Security
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF

# Start services
echo "🚀 Starting BetFit services..."
docker-compose up -d

# Setup SSL with Let's Encrypt
if [ "${config.enableSSL}" = "true" ]; then
  echo "🔒 Setting up SSL certificates..."
  apt install -y certbot python3-certbot-nginx
  certbot --nginx -d $DOMAIN -d api.$DOMAIN --email ${config.email} --agree-tos --non-interactive
fi

echo "✅ BetFit Platform installed successfully!"
echo "🌐 Frontend: https://$DOMAIN"
echo "🔧 Admin Panel: https://$DOMAIN/admin"
echo "📡 API: https://api.$DOMAIN"
echo "👤 Admin Email: $ADMIN_EMAIL"
echo "🔑 Admin Password: $ADMIN_PASSWORD"
`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Instalação VPS</h1>
          <p className="text-slate-600">Configure e instale o BetFit em seu servidor VPS</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Zap className="w-4 h-4 mr-1" />
          Instalação Automatizada
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="github">GitHub</TabsTrigger>
          <TabsTrigger value="progress">Instalação</TabsTrigger>
          <TabsTrigger value="complete">Finalizado</TabsTrigger>
        </TabsList>

        {/* Configuração */}
        <TabsContent value="config" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações do Domínio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Configurações do Domínio</span>
                </CardTitle>
                <CardDescription>
                  Configure o domínio onde a plataforma será hospedada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="domain">Domínio Principal</Label>
                  <Input
                    id="domain"
                    placeholder="meusite.com"
                    value={config.domain}
                    onChange={(e) => handleInputChange('domain', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Frontend será acessível em: https://{config.domain || 'meusite.com'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="subdomain">Subdomínio da API</Label>
                  <Input
                    id="subdomain"
                    placeholder="api"
                    value={config.subdomain}
                    onChange={(e) => handleInputChange('subdomain', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    API será acessível em: https://{config.subdomain || 'api'}.{config.domain || 'meusite.com'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configurações do VPS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Server className="w-5 h-5" />
                  <span>Configurações do VPS</span>
                </CardTitle>
                <CardDescription>
                  Dados de acesso ao seu servidor VPS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vpsIp">IP do Servidor</Label>
                  <Input
                    id="vpsIp"
                    placeholder="192.168.1.100"
                    value={config.vpsIp}
                    onChange={(e) => handleInputChange('vpsIp', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vpsUser">Usuário SSH</Label>
                    <Input
                      id="vpsUser"
                      placeholder="root"
                      value={config.vpsUser}
                      onChange={(e) => handleInputChange('vpsUser', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vpsPort">Porta SSH</Label>
                    <Input
                      id="vpsPort"
                      placeholder="22"
                      value={config.vpsPort}
                      onChange={(e) => handleInputChange('vpsPort', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vpsPassword">Senha SSH</Label>
                  <div className="relative">
                    <Input
                      id="vpsPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Senha do servidor"
                      value={config.vpsPassword}
                      onChange={(e) => handleInputChange('vpsPassword', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações do Banco de Dados */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Configurações do Banco</span>
                </CardTitle>
                <CardDescription>
                  Configurações do PostgreSQL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="dbName">Nome do Banco</Label>
                  <Input
                    id="dbName"
                    placeholder="betfit_db"
                    value={config.dbName}
                    onChange={(e) => handleInputChange('dbName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dbUser">Usuário do Banco</Label>
                  <Input
                    id="dbUser"
                    placeholder="betfit_user"
                    value={config.dbUser}
                    onChange={(e) => handleInputChange('dbUser', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="dbPassword">Senha do Banco</Label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Input
                        id="dbPassword"
                        type={showDbPassword ? 'text' : 'password'}
                        placeholder="Senha do banco de dados"
                        value={config.dbPassword}
                        onChange={(e) => handleInputChange('dbPassword', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowDbPassword(!showDbPassword)}
                      >
                        {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange('dbPassword', generatePassword())}
                    >
                      Gerar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configurações do Administrador */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Conta Administrador</span>
                </CardTitle>
                <CardDescription>
                  Dados da conta de administrador principal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="adminName">Nome do Administrador</Label>
                  <Input
                    id="adminName"
                    placeholder="Administrador BetFit"
                    value={config.adminName}
                    onChange={(e) => handleInputChange('adminName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="adminEmail">Email do Administrador</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@meusite.com"
                    value={config.adminEmail}
                    onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="adminPassword">Senha do Administrador</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Senha forte"
                      value={config.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange('adminPassword', generatePassword())}
                    >
                      Gerar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setActiveTab('github')} className="bg-green-600 hover:bg-green-700">
              Próximo: Configurar GitHub
            </Button>
          </div>
        </TabsContent>

        {/* GitHub */}
        <TabsContent value="github" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações do GitHub */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Github className="w-5 h-5" />
                  <span>Configurações do GitHub</span>
                </CardTitle>
                <CardDescription>
                  Configure a integração com GitHub para deploy automático
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="githubUser">Usuário GitHub</Label>
                  <Input
                    id="githubUser"
                    placeholder="meuusuario"
                    value={config.githubUser}
                    onChange={(e) => handleInputChange('githubUser', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="githubRepo">Nome do Repositório</Label>
                  <Input
                    id="githubRepo"
                    placeholder="betfit-platform"
                    value={config.githubRepo}
                    onChange={(e) => handleInputChange('githubRepo', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Repositório será criado em: github.com/{config.githubUser || 'meuusuario'}/{config.githubRepo || 'betfit-platform'}
                  </p>
                </div>
                <div>
                  <Label htmlFor="githubToken">Token de Acesso</Label>
                  <Input
                    id="githubToken"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    value={config.githubToken}
                    onChange={(e) => handleInputChange('githubToken', e.target.value)}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Criar token no GitHub →
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configurações SSL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Configurações SSL</span>
                </CardTitle>
                <CardDescription>
                  Configure certificados HTTPS automáticos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enableSSL"
                    checked={config.enableSSL}
                    onChange={(e) => handleInputChange('enableSSL', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="enableSSL">Habilitar SSL/HTTPS</Label>
                </div>
                {config.enableSSL && (
                  <div>
                    <Label htmlFor="email">Email para Let's Encrypt</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@meusite.com"
                      value={config.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Email usado para notificações de renovação de certificado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configurações de Pagamento */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cloud className="w-5 h-5" />
                  <span>Configurações de Pagamento (Opcional)</span>
                </CardTitle>
                <CardDescription>
                  Configure as chaves de API para PIX e Stripe
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">PIX</h4>
                  <div>
                    <Label htmlFor="pixMerchantId">Merchant ID</Label>
                    <Input
                      id="pixMerchantId"
                      placeholder="merchant_123"
                      value={config.pixMerchantId}
                      onChange={(e) => handleInputChange('pixMerchantId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pixApiKey">API Key</Label>
                    <Input
                      id="pixApiKey"
                      type="password"
                      placeholder="pix_api_key_***"
                      value={config.pixApiKey}
                      onChange={(e) => handleInputChange('pixApiKey', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Stripe</h4>
                  <div>
                    <Label htmlFor="stripePublishableKey">Publishable Key</Label>
                    <Input
                      id="stripePublishableKey"
                      placeholder="pk_test_***"
                      value={config.stripePublishableKey}
                      onChange={(e) => handleInputChange('stripePublishableKey', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="stripeSecretKey">Secret Key</Label>
                    <Input
                      id="stripeSecretKey"
                      type="password"
                      placeholder="sk_test_***"
                      value={config.stripeSecretKey}
                      onChange={(e) => handleInputChange('stripeSecretKey', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setActiveTab('config')}>
              Voltar
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={downloadInstallScript}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Script
              </Button>
              <Button onClick={startInstallation} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Iniciar Instalação
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Progresso da Instalação */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>Instalação em Progresso</span>
              </CardTitle>
              <CardDescription>
                Aguarde enquanto o BetFit é instalado em seu VPS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {installationSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < installationStep ? 'bg-green-500 text-white' :
                      index === installationStep ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-slate-200 text-slate-500'
                    }`}>
                      {index < installationStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <p className="text-sm text-slate-500">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Progress value={(installationStep / installationSteps.length) * 100} className="w-full" />

              {isInstalling && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Instalação em andamento... Isso pode levar alguns minutos.
                  </AlertDescription>
                </Alert>
              )}

              {installationStep === installationSteps.length && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Instalação concluída com sucesso! Sua plataforma BetFit está online.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finalizado */}
        <TabsContent value="complete" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Instalação Concluída!</span>
              </CardTitle>
              <CardDescription>
                Sua plataforma BetFit foi instalada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frontend da Plataforma</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={`https://${config.domain}`} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`https://${config.domain}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Painel Administrativo</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={`https://${config.domain}/admin`} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`https://${config.domain}/admin`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>API Backend</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={`https://${config.subdomain || 'api'}.${config.domain}`} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`https://${config.subdomain || 'api'}.${config.domain}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Repositório GitHub</Label>
                  <div className="flex items-center space-x-2">
                    <Input value={`https://github.com/${config.githubUser}/${config.githubRepo}`} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`https://github.com/${config.githubUser}/${config.githubRepo}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Credenciais de Acesso</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email Admin:</span> {config.adminEmail}
                  </div>
                  <div>
                    <span className="font-medium">Senha Admin:</span> {config.adminPassword}
                  </div>
                  <div>
                    <span className="font-medium">Banco de Dados:</span> {config.dbName}
                  </div>
                  <div>
                    <span className="font-medium">Usuário DB:</span> {config.dbUser}
                  </div>
                </div>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Importante:</strong> Salve essas informações em local seguro. 
                  Recomendamos alterar as senhas após o primeiro acesso.
                </AlertDescription>
              </Alert>

              <div className="flex space-x-4">
                <Button 
                  onClick={() => window.open(`https://${config.domain}`, '_blank')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Acessar Plataforma
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`https://${config.domain}/admin`, '_blank')}
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Acessar Admin
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.open(`https://github.com/${config.githubUser}/${config.githubRepo}`, '_blank')}
                >
                  <Github className="w-4 h-4 mr-2" />
                  Ver Repositório
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

