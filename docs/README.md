# 🎯 Sistema BetFit - Documentação Completa

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [Arquitetura](#arquitetura)
- [APIs](#apis)
- [Desenvolvimento](#desenvolvimento)
- [Troubleshooting](#troubleshooting)

## 🎯 Visão Geral

O **BetFit** é uma plataforma completa de apostas fitness que permite aos usuários participar de desafios de exercícios físicos e apostar em seus próprios resultados. O sistema é composto por:

### 🏗️ Componentes Principais
- **Frontend React**: Interface do usuário para participar de desafios
- **Painel Admin**: Interface administrativa para gestão da plataforma  
- **Backend API**: API REST em Flask para todas as operações
- **Banco de Dados**: Sistema de persistência em arquivos JSON

### ✨ Funcionalidades
- 🏃‍♂️ **Desafios Fitness**: Corrida, caminhada, ciclismo, natação, HIIT, yoga
- 💰 **Sistema de Apostas**: Pools automáticos com distribuição de prêmios
- 👥 **Gestão de Usuários**: Registro, autenticação, perfis
- 💳 **Carteira Digital**: Depósitos, saques, histórico de transações
- 📊 **Dashboard Admin**: Métricas, usuários, finanças
- 🔐 **Autenticação**: Sistema seguro com tokens
- 📱 **Responsivo**: Interface adaptada para desktop e mobile

## 🚀 Instalação

### Pré-requisitos
- Windows 11
- PowerShell (como Administrador)
- Conexão com internet

### Instalação Automática

1. **Baixe** todos os arquivos do sistema BetFit
2. **Extraia** para uma pasta temporária
3. **Execute** como Administrador:
   ```powershell
   .\scripts\install.ps1
   ```

O instalador irá:
- ✅ Instalar Python 3.11
- ✅ Instalar Node.js
- ✅ Instalar Git
- ✅ Configurar ambiente virtual Python
- ✅ Instalar dependências
- ✅ Criar arquivos de configuração
- ✅ Configurar banco de dados

### Instalação Manual

Se preferir instalar manualmente:

1. **Instale as dependências**:
   ```powershell
   # Instalar Chocolatey
   Set-ExecutionPolicy Bypass -Scope Process -Force
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   
   # Instalar Python e Node.js
   choco install python311 nodejs git -y
   ```

2. **Copie os arquivos** para `D:\Sistemas\BetFit`

3. **Configure o Backend**:
   ```powershell
   cd D:\Sistemas\BetFit\backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   copy .env.example .env
   ```

4. **Configure o Frontend**:
   ```powershell
   cd D:\Sistemas\BetFit\frontend
   npm install
   copy .env.example .env.local
   ```

5. **Configure o Admin**:
   ```powershell
   cd D:\Sistemas\BetFit\admin
   npm install
   copy .env.example .env.local
   ```

## ⚙️ Configuração

### Backend (.env)
```env
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta_aqui
DATA_DIR=./data
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:8080,http://localhost:5174/
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5001/api
VITE_API_BASE_URL=http://localhost:5001
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_stripe
```

### Admin (.env.local)
```env
VITE_API_BASE_URL=http://localhost:5001
VITE_ADMIN_EMAIL=admin@betfit.com
VITE_ADMIN_PASSWORD=admin123
```

## 🎮 Uso

### Iniciar o Sistema
```powershell
cd D:\Sistemas\BetFit
.\scripts\start.ps1
```

### Parar o Sistema
```powershell
.\scripts\stop.ps1
```

### URLs de Acesso
- **Frontend**: http://localhost:5173
- **Painel Admin**: http://localhost:5174  
- **API**: http://localhost:5001

### Credenciais Padrão
- **Admin**: admin@betfit.com / admin123
- **Usuários Teste**: Vários usuários fake já criados com senha `123456`

## 🏗️ Arquitetura

### Estrutura de Pastas
```
D:\Sistemas\BetFit\
├── backend/                 # API Flask
│   ├── src/
│   │   └── main.py         # Aplicação principal
│   ├── data/               # Banco de dados JSON
│   │   ├── users.json
│   │   ├── wallets.json
│   │   └── transactions.json
│   ├── venv/               # Ambiente virtual Python
│   ├── requirements.txt    # Dependências Python
│   └── .env               # Configurações
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/    # Componentes React
│   │   ├── pages/         # Páginas
│   │   ├── contexts/      # Contextos React
│   │   └── services/      # Serviços API
│   ├── node_modules/      # Dependências Node
│   ├── package.json       # Configuração NPM
│   └── .env.local        # Configurações
├── admin/                 # Painel Admin React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── contexts/
│   └── .env.local
├── docs/                  # Documentação
├── scripts/               # Scripts PowerShell
│   ├── install.ps1       # Instalador
│   ├── start.ps1         # Inicializador
│   └── stop.ps1          # Parar serviços
└── README.md
```

### Fluxo de Dados
```
Frontend ←→ Backend API ←→ JSON Database
   ↓
Admin Panel ←→ Backend API ←→ JSON Database
```

## 📡 APIs

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/admin/auth/login` - Login admin

### Usuários
- `GET /api/users` - Listar usuários (admin)
- `GET /api/users/{id}` - Obter usuário
- `POST /api/admin/users/{id}/balance` - Adicionar saldo

### Carteira
- `GET /api/wallet/{id}/balance` - Saldo
- `GET /api/wallet/{id}/transactions` - Transações
- `POST /api/wallet/{id}/deposit` - Depósito

### Desafios
- `GET /api/challenges` - Listar desafios
- `GET /api/activities/global` - Atividades globais

### Dashboard
- `GET /api/admin/dashboard` - Métricas admin

## 🛠️ Desenvolvimento

### Adicionando Novas Funcionalidades

Consulte os guias específicos:
- [📊 Dashboard e Métricas](./dashboard-guide.md)
- [👥 Gestão de Usuários](./users-guide.md)
- [💰 Sistema Financeiro](./financial-guide.md)
- [🎮 Desafios e Apostas](./challenges-guide.md)
- [🛡️ Painel Administrativo](./admin-guide.md)

### Estrutura do Código

#### Backend (Flask)
```python
# src/main.py
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Rotas organizadas por funcionalidade
@app.route('/api/auth/register', methods=['POST'])
def register():
    # Lógica de registro
    pass
```

#### Frontend (React)
```jsx
// src/components/Component.jsx
import React, { useState, useEffect } from 'react';

const Component = () => {
    const [data, setData] = useState([]);
    
    useEffect(() => {
        // Buscar dados da API
    }, []);
    
    return <div>Componente</div>;
};
```

### Banco de Dados JSON

O sistema usa arquivos JSON para persistência:

```json
// users.json
{
  "user_id": {
    "id": "user_id",
    "name": "Nome",
    "email": "email@example.com",
    "status": "active",
    "created_at": "2025-01-01T00:00:00"
  }
}
```

## 🔧 Troubleshooting

### Problemas Comuns

#### Erro: "Porta já em uso"
```powershell
# Parar todos os serviços
.\scripts\stop.ps1

# Ou matar processo específico
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

#### Erro: "Módulo não encontrado"
```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend/Admin
npm install
```

#### Erro: "CORS"
Verifique se as URLs estão corretas nos arquivos `.env`:
- Backend deve aceitar origem do frontend
- Frontend deve apontar para backend correto

#### Banco de dados vazio
```powershell
# Executar script de população
cd backend
python populate_users.py
```

### Logs e Debug

#### Backend
Os logs aparecem no terminal do backend:
```
[timestamp] Novo usuário registrado: email
[timestamp] Saldo adicionado: R$ 100,00
```

#### Frontend
Abra o DevTools do navegador (F12) para ver logs JavaScript.

### Performance

#### Otimizações
- Use `npm run build` para produção
- Configure cache no backend
- Otimize queries do banco JSON

## 📞 Suporte

Para suporte técnico:
1. Consulte esta documentação
2. Verifique os logs de erro
3. Execute `.\scripts\stop.ps1` e `.\scripts\start.ps1`
4. Verifique as configurações nos arquivos `.env`

## 📄 Licença

Sistema BetFit - Todos os direitos reservados.

---

**Versão**: 1.0.0  
**Última atualização**: 2025-08-27

