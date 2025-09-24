# 👥 Gestão de Usuários - Guia de Desenvolvimento

## 📋 Visão Geral

O sistema de gestão de usuários do BetFit permite registro, autenticação, perfis e administração completa de contas de usuários.

## 🏗️ Arquitetura de Usuários

### Estrutura do Usuário
```json
{
  "id": "uuid-gerado",
  "name": "Nome Completo",
  "email": "email@exemplo.com",
  "phone": "(11) 99999-9999",
  "password": "hash_da_senha",
  "status": "active|blocked",
  "kyc_status": "pending|verified|rejected",
  "created_at": "2025-01-01T00:00:00",
  "updated_at": "2025-01-01T00:00:00",
  "last_login": "2025-01-01T00:00:00",
  "total_bets": 0,
  "total_wins": 0,
  "total_deposited": 0.00,
  "total_withdrawn": 0.00,
  "profile": {
    "avatar": "url_da_foto",
    "birth_date": "1990-01-01",
    "gender": "M|F|O",
    "city": "São Paulo",
    "state": "SP"
  }
}
```

## 🔐 Sistema de Autenticação

### Backend - Registro de Usuário
**Arquivo**: `backend/src/main.py`

```python
@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['name', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        users = get_users()
        
        # Verificar se email já existe
        for user in users.values():
            if user.get('email') == data['email']:
                return jsonify({'error': 'Email já cadastrado'}), 400
        
        # Criar novo usuário
        user_id = generate_user_id()
        user = {
            'id': user_id,
            'name': data['name'],
            'email': data['email'],
            'phone': data.get('phone', ''),
            'password': hash_password(data['password']),
            'status': 'active',
            'kyc_status': 'pending',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'last_login': None,
            'total_bets': 0,
            'total_wins': 0,
            'total_deposited': 0.00,
            'total_withdrawn': 0.00
        }
        
        users[user_id] = user
        save_users(users)
        
        # Criar carteira para o usuário
        wallet = create_wallet(user_id)
        
        # Gerar token de acesso
        access_token = generate_token()
        
        return jsonify({
            'message': 'Usuário registrado com sucesso',
            'user': {k: v for k, v in user.items() if k != 'password'},
            'wallet': wallet,
            'access_token': access_token
        }), 201
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500
```

### Frontend - Formulário de Registro
**Arquivo**: `frontend/src/components/auth/RegisterForm.jsx`

```jsx
const RegisterForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }
        
        if (!formData.password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
        }
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Senhas não coincidem';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setLoading(true);
        try {
            const response = await authService.register(formData);
            // Redirecionar para dashboard ou login
            navigate('/dashboard');
        } catch (error) {
            setErrors({ submit: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Nome Completo
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
                {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Telefone (opcional)
                </label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Senha
                </label>
                <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
                {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Confirmar Senha
                </label>
                <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                />
                {errors.confirmPassword && <p className="text-red-500 text-sm">{errors.confirmPassword}</p>}
            </div>
            
            {errors.submit && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {errors.submit}
                </div>
            )}
            
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'Registrando...' : 'Registrar'}
            </button>
        </form>
    );
};
```

## 👤 Perfil do Usuário

### Backend - Atualizar Perfil
```python
@app.route('/api/users/<user_id>/profile', methods=['PUT'])
def update_profile(user_id):
    try:
        data = request.get_json()
        users = get_users()
        
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user = users[user_id]
        
        # Atualizar campos permitidos
        allowed_fields = ['name', 'phone', 'profile']
        for field in allowed_fields:
            if field in data:
                user[field] = data[field]
        
        user['updated_at'] = datetime.now().isoformat()
        
        users[user_id] = user
        save_users(users)
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': {k: v for k, v in user.items() if k != 'password'}
        })
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500
```

### Frontend - Componente de Perfil
```jsx
// frontend/src/components/profile/ProfileForm.jsx
const ProfileForm = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        birth_date: user?.profile?.birth_date || '',
        gender: user?.profile?.gender || '',
        city: user?.profile?.city || '',
        state: user?.profile?.state || ''
    });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const response = await userService.updateProfile(user.id, {
                name: profile.name,
                phone: profile.phone,
                profile: {
                    birth_date: profile.birth_date,
                    gender: profile.gender,
                    city: profile.city,
                    state: profile.state
                }
            });
            
            updateUser(response.user);
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            toast.error('Erro ao atualizar perfil');
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Nome Completo
                    </label>
                    <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Telefone
                    </label>
                    <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Data de Nascimento
                    </label>
                    <input
                        type="date"
                        value={profile.birth_date}
                        onChange={(e) => setProfile({...profile, birth_date: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700">
                        Gênero
                    </label>
                    <select
                        value={profile.gender}
                        onChange={(e) => setProfile({...profile, gender: e.target.value})}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                        <option value="">Selecione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="O">Outro</option>
                    </select>
                </div>
            </div>
            
            <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
                Salvar Alterações
            </button>
        </form>
    );
};
```

## 🛡️ Gestão Administrativa

### Lista de Usuários no Admin
**Arquivo**: `admin/src/pages/UsersPage.jsx`

```jsx
const UsersPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: 'all',
        kyc: 'all',
        search: ''
    });
    
    useEffect(() => {
        fetchUsers();
    }, [filters]);
    
    const fetchUsers = async () => {
        try {
            const response = await adminService.getUsers(filters);
            setUsers(response.users);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleBlockUser = async (userId) => {
        try {
            await adminService.blockUser(userId);
            fetchUsers(); // Recarregar lista
            toast.success('Usuário bloqueado com sucesso');
        } catch (error) {
            toast.error('Erro ao bloquear usuário');
        }
    };
    
    const handleAddBalance = async (userId, amount) => {
        try {
            await adminService.addBalance(userId, amount);
            fetchUsers(); // Recarregar lista
            toast.success(`R$ ${amount} adicionado com sucesso`);
        } catch (error) {
            toast.error('Erro ao adicionar saldo');
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
                    Exportar Lista
                </button>
            </div>
            
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                        className="border rounded-md px-3 py-2"
                    />
                    
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="active">Ativos</option>
                        <option value="blocked">Bloqueados</option>
                    </select>
                    
                    <select
                        value={filters.kyc}
                        onChange={(e) => setFilters({...filters, kyc: e.target.value})}
                        className="border rounded-md px-3 py-2"
                    >
                        <option value="all">Todos os KYC</option>
                        <option value="pending">Pendente</option>
                        <option value="verified">Verificado</option>
                        <option value="rejected">Rejeitado</option>
                    </select>
                    
                    <button
                        onClick={() => setFilters({status: 'all', kyc: 'all', search: ''})}
                        className="bg-gray-500 text-white px-4 py-2 rounded-md"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>
            
            {/* Tabela de Usuários */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Usuário
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                KYC
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Saldo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {user.name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {user.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        user.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        user.kyc_status === 'verified' 
                                            ? 'bg-green-100 text-green-800' 
                                            : user.kyc_status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.kyc_status === 'verified' ? 'Verificado' : 
                                         user.kyc_status === 'pending' ? 'Pendente' : 'Rejeitado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    R$ {user.balance?.toFixed(2) || '0,00'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <UserActionsMenu 
                                        user={user}
                                        onBlock={() => handleBlockUser(user.id)}
                                        onAddBalance={(amount) => handleAddBalance(user.id, amount)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
```

## 🔍 Sistema de Busca e Filtros

### Backend - Busca Avançada
```python
@app.route('/api/admin/users/search', methods=['GET'])
def search_users():
    try:
        # Parâmetros de busca
        search_term = request.args.get('q', '').lower()
        status_filter = request.args.get('status', 'all')
        kyc_filter = request.args.get('kyc', 'all')
        date_from = request.args.get('date_from')
        date_to = request.args.get('date_to')
        
        users = get_users()
        wallets = get_wallets()
        
        filtered_users = []
        
        for user_id, user in users.items():
            # Filtro de busca por texto
            if search_term:
                if (search_term not in user.get('name', '').lower() and 
                    search_term not in user.get('email', '').lower()):
                    continue
            
            # Filtro de status
            if status_filter != 'all' and user.get('status') != status_filter:
                continue
            
            # Filtro de KYC
            if kyc_filter != 'all' and user.get('kyc_status') != kyc_filter:
                continue
            
            # Filtro de data
            if date_from or date_to:
                created_date = user.get('created_at', '')[:10]
                if date_from and created_date < date_from:
                    continue
                if date_to and created_date > date_to:
                    continue
            
            # Adicionar dados da carteira
            wallet = wallets.get(user_id, {'balance': 0.00})
            user_data = user.copy()
            user_data['balance'] = wallet.get('balance', 0.00)
            
            filtered_users.append(user_data)
        
        return jsonify({
            'users': filtered_users,
            'total': len(filtered_users)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🔒 Sistema KYC (Know Your Customer)

### Verificação de Documentos
```python
@app.route('/api/users/<user_id>/kyc', methods=['POST'])
def submit_kyc(user_id):
    try:
        data = request.get_json()
        users = get_users()
        
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user = users[user_id]
        
        # Salvar dados do KYC
        kyc_data = {
            'document_type': data.get('document_type'),
            'document_number': data.get('document_number'),
            'document_front': data.get('document_front'),  # Base64 da foto
            'document_back': data.get('document_back'),
            'selfie': data.get('selfie'),
            'submitted_at': datetime.now().isoformat(),
            'status': 'pending'
        }
        
        user['kyc'] = kyc_data
        user['kyc_status'] = 'pending'
        user['updated_at'] = datetime.now().isoformat()
        
        users[user_id] = user
        save_users(users)
        
        return jsonify({
            'message': 'Documentos enviados para verificação',
            'kyc_status': 'pending'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/kyc/approve', methods=['POST'])
def approve_kyc(user_id):
    try:
        users = get_users()
        
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        user = users[user_id]
        user['kyc_status'] = 'verified'
        user['kyc']['status'] = 'verified'
        user['kyc']['verified_at'] = datetime.now().isoformat()
        user['updated_at'] = datetime.now().isoformat()
        
        users[user_id] = user
        save_users(users)
        
        return jsonify({
            'message': 'KYC aprovado com sucesso',
            'kyc_status': 'verified'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 📊 Relatórios de Usuários

### Exportar Lista de Usuários
```python
@app.route('/api/admin/users/export', methods=['GET'])
def export_users():
    try:
        users = get_users()
        wallets = get_wallets()
        
        # Preparar dados para exportação
        export_data = []
        for user_id, user in users.items():
            wallet = wallets.get(user_id, {'balance': 0.00})
            
            export_data.append({
                'ID': user_id,
                'Nome': user.get('name', ''),
                'Email': user.get('email', ''),
                'Telefone': user.get('phone', ''),
                'Status': user.get('status', ''),
                'KYC': user.get('kyc_status', ''),
                'Saldo': wallet.get('balance', 0.00),
                'Total Apostas': user.get('total_bets', 0),
                'Total Vitórias': user.get('total_wins', 0),
                'Data Cadastro': user.get('created_at', ''),
                'Último Login': user.get('last_login', '')
            })
        
        return jsonify({
            'data': export_data,
            'total': len(export_data),
            'exported_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Usuário não consegue fazer login**
   - Verificar se email/senha estão corretos
   - Verificar se usuário não está bloqueado
   - Verificar logs de autenticação

2. **Erro ao registrar usuário**
   - Verificar se email já existe
   - Verificar validação de campos
   - Verificar permissões do banco de dados

3. **Perfil não atualiza**
   - Verificar se token de autenticação é válido
   - Verificar se campos são permitidos para atualização
   - Verificar logs do backend

### Debug
```javascript
// Frontend - Debug de autenticação
console.log('Token atual:', localStorage.getItem('auth_token'));
console.log('Usuário logado:', user);

// Backend - Debug de usuários
print(f"Total de usuários: {len(users)}")
print(f"Usuário encontrado: {user_id in users}")
```

## 📝 Checklist para Novas Funcionalidades

- [ ] Definir estrutura de dados
- [ ] Implementar validações
- [ ] Criar rotas da API
- [ ] Implementar no frontend
- [ ] Adicionar testes
- [ ] Documentar funcionalidade
- [ ] Testar com dados reais

---

**Próximos passos**: Consulte o [Guia Financeiro](./financial-guide.md) para implementar funcionalidades relacionadas a pagamentos e carteira digital.

