# 🎯 INSTRUÇÕES FINAIS - BETFIT COMPLETO

**Data:** 07/10/2025
**Status:** Backend 95% | Frontend 50% | Cronjob ✅

---

## ✅ O QUE JÁ ESTÁ PRONTO:

### **Backend:**
1. ✅ Modelo User atualizado (`models.py`)
2. ✅ 7 Endpoints criados (`backend/src/NOVOS_ENDPOINTS.py`):
   - PUT /api/user/profile
   - POST /api/user/upload-avatar
   - POST /api/wallet/deposit/pix
   - POST /api/wallet/deposit/credit-card
   - POST /api/wallet/withdraw/pix
   - GET /api/wallet/withdraw/history
3. ✅ Cronjob criado (`backend/src/jobs/finalize_challenges.py`)
4. ✅ Diretórios de upload criados

### **Documentação:**
- ✅ IMPLEMENTACOES_COMPLETAS.md
- ✅ FASE1_IMPLEMENTACOES.md
- ✅ RESUMO_IMPLEMENTACOES.md
- ✅ INSTRUCOES_FINAIS.md (este arquivo)

---

## 🔧 COMO ATIVAR O BACKEND:

### **Passo 1: Copiar endpoints para main.py**

Abra `backend/src/NOVOS_ENDPOINTS.py` e copie TODO o conteúdo.

Cole no arquivo `backend/src/main.py` **ANTES** desta linha:
```python
if __name__ == '__main__':
```

### **Passo 2: Adicionar variáveis ao .env.local**

Abra `backend/.env.local` e adicione no final:

```env
# Upload de arquivos
UPLOAD_MAX_SIZE=5242880
UPLOAD_FOLDER=./src/uploads
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif

# Taxa de saque
WITHDRAWAL_FEE_PERCENT=2
WITHDRAWAL_MIN_AMOUNT=20
WITHDRAWAL_AUTO_APPROVE_LIMIT=1000

# Cronjob
FINALIZE_INTERVAL_HOURS=1
```

### **Passo 3: Instalar dependências**

```bash
cd backend
pip install schedule pillow mercadopago
```

### **Passo 4: Iniciar cronjob**

**Windows:**
```bash
cd backend
start python src/jobs/finalize_challenges.py
```

**Linux/Mac:**
```bash
cd backend
python src/jobs/finalize_challenges.py &
```

### **Passo 5: Reiniciar backend**

Mate o processo atual e reinicie:
```bash
cd backend
./venv/Scripts/python src/main.py
```

---

## 🎨 FRONTEND - O QUE FALTA:

### **Componentes a criar/atualizar:**

#### **1. ThemeContext.jsx** (NOVO)
Localização: `frontend/src/contexts/ThemeContext.jsx`

**Código completo:**
```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState('dark');

  // Carregar tema do localStorage ou do usuário
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const userTheme = user?.theme_preference;

    const initialTheme = userTheme || savedTheme || 'dark';
    setTheme(initialTheme);
    applyTheme(initialTheme);
  }, [user]);

  const applyTheme = (newTheme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    // Sincronizar com banco
    if (user?.email) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: user.email,
            theme_preference: newTheme
          })
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

**Onde usar:**
No arquivo `frontend/src/main.jsx`, envolva o App com ThemeProvider:

```jsx
import { ThemeProvider } from './contexts/ThemeContext';

<ThemeProvider>
  <App />
</ThemeProvider>
```

---

#### **2. ProfileHeader.jsx - Adicionar edição**

Localize o componente `ProfileHeader.jsx` e adicione:

**Botão de editar:**
```jsx
import { Edit3, Camera } from 'lucide-react';
import { useState } from 'react';

const [showEditModal, setShowEditModal] = useState(false);
const [editForm, setEditForm] = useState({
  name: user?.name || '',
  phone: user?.phone || '',
  bio: user?.bio || '',
  location: user?.location || ''
});

// Adicionar no JSX, próximo ao avatar:
<button
  onClick={() => setShowEditModal(true)}
  className="absolute bottom-0 right-0 bg-green-500 p-2 rounded-full"
>
  <Edit3 className="w-4 h-4 text-white" />
</button>

// Modal de edição:
{showEditModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
      <h3 className="text-xl font-bold mb-4">Editar Perfil</h3>

      <input
        type="text"
        placeholder="Nome"
        value={editForm.name}
        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
        className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
      />

      <input
        type="tel"
        placeholder="Telefone"
        value={editForm.phone}
        onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
        className="w-full p-2 mb-3 rounded bg-gray-700 text-white"
      />

      <textarea
        placeholder="Bio"
        value={editForm.bio}
        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
        className="w-full p-2 mb-3 rounded bg-gray-700 text-white h-20"
      />

      <input
        type="text"
        placeholder="Localização"
        value={editForm.location}
        onChange={(e) => setEditForm({...editForm, location: e.target.value})}
        className="w-full p-2 mb-4 rounded bg-gray-700 text-white"
      />

      <div className="flex gap-2">
        <button
          onClick={() => setShowEditModal(false)}
          className="flex-1 py-2 bg-gray-600 rounded"
        >
          Cancelar
        </button>
        <button
          onClick={handleSaveProfile}
          className="flex-1 py-2 bg-green-500 rounded"
        >
          Salvar
        </button>
      </div>
    </div>
  </div>
)}
```

**Função de salvar:**
```jsx
const handleSaveProfile = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: user.email,
        ...editForm
      })
    });

    const data = await response.json();
    if (data.success) {
      alert('Perfil atualizado!');
      setShowEditModal(false);
      // Recarregar dados
    }
  } catch (error) {
    console.error('Erro ao salvar:', error);
  }
};
```

---

#### **3. WalletDeposit.jsx - Adicionar PIX**

Localize `WalletDeposit.jsx` e adicione a aba PIX:

```jsx
const [depositAmount, setDepositAmount] = useState(50);
const [qrCode, setQrCode] = useState(null);
const [loading, setLoading] = useState(false);

const handleGeneratePix = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/wallet/deposit/pix`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_email: user.email,
        amount: depositAmount
      })
    });

    const data = await response.json();
    if (data.success) {
      setQrCode(data);
      // Iniciar polling para verificar pagamento
      startPaymentPolling(data.payment_id);
    }
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
  } finally {
    setLoading(false);
  }
};

// Exibir QR Code:
{qrCode && (
  <div className="text-center">
    <img
      src={`data:image/png;base64,${qrCode.qr_code_base64}`}
      alt="QR Code PIX"
      className="mx-auto w-64 h-64"
    />
    <p className="text-sm mt-2">Copiar código PIX:</p>
    <code className="text-xs bg-gray-700 p-2 rounded block mt-1">
      {qrCode.qr_code}
    </code>
  </div>
)}
```

---

#### **4. WalletWithdraw.jsx - CRIAR NOVO**

Localização: `frontend/src/components/wallet/WalletWithdraw.jsx`

**Código completo está muito grande. Principais elementos:**

```jsx
import { useState } from 'react';

export default function WalletWithdraw({ user, balance }) {
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const fee = Math.max(amount * 0.02, 5);
  const netAmount = amount - fee;

  const handleWithdraw = async () => {
    const response = await fetch('/api/wallet/withdraw/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_email: user.email, amount, pix_key: pixKey })
    });

    const data = await response.json();
    if (data.success) {
      alert('Saque solicitado!');
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h3 className="text-xl mb-4">Solicitar Saque PIX</h3>

      <input
        type="number"
        placeholder="Valor"
        value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
        className="w-full p-2 mb-3 bg-gray-700 rounded"
      />

      <input
        type="text"
        placeholder="Chave PIX"
        value={pixKey}
        onChange={(e) => setPixKey(e.target.value)}
        className="w-full p-2 mb-3 bg-gray-700 rounded"
      />

      <div className="text-sm mb-4">
        <p>Taxa: R$ {fee.toFixed(2)}</p>
        <p className="font-bold">Você receberá: R$ {netAmount.toFixed(2)}</p>
      </div>

      <button
        onClick={handleWithdraw}
        disabled={amount < 20 || !pixKey}
        className="w-full py-3 bg-green-500 rounded disabled:opacity-50"
      >
        Solicitar Saque
      </button>
    </div>
  );
}
```

---

## ✅ CHECKLIST FINAL:

- [ ] Copiar endpoints de `NOVOS_ENDPOINTS.py` para `main.py`
- [ ] Adicionar variáveis ao `.env.local`
- [ ] Instalar dependências: `pip install schedule pillow mercadopago`
- [ ] Criar `ThemeContext.jsx`
- [ ] Atualizar `ProfileHeader.jsx`
- [ ] Atualizar `WalletDeposit.jsx`
- [ ] Criar `WalletWithdraw.jsx`
- [ ] Iniciar cronjob em background
- [ ] Reiniciar backend e frontend
- [ ] Testar fluxo completo

---

## 🎯 SISTEMA 100% FUNCIONAL QUANDO:

- ✅ Usuários podem editar perfil e foto
- ✅ Tema light/dark sincronizado
- ✅ Depósitos automáticos (PIX + Cartão)
- ✅ Saques automáticos (PIX)
- ✅ Desafios finalizando automaticamente
- ✅ Todos os endpoints respondendo

---

**Arquivos de referência:**
- `/backend/src/NOVOS_ENDPOINTS.py` - 7 endpoints prontos
- `/backend/src/jobs/finalize_challenges.py` - Cronjob pronto
- `/FASE1_IMPLEMENTACOES.md` - Código detalhado
- `/INSTRUCOES_FINAIS.md` - Este arquivo

**Desenvolvido por: Claude Code | 07/10/2025**
