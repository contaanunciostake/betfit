# 🎮 Desafios e Apostas - Guia de Desenvolvimento

## 📋 Visão Geral

O sistema de desafios é o coração do BetFit, permitindo que usuários participem de atividades físicas e apostem em seus próprios resultados.

## 🏗️ Arquitetura de Desafios

### Estrutura do Desafio
```json
{
  "id": "challenge_001",
  "title": "Corrida Matinal 5K",
  "description": "Complete uma corrida de 5km em até 30 minutos",
  "type": "running",
  "category": "endurance",
  "difficulty": "medium",
  "requirements": {
    "distance": 5.0,
    "max_time": 1800,
    "min_pace": 6.0
  },
  "rewards": {
    "base_reward": 50.00,
    "bonus_multiplier": 1.5,
    "pool_percentage": 0.90
  },
  "schedule": {
    "start_date": "2025-01-01T06:00:00",
    "end_date": "2025-01-01T10:00:00",
    "timezone": "America/Sao_Paulo"
  },
  "status": "active",
  "participants": [],
  "pool_total": 0.00,
  "created_at": "2025-01-01T00:00:00"
}
```

### Estrutura da Participação
```json
{
  "user_id": "uuid-do-usuario",
  "challenge_id": "challenge_001",
  "bet_amount": 25.00,
  "joined_at": "2025-01-01T07:00:00",
  "activity": {
    "start_time": "2025-01-01T07:30:00",
    "end_time": "2025-01-01T08:00:00",
    "distance": 5.2,
    "duration": 1680,
    "pace": 5.38,
    "calories": 420,
    "verified": true
  },
  "result": {
    "completed": true,
    "position": 1,
    "score": 95.5,
    "prize_amount": 75.00
  }
}
```

## 🎯 Sistema de Desafios

### Backend - Listar Desafios
**Arquivo**: `backend/src/main.py`

```python
@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    """Obter lista de desafios disponíveis"""
    try:
        # Desafios pré-definidos (em produção, viria do banco)
        challenges = [
            {
                'id': 'challenge_001',
                'title': 'Corrida Matinal 5K',
                'description': 'Complete uma corrida de 5km e ganhe prêmios baseados na sua performance',
                'type': 'running',
                'category': 'endurance',
                'difficulty': 'medium',
                'requirements': {
                    'distance': 5.0,
                    'max_time': 1800,  # 30 minutos
                    'unit': 'km'
                },
                'rewards': {
                    'entry_fee': 25.00,
                    'prize_pool': 'Dinâmico baseado em participantes',
                    'bonus_multiplier': 1.5
                },
                'schedule': {
                    'start_time': '06:00',
                    'end_time': '10:00',
                    'days': ['monday', 'wednesday', 'friday']
                },
                'status': 'active',
                'participants_count': 0,
                'current_pool': 0.00,
                'icon': '🏃‍♂️',
                'color': '#3B82F6'
            },
            {
                'id': 'challenge_002',
                'title': 'Caminhada dos 10K Passos',
                'description': 'Atinja 10.000 passos durante o dia e concorra a prêmios',
                'type': 'walking',
                'category': 'daily',
                'difficulty': 'easy',
                'requirements': {
                    'steps': 10000,
                    'time_limit': 86400,  # 24 horas
                    'unit': 'steps'
                },
                'rewards': {
                    'entry_fee': 15.00,
                    'prize_pool': 'Dinâmico baseado em participantes',
                    'bonus_multiplier': 1.2
                },
                'schedule': {
                    'start_time': '00:00',
                    'end_time': '23:59',
                    'days': ['daily']
                },
                'status': 'active',
                'participants_count': 0,
                'current_pool': 0.00,
                'icon': '🚶‍♀️',
                'color': '#10B981'
            },
            {
                'id': 'challenge_003',
                'title': 'Pedalada Urbana 15K',
                'description': 'Percorra 15km de bicicleta pela cidade',
                'type': 'cycling',
                'category': 'endurance',
                'difficulty': 'medium',
                'requirements': {
                    'distance': 15.0,
                    'max_time': 3600,  # 1 hora
                    'unit': 'km'
                },
                'rewards': {
                    'entry_fee': 30.00,
                    'prize_pool': 'Dinâmico baseado em participantes',
                    'bonus_multiplier': 1.8
                },
                'schedule': {
                    'start_time': '07:00',
                    'end_time': '18:00',
                    'days': ['saturday', 'sunday']
                },
                'status': 'active',
                'participants_count': 0,
                'current_pool': 0.00,
                'icon': '🚴‍♂️',
                'color': '#F59E0B'
            },
            {
                'id': 'challenge_004',
                'title': 'Natação 1000m',
                'description': 'Nade 1000 metros no menor tempo possível',
                'type': 'swimming',
                'category': 'speed',
                'difficulty': 'hard',
                'requirements': {
                    'distance': 1.0,
                    'max_time': 1200,  # 20 minutos
                    'unit': 'km'
                },
                'rewards': {
                    'entry_fee': 40.00,
                    'prize_pool': 'Dinâmico baseado em participantes',
                    'bonus_multiplier': 2.0
                },
                'schedule': {
                    'start_time': '06:00',
                    'end_time': '22:00',
                    'days': ['tuesday', 'thursday', 'saturday']
                },
                'status': 'active',
                'participants_count': 0,
                'current_pool': 0.00,
                'icon': '🏊‍♀️',
                'color': '#06B6D4'
            },
            {
                'id': 'challenge_005',
                'title': 'HIIT Intenso 30min',
                'description': 'Complete um treino HIIT de alta intensidade',
                'type': 'hiit',
                'category': 'strength',
                'difficulty': 'hard',
                'requirements': {
                    'duration': 1800,  # 30 minutos
                    'min_intensity': 80,
                    'unit': 'minutes'
                },
                'rewards': {
                    'entry_fee': 35.00,
                    'prize_pool': 'Dinâmico baseado em participantes',
                    'bonus_multiplier': 1.7
                },
                'schedule': {
                    'start_time': '06:00',
                    'end_time': '21:00',
                    'days': ['monday', 'wednesday', 'friday']
                },
                'status': 'active',
                'participants_count': 0,
                'current_pool': 0.00,
                'icon': '💪',
                'color': '#EF4444'
            },
            {
                'id': 'challenge_006',
                'title': 'Yoga Zen 45min',
                'description': 'Pratique yoga por 45 minutos com foco em mindfulness',
                'type': 'yoga',
                'category': 'wellness',
                'difficulty': 'easy',
                'requirements': {
                    'duration': 2700,  # 45 minutos
                    'min_poses': 20,
                    'unit': 'minutes'
                },
                'rewards': {
                    'entry_fee': 20.00,
                    'prize_pool': 'Dinâmico baseado em participantes',
                    'bonus_multiplier': 1.3
                },
                'schedule': {
                    'start_time': '06:00',
                    'end_time': '20:00',
                    'days': ['daily']
                },
                'status': 'active',
                'participants_count': 0,
                'current_pool': 0.00,
                'icon': '🧘‍♀️',
                'color': '#8B5CF6'
            }
        ]
        
        # Calcular pools dinâmicos (simulado)
        for challenge in challenges:
            # Simular participantes e pool baseado no tipo de desafio
            base_participants = {
                'running': 15,
                'walking': 25,
                'cycling': 12,
                'swimming': 8,
                'hiit': 10,
                'yoga': 18
            }
            
            participants = base_participants.get(challenge['type'], 10)
            challenge['participants_count'] = participants
            challenge['current_pool'] = participants * challenge['rewards']['entry_fee']
        
        return jsonify({
            'challenges': challenges,
            'total': len(challenges)
        }), 200
        
    except Exception as e:
        print(f"Erro ao obter desafios: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/challenges/<challenge_id>', methods=['GET'])
def get_challenge_details(challenge_id):
    """Obter detalhes de um desafio específico"""
    try:
        challenges = get_challenges().get_json()['challenges']
        challenge = next((c for c in challenges if c['id'] == challenge_id), None)
        
        if not challenge:
            return jsonify({'error': 'Desafio não encontrado'}), 404
        
        # Adicionar informações detalhadas
        challenge['leaderboard'] = get_challenge_leaderboard(challenge_id)
        challenge['recent_activities'] = get_recent_activities(challenge_id)
        challenge['statistics'] = calculate_challenge_statistics(challenge_id)
        
        return jsonify(challenge), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Frontend - Lista de Desafios
**Arquivo**: `frontend/src/components/challenges/ChallengeList.jsx`

```jsx
const ChallengeList = () => {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDifficulty, setSelectedDifficulty] = useState('all');
    
    useEffect(() => {
        fetchChallenges();
    }, []);
    
    const fetchChallenges = async () => {
        try {
            const response = await challengeService.getChallenges();
            setChallenges(response.challenges);
        } catch (error) {
            console.error('Erro ao buscar desafios:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const filteredChallenges = challenges.filter(challenge => {
        if (selectedCategory !== 'all' && challenge.category !== selectedCategory) {
            return false;
        }
        if (selectedDifficulty !== 'all' && challenge.difficulty !== selectedDifficulty) {
            return false;
        }
        return true;
    });
    
    const getDifficultyColor = (difficulty) => {
        const colors = {
            easy: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            hard: 'bg-red-100 text-red-800'
        };
        return colors[difficulty] || 'bg-gray-100 text-gray-800';
    };
    
    const getDifficultyLabel = (difficulty) => {
        const labels = {
            easy: 'Fácil',
            medium: 'Médio',
            hard: 'Difícil'
        };
        return labels[difficulty] || difficulty;
    };
    
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>
                ))}
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            {/* Filtros */}
            <div className="bg-white p-4 rounded-lg shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoria
                        </label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="all">Todas as Categorias</option>
                            <option value="endurance">Resistência</option>
                            <option value="speed">Velocidade</option>
                            <option value="strength">Força</option>
                            <option value="wellness">Bem-estar</option>
                            <option value="daily">Diário</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dificuldade
                        </label>
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="w-full border rounded-md px-3 py-2"
                        >
                            <option value="all">Todas as Dificuldades</option>
                            <option value="easy">Fácil</option>
                            <option value="medium">Médio</option>
                            <option value="hard">Difícil</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setSelectedCategory('all');
                                setSelectedDifficulty('all');
                            }}
                            className="w-full bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Grid de Desafios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredChallenges.map((challenge) => (
                    <ChallengeCard 
                        key={challenge.id} 
                        challenge={challenge}
                        onJoin={() => handleJoinChallenge(challenge)}
                    />
                ))}
            </div>
            
            {filteredChallenges.length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Nenhum desafio encontrado
                    </h3>
                    <p className="text-gray-500">
                        Tente ajustar os filtros para encontrar desafios disponíveis.
                    </p>
                </div>
            )}
        </div>
    );
};

const ChallengeCard = ({ challenge, onJoin }) => {
    const navigate = useNavigate();
    
    const formatRequirement = (requirements) => {
        if (requirements.distance) {
            return `${requirements.distance}${requirements.unit}`;
        }
        if (requirements.steps) {
            return `${requirements.steps.toLocaleString()} passos`;
        }
        if (requirements.duration) {
            const minutes = Math.floor(requirements.duration / 60);
            return `${minutes} minutos`;
        }
        return 'Ver detalhes';
    };
    
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Header com cor do desafio */}
            <div 
                className="h-2"
                style={{ backgroundColor: challenge.color }}
            ></div>
            
            <div className="p-6">
                {/* Título e ícone */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                        <span className="text-3xl">{challenge.icon}</span>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {challenge.title}
                            </h3>
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getDifficultyColor(challenge.difficulty)}`}>
                                {getDifficultyLabel(challenge.difficulty)}
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Descrição */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {challenge.description}
                </p>
                
                {/* Requisitos */}
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Meta:</span>
                        <span className="font-medium">{formatRequirement(challenge.requirements)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Taxa de entrada:</span>
                        <span className="font-medium text-green-600">
                            R$ {challenge.rewards.entry_fee.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Pool atual:</span>
                        <span className="font-medium text-blue-600">
                            R$ {challenge.current_pool.toFixed(2)}
                        </span>
                    </div>
                </div>
                
                {/* Participantes */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                            {challenge.participants_count} participantes
                        </span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {challenge.schedule.start_time} - {challenge.schedule.end_time}
                    </div>
                </div>
                
                {/* Botões */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate(`/challenges/${challenge.id}`)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Ver Detalhes
                    </button>
                    <button
                        onClick={onJoin}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Participar
                    </button>
                </div>
            </div>
        </div>
    );
};
```

## 🏆 Sistema de Apostas

### Backend - Participar de Desafio
```python
@app.route('/api/challenges/<challenge_id>/join', methods=['POST'])
def join_challenge(challenge_id):
    """Participar de um desafio"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        bet_amount = float(data.get('bet_amount', 0))
        
        if not user_id:
            return jsonify({'error': 'ID do usuário é obrigatório'}), 400
        
        if bet_amount <= 0:
            return jsonify({'error': 'Valor da aposta deve ser maior que zero'}), 400
        
        # Verificar se usuário existe
        users = get_users()
        if user_id not in users:
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Verificar saldo
        wallets = get_wallets()
        wallet = wallets.get(user_id, {})
        
        if wallet.get('available', 0) < bet_amount:
            return jsonify({'error': 'Saldo insuficiente'}), 400
        
        # Verificar se já está participando
        participations = get_challenge_participations()
        user_participations = participations.get(user_id, [])
        
        if any(p['challenge_id'] == challenge_id and p['status'] == 'active' for p in user_participations):
            return jsonify({'error': 'Você já está participando deste desafio'}), 400
        
        # Debitar da carteira
        wallet = update_wallet_balance(user_id, bet_amount, 'bet')
        
        # Registrar participação
        participation = {
            'id': f'participation_{secrets.token_hex(8)}',
            'user_id': user_id,
            'challenge_id': challenge_id,
            'bet_amount': bet_amount,
            'joined_at': datetime.now().isoformat(),
            'status': 'active',
            'activity': None,
            'result': None
        }
        
        if user_id not in participations:
            participations[user_id] = []
        participations[user_id].append(participation)
        save_challenge_participations(participations)
        
        # Registrar transação
        transaction = add_transaction(
            user_id,
            'bet',
            -bet_amount,
            f'Participação no desafio: {challenge_id}',
            'completed',
            {
                'challenge_id': challenge_id,
                'participation_id': participation['id']
            }
        )
        
        return jsonify({
            'message': 'Participação confirmada com sucesso!',
            'participation': participation,
            'transaction': transaction,
            'new_balance': wallet['balance']
        }), 201
        
    except Exception as e:
        print(f"Erro ao participar do desafio: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@app.route('/api/challenges/<challenge_id>/submit-activity', methods=['POST'])
def submit_activity(challenge_id):
    """Submeter atividade para um desafio"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        activity_data = data.get('activity')
        
        if not user_id or not activity_data:
            return jsonify({'error': 'Dados incompletos'}), 400
        
        # Verificar participação
        participations = get_challenge_participations()
        user_participations = participations.get(user_id, [])
        
        participation = next(
            (p for p in user_participations 
             if p['challenge_id'] == challenge_id and p['status'] == 'active'), 
            None
        )
        
        if not participation:
            return jsonify({'error': 'Você não está participando deste desafio'}), 400
        
        # Validar dados da atividade
        required_fields = ['start_time', 'end_time', 'distance', 'duration']
        for field in required_fields:
            if field not in activity_data:
                return jsonify({'error': f'Campo {field} é obrigatório'}), 400
        
        # Calcular métricas
        activity = {
            'start_time': activity_data['start_time'],
            'end_time': activity_data['end_time'],
            'distance': float(activity_data['distance']),
            'duration': int(activity_data['duration']),
            'calories': activity_data.get('calories', 0),
            'pace': calculate_pace(activity_data['distance'], activity_data['duration']),
            'verified': True,  # Em produção, implementar verificação
            'submitted_at': datetime.now().isoformat()
        }
        
        # Verificar se atende aos requisitos
        challenge = get_challenge_by_id(challenge_id)
        result = evaluate_challenge_completion(challenge, activity)
        
        # Atualizar participação
        participation['activity'] = activity
        participation['result'] = result
        participation['status'] = 'completed' if result['completed'] else 'failed'
        
        # Salvar participação atualizada
        participations[user_id] = [
            p if p['id'] != participation['id'] else participation 
            for p in user_participations
        ]
        save_challenge_participations(participations)
        
        # Se completou, adicionar à fila de distribuição de prêmios
        if result['completed']:
            add_to_prize_distribution_queue(challenge_id, user_id, result['score'])
        
        return jsonify({
            'message': 'Atividade submetida com sucesso!',
            'activity': activity,
            'result': result,
            'participation': participation
        }), 200
        
    except Exception as e:
        print(f"Erro ao submeter atividade: {e}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

def evaluate_challenge_completion(challenge, activity):
    """Avaliar se a atividade completa o desafio"""
    requirements = challenge['requirements']
    score = 0
    completed = True
    details = {}
    
    # Verificar distância (se aplicável)
    if 'distance' in requirements:
        required_distance = requirements['distance']
        actual_distance = activity['distance']
        
        if actual_distance >= required_distance:
            distance_score = min(100, (actual_distance / required_distance) * 100)
            score += distance_score * 0.4  # 40% do score
            details['distance'] = {
                'required': required_distance,
                'actual': actual_distance,
                'completed': True,
                'score': distance_score
            }
        else:
            completed = False
            details['distance'] = {
                'required': required_distance,
                'actual': actual_distance,
                'completed': False,
                'score': 0
            }
    
    # Verificar tempo (se aplicável)
    if 'max_time' in requirements:
        max_time = requirements['max_time']
        actual_time = activity['duration']
        
        if actual_time <= max_time:
            time_score = max(50, 100 - ((actual_time / max_time) * 50))
            score += time_score * 0.3  # 30% do score
            details['time'] = {
                'max_allowed': max_time,
                'actual': actual_time,
                'completed': True,
                'score': time_score
            }
        else:
            completed = False
            details['time'] = {
                'max_allowed': max_time,
                'actual': actual_time,
                'completed': False,
                'score': 0
            }
    
    # Verificar pace (se aplicável)
    if 'min_pace' in requirements:
        min_pace = requirements['min_pace']
        actual_pace = activity['pace']
        
        if actual_pace <= min_pace:  # Pace menor é melhor
            pace_score = max(50, 100 - ((actual_pace / min_pace) * 50))
            score += pace_score * 0.3  # 30% do score
            details['pace'] = {
                'min_required': min_pace,
                'actual': actual_pace,
                'completed': True,
                'score': pace_score
            }
        else:
            completed = False
            details['pace'] = {
                'min_required': min_pace,
                'actual': actual_pace,
                'completed': False,
                'score': 0
            }
    
    return {
        'completed': completed,
        'score': round(score, 2),
        'details': details,
        'evaluated_at': datetime.now().isoformat()
    }

def calculate_pace(distance_km, duration_seconds):
    """Calcular pace em min/km"""
    if distance_km <= 0:
        return 0
    
    pace_seconds = duration_seconds / distance_km
    pace_minutes = pace_seconds / 60
    return round(pace_minutes, 2)
```

## 🏅 Sistema de Ranking e Prêmios

### Backend - Distribuição de Prêmios
```python
def distribute_challenge_prizes(challenge_id):
    """Distribuir prêmios de um desafio"""
    try:
        # Obter todas as participações completadas
        participations = get_challenge_participations()
        completed_participations = []
        
        for user_participations in participations.values():
            for participation in user_participations:
                if (participation['challenge_id'] == challenge_id and 
                    participation['status'] == 'completed' and
                    participation['result']['completed']):
                    completed_participations.append(participation)
        
        if not completed_participations:
            return False
        
        # Ordenar por score (maior primeiro)
        completed_participations.sort(
            key=lambda x: x['result']['score'], 
            reverse=True
        )
        
        # Calcular pool total
        total_pool = sum(p['bet_amount'] for p in completed_participations)
        platform_fee = total_pool * 0.10  # 10% para a plataforma
        prize_pool = total_pool - platform_fee
        
        # Distribuição de prêmios
        prize_distribution = [0.50, 0.30, 0.20]  # 1º, 2º, 3º lugar
        
        for i, participation in enumerate(completed_participations[:3]):
            if i < len(prize_distribution):
                prize_amount = prize_pool * prize_distribution[i]
                user_id = participation['user_id']
                
                # Creditar prêmio na carteira
                update_wallet_balance(user_id, prize_amount, 'win')
                
                # Registrar transação
                add_transaction(
                    user_id,
                    'win',
                    prize_amount,
                    f'Prêmio do desafio {challenge_id} - {i+1}º lugar',
                    'completed',
                    {
                        'challenge_id': challenge_id,
                        'position': i + 1,
                        'total_participants': len(completed_participations),
                        'score': participation['result']['score'],
                        'prize_percentage': prize_distribution[i]
                    }
                )
                
                # Atualizar participação com prêmio
                participation['result']['position'] = i + 1
                participation['result']['prize_amount'] = prize_amount
        
        # Salvar participações atualizadas
        save_challenge_participations(participations)
        
        return True
        
    except Exception as e:
        print(f"Erro ao distribuir prêmios: {e}")
        return False

@app.route('/api/challenges/<challenge_id>/leaderboard', methods=['GET'])
def get_challenge_leaderboard(challenge_id):
    """Obter ranking de um desafio"""
    try:
        participations = get_challenge_participations()
        users = get_users()
        
        leaderboard = []
        
        for user_participations in participations.values():
            for participation in user_participations:
                if (participation['challenge_id'] == challenge_id and 
                    participation['status'] == 'completed' and
                    participation['result']['completed']):
                    
                    user = users.get(participation['user_id'], {})
                    
                    leaderboard.append({
                        'user_id': participation['user_id'],
                        'user_name': user.get('name', 'Usuário'),
                        'score': participation['result']['score'],
                        'activity': participation['activity'],
                        'position': participation['result'].get('position'),
                        'prize_amount': participation['result'].get('prize_amount', 0),
                        'completed_at': participation['activity']['submitted_at']
                    })
        
        # Ordenar por score
        leaderboard.sort(key=lambda x: x['score'], reverse=True)
        
        # Adicionar posições se não existirem
        for i, entry in enumerate(leaderboard):
            if not entry['position']:
                entry['position'] = i + 1
        
        return jsonify({
            'leaderboard': leaderboard,
            'total_participants': len(leaderboard)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### Frontend - Ranking do Desafio
```jsx
// frontend/src/components/challenges/ChallengeLeaderboard.jsx
const ChallengeLeaderboard = ({ challengeId }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchLeaderboard();
    }, [challengeId]);
    
    const fetchLeaderboard = async () => {
        try {
            const response = await challengeService.getLeaderboard(challengeId);
            setLeaderboard(response.leaderboard);
        } catch (error) {
            console.error('Erro ao buscar ranking:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const getPositionIcon = (position) => {
        const icons = {
            1: '🥇',
            2: '🥈',
            3: '🥉'
        };
        return icons[position] || `${position}º`;
    };
    
    const getPositionColor = (position) => {
        const colors = {
            1: 'text-yellow-600',
            2: 'text-gray-600',
            3: 'text-orange-600'
        };
        return colors[position] || 'text-gray-800';
    };
    
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }
    
    return (
        <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                    🏆 Ranking do Desafio
                </h3>
                <p className="text-sm text-gray-600">
                    {leaderboard.length} participantes completaram o desafio
                </p>
            </div>
            
            <div className="divide-y divide-gray-200">
                {leaderboard.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <div className="text-4xl mb-2">🎯</div>
                        <p>Nenhum participante completou o desafio ainda</p>
                    </div>
                ) : (
                    leaderboard.map((entry, index) => (
                        <div key={entry.user_id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`text-2xl font-bold ${getPositionColor(entry.position)}`}>
                                        {getPositionIcon(entry.position)}
                                    </div>
                                    
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {entry.user_name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Score: {entry.score.toFixed(1)} pontos
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    {entry.prize_amount > 0 && (
                                        <p className="text-lg font-semibold text-green-600">
                                            R$ {entry.prize_amount.toFixed(2)}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-500">
                                        {new Date(entry.completed_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Detalhes da atividade */}
                            <div className="mt-3 grid grid-cols-3 gap-4 text-sm text-gray-600">
                                <div>
                                    <span className="font-medium">Distância:</span>
                                    <br />
                                    {entry.activity.distance.toFixed(2)} km
                                </div>
                                <div>
                                    <span className="font-medium">Tempo:</span>
                                    <br />
                                    {Math.floor(entry.activity.duration / 60)}:{(entry.activity.duration % 60).toString().padStart(2, '0')}
                                </div>
                                <div>
                                    <span className="font-medium">Pace:</span>
                                    <br />
                                    {entry.activity.pace.toFixed(2)} min/km
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
```

## 📊 Estatísticas e Analytics

### Backend - Estatísticas de Desafios
```python
@app.route('/api/challenges/statistics', methods=['GET'])
def get_challenges_statistics():
    """Obter estatísticas gerais dos desafios"""
    try:
        participations = get_challenge_participations()
        
        stats = {
            'total_participations': 0,
            'completed_challenges': 0,
            'total_bets': 0.00,
            'total_prizes': 0.00,
            'average_completion_rate': 0.00,
            'popular_challenge_types': {},
            'daily_activity': {}
        }
        
        for user_participations in participations.values():
            for participation in user_participations:
                stats['total_participations'] += 1
                stats['total_bets'] += participation['bet_amount']
                
                if participation['status'] == 'completed':
                    stats['completed_challenges'] += 1
                    
                    if participation['result'].get('prize_amount'):
                        stats['total_prizes'] += participation['result']['prize_amount']
                
                # Contar tipos de desafio
                challenge_type = get_challenge_type(participation['challenge_id'])
                if challenge_type in stats['popular_challenge_types']:
                    stats['popular_challenge_types'][challenge_type] += 1
                else:
                    stats['popular_challenge_types'][challenge_type] = 1
                
                # Atividade diária
                date = participation['joined_at'][:10]
                if date in stats['daily_activity']:
                    stats['daily_activity'][date] += 1
                else:
                    stats['daily_activity'][date] = 1
        
        # Calcular taxa de conclusão
        if stats['total_participations'] > 0:
            stats['average_completion_rate'] = (
                stats['completed_challenges'] / stats['total_participations']
            ) * 100
        
        return jsonify({'statistics': stats}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

## 🔧 Troubleshooting

### Problemas Comuns

1. **Usuário não consegue participar do desafio**
   - Verificar saldo suficiente
   - Verificar se já está participando
   - Verificar status do desafio

2. **Atividade não é aceita**
   - Verificar se atende aos requisitos
   - Verificar formato dos dados
   - Verificar validações de tempo/distância

3. **Prêmios não distribuídos**
   - Verificar se há participantes que completaram
   - Verificar cálculos de pool
   - Verificar logs de distribuição

### Debug de Desafios
```python
# Verificar integridade dos desafios
def debug_challenge_integrity(challenge_id):
    participations = get_challenge_participations()
    
    total_bets = 0
    completed_count = 0
    
    for user_participations in participations.values():
        for p in user_participations:
            if p['challenge_id'] == challenge_id:
                total_bets += p['bet_amount']
                if p['status'] == 'completed':
                    completed_count += 1
    
    print(f"Desafio {challenge_id}:")
    print(f"Total apostado: R$ {total_bets}")
    print(f"Participantes que completaram: {completed_count}")
```

## 📝 Checklist para Novos Desafios

- [ ] Definir tipo e categoria
- [ ] Estabelecer requisitos claros
- [ ] Configurar sistema de pontuação
- [ ] Definir distribuição de prêmios
- [ ] Implementar validações
- [ ] Criar interface no frontend
- [ ] Testar fluxo completo
- [ ] Documentar regras

---

**Próximos passos**: Consulte o [Guia do Painel Admin](./admin-guide.md) para implementar funcionalidades administrativas avançadas.

