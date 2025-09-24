# 📊 Dashboard e Métricas - Guia de Desenvolvimento

## 📋 Visão Geral

O dashboard do BetFit é o centro de controle administrativo que exibe métricas em tempo real sobre usuários, finanças e atividades da plataforma.

## 🏗️ Arquitetura do Dashboard

### Backend - Cálculo de Métricas
**Arquivo**: `backend/src/main.py`

```python
@app.route('/api/admin/dashboard', methods=['GET'])
def admin_dashboard():
    """Obter métricas para o dashboard administrativo"""
    try:
        users = get_users()
        wallets = get_wallets()
        transactions = get_transactions()
        
        # Calcular métricas
        total_users = len(users)
        active_users = len([u for u in users.values() if u.get('status') == 'active'])
        total_balance = sum(w.get('balance', 0) for w in wallets.values())
        
        # Retornar métricas calculadas
        return jsonify({
            'metrics': {
                'total_users': total_users,
                'active_users': active_users,
                'total_balance': round(total_balance, 2),
                # ... mais métricas
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Frontend - Exibição de Métricas
**Arquivo**: `admin/src/pages/DashboardPage.jsx`

```jsx
const DashboardPage = () => {
    const [metrics, setMetrics] = useState(null);
    
    useEffect(() => {
        fetchMetrics();
    }, []);
    
    const fetchMetrics = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`);
            const data = await response.json();
            setMetrics(data.metrics);
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
        }
    };
    
    return (
        <div className="dashboard">
            <MetricCard 
                title="Total de Usuários"
                value={metrics?.total_users || 0}
                growth={metrics?.growth?.users || 0}
            />
            {/* Mais cards de métricas */}
        </div>
    );
};
```

## 📈 Tipos de Métricas

### 1. Métricas de Usuários
```javascript
// Estrutura das métricas de usuários
{
    total_users: 150,           // Total de usuários cadastrados
    active_users: 142,          // Usuários ativos
    blocked_users: 8,           // Usuários bloqueados
    user_stats: {
        new_today: 5,           // Novos usuários hoje
        kyc_pending: 23,        // KYC pendente
        kyc_verified: 127       // KYC verificado
    }
}
```

**Como adicionar nova métrica de usuário**:
```python
# No backend (main.py)
def admin_dashboard():
    users = get_users()
    
    # Nova métrica: usuários premium
    premium_users = len([u for u in users.values() if u.get('plan') == 'premium'])
    
    metrics['premium_users'] = premium_users
```

### 2. Métricas Financeiras
```javascript
// Estrutura das métricas financeiras
{
    total_balance: 45230.50,    // Saldo total da plataforma
    financial_stats: {
        average_balance: 301.54, // Saldo médio por usuário
        highest_balance: 5000.00, // Maior saldo individual
        users_with_balance: 89   // Usuários com saldo > 0
    }
}
```

**Como adicionar nova métrica financeira**:
```python
# Calcular receita total de taxas
def calculate_platform_revenue():
    transactions = get_transactions()
    total_fees = 0
    
    for user_transactions in transactions.values():
        for transaction in user_transactions:
            if transaction.get('type') == 'platform_fee':
                total_fees += transaction.get('amount', 0)
    
    return total_fees

# Adicionar ao dashboard
metrics['platform_revenue'] = calculate_platform_revenue()
```

### 3. Métricas de Apostas
```javascript
// Estrutura das métricas de apostas
{
    total_bets: 1250,           // Total de apostas feitas
    total_wins: 578,            // Total de vitórias
    overall_win_rate: 46.24,    // Taxa de vitória geral
    active_challenges: 6        // Desafios ativos
}
```

## 🎨 Componentes do Dashboard

### MetricCard Component
```jsx
// admin/src/components/MetricCard.jsx
const MetricCard = ({ title, value, growth, icon, color }) => {
    const growthColor = growth >= 0 ? 'text-green-600' : 'text-red-600';
    const growthIcon = growth >= 0 ? '↗' : '↘';
    
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className={`text-sm ${growthColor}`}>
                        {growthIcon} {Math.abs(growth)}% vs mês anterior
                    </p>
                </div>
                <div className={`text-3xl ${color}`}>
                    {icon}
                </div>
            </div>
        </div>
    );
};
```

### Chart Component
```jsx
// admin/src/components/Chart.jsx
import { Line, Bar } from 'react-chartjs-2';

const Chart = ({ type, data, title }) => {
    const chartData = {
        labels: data.labels,
        datasets: [{
            label: title,
            data: data.values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
        }]
    };
    
    const ChartComponent = type === 'line' ? Line : Bar;
    
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">{title}</h3>
            <ChartComponent data={chartData} />
        </div>
    );
};
```

## 🔄 Atualização em Tempo Real

### Implementar Auto-refresh
```jsx
// admin/src/pages/DashboardPage.jsx
const DashboardPage = () => {
    const [metrics, setMetrics] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    
    useEffect(() => {
        fetchMetrics();
        
        if (autoRefresh) {
            const interval = setInterval(fetchMetrics, 30000); // 30 segundos
            return () => clearInterval(interval);
        }
    }, [autoRefresh]);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1>Dashboard</h1>
                <button 
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={autoRefresh ? 'text-green-600' : 'text-gray-600'}
                >
                    {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
                </button>
            </div>
            {/* Resto do dashboard */}
        </div>
    );
};
```

## 📊 Adicionando Novos Gráficos

### 1. Gráfico de Evolução de Saldo
```python
# Backend - Adicionar dados históricos
@app.route('/api/admin/dashboard/balance-history', methods=['GET'])
def get_balance_history():
    # Simular dados históricos (implementar com dados reais)
    history = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime('%d/%m')
        # Calcular saldo total para essa data
        balance = calculate_balance_for_date(date)
        history.append({'date': date, 'balance': balance})
    
    return jsonify({'history': list(reversed(history))})
```

```jsx
// Frontend - Componente do gráfico
const BalanceChart = () => {
    const [balanceHistory, setBalanceHistory] = useState([]);
    
    useEffect(() => {
        fetchBalanceHistory();
    }, []);
    
    const fetchBalanceHistory = async () => {
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/balance-history`);
        const data = await response.json();
        setBalanceHistory(data.history);
    };
    
    const chartData = {
        labels: balanceHistory.map(item => item.date),
        datasets: [{
            label: 'Saldo Total',
            data: balanceHistory.map(item => item.balance),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
        }]
    };
    
    return <Line data={chartData} />;
};
```

### 2. Gráfico de Crescimento de Usuários
```python
# Backend - Dados de crescimento
@app.route('/api/admin/dashboard/user-growth', methods=['GET'])
def get_user_growth():
    users = get_users()
    growth_data = {}
    
    for user in users.values():
        created_date = user.get('created_at', '')[:10]  # YYYY-MM-DD
        if created_date in growth_data:
            growth_data[created_date] += 1
        else:
            growth_data[created_date] = 1
    
    # Converter para formato do gráfico
    sorted_dates = sorted(growth_data.keys())
    cumulative = 0
    result = []
    
    for date in sorted_dates:
        cumulative += growth_data[date]
        result.append({
            'date': date,
            'new_users': growth_data[date],
            'total_users': cumulative
        })
    
    return jsonify({'growth': result})
```

## 🎯 Filtros e Períodos

### Implementar Filtros de Data
```jsx
// admin/src/components/DateFilter.jsx
const DateFilter = ({ onFilterChange }) => {
    const [period, setPeriod] = useState('7d');
    
    const periods = [
        { value: '1d', label: 'Último dia' },
        { value: '7d', label: 'Últimos 7 dias' },
        { value: '30d', label: 'Últimos 30 dias' },
        { value: '90d', label: 'Últimos 90 dias' }
    ];
    
    const handlePeriodChange = (newPeriod) => {
        setPeriod(newPeriod);
        onFilterChange(newPeriod);
    };
    
    return (
        <div className="flex space-x-2">
            {periods.map(p => (
                <button
                    key={p.value}
                    onClick={() => handlePeriodChange(p.value)}
                    className={`px-3 py-1 rounded ${
                        period === p.value 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200'
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
    );
};
```

## 🚨 Alertas e Notificações

### Sistema de Alertas
```jsx
// admin/src/components/AlertSystem.jsx
const AlertSystem = ({ metrics }) => {
    const alerts = [];
    
    // Verificar condições de alerta
    if (metrics.total_balance < 1000) {
        alerts.push({
            type: 'warning',
            message: 'Saldo total da plataforma está baixo'
        });
    }
    
    if (metrics.blocked_users > metrics.total_users * 0.1) {
        alerts.push({
            type: 'error',
            message: 'Muitos usuários bloqueados'
        });
    }
    
    return (
        <div className="space-y-2">
            {alerts.map((alert, index) => (
                <div 
                    key={index}
                    className={`p-3 rounded ${
                        alert.type === 'error' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                    }`}
                >
                    {alert.message}
                </div>
            ))}
        </div>
    );
};
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Métricas não carregam**
   - Verificar se a API está rodando
   - Verificar URL da API no frontend
   - Verificar logs do backend

2. **Dados incorretos**
   - Verificar cálculos no backend
   - Verificar estrutura do banco JSON
   - Verificar filtros de data

3. **Performance lenta**
   - Implementar cache no backend
   - Otimizar queries do banco JSON
   - Implementar paginação

### Debug
```javascript
// Adicionar logs para debug
console.log('Métricas recebidas:', metrics);
console.log('Erro na API:', error);
```

## 📝 Checklist para Novas Métricas

- [ ] Definir cálculo no backend
- [ ] Criar rota da API
- [ ] Implementar no frontend
- [ ] Adicionar componente visual
- [ ] Testar com dados reais
- [ ] Documentar a métrica
- [ ] Adicionar testes unitários

---

**Próximos passos**: Consulte o [Guia de Usuários](./users-guide.md) para implementar funcionalidades relacionadas a gestão de usuários.

