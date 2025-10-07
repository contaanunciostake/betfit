# 🚀 FASE 1 - IMPLEMENTAÇÕES CRÍTICAS BETFIT

**Status:** ✅ Modelo User atualizado | 🔄 Endpoints em progresso

---

## ✅ O QUE JÁ FOI FEITO:

### 1. **Modelo User Atualizado** ✅
**Arquivo:** `backend/src/models.py`

**Novos campos adicionados:**
- `profile_picture` (String) - URL da foto de perfil
- `theme_preference` (String, default='dark') - Tema do usuário (light/dark)
- `bio` (Text) - Biografia do usuário
- `location` (String) - Localização
- `birthdate` (DateTime) - Data de nascimento
- `pix_key` (String) - Chave PIX para saques

**Método adicionado:**
- `to_dict()` - Converte usuário para dicionário (excluindo senha)

---

## 🔄 ENDPOINTS A IMPLEMENTAR (PRÓXIMOS PASSOS):

### **1. PERFIL DO USUÁRIO**

#### `PUT /api/user/profile`
```python
@app.route('/api/user/profile', methods=['PUT'])
def update_user_profile():
    """Atualizar perfil do usuário"""
    # - Receber dados: name, phone, bio, location, birthdate, theme_preference
    # - Validar usuário autenticado
    # - Atualizar campos no banco
    # - Retornar perfil atualizado
```

#### `POST /api/user/upload-avatar`
```python
@app.route('/api/user/upload-avatar', methods=['POST'])
def upload_avatar():
    """Upload de foto de perfil"""
    # - Receber arquivo (max 5MB)
    # - Validar formato (jpg, jpeg, png)
    # - Salvar em /uploads/avatars/
    # - Atualizar profile_picture no banco
    # - Retornar URL da foto
```

---

### **2. DEPÓSITOS MERCADOPAGO**

#### `POST /api/wallet/deposit/pix`
```python
@app.route('/api/wallet/deposit/pix', methods=['POST'])
def deposit_pix():
    """Criar depósito via PIX"""
    # - Receber valor (min R$10)
    # - Gerar payment via MercadoPago SDK
    # - Criar QR Code PIX
    # - Salvar transação com status='pending'
    # - Retornar: payment_id, qr_code, qr_code_base64
```

#### `POST /api/wallet/deposit/credit-card`
```python
@app.route('/api/wallet/deposit/credit-card', methods=['POST'])
def deposit_credit_card():
    """Depósito via cartão de crédito"""
    # - Receber: card_number, cvv, expiry, holder_name
    # - Processar via MercadoPago SDK
    # - Criar transação
    # - Se aprovado: creditar saldo automaticamente
    # - Retornar status
```

#### Melhorar `POST /api/payments/webhook/mercadopago`
```python
# JÁ EXISTE, MAS PRECISA MELHORAR:
@app.route('/api/payments/webhook/mercadopago', methods=['POST'])
def mercadopago_webhook():
    """Webhook para confirmar pagamentos"""
    # ADICIONAR:
    # - Detectar event_type = 'payment'
    # - Se status = 'approved':
    #   - Buscar transação pelo payment_id
    #   - Atualizar status para 'completed'
    #   - Creditar saldo na carteira
    #   - user_wallet.balance += amount
    #   - user.total_deposited += amount
    # - Enviar notificação ao usuário
```

---

### **3. SAQUES MERCADOPAGO**

#### `POST /api/wallet/withdraw/pix`
```python
@app.route('/api/wallet/withdraw/pix', methods=['POST'])
def withdraw_pix():
    """Saque via PIX"""
    # - Receber: amount, pix_key
    # - Validar saldo suficiente (balance >= amount + taxa)
    # - Taxa: 2% ou mín R$5
    # - Criar transferência via MercadoPago:
    #   - money_transfer.create(pix_key, amount)
    # - Descontar do saldo
    # - Salvar transação com status='processing'
    # - Auto-aprovar se amount < R$1000
    # - Retornar status
```

#### `GET /api/wallet/withdraw/history`
```python
@app.route('/api/wallet/withdraw/history', methods=['GET'])
def withdraw_history():
    """Histórico de saques"""
    # - Buscar transações type='withdrawal'
    # - Retornar lista com status
```

---

### **4. CRONJOB DE FINALIZAÇÃO**

**Arquivo:** `backend/src/jobs/finalize_challenges.py`

```python
import schedule
import time
from datetime import datetime
from models import Challenge, SessionLocal
import requests

def finalize_expired_challenges():
    """Finalizar desafios expirados automaticamente"""
    session = SessionLocal()
    try:
        # Buscar desafios expirados
        now = datetime.utcnow()
        expired = session.query(Challenge).filter(
            Challenge.end_date < now,
            Challenge.status == 'active'
        ).all()

        for challenge in expired:
            print(f"[CRON] Finalizando desafio: {challenge.id}")
            # Chamar endpoint de finalização
            response = requests.post(
                f'http://localhost:5001/api/challenges/{challenge.id}/finalize'
            )
            if response.status_code == 200:
                print(f"[OK] Desafio {challenge.id} finalizado")
            else:
                print(f"[ERROR] Erro ao finalizar {challenge.id}")

    except Exception as e:
        print(f"[ERROR] Erro no cronjob: {e}")
    finally:
        session.close()

# Agendar execução a cada 1 hora
schedule.every(1).hours.do(finalize_expired_challenges)

if __name__ == '__main__':
    print("[CRON] Iniciando cronjob de finalização...")
    while True:
        schedule.run_pending()
        time.sleep(60)  # Verificar a cada minuto
```

**Executar:**
```bash
cd backend
python src/jobs/finalize_challenges.py &
```

---

## 📦 DEPENDÊNCIAS NECESSÁRIAS:

**Instalar no backend:**
```bash
pip install schedule
pip install pillow  # Para manipulação de imagens
```

---

## 🗂️ ESTRUTURA DE DIRETÓRIOS A CRIAR:

```bash
backend/
├── src/
│   ├── jobs/
│   │   └── finalize_challenges.py
│   └── uploads/
│       ├── avatars/
│       └── proofs/
```

**Criar diretórios:**
```bash
mkdir -p backend/src/jobs
mkdir -p backend/src/uploads/avatars
mkdir -p backend/src/uploads/proofs
```

---

## ⚙️ CONFIGURAÇÕES `.env.local`:

```env
# Upload de arquivos
UPLOAD_MAX_SIZE=5242880  # 5MB
UPLOAD_FOLDER=./src/uploads
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif

# Taxa de saque
WITHDRAWAL_FEE_PERCENT=2
WITHDRAWAL_MIN_AMOUNT=20
WITHDRAWAL_AUTO_APPROVE_LIMIT=1000

# Cronjob
FINALIZE_INTERVAL_HOURS=1
```

---

## 🎯 PRÓXIMAS AÇÕES:

1. ✅ **Modelos atualizados**
2. 🔄 **Implementar 8 endpoints** (perfil, depósito, saque)
3. 🔄 **Criar cronjob** de finalização
4. 🔄 **Atualizar frontend** (ProfileHeader, WalletDeposit, WalletWithdraw)
5. 🔄 **Testar fluxo completo**

---

## 📝 EXEMPLO DE USO (FRONTEND):

### Atualizar perfil:
```javascript
const updateProfile = async (data) => {
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_email: user.email,
      name: data.name,
      bio: data.bio,
      theme_preference: data.theme
    })
  });
  return response.json();
};
```

### Fazer depósito PIX:
```javascript
const depositPix = async (amount) => {
  const response = await fetch('/api/wallet/deposit/pix', {
    method: 'POST',
    body: JSON.stringify({ user_email: user.email, amount })
  });
  const data = await response.json();
  // Exibir QR Code: data.qr_code_base64
};
```

### Fazer saque:
```javascript
const withdrawPix = async (amount, pix_key) => {
  const response = await fetch('/api/wallet/withdraw/pix', {
    method: 'POST',
    body: JSON.stringify({ user_email: user.email, amount, pix_key })
  });
  return response.json();
};
```

---

**Status:** Modelo User ✅ | Endpoints 🔄 | Cronjob 🔄 | Frontend 🔄

**Próximo passo:** Implementar os 8 endpoints restantes no `main.py`
