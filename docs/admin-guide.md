# 🛡️ Painel Administrativo - Guia de Desenvolvimento

## 📋 Visão Geral

O painel administrativo do BetFit é uma interface completa para gestão da plataforma, permitindo controle total sobre usuários, finanças, desafios e operações.

## 🏗️ Arquitetura do Admin

### Estrutura de Permissões
```json
{
  "admin_id": "uuid-do-admin",
  "email": "admin@betfit.com",
  "name": "Administrador",
  "role": "super_admin|admin|moderator",
  "permissions": [
    "users.view",
    "users.edit",
    "users.block",
    "financial.view",
    "financial.edit",
    "challenges.manage",
    "reports.generate"
  ],
  "created_at": "2025-01-01T00:00:00",
  "last_login": "2025-01-01T00:00:00"
}
```

### Estrutura de Logs de Auditoria
```json
{
  "id": "uuid-do-log",
  "admin_id": "uuid-do-admin",
  "action": "user.block|balance.add|challenge.create",
  "target_type": "user|challenge|transaction",
  "target_id": "uuid-do-alvo",
  "details": {
    "old_value": "valor_anterior",
    "new_value": "novo_valor",
    "reason": "motivo_da_acao"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2025-01-01T00:00:00"
}
```

## 🔐 Sistema de Autenticação Admin

### Backend - Login Administrativo
**Arquivo**: `backend/src/main.py`

```python
@app.route('/api/admin/auth/login', methods=['POST'])
def admin_login():
    """Login administrativo"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'error': 'Email e senha são obrigatórios'}), 400
        
        # Credenciais padrão (em produção, usar banco de dados)
        admin_credentials = {
            'admin@betfit.com': {
                'password': 'admin123',
                'name': 'Administrador BetFit',
                'role': 'super_admin',
                'permissions': [
                    'users.view', 'users.edit', 'users.block',
                    'financial.view', 'financial.edit',
                    'challenges.manage', 'reports.generate',
                    'admin.manage'
                ]
            },
            'moderator@betfit.com': {
                'password': 'mod123',
                'name': 'Moderador BetFit',
                'role': 'moderator',
                'permissions': [
                    'users.view', 'users.edit',
                    'challenges.manage'
                ]
            }
        }
        
        if email not in admin_credentials:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        admin_data = admin_credentials[email]
        
        # Verificar senha (em produção, usar hash)
        if password != admin_data['password']:
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        # Gerar token de acesso
        admin_token = generate_admin_token(email)
        
        # Registrar log de login
        log_admin_action(
            admin_id=email,
            action='admin.login',
            details={'ip_address': request.remote_addr}
        )
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'admin': {
                'email': email,
                'name': admin_data['name'],
                'role': admin_data['role'],
                'permissions': admin_data['permissions']
            },
            'access_token': admin_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

def generate_admin_token(admin_email):
    """Gerar token de acesso administrativo"""
    # Em produção, usar JWT com expiração
    return f"admin_token_{secrets.token_hex(16)}_{admin_email}"

def log_admin_action(admin_id, action, target_type=None, target_id=None, details=None):
    """Registrar ação administrativa para auditoria"""
    try:
        logs = get_admin_logs()
        
        log_entry = {
            'id': f'log_{secrets.token_hex(8)}',
            'admin_id': admin_id,
            'action': action,
            'target_type': target_type,
            'target_id': target_id,
            'details': details or {},
            'ip_address': request.remote_addr if request else None,
            'user_agent': request.headers.get('User-Agent') if request else None,
            'created_at': datetime.now().isoformat()
        }
        
        logs.append(log_entry)
        save_admin_logs(logs)
        
        print(f"Log admin: {admin_id} - {action}")
        
    except Exception as e:
        print(f"Erro ao registrar log admin: {e}")
```

### Frontend - Login Admin
**Arquivo**: `admin/src/components/auth/AdminLogin.jsx`

```jsx
const AdminLogin = () => {
    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAdminAuth();
    const navigate = useNavigate();
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await login(credentials);
            navigate('/admin/dashboard');
        } catch (error) {
            setError(error.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
                        <span className="text-2xl">🛡️</span>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Painel Administrativo
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Acesso restrito para administradores
                    </p>
                </div>
                
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                value={credentials.email}
                                onChange={(e) => setCredentials({
                                    ...credentials, 
                                    email: e.target.value
                                })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({
                                    ...credentials, 
                                    password: e.target.value
                                })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </div>
                    
                    <div className="text-center">
                        <div className="text-sm text-gray-600">
                            <strong>Credenciais de teste:</strong>
                            <br />
                            Email: admin@betfit.com
                            <br />
                            Senha: admin123
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
```

## 👥 Gestão Avançada de Usuários

### Backend - Operações Administrativas
```python
@app.route('/api/admin/users/<user_id>/block', methods=['POST'])
def block_user(user_id):
    """Bloquear usuário"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        reason = data.get('reason', 'Não especificado')
        
        users = get_users()
        
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user = users[user_id]
        old_status = user.get('status')
        
        user['status'] = 'blocked'
        user['blocked_at'] = datetime.now().isoformat()
        user['blocked_reason'] = reason
        user['blocked_by'] = admin_id
        user['updated_at'] = datetime.now().isoformat()
        
        users[user_id] = user
        save_users(users)
        
        # Log da ação
        log_admin_action(
            admin_id=admin_id,
            action='user.block',
            target_type='user',
            target_id=user_id,
            details={
                'old_status': old_status,
                'new_status': 'blocked',
                'reason': reason,
                'user_email': user.get('email')
            }
        )
        
        return jsonify({
            'message': 'Usuário bloqueado com sucesso',
            'user': {k: v for k, v in user.items() if k != 'password'}
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/unblock', methods=['POST'])
def unblock_user(user_id):
    """Desbloquear usuário"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        
        users = get_users()
        
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user = users[user_id]
        old_status = user.get('status')
        
        user['status'] = 'active'
        user['unblocked_at'] = datetime.now().isoformat()
        user['unblocked_by'] = admin_id
        user['updated_at'] = datetime.now().isoformat()
        
        # Remover campos de bloqueio
        user.pop('blocked_at', None)
        user.pop('blocked_reason', None)
        user.pop('blocked_by', None)
        
        users[user_id] = user
        save_users(users)
        
        # Log da ação
        log_admin_action(
            admin_id=admin_id,
            action='user.unblock',
            target_type='user',
            target_id=user_id,
            details={
                'old_status': old_status,
                'new_status': 'active',
                'user_email': user.get('email')
            }
        )
        
        return jsonify({
            'message': 'Usuário desbloqueado com sucesso',
            'user': {k: v for k, v in user.items() if k != 'password'}
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/balance', methods=['POST'])
def admin_add_balance(user_id):
    """Adicionar saldo administrativamente"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        amount = float(data.get('amount', 0))
        reason = data.get('reason', 'Crédito administrativo')
        
        if amount <= 0:
            return jsonify({'error': 'Valor deve ser maior que zero'}), 400
        
        users = get_users()
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Atualizar saldo
        old_balance = get_wallet_balance(user_id)
        wallet = update_wallet_balance(user_id, amount, 'admin_credit')
        
        # Registrar transação
        transaction = add_transaction(
            user_id,
            'admin_credit',
            amount,
            reason,
            'completed',
            {
                'admin_id': admin_id,
                'admin_action': True
            }
        )
        
        # Log da ação
        log_admin_action(
            admin_id=admin_id,
            action='balance.add',
            target_type='user',
            target_id=user_id,
            details={
                'old_balance': old_balance,
                'new_balance': wallet['balance'],
                'amount_added': amount,
                'reason': reason,
                'user_email': users[user_id].get('email')
            }
        )
        
        return jsonify({
            'message': f'R$ {amount:.2f} adicionado com sucesso',
            'transaction': transaction,
            'new_balance': wallet['balance']
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/kyc/approve', methods=['POST'])
def admin_approve_kyc(user_id):
    """Aprovar KYC administrativamente"""
    try:
        data = request.get_json()
        admin_id = data.get('admin_id')
        notes = data.get('notes', '')
        
        users = get_users()
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user = users[user_id]
        old_kyc_status = user.get('kyc_status')
        
        user['kyc_status'] = 'verified'
        user['kyc_verified_at'] = datetime.now().isoformat()
        user['kyc_verified_by'] = admin_id
        user['kyc_notes'] = notes
        user['updated_at'] = datetime.now().isoformat()
        
        users[user_id] = user
        save_users(users)
        
        # Log da ação
        log_admin_action(
            admin_id=admin_id,
            action='kyc.approve',
            target_type='user',
            target_id=user_id,
            details={
                'old_status': old_kyc_status,
                'new_status': 'verified',
                'notes': notes,
                'user_email': user.get('email')
            }
        )
        
        return jsonify({
            'message': 'KYC aprovado com sucesso',
            'user': {k: v for k, v in user.items() if k != 'password'}
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Frontend - Ações Administrativas
```jsx
// admin/src/components/users/UserActionsMenu.jsx
const UserActionsMenu = ({ user, onAction }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const { admin } = useAdminAuth();
    
    const actions = [
        {
            id: 'view',
            label: 'Ver Detalhes',
            icon: '👁️',
            onClick: () => onAction('view', user.id)
        },
        {
            id: 'add_balance',
            label: 'Adicionar Saldo',
            icon: '💰',
            onClick: () => setShowBalanceModal(true),
            permission: 'financial.edit'
        },
        {
            id: 'approve_kyc',
            label: 'Aprovar KYC',
            icon: '✅',
            onClick: () => onAction('approve_kyc', user.id),
            permission: 'users.edit',
            condition: user.kyc_status === 'pending'
        },
        {
            id: 'block',
            label: user.status === 'active' ? 'Bloquear' : 'Desbloquear',
            icon: user.status === 'active' ? '🚫' : '✅',
            onClick: () => setShowBlockModal(true),
            permission: 'users.block',
            danger: user.status === 'active'
        },
        {
            id: 'login_as',
            label: 'Login como Usuário',
            icon: '🔑',
            onClick: () => onAction('login_as', user.id),
            permission: 'admin.manage'
        }
    ];
    
    const filteredActions = actions.filter(action => {
        if (action.permission && !admin.permissions.includes(action.permission)) {
            return false;
        }
        if (action.condition !== undefined && !action.condition) {
            return false;
        }
        return true;
    });
    
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-gray-600"
            >
                ⋮
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                    <div className="py-1">
                        {filteredActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2 ${
                                    action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                                }`}
                            >
                                <span>{action.icon}</span>
                                <span>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Modal de Adicionar Saldo */}
            {showBalanceModal && (
                <AddBalanceModal
                    user={user}
                    onClose={() => setShowBalanceModal(false)}
                    onSuccess={(amount) => {
                        onAction('balance_added', user.id, { amount });
                        setShowBalanceModal(false);
                    }}
                />
            )}
            
            {/* Modal de Bloquear/Desbloquear */}
            {showBlockModal && (
                <BlockUserModal
                    user={user}
                    onClose={() => setShowBlockModal(false)}
                    onSuccess={() => {
                        onAction('status_changed', user.id);
                        setShowBlockModal(false);
                    }}
                />
            )}
        </div>
    );
};

const AddBalanceModal = ({ user, onClose, onSuccess }) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const { admin } = useAdminAuth();
    
    const predefinedAmounts = [10, 25, 50, 100, 250, 500];
    const predefinedReasons = [
        'Crédito promocional',
        'Compensação por erro',
        'Bônus de fidelidade',
        'Reembolso',
        'Crédito administrativo'
    ];
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Valor inválido');
            return;
        }
        
        setLoading(true);
        try {
            await adminService.addUserBalance(user.id, {
                admin_id: admin.email,
                amount: parseFloat(amount),
                reason: reason || 'Crédito administrativo'
            });
            
            toast.success(`R$ ${amount} adicionado com sucesso!`);
            onSuccess(parseFloat(amount));
        } catch (error) {
            toast.error('Erro ao adicionar saldo');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                        Adicionar Saldo - {user.name}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Valores Pré-definidos */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valores Rápidos
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {predefinedAmounts.map(value => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setAmount(value.toString())}
                                    className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                                >
                                    R$ {value}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* Valor Customizado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Valor Personalizado
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                R$
                            </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0,00"
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                                min="0.01"
                                step="0.01"
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Motivo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Motivo
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 mb-2"
                        >
                            <option value="">Selecione um motivo</option>
                            {predefinedReasons.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ou digite um motivo personalizado"
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        />
                    </div>
                    
                    {/* Botões */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? 'Adicionando...' : 'Adicionar Saldo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
```

## 📊 Relatórios e Analytics

### Backend - Relatórios Administrativos
```python
@app.route('/api/admin/reports/users', methods=['GET'])
def generate_users_report():
    """Gerar relatório de usuários"""
    try:
        period = request.args.get('period', '30d')
        format_type = request.args.get('format', 'json')  # json, csv
        
        users = get_users()
        wallets = get_wallets()
        transactions = get_transactions()
        
        # Calcular métricas por usuário
        user_reports = []
        
        for user_id, user in users.items():
            wallet = wallets.get(user_id, {})
            user_transactions = transactions.get(user_id, [])
            
            # Calcular estatísticas
            total_deposits = sum(
                t['amount'] for t in user_transactions 
                if t['type'] == 'deposit' and t['status'] == 'completed'
            )
            
            total_withdrawals = sum(
                abs(t['amount']) for t in user_transactions 
                if t['type'] == 'withdraw' and t['status'] == 'completed'
            )
            
            total_bets = sum(
                abs(t['amount']) for t in user_transactions 
                if t['type'] == 'bet'
            )
            
            total_wins = sum(
                t['amount'] for t in user_transactions 
                if t['type'] == 'win'
            )
            
            user_reports.append({
                'user_id': user_id,
                'name': user.get('name', ''),
                'email': user.get('email', ''),
                'status': user.get('status', ''),
                'kyc_status': user.get('kyc_status', ''),
                'created_at': user.get('created_at', ''),
                'last_login': user.get('last_login', ''),
                'current_balance': wallet.get('balance', 0),
                'total_deposits': total_deposits,
                'total_withdrawals': total_withdrawals,
                'total_bets': total_bets,
                'total_wins': total_wins,
                'net_result': total_wins - total_bets,
                'transaction_count': len(user_transactions)
            })
        
        if format_type == 'csv':
            # Gerar CSV
            csv_data = generate_csv_from_data(user_reports)
            return Response(
                csv_data,
                mimetype='text/csv',
                headers={'Content-Disposition': 'attachment; filename=users_report.csv'}
            )
        
        return jsonify({
            'report': user_reports,
            'summary': {
                'total_users': len(user_reports),
                'active_users': len([u for u in user_reports if u['status'] == 'active']),
                'total_balance': sum(u['current_balance'] for u in user_reports),
                'total_deposits': sum(u['total_deposits'] for u in user_reports),
                'total_withdrawals': sum(u['total_withdrawals'] for u in user_reports)
            },
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/reports/financial', methods=['GET'])
def generate_financial_report():
    """Gerar relatório financeiro"""
    try:
        period = request.args.get('period', '30d')
        
        transactions = get_transactions()
        wallets = get_wallets()
        
        # Calcular métricas financeiras
        financial_data = {
            'deposits': {'count': 0, 'total': 0, 'fees': 0},
            'withdrawals': {'count': 0, 'total': 0, 'fees': 0},
            'bets': {'count': 0, 'total': 0},
            'wins': {'count': 0, 'total': 0},
            'admin_credits': {'count': 0, 'total': 0}
        }
        
        daily_data = {}
        
        for user_transactions in transactions.values():
            for transaction in user_transactions:
                transaction_type = transaction.get('type')
                amount = transaction.get('amount', 0)
                date = transaction.get('created_at', '')[:10]
                
                # Dados por tipo
                if transaction_type in financial_data:
                    financial_data[transaction_type]['count'] += 1
                    financial_data[transaction_type]['total'] += abs(amount)
                    
                    # Taxas
                    fee = transaction.get('metadata', {}).get('fee', 0)
                    if fee > 0:
                        financial_data[transaction_type]['fees'] += fee
                
                # Dados diários
                if date not in daily_data:
                    daily_data[date] = {
                        'deposits': 0, 'withdrawals': 0, 'bets': 0, 'wins': 0
                    }
                
                if transaction_type in daily_data[date]:
                    daily_data[date][transaction_type] += abs(amount)
        
        # Calcular métricas derivadas
        platform_revenue = (
            financial_data['deposits']['fees'] + 
            financial_data['withdrawals']['fees'] +
            (financial_data['bets']['total'] - financial_data['wins']['total']) * 0.10
        )
        
        return jsonify({
            'financial_summary': financial_data,
            'platform_revenue': platform_revenue,
            'daily_breakdown': daily_data,
            'total_platform_balance': sum(w.get('balance', 0) for w in wallets.values()),
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🔍 Sistema de Auditoria

### Backend - Logs de Auditoria
```python
@app.route('/api/admin/audit-logs', methods=['GET'])
def get_audit_logs():
    """Obter logs de auditoria"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        action_filter = request.args.get('action', 'all')
        admin_filter = request.args.get('admin', 'all')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        logs = get_admin_logs()
        
        # Aplicar filtros
        filtered_logs = []
        for log in logs:
            # Filtro por ação
            if action_filter != 'all' and log.get('action') != action_filter:
                continue
            
            # Filtro por admin
            if admin_filter != 'all' and log.get('admin_id') != admin_filter:
                continue
            
            # Filtro por data
            if date_from or date_to:
                log_date = log.get('created_at', '')[:10]
                if date_from and log_date < date_from:
                    continue
                if date_to and log_date > date_to:
                    continue
            
            filtered_logs.append(log)
        
        # Ordenar por data (mais recentes primeiro)
        filtered_logs.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Paginação
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        paginated_logs = filtered_logs[start_index:end_index]
        
        return jsonify({
            'logs': paginated_logs,
            'total': len(filtered_logs),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(filtered_logs) + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_admin_logs():
    """Obter logs administrativos"""
    try:
        logs_file = os.path.join(DATA_DIR, 'admin_logs.json')
        if os.path.exists(logs_file):
            with open(logs_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Erro ao carregar logs admin: {e}")
        return []

def save_admin_logs(logs):
    """Salvar logs administrativos"""
    try:
        logs_file = os.path.join(DATA_DIR, 'admin_logs.json')
        with open(logs_file, 'w', encoding='utf-8') as f:
            json.dump(logs, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Erro ao salvar logs admin: {e}")
```

### Frontend - Visualização de Logs
```jsx
// admin/src/pages/AuditLogsPage.jsx
const AuditLogsPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: 'all',
        admin: 'all',
        date_from: '',
        date_to: '',
        page: 1
    });
    
    useEffect(() => {
        fetchLogs();
    }, [filters]);
    
    const fetchLogs = async () => {
        try {
            const response = await adminService.getAuditLogs(filters);
            setLogs(response.logs);
        } catch (error) {
            console.error('Erro ao buscar logs:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const getActionIcon = (action) => {
        const icons = {
            'user.block': '🚫',
            'user.unblock': '✅',
            'balance.add': '💰',
            'kyc.approve': '✅',
            'admin.login': '🔑',
            'challenge.create': '🎯',
            'report.generate': '📊'
        };
        return icons[action] || '📝';
    };
    
    const getActionLabel = (action) => {
        const labels = {
            'user.block': 'Usuário Bloqueado',
            'user.unblock': 'Usuário Desbloqueado',
            'balance.add': 'Saldo Adicionado',
            'kyc.approve': 'KYC Aprovado',
            'admin.login': 'Login Admin',
            'challenge.create': 'Desafio Criado',
            'report.generate': 'Relatório Gerado'
        };
        return labels[action] || action;
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Logs de Auditoria</h1>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    🔄 Atualizar
                </button>
            </div>
            
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                        value={filters.action}
                        onChange={(e) => setFilters({...filters, action: e.target.value, page: 1})}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Todas as Ações</option>
                        <option value="user.block">Bloqueios</option>
                        <option value="balance.add">Adição de Saldo</option>
                        <option value="kyc.approve">Aprovações KYC</option>
                        <option value="admin.login">Logins Admin</option>
                    </select>
                    
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => setFilters({...filters, date_from: e.target.value, page: 1})}
                        className="border rounded-md px-3 py-2"
                        placeholder="Data inicial"
                    />
                    
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => setFilters({...filters, date_to: e.target.value, page: 1})}
                        className="border rounded-md px-3 py-2"
                        placeholder="Data final"
                    />
                    
                    <button
                        onClick={() => setFilters({
                            action: 'all', admin: 'all', date_from: '', date_to: '', page: 1
                        })}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
            
            {/* Lista de Logs */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando logs...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhum log encontrado
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-3">
                                        <div className="text-2xl">
                                            {getActionIcon(log.action)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {getActionLabel(log.action)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                Por: {log.admin_id}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right text-sm text-gray-500">
                                        {log.ip_address && (
                                            <p>IP: {log.ip_address}</p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Detalhes da ação */}
                                {log.details && Object.keys(log.details).length > 0 && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                            Detalhes:
                                        </p>
                                        <div className="text-sm text-gray-600 space-y-1">
                                            {Object.entries(log.details).map(([key, value]) => (
                                                <div key={key} className="flex justify-between">
                                                    <span className="font-medium">{key}:</span>
                                                    <span>{JSON.stringify(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Admin não consegue fazer login**
   - Verificar credenciais padrão
   - Verificar se o backend está rodando
   - Verificar logs de autenticação

2. **Ações administrativas não funcionam**
   - Verificar permissões do admin
   - Verificar token de autenticação
   - Verificar logs de erro

3. **Relatórios não carregam**
   - Verificar se há dados suficientes
   - Verificar filtros aplicados
   - Verificar logs do backend

### Debug Administrativo
```javascript
// Frontend - Debug de admin
console.log('Admin logado:', admin);
console.log('Permissões:', admin.permissions);
console.log('Token:', localStorage.getItem('admin_token'));

// Backend - Debug de ações
print(f"Ação admin: {action} por {admin_id}")
print(f"Detalhes: {details}")
```

## 📝 Checklist para Novas Funcionalidades Admin

- [ ] Definir permissões necessárias
- [ ] Implementar validações de segurança
- [ ] Criar rotas da API
- [ ] Implementar no frontend
- [ ] Adicionar logs de auditoria
- [ ] Testar com diferentes níveis de permissão
- [ ] Documentar funcionalidade
- [ ] Adicionar testes de segurança

---

**Sistema completo de documentação criado! Agora você tem guias detalhados para todas as funcionalidades do BetFit.**

