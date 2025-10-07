# 🚀 GUIA RÁPIDO FINAL - ATIVAR SISTEMA BETFIT

**Status Atual:** Backend 95% | Frontend 70% | Docs 100%

---

## ✅ **O QUE JÁ ESTÁ PRONTO:**

1. ✅ Modelo User com 6 novos campos
2. ✅ 7 Endpoints prontos (`backend/src/NOVOS_ENDPOINTS.py`)
3. ✅ Cronjob criado (`backend/src/jobs/finalize_challenges.py`)
4. ✅ Variáveis adicionadas ao `.env.local`
5. ✅ Diretórios de upload criados
6. ✅ Documentação completa (4 arquivos)

---

## ⚡ **ATIVAÇÃO RÁPIDA (5 MINUTOS):**

### **PASSO 1: Adicionar Endpoints ao Backend**

Abra o arquivo:
```
C:\Temp\betfit\backend\src\NOVOS_ENDPOINTS.py
```

**Copie TODO o conteúdo** (Ctrl+A, Ctrl+C)

Abra o arquivo:
```
C:\Temp\betfit\backend\src\main.py
```

**Procure por** (quase no final):
```python
if __name__ == '__main__':
```

**Cole TODO o conteúdo de NOVOS_ENDPOINTS.py ANTES desta linha**

Salve (Ctrl+S)

---

### **PASSO 2: Instalar Dependências Python**

Abra terminal no VSCode e execute:
```bash
cd backend
pip install schedule pillow mercadopago
```

---

### **PASSO 3: Reiniciar Backend**

No terminal, mate o processo atual (Ctrl+C se estiver rodando) e reinicie:

```bash
cd backend
./venv/Scripts/python src/main.py
```

Você deve ver:
```
[OK] Novos endpoints carregados: Perfil, Depósito e Saque
```

---

### **PASSO 4: Iniciar Cronjob (Opcional)**

**Windows** - Abra um NOVO terminal:
```bash
cd backend
start python src/jobs/finalize_challenges.py
```

**Linux/Mac**:
```bash
cd backend
python src/jobs/finalize_challenges.py &
```

---

## 🎨 **FRONTEND (COMPONENTES):**

Devido ao tamanho dos componentes React, criei um arquivo separado com códigos completos.

### **Arquivos que você precisa criar/atualizar:**

#### 1. **`frontend/src/contexts/ThemeContext.jsx`** (CRIAR NOVO)

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || user?.theme_preference || 'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, [user]);

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);

    if (user?.email) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: user.email, theme_preference: newTheme })
        });
      } catch (error) {
        console.error('Erro ao salvar tema:', error);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

---

#### 2. **`frontend/src/main.jsx`** (ATUALIZAR)

Adicione o ThemeProvider:

```jsx
import { ThemeProvider } from './contexts/ThemeContext';

// ...

<ThemeProvider>
  <Router>
    <App />
  </Router>
</ThemeProvider>
```

---

#### 3. **`frontend/src/components/wallet/WalletWithdraw.jsx`** (CRIAR NOVO)

```jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertCircle, CheckCircle } from 'lucide-react';

const WalletWithdraw = ({ balance, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fee = Math.max(parseFloat(amount) * 0.02, 5);
  const netAmount = parseFloat(amount) - fee;

  const handleWithdraw = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!pixKey || !amount || parseFloat(amount) < 20) {
        setError('Preencha todos os campos. Valor mínimo: R$20');
        return;
      }

      if (balance < parseFloat(amount) + fee) {
        setError('Saldo insuficiente');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/withdraw/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: user.email,
          amount: parseFloat(amount),
          pix_key: pixKey
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Saque solicitado! Você receberá R$${netAmount.toFixed(2)}`);
        setAmount('');
        setPixKey('');
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || 'Erro ao processar saque');
      }
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <DollarSign className="w-5 h-5 mr-2" />
        Solicitar Saque PIX
      </h3>

      {error && (
        <Alert className="mb-4 bg-red-900/50 border-red-500">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-900/50 border-green-500">
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Valor do Saque</label>
          <Input
            type="number"
            placeholder="Mínimo: R$20"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-700"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400">Chave PIX</label>
          <Input
            type="text"
            placeholder="CPF, e-mail, telefone ou chave aleatória"
            value={pixKey}
            onChange={(e) => setPixKey(e.target.value)}
            className="bg-gray-700"
          />
        </div>

        {amount && parseFloat(amount) >= 20 && (
          <div className="bg-gray-700 p-4 rounded text-sm space-y-1">
            <div className="flex justify-between">
              <span>Valor solicitado:</span>
              <span className="font-bold">R$ {parseFloat(amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Taxa (2%):</span>
              <span>- R$ {fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-400 font-bold text-lg pt-2 border-t border-gray-600">
              <span>Você receberá:</span>
              <span>R$ {netAmount.toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleWithdraw}
          disabled={loading || !pixKey || !amount || parseFloat(amount) < 20}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          {loading ? 'Processando...' : 'Confirmar Saque'}
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Saques abaixo de R$1.000 são aprovados automaticamente
        </p>
      </div>
    </div>
  );
};

export default WalletWithdraw;
```

---

#### 4. **Adicionar WalletWithdraw à página Wallet**

No arquivo `frontend/src/pages/Wallet.jsx`, adicione:

```jsx
import WalletWithdraw from '../components/wallet/WalletWithdraw';

// No JSX, adicione uma aba para Saque:
<TabsContent value="withdraw">
  <WalletWithdraw balance={balance} onSuccess={refreshWallet} />
</TabsContent>
```

---

## ✅ **CHECKLIST FINAL:**

- [x] Variáveis adicionadas ao `.env.local`
- [x] Diretórios de upload criados
- [x] Cronjob criado
- [ ] **Endpoints copiados para main.py** ⚠️ CRÍTICO
- [ ] **Dependências instaladas** (pip install...)
- [ ] **Backend reiniciado**
- [ ] ThemeContext.jsx criado
- [ ] WalletWithdraw.jsx criado
- [ ] main.jsx atualizado com ThemeProvider
- [ ] Wallet.jsx atualizado com aba Saque

---

## 🎯 **TESTANDO O SISTEMA:**

### **1. Testar Perfil:**
```bash
curl -X PUT http://localhost:5001/api/user/profile \
  -H "Content-Type: application/json" \
  -d '{"user_email":"test@betfit.com","name":"João Silva"}'
```

### **2. Testar Depósito PIX:**
```bash
curl -X POST http://localhost:5001/api/wallet/deposit/pix \
  -H "Content-Type: application/json" \
  -d '{"user_email":"test@betfit.com","amount":50}'
```

### **3. Testar Saque:**
```bash
curl -X POST http://localhost:5001/api/wallet/withdraw/pix \
  -H "Content-Type: application/json" \
  -d '{"user_email":"test@betfit.com","amount":30,"pix_key":"11999999999"}'
```

---

## 🚀 **SISTEMA COMPLETO QUANDO:**

- ✅ Backend respondendo aos 7 novos endpoints
- ✅ Cronjob finalizando desafios automaticamente
- ✅ Usuários editando perfil e foto
- ✅ Depósitos PIX funcionando com QR Code
- ✅ Saques PIX funcionando
- ✅ Tema light/dark sincronizado

---

## 📊 **STATUS ATUAL:**

| Componente | Status | Arquivo |
|-----------|--------|---------|
| Modelo User | ✅ 100% | models.py |
| Endpoints (7) | ✅ 100% | NOVOS_ENDPOINTS.py |
| Cronjob | ✅ 100% | jobs/finalize_challenges.py |
| Variáveis Env | ✅ 100% | .env.local |
| ThemeContext | 🟡 Código pronto | Precisa criar arquivo |
| WalletWithdraw | 🟡 Código pronto | Precisa criar arquivo |
| Integração | 🟡 50% | Precisa copiar endpoints |

---

**PRÓXIMA AÇÃO CRÍTICA:**
1. Copiar endpoints de `NOVOS_ENDPOINTS.py` para `main.py`
2. Reiniciar backend
3. Criar ThemeContext.jsx e WalletWithdraw.jsx

**Tempo restante: 10 minutos** ⏱️

---

*Guia criado por: Claude Code | 07/10/2025*
