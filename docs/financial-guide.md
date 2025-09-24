# 💰 Sistema Financeiro - Guia de Desenvolvimento

## 📋 Visão Geral

O sistema financeiro do BetFit gerencia carteiras digitais, transações, depósitos, saques e todo o fluxo monetário da plataforma.

## 🏗️ Arquitetura Financeira

### Estrutura da Carteira
```json
{
  "user_id": "uuid-do-usuario",
  "balance": 1250.75,
  "available": 1200.75,
  "pending": 50.00,
  "currency": "BRL",
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00"
}
```

### Estrutura da Transação
```json
{
  "id": "uuid-da-transacao",
  "user_id": "uuid-do-usuario",
  "type": "deposit|withdraw|bet|win|admin_credit",
  "amount": 100.50,
  "description": "Depósito via PIX",
  "status": "pending|completed|failed|cancelled",
  "method": "pix|credit_card|admin",
  "created_at": "2025-01-01T00:00:00",
  "metadata": {
    "payment_id": "external_payment_id",
    "fee": 2.50,
    "net_amount": 98.00
  }
}
```

## 💳 Sistema de Carteira Digital

### Backend - Operações de Carteira
**Arquivo**: `backend/src/main.py`

```python
def create_wallet(user_id):
    """Criar carteira para novo usuário"""
    wallets = get_wallets()
    
    wallet = {
        'user_id': user_id,
        'balance': 0.00,
        'available': 0.00,
        'pending': 0.00,
        'currency': 'BRL',
        'created_at': datetime.now().isoformat(),
        'updated_at': datetime.now().isoformat()
    }
    
    wallets[user_id] = wallet
    save_wallets(wallets)
    return wallet

@app.route('/api/wallet/<user_id>/balance', methods=['GET'])
def get_wallet_balance(user_id):
    """Obter saldo da carteira"""
    try:
        wallets = get_wallets()
        
        if user_id not in wallets:
            wallet = create_wallet(user_id)
        else:
            wallet = wallets[user_id]
        
        return jsonify({
            'balance': wallet['balance'],
            'available': wallet['available'],
            'pending': wallet['pending'],
            'currency': wallet['currency']
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

def update_wallet_balance(user_id, amount, transaction_type):
    """Atualizar saldo da carteira"""
    wallets = get_wallets()
    
    if user_id not in wallets:
        wallet = create_wallet(user_id)
    else:
        wallet = wallets[user_id]
    
    # Lógica de atualização baseada no tipo
    if transaction_type in ['deposit', 'win', 'admin_credit']:
        wallet['balance'] += amount
        wallet['available'] += amount
    elif transaction_type in ['withdraw', 'bet']:
        if wallet['available'] >= amount:
            wallet['balance'] -= amount
            wallet['available'] -= amount
        else:
            raise ValueError('Saldo insuficiente')
    
    wallet['updated_at'] = datetime.now().isoformat()
    wallets[user_id] = wallet
    save_wallets(wallets)
    
    return wallet
```

### Frontend - Componente de Carteira
**Arquivo**: `frontend/src/components/wallet/WalletBalance.jsx`

```jsx
const WalletBalance = () => {
    const { user } = useAuth();
    const [balance, setBalance] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchBalance();
    }, [user]);
    
    const fetchBalance = async () => {
        try {
            const response = await walletService.getBalance(user.id);
            setBalance(response);
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) {
        return <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>;
    }
    
    return (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-blue-100 text-sm">Saldo Total</p>
                    <p className="text-3xl font-bold">
                        R$ {balance?.balance?.toFixed(2) || '0,00'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-blue-100 text-sm">Disponível</p>
                    <p className="text-xl font-semibold">
                        R$ {balance?.available?.toFixed(2) || '0,00'}
                    </p>
                </div>
            </div>
            
            {balance?.pending > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-400">
                    <p className="text-blue-100 text-sm">
                        Pendente: R$ {balance.pending.toFixed(2)}
                    </p>
                </div>
            )}
            
            <div className="mt-6 flex space-x-3">
                <button 
                    onClick={() => openDepositModal()}
                    className="bg-white text-blue-600 px-4 py-2 rounded-md font-medium hover:bg-blue-50"
                >
                    Depositar
                </button>
                <button 
                    onClick={() => openWithdrawModal()}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-400"
                >
                    Sacar
                </button>
            </div>
        </div>
    );
};
```

## 💸 Sistema de Depósitos

### Backend - Processar Depósito
```python
@app.route('/api/wallet/<user_id>/deposit', methods=['POST'])
def deposit_funds(user_id):
    """Depositar fundos na carteira"""
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        method = data.get('method', 'pix')  # pix, credit_card
        
        if amount <= 0:
            return jsonify({'error': 'Valor deve ser maior que zero'}), 400
        
        users = get_users()
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Processar pagamento baseado no método
        if method == 'pix':
            payment_result = process_pix_payment(amount, user_id)
        elif method == 'credit_card':
            payment_result = process_credit_card_payment(amount, data.get('card_data'), user_id)
        else:
            return jsonify({'error': 'Método de pagamento inválido'}), 400
        
        if payment_result['status'] == 'success':
            # Atualizar saldo
            wallet = update_wallet_balance(user_id, amount, 'deposit')
            
            # Registrar transação
            transaction = add_transaction(
                user_id, 
                'deposit', 
                amount, 
                f"Depósito via {method.upper()}",
                'completed',
                {
                    'method': method,
                    'payment_id': payment_result.get('payment_id'),
                    'fee': payment_result.get('fee', 0)
                }
            )
            
            return jsonify({
                'message': 'Depósito realizado com sucesso',
                'transaction': transaction,
                'new_balance': wallet['balance']
            }), 200
        else:
            return jsonify({
                'error': 'Falha no processamento do pagamento',
                'details': payment_result.get('error')
            }), 400
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

def process_pix_payment(amount, user_id):
    """Processar pagamento PIX"""
    try:
        # Integração com API do PIX (simulada)
        pix_data = {
            'amount': amount,
            'user_id': user_id,
            'description': f'Depósito BetFit - Usuário {user_id}',
            'expiration': (datetime.now() + timedelta(minutes=30)).isoformat()
        }
        
        # Simular resposta da API PIX
        payment_id = f'pix_{secrets.token_hex(8)}'
        qr_code = f'00020126580014br.gov.bcb.pix0136{payment_id}520400005303986540{amount:.2f}5802BR5913BetFit6009SAO PAULO62070503***6304'
        
        return {
            'status': 'success',
            'payment_id': payment_id,
            'qr_code': qr_code,
            'qr_code_image': f'data:image/png;base64,{generate_qr_code_base64(qr_code)}',
            'fee': 0  # PIX sem taxa
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }

def process_credit_card_payment(amount, card_data, user_id):
    """Processar pagamento com cartão de crédito"""
    try:
        # Integração com Stripe (simulada)
        stripe_data = {
            'amount': int(amount * 100),  # Stripe usa centavos
            'currency': 'brl',
            'card': card_data,
            'description': f'Depósito BetFit - Usuário {user_id}'
        }
        
        # Simular resposta do Stripe
        payment_id = f'stripe_{secrets.token_hex(8)}'
        fee = amount * 0.039 + 0.39  # Taxa Stripe: 3.9% + R$ 0,39
        
        return {
            'status': 'success',
            'payment_id': payment_id,
            'fee': fee
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }
```

### Frontend - Modal de Depósito
```jsx
// frontend/src/components/wallet/DepositModal.jsx
const DepositModal = ({ isOpen, onClose }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('pix');
    const [loading, setLoading] = useState(false);
    const [paymentData, setPaymentData] = useState(null);
    
    const predefinedAmounts = [25, 50, 100, 200, 500];
    
    const handleDeposit = async () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Valor inválido');
            return;
        }
        
        setLoading(true);
        try {
            const response = await walletService.deposit({
                amount: parseFloat(amount),
                method: method
            });
            
            if (method === 'pix') {
                setPaymentData(response);
            } else {
                toast.success('Depósito realizado com sucesso!');
                onClose();
            }
        } catch (error) {
            toast.error('Erro ao processar depósito');
        } finally {
            setLoading(false);
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Depositar Fundos</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>
                
                {!paymentData ? (
                    <>
                        {/* Seleção de Método */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Método de Pagamento
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMethod('pix')}
                                    className={`p-3 border rounded-lg flex items-center justify-center ${
                                        method === 'pix' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl mr-2">📱</span>
                                    PIX
                                </button>
                                <button
                                    onClick={() => setMethod('credit_card')}
                                    className={`p-3 border rounded-lg flex items-center justify-center ${
                                        method === 'credit_card' 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-300'
                                    }`}
                                >
                                    <span className="text-2xl mr-2">💳</span>
                                    Cartão
                                </button>
                            </div>
                        </div>
                        
                        {/* Valores Pré-definidos */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Valores Rápidos
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {predefinedAmounts.map(value => (
                                    <button
                                        key={value}
                                        onClick={() => setAmount(value.toString())}
                                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                    >
                                        R$ {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Valor Customizado */}
                        <div className="mb-6">
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
                                    min="1"
                                    step="0.01"
                                />
                            </div>
                        </div>
                        
                        {/* Botões */}
                        <div className="flex space-x-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeposit}
                                disabled={loading || !amount}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? 'Processando...' : 'Depositar'}
                            </button>
                        </div>
                    </>
                ) : (
                    <PixPaymentView 
                        paymentData={paymentData} 
                        onSuccess={() => {
                            toast.success('Depósito realizado com sucesso!');
                            onClose();
                        }}
                    />
                )}
            </div>
        </div>
    );
};
```

## 💰 Sistema de Saques

### Backend - Processar Saque
```python
@app.route('/api/wallet/<user_id>/withdraw', methods=['POST'])
def withdraw_funds(user_id):
    """Sacar fundos da carteira"""
    try:
        data = request.get_json()
        amount = float(data.get('amount', 0))
        method = data.get('method', 'pix')
        account_data = data.get('account_data', {})
        
        if amount <= 0:
            return jsonify({'error': 'Valor deve ser maior que zero'}), 400
        
        users = get_users()
        wallets = get_wallets()
        
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        wallet = wallets.get(user_id, {})
        if wallet.get('available', 0) < amount:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        # Verificar KYC
        user = users[user_id]
        if user.get('kyc_status') != 'verified':
            return jsonify({'error': 'KYC não verificado. Complete a verificação de identidade.'}), 400
        
        # Calcular taxa de saque
        withdrawal_fee = calculate_withdrawal_fee(amount, method)
        net_amount = amount - withdrawal_fee
        
        # Processar saque
        withdrawal_result = process_withdrawal(amount, method, account_data, user_id)
        
        if withdrawal_result['status'] == 'success':
            # Atualizar saldo
            wallet = update_wallet_balance(user_id, amount, 'withdraw')
            
            # Registrar transação
            transaction = add_transaction(
                user_id, 
                'withdraw', 
                -amount,  # Valor negativo para saque
                f"Saque via {method.upper()}",
                'pending',  # Saques ficam pendentes para aprovação
                {
                    'method': method,
                    'account_data': account_data,
                    'fee': withdrawal_fee,
                    'net_amount': net_amount,
                    'withdrawal_id': withdrawal_result.get('withdrawal_id')
                }
            )
            
            return jsonify({
                'message': 'Saque solicitado com sucesso',
                'transaction': transaction,
                'fee': withdrawal_fee,
                'net_amount': net_amount,
                'estimated_time': '1-2 dias úteis'
            }), 200
        else:
            return jsonify({
                'error': 'Falha ao processar saque',
                'details': withdrawal_result.get('error')
            }), 400
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

def calculate_withdrawal_fee(amount, method):
    """Calcular taxa de saque"""
    if method == 'pix':
        # PIX: R$ 2,00 fixo
        return 2.00
    elif method == 'bank_transfer':
        # TED: R$ 8,00 fixo
        return 8.00
    else:
        return 0.00

def process_withdrawal(amount, method, account_data, user_id):
    """Processar solicitação de saque"""
    try:
        withdrawal_id = f'withdraw_{secrets.token_hex(8)}'
        
        # Validar dados da conta
        if method == 'pix':
            if not account_data.get('pix_key'):
                raise ValueError('Chave PIX é obrigatória')
        elif method == 'bank_transfer':
            required_fields = ['bank_code', 'agency', 'account', 'account_type']
            for field in required_fields:
                if not account_data.get(field):
                    raise ValueError(f'Campo {field} é obrigatório')
        
        # Simular processamento
        return {
            'status': 'success',
            'withdrawal_id': withdrawal_id
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'error': str(e)
        }
```

## 📊 Histórico de Transações

### Backend - Listar Transações
```python
@app.route('/api/wallet/<user_id>/transactions', methods=['GET'])
def get_wallet_transactions(user_id):
    """Obter transações da carteira"""
    try:
        # Parâmetros de filtro
        transaction_type = request.args.get('type', 'all')
        status = request.args.get('status', 'all')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        transactions = get_transactions()
        user_transactions = transactions.get(user_id, [])
        
        # Aplicar filtros
        filtered_transactions = []
        for transaction in user_transactions:
            # Filtro por tipo
            if transaction_type != 'all' and transaction.get('type') != transaction_type:
                continue
            
            # Filtro por status
            if status != 'all' and transaction.get('status') != status:
                continue
            
            # Filtro por data
            if date_from or date_to:
                created_date = transaction.get('created_at', '')[:10]
                if date_from and created_date < date_from:
                    continue
                if date_to and created_date > date_to:
                    continue
            
            filtered_transactions.append(transaction)
        
        # Ordenar por data (mais recentes primeiro)
        filtered_transactions.sort(key=lambda x: x['created_at'], reverse=True)
        
        # Paginação
        start_index = (page - 1) * per_page
        end_index = start_index + per_page
        paginated_transactions = filtered_transactions[start_index:end_index]
        
        return jsonify({
            'transactions': paginated_transactions,
            'total': len(filtered_transactions),
            'page': page,
            'per_page': per_page,
            'total_pages': (len(filtered_transactions) + per_page - 1) // per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500
```

### Frontend - Lista de Transações
```jsx
// frontend/src/components/wallet/TransactionHistory.jsx
const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        type: 'all',
        status: 'all',
        page: 1
    });
    
    useEffect(() => {
        fetchTransactions();
    }, [filters]);
    
    const fetchTransactions = async () => {
        try {
            const response = await walletService.getTransactions(filters);
            setTransactions(response.transactions);
        } catch (error) {
            console.error('Erro ao buscar transações:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const getTransactionIcon = (type) => {
        const icons = {
            deposit: '💰',
            withdraw: '💸',
            bet: '🎯',
            win: '🏆',
            admin_credit: '⚡'
        };
        return icons[type] || '📄';
    };
    
    const getTransactionColor = (type, amount) => {
        if (amount > 0) return 'text-green-600';
        if (amount < 0) return 'text-red-600';
        return 'text-gray-600';
    };
    
    const getStatusBadge = (status) => {
        const badges = {
            completed: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800'
        };
        
        const labels = {
            completed: 'Concluído',
            pending: 'Pendente',
            failed: 'Falhou',
            cancelled: 'Cancelado'
        };
        
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${badges[status]}`}>
                {labels[status]}
            </span>
        );
    };
    
    return (
        <div className="space-y-4">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({...filters, type: e.target.value, page: 1})}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="deposit">Depósitos</option>
                        <option value="withdraw">Saques</option>
                        <option value="bet">Apostas</option>
                        <option value="win">Prêmios</option>
                    </select>
                    
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="completed">Concluído</option>
                        <option value="pending">Pendente</option>
                        <option value="failed">Falhou</option>
                    </select>
                    
                    <button
                        onClick={() => setFilters({type: 'all', status: 'all', page: 1})}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
            
            {/* Lista de Transações */}
            <div className="bg-white rounded-lg shadow">
                {loading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Carregando transações...</p>
                    </div>
                ) : transactions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        Nenhuma transação encontrada
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {transactions.map((transaction) => (
                            <div key={transaction.id} className="p-4 hover:bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="text-2xl">
                                            {getTransactionIcon(transaction.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {transaction.description}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(transaction.created_at).toLocaleString('pt-BR')}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="text-right">
                                        <p className={`font-semibold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                                            {transaction.amount > 0 ? '+' : ''}R$ {Math.abs(transaction.amount).toFixed(2)}
                                        </p>
                                        {getStatusBadge(transaction.status)}
                                    </div>
                                </div>
                                
                                {transaction.metadata?.fee && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        Taxa: R$ {transaction.metadata.fee.toFixed(2)}
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

## 🎯 Sistema de Apostas

### Lógica de Apostas
```python
@app.route('/api/challenges/<challenge_id>/bet', methods=['POST'])
def place_bet(challenge_id):
    """Fazer aposta em um desafio"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        bet_amount = float(data.get('amount', 0))
        
        if bet_amount <= 0:
            return jsonify({'error': 'Valor da aposta deve ser maior que zero'}), 400
        
        # Verificar saldo
        wallets = get_wallets()
        wallet = wallets.get(user_id, {})
        
        if wallet.get('available', 0) < bet_amount:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        # Debitar da carteira
        wallet = update_wallet_balance(user_id, bet_amount, 'bet')
        
        # Registrar transação
        transaction = add_transaction(
            user_id,
            'bet',
            -bet_amount,
            f'Aposta no desafio {challenge_id}',
            'completed',
            {
                'challenge_id': challenge_id,
                'bet_type': 'participation'
            }
        )
        
        # Adicionar à pool do desafio
        add_to_challenge_pool(challenge_id, user_id, bet_amount)
        
        return jsonify({
            'message': 'Aposta realizada com sucesso',
            'transaction': transaction,
            'new_balance': wallet['balance']
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def distribute_winnings(challenge_id, winners):
    """Distribuir prêmios aos vencedores"""
    try:
        # Obter pool total do desafio
        pool_total = get_challenge_pool_total(challenge_id)
        platform_fee = pool_total * 0.10  # 10% para a plataforma
        prize_pool = pool_total - platform_fee
        
        # Distribuição de prêmios (exemplo: 50%, 30%, 20%)
        prize_distribution = [0.50, 0.30, 0.20]
        
        for i, winner in enumerate(winners[:3]):
            if i < len(prize_distribution):
                prize_amount = prize_pool * prize_distribution[i]
                
                # Creditar na carteira
                update_wallet_balance(winner['user_id'], prize_amount, 'win')
                
                # Registrar transação
                add_transaction(
                    winner['user_id'],
                    'win',
                    prize_amount,
                    f'Prêmio do desafio {challenge_id} - {i+1}º lugar',
                    'completed',
                    {
                        'challenge_id': challenge_id,
                        'position': i + 1,
                        'total_pool': pool_total,
                        'prize_percentage': prize_distribution[i]
                    }
                )
        
        return True
        
    except Exception as e:
        print(f"Erro ao distribuir prêmios: {e}")
        return False
```

## 📈 Relatórios Financeiros

### Dashboard Financeiro Admin
```python
@app.route('/api/admin/financial/summary', methods=['GET'])
def get_financial_summary():
    """Obter resumo financeiro para admin"""
    try:
        period = request.args.get('period', '30d')  # 7d, 30d, 90d
        
        transactions = get_transactions()
        wallets = get_wallets()
        
        # Calcular métricas
        total_deposits = 0
        total_withdrawals = 0
        total_bets = 0
        total_winnings = 0
        platform_revenue = 0
        
        for user_transactions in transactions.values():
            for transaction in user_transactions:
                amount = transaction.get('amount', 0)
                transaction_type = transaction.get('type')
                
                if transaction_type == 'deposit':
                    total_deposits += amount
                elif transaction_type == 'withdraw':
                    total_withdrawals += abs(amount)
                elif transaction_type == 'bet':
                    total_bets += abs(amount)
                elif transaction_type == 'win':
                    total_winnings += amount
                
                # Calcular receita da plataforma (taxas)
                if transaction.get('metadata', {}).get('fee'):
                    platform_revenue += transaction['metadata']['fee']
        
        # Saldo total da plataforma
        total_balance = sum(w.get('balance', 0) for w in wallets.values())
        
        return jsonify({
            'summary': {
                'total_deposits': total_deposits,
                'total_withdrawals': total_withdrawals,
                'total_bets': total_bets,
                'total_winnings': total_winnings,
                'platform_revenue': platform_revenue,
                'total_balance': total_balance,
                'net_flow': total_deposits - total_withdrawals,
                'period': period
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Saldo não atualiza**
   - Verificar se transação foi salva corretamente
   - Verificar logs do backend
   - Verificar integridade dos arquivos JSON

2. **Erro ao processar pagamento**
   - Verificar configurações da API de pagamento
   - Verificar conectividade com serviços externos
   - Verificar logs de erro

3. **Transações duplicadas**
   - Implementar idempotência nas APIs
   - Verificar se IDs de transação são únicos
   - Adicionar validações de duplicação

### Debug Financeiro
```python
# Verificar integridade financeira
def audit_financial_integrity():
    users = get_users()
    wallets = get_wallets()
    transactions = get_transactions()
    
    for user_id in users.keys():
        wallet_balance = wallets.get(user_id, {}).get('balance', 0)
        
        # Calcular saldo baseado em transações
        calculated_balance = 0
        user_transactions = transactions.get(user_id, [])
        
        for transaction in user_transactions:
            if transaction.get('status') == 'completed':
                calculated_balance += transaction.get('amount', 0)
        
        # Verificar discrepância
        if abs(wallet_balance - calculated_balance) > 0.01:
            print(f"Discrepância encontrada para usuário {user_id}")
            print(f"Saldo na carteira: {wallet_balance}")
            print(f"Saldo calculado: {calculated_balance}")
```

## 📝 Checklist para Novas Funcionalidades

- [ ] Definir estrutura de dados
- [ ] Implementar validações financeiras
- [ ] Criar rotas da API
- [ ] Implementar no frontend
- [ ] Adicionar logs de auditoria
- [ ] Testar com valores reais
- [ ] Documentar funcionalidade
- [ ] Implementar testes de integridade

---

**Próximos passos**: Consulte o [Guia de Desafios](./challenges-guide.md) para implementar funcionalidades relacionadas a desafios e apostas.

