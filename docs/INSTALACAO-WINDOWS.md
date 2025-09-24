# 🪟 Instalação BetFit no Windows 11

## 📋 Guia Completo de Instalação

Este guia irá te ajudar a instalar e configurar o sistema BetFit completo no seu Windows 11.

## 🎯 Pré-requisitos

- **Windows 11** (versão atualizada)
- **PowerShell** (como Administrador)
- **Conexão com internet** estável
- **Pelo menos 2GB** de espaço livre em disco

## 🚀 Instalação Automática (Recomendada)

### Passo 1: Baixar os Arquivos
1. Baixe o arquivo **BetFit-Sistema-Completo.zip**
2. Extraia para uma pasta temporária (ex: `C:\Temp\BetFit`)

### Passo 2: Executar o Instalador
1. **Clique com botão direito** no **PowerShell** e selecione **"Executar como administrador"**
2. Navegue até a pasta extraída:
   ```powershell
   cd "C:\Temp\BetFit"
   ```
3. Execute o instalador:
   ```powershell
   .\scripts\install.ps1
   ```

### Passo 3: Aguardar a Instalação
O instalador irá automaticamente:
- ✅ Instalar Python 3.11
- ✅ Instalar Node.js
- ✅ Instalar Git
- ✅ Copiar arquivos para `D:\Sistemas\BetFit`
- ✅ Configurar ambiente virtual Python
- ✅ Instalar dependências
- ✅ Criar arquivos de configuração

**Tempo estimado**: 10-15 minutos

## 🎮 Iniciando o Sistema

### Método 1: Script Automático (Recomendado)
1. Abra o **PowerShell** (não precisa ser como administrador)
2. Navegue até a pasta do sistema:
   ```powershell
   cd "D:\Sistemas\BetFit"
   ```
3. Execute o inicializador:
   ```powershell
   .\scripts\start.ps1
   ```

### Método 2: Manual
Se preferir iniciar manualmente:

**Terminal 1 - Backend:**
```powershell
cd "D:\Sistemas\BetFit\backend"
.\venv\Scripts\Activate.ps1
python src\main.py
```

**Terminal 2 - Frontend:**
```powershell
cd "D:\Sistemas\BetFit\frontend"
npm run dev
```

**Terminal 3 - Painel Admin:**
```powershell
cd "D:\Sistemas\BetFit\admin"
npm run dev
```

## 🌐 Acessando o Sistema

Após iniciar, o sistema estará disponível em:

### 🎯 Frontend Principal (Usuários)
- **URL**: http://localhost:5173
- **Descrição**: Interface para usuários participarem de desafios
- **Funcionalidades**:
  - Registro e login de usuários
  - Visualização de desafios
  - Participação em apostas
  - Carteira digital
  - Histórico de atividades

### 🛡️ Painel Administrativo
- **URL**: http://localhost:5174
- **Descrição**: Interface para administradores
- **Credenciais**:
  - **Email**: admin@betfit.com
  - **Senha**: admin123
- **Funcionalidades**:
  - Dashboard com métricas
  - Gestão de usuários
  - Controle financeiro
  - Relatórios
  - Logs de auditoria

### 🔧 API Backend
- **URL**: http://localhost:5001
- **Descrição**: API REST para comunicação
- **Endpoints**: `/api/users`, `/api/challenges`, `/api/wallet`, etc.

## ⚙️ Configurações Importantes

### Arquivos de Configuração

#### Backend (.env)
Localização: `D:\Sistemas\BetFit\backend\.env`
```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui
DATA_DIR=./data
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

#### Frontend (.env.local)
Localização: `D:\Sistemas\BetFit\frontend\.env.local`
```env
VITE_API_URL=http://localhost:5001/api
VITE_API_BASE_URL=http://localhost:5001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_stripe
```

#### Admin (.env.local)
Localização: `D:\Sistemas\BetFit\admin\.env.local`
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_ADMIN_EMAIL=admin@betfit.com
VITE_ADMIN_PASSWORD=admin123
```

## 🗂️ Estrutura de Pastas

```
D:\Sistemas\BetFit\
├── backend\                 # API Flask
│   ├── src\
│   │   └── main.py         # Aplicação principal
│   ├── data\               # Banco de dados JSON
│   │   ├── users.json      # Usuários
│   │   ├── wallets.json    # Carteiras
│   │   └── transactions.json # Transações
│   ├── venv\               # Ambiente virtual Python
│   ├── requirements.txt    # Dependências Python
│   └── .env               # Configurações
├── frontend\               # Interface React (Usuários)
│   ├── src\
│   │   ├── components\    # Componentes React
│   │   ├── pages\         # Páginas
│   │   └── services\      # Serviços API
│   ├── node_modules\      # Dependências Node
│   └── .env.local        # Configurações
├── admin\                 # Painel Admin React
│   ├── src\
│   │   ├── components\
│   │   ├── pages\
│   │   └── contexts\
│   └── .env.local
├── docs\                  # Documentação
│   ├── README.md
│   ├── dashboard-guide.md
│   ├── users-guide.md
│   ├── financial-guide.md
│   ├── challenges-guide.md
│   └── admin-guide.md
└── scripts\               # Scripts PowerShell
    ├── install.ps1       # Instalador
    ├── start.ps1         # Inicializador
    └── stop.ps1          # Parar serviços
```

## 🛠️ Comandos Úteis

### Parar Todos os Serviços
```powershell
cd "D:\Sistemas\BetFit"
.\scripts\stop.ps1
```

### Verificar Status dos Serviços
```powershell
# Verificar se as portas estão em uso
netstat -an | findstr ":5001"  # Backend
netstat -an | findstr ":5173"  # Frontend
netstat -an | findstr ":5174"  # Admin
```

### Reinstalar Dependências
```powershell
# Backend
cd "D:\Sistemas\BetFit\backend"
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd "D:\Sistemas\BetFit\frontend"
npm install

# Admin
cd "D:\Sistemas\BetFit\admin"
npm install
```

### Limpar Cache
```powershell
# Limpar cache do npm
npm cache clean --force

# Limpar cache do pip
pip cache purge
```

## 🔧 Solução de Problemas

### Problema: "Erro de Execução de Scripts"
**Solução**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problema: "Porta já em uso"
**Solução**:
```powershell
# Encontrar processo na porta
netstat -ano | findstr :5001

# Matar processo (substitua PID pelo número encontrado)
taskkill /PID <PID> /F
```

### Problema: "Python não encontrado"
**Solução**:
1. Reinstale o Python pelo instalador
2. Ou baixe manualmente: https://python.org/downloads/
3. Certifique-se de marcar "Add to PATH"

### Problema: "Node.js não encontrado"
**Solução**:
1. Reinstale o Node.js pelo instalador
2. Ou baixe manualmente: https://nodejs.org/
3. Reinicie o PowerShell após instalação

### Problema: "Módulos não encontrados"
**Solução**:
```powershell
# Backend
cd "D:\Sistemas\BetFit\backend"
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend/Admin
cd "D:\Sistemas\BetFit\frontend"
rm -rf node_modules
npm install
```

### Problema: "Banco de dados vazio"
**Solução**:
```powershell
cd "D:\Sistemas\BetFit\backend"
.\venv\Scripts\Activate.ps1
python -c "
import sys
sys.path.append('src')
from main import create_sample_data
create_sample_data()
"
```

## 📊 Dados de Teste

O sistema vem com dados de teste pré-configurados:

### Usuários de Teste
- **Email**: joao.silva@email.com | **Senha**: 123456 | **Saldo**: R$ 1.250,75
- **Email**: maria.oliveira@email.com | **Senha**: 123456 | **Saldo**: R$ 850,30
- **Email**: carlos.lima@email.com | **Senha**: 123456 | **Saldo**: R$ 2.100,50
- *(E mais 7 usuários com saldos variados)*

### Credenciais Admin
- **Email**: admin@betfit.com
- **Senha**: admin123
- **Permissões**: Acesso total ao sistema

### Desafios Disponíveis
- 🏃‍♂️ **Corrida Matinal 5K** - R$ 25,00
- 🚶‍♀️ **Caminhada 10K Passos** - R$ 15,00
- 🚴‍♂️ **Pedalada Urbana 15K** - R$ 30,00
- 🏊‍♀️ **Natação 1000m** - R$ 40,00
- 💪 **HIIT Intenso 30min** - R$ 35,00
- 🧘‍♀️ **Yoga Zen 45min** - R$ 20,00

## 🎯 Primeiros Passos

### 1. Testar o Sistema
1. Acesse http://localhost:5173
2. Registre uma nova conta ou use um usuário de teste
3. Explore os desafios disponíveis
4. Teste o sistema de carteira

### 2. Acessar o Admin
1. Acesse http://localhost:5174
2. Faça login com admin@betfit.com / admin123
3. Explore o dashboard e métricas
4. Teste adicionar saldo a um usuário

### 3. Verificar APIs
1. Acesse http://localhost:5001/api/challenges
2. Verifique se os dados estão sendo retornados
3. Teste outras rotas da API

## 📚 Documentação Adicional

- **README.md**: Visão geral do sistema
- **dashboard-guide.md**: Como desenvolver métricas e dashboard
- **users-guide.md**: Sistema de usuários e autenticação
- **financial-guide.md**: Carteira digital e transações
- **challenges-guide.md**: Desafios e sistema de apostas
- **admin-guide.md**: Painel administrativo avançado

## 🆘 Suporte

### Em caso de problemas:

1. **Verifique os logs** nos terminais onde os serviços estão rodando
2. **Consulte a documentação** na pasta `docs\`
3. **Execute o comando de diagnóstico**:
   ```powershell
   cd "D:\Sistemas\BetFit"
   .\scripts\stop.ps1
   .\scripts\start.ps1
   ```

### Logs Importantes
- **Backend**: Logs aparecem no terminal do Python
- **Frontend**: Logs no DevTools do navegador (F12)
- **Admin**: Logs no DevTools do navegador (F12)

## 🎉 Sistema Pronto!

Após seguir este guia, você terá:
- ✅ Sistema BetFit funcionando localmente
- ✅ 11 usuários de teste com saldos variados
- ✅ 6 desafios fitness disponíveis
- ✅ Painel administrativo completo
- ✅ APIs funcionais e documentadas
- ✅ Banco de dados persistente

**O sistema está pronto para desenvolvimento e testes!**

---

**Versão**: 1.0.0  
**Data**: 2025-08-27  
**Compatibilidade**: Windows 11

