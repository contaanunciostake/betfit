#!/usr/bin/env python3
import sqlite3
import json
import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configurar CORS para permitir todas as origens
CORS(app, 
     origins=['*'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

# Configuração do banco de dados - Windows paths
BASE_DIR = r'C:\Temp\BetFit'
DATABASE_PATH = os.path.join(BASE_DIR, 'backend', 'src', 'betfit.db')

def get_db_connection():
    """Conecta ao banco de dados SQLite"""
    try:
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
        
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        
        # Verificar se o banco existe e criar tabelas se necessário
        init_database(conn)
        
        return conn
    except Exception as e:
        print(f"❌ Erro ao conectar com banco: {e}")
        print(f"📁 Tentando conectar em: {DATABASE_PATH}")
        return None

def init_database(conn):
    """Inicializa o banco de dados com tabelas básicas se não existirem"""
    try:
        cursor = conn.cursor()
        
        # Tabela de categorias
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenge_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Tabela de desafios
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            category_id INTEGER,
            target_value REAL,
            target_unit TEXT,
            stake_min REAL DEFAULT 10.0,
            stake_max REAL DEFAULT 100.0,
            max_participants INTEGER DEFAULT 100,
            end_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES challenge_categories (id)
        )
        ''')
        
        # Tabela de participações
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenge_participations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER,
            user_email TEXT NOT NULL,
            stake_amount REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        )
        ''')
        
        # Tabela de pools de desafios
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS challenge_pools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            challenge_id INTEGER,
            total_pool REAL DEFAULT 0.0,
            participants_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (challenge_id) REFERENCES challenges (id)
        )
        ''')
        
        # Inserir categorias padrão se não existirem
        categories = [
            ('Corrida', 'Desafios de corrida e caminhada'),
            ('Ciclismo', 'Desafios de ciclismo'),
            ('Passos', 'Desafios de contagem de passos'),
            ('Treinos', 'Desafios de treinos e exercícios'),
            ('Calorias', 'Desafios de queima de calorias'),
            ('Natação', 'Desafios de natação')
        ]
        
        cursor.execute("SELECT COUNT(*) FROM challenge_categories")
        if cursor.fetchone()[0] == 0:
            cursor.executemany(
                "INSERT INTO challenge_categories (name, description) VALUES (?, ?)",
                categories
            )
            print("✅ Categorias padrão inseridas")
        
        conn.commit()
        print("✅ Banco de dados inicializado com sucesso")
        
    except Exception as e:
        print(f"❌ Erro ao inicializar banco: {e}")

def dict_from_row(row):
    """Converte sqlite3.Row para dict"""
    return {key: row[key] for key in row.keys()}

# ============================================================================
# ENDPOINTS DE SAÚDE E AUTENTICAÇÃO
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verificação de saúde"""
    return jsonify({
        "status": "ok", 
        "message": "Backend BetFit funcionando!", 
        "timestamp": datetime.now().isoformat(),
        "database_path": DATABASE_PATH,
        "database_exists": os.path.exists(DATABASE_PATH)
    })

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Endpoint de login"""
    try:
        data = request.get_json()
        email = data.get('email', '')
        
        print(f"🔐 Login realizado: {email}")
        
        # Mock de autenticação
        user_data = {
            "id": 1,
            "email": email,
            "name": email.split('@')[0].title(),
            "token": f"mock_token_{datetime.now().timestamp()}",
            "wallet_balance": 100.00,
            "created_at": datetime.now().isoformat()
        }
        
        return jsonify({
            "success": True,
            "user": user_data,
            "message": "Login realizado com sucesso"
        })
        
    except Exception as e:
        print(f"❌ Erro no login: {e}")
        return jsonify({"error": f"Erro no login: {str(e)}"}), 500

# ============================================================================
# ENDPOINTS DE DESAFIOS
# ============================================================================

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    """Busca todos os desafios disponíveis"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Erro de conexão com banco"}), 500
            
        cursor = conn.cursor()
        
        # Buscar desafios com informações das categorias
        query = """
        SELECT c.*, cat.name as category_name
        FROM challenges c
        LEFT JOIN challenge_categories cat ON c.category_id = cat.id
        ORDER BY c.created_at DESC
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        challenges = []
        for row in rows:
            challenge = dict_from_row(row)
            challenges.append(challenge)
        
        conn.close()
        
        return jsonify({
            "challenges": challenges,
            "total": len(challenges)
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar desafios: {e}")
        return jsonify({"error": f"Erro ao buscar desafios: {str(e)}"}), 500

@app.route('/api/challenges/my-participations', methods=['GET'])
def get_user_participations():
    """Busca participações do usuário"""
    try:
        user_email = request.args.get('user_email', 'teste@betfit.com')
        
        conn = get_db_connection()
        if not conn:
            # Retornar dados mock se não conseguir conectar
            return jsonify({
                "participations": [],
                "total": 0,
                "message": "Nenhuma participação encontrada"
            })
            
        cursor = conn.cursor()
        
        # Buscar participações do usuário
        query = """
        SELECT cp.*, c.title, c.description, cat.name as category_name
        FROM challenge_participations cp
        JOIN challenges c ON cp.challenge_id = c.id
        LEFT JOIN challenge_categories cat ON c.category_id = cat.id
        WHERE cp.user_email = ?
        ORDER BY cp.created_at DESC
        """
        
        cursor.execute(query, (user_email,))
        rows = cursor.fetchall()
        
        participations = []
        for row in rows:
            participation = dict_from_row(row)
            participations.append(participation)
        
        conn.close()
        
        return jsonify({
            "participations": participations,
            "total": len(participations)
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar participações: {e}")
        return jsonify({"error": f"Erro ao buscar participações: {str(e)}"}), 500

# ============================================================================
# ENDPOINTS DE WALLET/CARTEIRA
# ============================================================================

@app.route('/api/wallet/<email>', methods=['GET'])
def get_wallet_by_email(email):
    """Busca dados da carteira por email"""
    try:
        print(f"💰 Buscando carteira para: {email}")
        
        # Mock de dados da carteira
        wallet_data = {
            "user_email": email,
            "balance": 150.75,
            "available_balance": 120.50,
            "locked_balance": 30.25,
            "total_deposits": 200.00,
            "total_withdrawals": 49.25,
            "total_winnings": 75.50,
            "total_losses": 25.00,
            "transactions": [
                {
                    "id": 1,
                    "type": "deposit",
                    "amount": 100.00,
                    "description": "Depósito inicial",
                    "created_at": (datetime.now() - timedelta(days=5)).isoformat()
                },
                {
                    "id": 2,
                    "type": "stake",
                    "amount": -25.00,
                    "description": "Aposta em desafio de corrida",
                    "created_at": (datetime.now() - timedelta(days=3)).isoformat()
                },
                {
                    "id": 3,
                    "type": "winning",
                    "amount": 75.75,
                    "description": "Ganho em desafio completado",
                    "created_at": (datetime.now() - timedelta(days=1)).isoformat()
                }
            ],
            "last_updated": datetime.now().isoformat()
        }
        
        return jsonify(wallet_data)
        
    except Exception as e:
        print(f"❌ Erro ao buscar carteira: {e}")
        return jsonify({"error": f"Erro ao buscar carteira: {str(e)}"}), 500

@app.route('/api/wallet', methods=['GET'])
def get_wallet_by_query():
    """Busca dados da carteira por query parameter"""
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email é obrigatório"}), 400
            
        return get_wallet_by_email(email)
        
    except Exception as e:
        print(f"❌ Erro ao buscar carteira: {e}")
        return jsonify({"error": f"Erro ao buscar carteira: {str(e)}"}), 500

# ============================================================================
# ENDPOINTS DE USUÁRIO
# ============================================================================

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Busca perfil do usuário"""
    try:
        email = request.args.get('email')
        if not email:
            return jsonify({"error": "Email é obrigatório"}), 400
            
        print(f"👤 Buscando perfil para: {email}")
        
        # Mock de dados do perfil
        profile_data = {
            "email": email,
            "name": email.split('@')[0].title(),
            "avatar": f"https://ui-avatars.com/api/?name={email.split('@')[0]}&background=random",
            "level": 5,
            "experience_points": 1250,
            "total_challenges": 12,
            "completed_challenges": 8,
            "success_rate": 66.7,
            "total_earnings": 245.50,
            "favorite_categories": ["Corrida", "Ciclismo"],
            "achievements": [
                {"id": 1, "name": "Primeiro Desafio", "description": "Completou seu primeiro desafio", "earned_at": "2024-01-15"},
                {"id": 2, "name": "Corredor Dedicado", "description": "Completou 5 desafios de corrida", "earned_at": "2024-02-20"},
                {"id": 3, "name": "Vencedor", "description": "Ganhou 3 desafios consecutivos", "earned_at": "2024-03-10"}
            ],
            "stats": {
                "total_distance_km": 125.5,
                "total_calories_burned": 8750,
                "total_workout_minutes": 2400,
                "average_stake": 25.00
            },
            "preferences": {
                "notifications": True,
                "email_updates": True,
                "privacy_level": "public"
            },
            "created_at": "2024-01-01T00:00:00Z",
            "last_login": datetime.now().isoformat()
        }
        
        return jsonify(profile_data)
        
    except Exception as e:
        print(f"❌ Erro ao buscar perfil: {e}")
        return jsonify({"error": f"Erro ao buscar perfil: {str(e)}"}), 500

@app.route('/api/test/user/<email>', methods=['GET'])
def test_user_api(email):
    """Endpoint de teste para dados do usuário (usado pelo WalletContext)"""
    try:
        print(f"🧪 Test User API para: {email}")
        
        # Dados simplificados para teste
        test_data = {
            "email": email,
            "name": email.split('@')[0].title(),
            "balance": 150.75,
            "status": "active",
            "test_timestamp": datetime.now().isoformat()
        }
        
        return jsonify(test_data)
        
    except Exception as e:
        print(f"❌ Erro no test user API: {e}")
        return jsonify({"error": f"Erro no test user API: {str(e)}"}), 500

# ============================================================================
# ENDPOINTS DE ATIVIDADES
# ============================================================================

@app.route('/api/activities/global', methods=['GET'])
def get_global_activities():
    """Busca atividades globais da plataforma"""
    try:
        limit = request.args.get('limit', 20, type=int)
        
        print(f"🌍 Buscando {limit} atividades globais...")
        
        # Mock de atividades globais
        activities = []
        for i in range(min(limit, 20)):
            activity = {
                "id": i + 1,
                "user_name": f"Usuário {i + 1}",
                "user_avatar": f"https://ui-avatars.com/api/?name=User{i+1}&background=random",
                "action": ["completou um desafio", "fez uma aposta", "ganhou um desafio", "atingiu uma meta"][i % 4],
                "challenge_title": f"Desafio {['Corrida 5K', 'Ciclismo 20K', 'Passos Diários', 'Treino HIIT'][i % 4]}",
                "amount": round(10 + (i * 5.5), 2),
                "timestamp": (datetime.now() - timedelta(minutes=i * 15)).isoformat(),
                "type": ["challenge_completed", "bet_placed", "challenge_won", "goal_achieved"][i % 4]
            }
            activities.append(activity)
        
        return jsonify({
            "activities": activities,
            "total": len(activities),
            "limit": limit
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar atividades globais: {e}")
        return jsonify({"error": f"Erro ao buscar atividades globais: {str(e)}"}), 500

# ============================================================================
# ENDPOINTS ADMIN
# ============================================================================

@app.route('/api/admin/dashboard/metrics', methods=['GET', 'OPTIONS'])
def admin_dashboard_metrics():
    """Métricas específicas para o dashboard admin"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        print("📊 [ADMIN] Buscando métricas do dashboard...")
        
        conn = get_db_connection()
        if not conn:
            # Retornar dados mock se não conseguir conectar
            print("⚠️ [ADMIN] Usando dados mock - sem conexão com banco")
            return jsonify({
                "metrics": {
                    "total_challenges": 7,
                    "active_challenges": 5,
                    "completed_challenges": 2,
                    "total_participants": 15,
                    "total_pool": 1640.0,
                    "average_stake": 25.50,
                    "success_rate": 28.57
                },
                "charts": {
                    "challenges_by_category": [
                        {"category": "Corrida", "count": 5},
                        {"category": "Ciclismo", "count": 3},
                        {"category": "Passos", "count": 7},
                        {"category": "Treinos", "count": 2}
                    ],
                    "participation_trend": [
                        {"date": "2024-01-01", "participants": 10},
                        {"date": "2024-01-02", "participants": 15},
                        {"date": "2024-01-03", "participants": 12},
                        {"date": "2024-01-04", "participants": 18}
                    ]
                }
            })
            
        cursor = conn.cursor()
        
        # Métricas básicas
        cursor.execute("SELECT COUNT(*) as total FROM challenges")
        total_challenges = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) as active FROM challenges WHERE end_at > datetime('now')")
        active_challenges = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) as participants FROM challenge_participations")
        total_participants = cursor.fetchone()[0]
        
        cursor.execute("SELECT SUM(total_pool) as total_pool FROM challenge_pools")
        total_pool = cursor.fetchone()[0] or 0
        
        cursor.execute("SELECT COUNT(*) as completed FROM challenges WHERE end_at < datetime('now')")
        completed_challenges = cursor.fetchone()[0]
        
        cursor.execute("SELECT AVG(stake_min) as avg_stake FROM challenges")
        avg_stake = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            "metrics": {
                "total_challenges": total_challenges,
                "active_challenges": active_challenges,
                "completed_challenges": completed_challenges,
                "total_participants": total_participants,
                "total_pool": float(total_pool),
                "average_stake": float(avg_stake),
                "success_rate": round((completed_challenges / max(total_challenges, 1)) * 100, 2)
            },
            "charts": {
                "challenges_by_category": [
                    {"category": "Corrida", "count": 5},
                    {"category": "Ciclismo", "count": 3},
                    {"category": "Passos", "count": 7},
                    {"category": "Treinos", "count": 2}
                ],
                "participation_trend": [
                    {"date": "2024-01-01", "participants": 10},
                    {"date": "2024-01-02", "participants": 15},
                    {"date": "2024-01-03", "participants": 12},
                    {"date": "2024-01-04", "participants": 18}
                ]
            }
        })
        
    except Exception as e:
        print(f"❌ [ADMIN] Erro ao buscar métricas: {e}")
        return jsonify({"error": f"Erro ao buscar métricas: {str(e)}"}), 500

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Busca todas as categorias"""
    try:
        conn = get_db_connection()
        if not conn:
            # Retornar categorias padrão se não conseguir conectar
            return jsonify({
                "categories": [
                    {"id": 1, "name": "Corrida"},
                    {"id": 2, "name": "Ciclismo"},
                    {"id": 3, "name": "Passos"},
                    {"id": 4, "name": "Treinos"},
                    {"id": 5, "name": "Calorias"},
                    {"id": 6, "name": "Natação"}
                ],
                "total": 6
            })
            
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM challenge_categories ORDER BY name")
        rows = cursor.fetchall()
        
        categories = []
        for row in rows:
            category = dict_from_row(row)
            categories.append(category)
        
        conn.close()
        
        return jsonify({
            "categories": categories,
            "total": len(categories)
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar categorias: {e}")
        return jsonify({"error": f"Erro ao buscar categorias: {str(e)}"}), 500

# ============================================================================
# TRATAMENTO DE ERROS
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint não encontrado"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Erro interno do servidor"}), 500

# ============================================================================
# INICIALIZAÇÃO
# ============================================================================

if __name__ == '__main__':
    print("🚀 Iniciando BetFit Backend Completo para Windows...")
    print(f"📁 Diretório base: {BASE_DIR}")
    print(f"💾 Banco de dados: {DATABASE_PATH}")
    
    # Verificar se os diretórios existem
    if not os.path.exists(BASE_DIR):
        print(f"⚠️ Criando diretório base: {BASE_DIR}")
        os.makedirs(BASE_DIR, exist_ok=True)
    
    backend_dir = os.path.join(BASE_DIR, 'backend')
    frontend_dir = os.path.join(BASE_DIR, 'frontend')
    
    if not os.path.exists(backend_dir):
        print(f"⚠️ Criando diretório backend: {backend_dir}")
        os.makedirs(backend_dir, exist_ok=True)
    
    if not os.path.exists(frontend_dir):
        print(f"⚠️ Criando diretório frontend: {frontend_dir}")
        os.makedirs(frontend_dir, exist_ok=True)
    
    print("\n🌐 Endpoints disponíveis:")
    print("   ✅ GET /api/health")
    print("   ✅ POST /api/auth/login")
    print("   ✅ GET /api/challenges")
    print("   ✅ GET /api/challenges/my-participations")
    print("   ✅ GET /api/wallet/<email>")
    print("   ✅ GET /api/wallet?email=<email>")
    print("   ✅ GET /api/user/profile?email=<email>")
    print("   ✅ GET /api/test/user/<email>")
    print("   ✅ GET /api/activities/global?limit=<limit>")
    print("   ✅ GET /api/admin/dashboard/metrics")
    print("   ✅ GET /api/categories")
    print("\n🔧 Ajustes para Windows:")
    print("   - Caminhos Windows (C:\\Temp\\BetFit)")
    print("   - Criação automática de diretórios")
    print("   - Inicialização automática do banco SQLite")
    print("   - CORS configurado para desenvolvimento local")
    print("   - Dados mock para desenvolvimento")
    print("   - Logs detalhados para debug")
    
    app.run(host='0.0.0.0', port=5001, debug=True)