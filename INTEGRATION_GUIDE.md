# 🔧 GUIA DE INTEGRAÇÃO - BETFIT 110%

**Data:** 07/10/2025
**Arquivos Criados:** notification_service.py, leaderboard_endpoints.py, gamification.py, analytics_endpoints.py

---

## 📦 BACKEND - INTEGRAÇÃO NO MAIN.PY

Adicione estas linhas no `backend/src/main.py`:

```python
# ==================== IMPORTS (no topo do arquivo) ====================
from notification_service import init_notification_service, register_notification_routes
from leaderboard_endpoints import register_leaderboard_routes
from gamification import register_gamification_routes
from analytics_endpoints import register_analytics_routes
import threading
import time

# ==================== APÓS CRIAR SOCKETIO (linha ~70) ====================

# Inicializar serviço de notificações
notification_service = init_notification_service(socketio)
register_notification_routes(app, notification_service)

print("[OK] Sistema de notificações inicializado")

# ==================== APÓS REGISTRAR ROTAS DO CHAT (linha ~2000+) ====================

# Registrar rotas adicionais
register_leaderboard_routes(app)
register_gamification_routes(app)
register_analytics_routes(app)

print("[OK] Leaderboard, Gamification e Analytics registrados")

# ==================== CRONJOB DE NOTIFICAÇÕES (antes de socketio.run) ====================

# Worker de notificações (roda em background)
def notification_worker():
    """Verifica alertas de desafios a cada minuto"""
    while True:
        try:
            notification_service.check_challenge_time_alerts()
        except Exception as e:
            print(f"[ERROR] Notification worker: {e}")
        time.sleep(60)  # 1 minuto

# Iniciar worker em thread separada
notification_thread = threading.Thread(target=notification_worker, daemon=True)
notification_thread.start()
print("[OK] Cronjob de notificações iniciado")
```

---

## 🎨 FRONTEND - COMPONENTS A CRIAR

### 1. Notification Center

Criar: `frontend/src/components/notifications/NotificationCenter.jsx`

```jsx
import React, { useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'sonner';

export default function NotificationCenter({ user }) {
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001');

    socket.on('connect', () => {
      socket.emit('join', { room: `user_${user.id}`, username: user.name });
    });

    socket.on('notification', (data) => {
      // Exibir toast baseado no tipo
      const icons = {
        'challenge_starting': '⏰',
        'challenge_ending': '🏁',
        'prize_won': '🏆',
        'new_message': '💬',
        'payment_received': '💰'
      };

      toast(data.title, {
        description: data.message,
        icon: data.data?.icon || icons[data.type] || '🔔',
        duration: 5000
      });
    });

    return () => socket.disconnect();
  }, [user]);

  return null; // Componente invisível
}
```

**Integrar no MainLayout.jsx:**
```jsx
import NotificationCenter from './notifications/NotificationCenter';

// Dentro do component:
<NotificationCenter user={currentUser} />
```

---

### 2. Leaderboard Component

Criar: `frontend/src/components/leaderboard/Leaderboard.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    fetch(`${API_URL}/api/leaderboard?period=${period}`)
      .then(res => res.json())
      .then(data => setLeaderboard(data.leaderboard));
  }, [period]);

  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">🏆 Ranking Global</h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['all', 'month', 'week'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded ${period === p ? 'bg-cyan-500 text-white' : 'bg-gray-200'}`}
          >
            {p === 'all' ? 'Geral' : p === 'month' ? 'Mês' : 'Semana'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {leaderboard.map(user => (
          <div key={user.user_id} className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
            <span className="text-2xl">{medals[user.position] || user.position}</span>
            <img src={user.avatar} className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <p className="font-bold">{user.name}</p>
              <p className="text-sm text-gray-600">{user.challenges_completed} desafios</p>
            </div>
            <p className="text-lg font-bold text-green-600">R$ {user.total_earned.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Level Badge Component

Criar: `frontend/src/components/gamification/LevelBadge.jsx`

```jsx
import React, { useEffect, useState } from 'react';

export default function LevelBadge({ userEmail }) {
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/gamification/${userEmail}`)
      .then(res => res.json())
      .then(data => setGamification(data));
  }, [userEmail]);

  if (!gamification) return null;

  const { level, xp, next_level_xp } = gamification;

  return (
    <div className="p-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white">
      <div className="flex items-center gap-3">
        <div className="text-3xl">
          {level.key === 'bronze' && '🥉'}
          {level.key === 'silver' && '🥈'}
          {level.key === 'gold' && '🥇'}
          {level.key === 'diamond' && '💎'}
        </div>
        <div>
          <p className="text-sm opacity-80">Nível</p>
          <p className="text-xl font-bold">{level.name}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-xs mb-1">
          <span>{xp} XP</span>
          {next_level_xp && <span>{next_level_xp} XP</span>}
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${level.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Integrar notification_service no main.py
- [ ] Integrar leaderboard, gamification, analytics no main.py
- [ ] Adicionar cronjob de notificações
- [ ] Criar NotificationCenter.jsx
- [ ] Criar Leaderboard.jsx
- [ ] Criar LevelBadge.jsx
- [ ] Testar localhost
- [ ] Commit e push
- [ ] Verificar deploy Render

---

## 📊 ENDPOINTS DISPONÍVEIS

### Notificações
- `POST /api/notifications/test` - Testar notificação
- `POST /api/notifications/check-alerts` - Forçar verificação

### Leaderboard
- `GET /api/leaderboard?period=all|month|week` - Ranking
- `GET /api/leaderboard/rank/<email>` - Posição usuário

### Gamificação
- `GET /api/gamification/<email>` - Stats completas
- `POST /api/gamification/award-xp` - Adicionar XP
- `POST /api/gamification/check-badges` - Verificar badges
- `GET /api/gamification/levels` - Listar níveis
- `GET /api/gamification/badges` - Listar badges

### Analytics
- `GET /api/analytics/<email>` - Estatísticas completas

---

**🎉 Com essas integrações, BetFit chega a 110%!**
