#!/usr/bin/env python3
import sqlite3
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Configurar CORS para permitir requisições do frontend
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:8080'], 
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With'],
     supports_credentials=True)

# Handler global para requisições OPTIONS
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify()
        response.headers.add("Access-Control-Allow-Origin", "*")
        response.headers.add('Access-Control-Allow-Headers', "Content-Type,Authorization,X-Requested-With")
        response.headers.add('Access-Control-Allow-Methods', "GET,PUT,POST,DELETE,OPTIONS")
        return response

# Configuração do banco de dados
DATABASE_PATH = '/home/ubuntu/betfit/betfit-backend/database.db'

def get_db_connection():
    """Conecta ao banco de dados SQLite"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Para acessar colunas por nome
    return conn

def dict_from_row(row):
    """Converte sqlite3.Row para dict"""
    return {key: row[key] for key in row.keys()}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verificação de saúde"""
    return jsonify({"status": "ok", "message": "Backend funcionando!"})

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    """Busca todos os desafios disponíveis"""
    try:
        conn = get_db_connection()
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

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Busca todas as categorias"""
    try:
        conn = get_db_connection()
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

@app.route('/api/challenges/my-participations', methods=['GET'])
def get_user_participations():
    """Busca participações do usuário logado"""
    try:
        # Mock de usuário logado (você pode implementar autenticação real)
        user_email = "teste@betfit.com"
        
        conn = get_db_connection()
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

@app.route('/api/admin/challenges', methods=['GET', 'POST', 'OPTIONS'])
def admin_challenges():
    """Endpoint admin para gerenciar desafios"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    if request.method == 'GET':
        # Retornar desafios (mesmo que endpoint público)
        return get_challenges()
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            print(f"📥 Dados recebidos: {data}")
            
            # Validar campos obrigatórios (sem entry_fee)
            required_fields = ['title', 'description', 'category_id', 'target_value', 'target_unit', 'stake_min', 'stake_max', 'end_at']
            for field in required_fields:
                if field not in data or data[field] is None or data[field] == '':
                    return jsonify({"error": f"Campo obrigatório: {field}"}), 400
            
            conn = get_db_connection()
            cursor = conn.cursor()
            
            # Inserir novo desafio com campos corretos
            insert_query = """
            INSERT INTO challenges (
                title, description, category_id, target_value, target_unit,
                stake_min, stake_max, max_participants, start_at, end_at, 
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            values = (
                data['title'],
                data['description'],
                int(data['category_id']),
                float(data['target_value']),
                data['target_unit'],
                float(data['stake_min']),
                float(data['stake_max']),
                int(data.get('max_participants', 100)),
                data.get('start_at', datetime.now().isoformat()),
                data['end_at'],
                1,  # created_by (admin user)
                datetime.now().isoformat()
            )
            
            cursor.execute(insert_query, values)
            challenge_id = cursor.lastrowid
            
            # Criar pool para o desafio
            pool_query = """
            INSERT INTO challenge_pools (
                challenge_id, total_pool, platform_fee_percentage, 
                platform_fee_amount, available_pool, participant_count
            ) VALUES (?, 0, 10.00, 0, 0, 0)
            """
            
            cursor.execute(pool_query, (challenge_id,))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Desafio criado com ID: {challenge_id}")
            
            return jsonify({
                "message": "Desafio criado com sucesso!",
                "challenge_id": challenge_id
            }), 201
            
        except Exception as e:
            print(f"❌ Erro ao criar desafio: {e}")
            return jsonify({"error": f"Erro ao criar desafio: {str(e)}"}), 500

@app.route('/api/admin/auth/me', methods=['GET', 'OPTIONS'])
def admin_auth_me():
    """Mock de verificação de autenticação admin"""
    if request.method == 'OPTIONS':
        return '', 200
    
    return jsonify({
        "user": {
            "id": 1,
            "name": "Admin BetFit",
            "email": "admin@betfit.com",
            "role": "admin"
        }
    })

@app.route('/api/admin/stats', methods=['GET', 'OPTIONS'])
def admin_stats():
    """Estatísticas para o painel admin"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Total de desafios
        cursor.execute("SELECT COUNT(*) as total FROM challenges")
        total_challenges = cursor.fetchone()[0]
        
        # Desafios ativos
        cursor.execute("SELECT COUNT(*) as active FROM challenges WHERE end_at > datetime('now')")
        active_challenges = cursor.fetchone()[0]
        
        # Total de participantes
        cursor.execute("SELECT COUNT(*) as participants FROM challenge_participations")
        total_participants = cursor.fetchone()[0]
        
        # Pool total
        cursor.execute("SELECT SUM(total_pool) as total_pool FROM challenge_pools")
        total_pool = cursor.fetchone()[0] or 0
        
        conn.close()
        
        return jsonify({
            "total_challenges": total_challenges,
            "active_challenges": active_challenges,
            "total_participants": total_participants,
            "total_pool": float(total_pool)
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar estatísticas: {e}")
        return jsonify({"error": f"Erro ao buscar estatísticas: {str(e)}"}), 500

@app.route('/users', methods=['GET', 'OPTIONS'])
def get_users():
    """Endpoint para buscar usuários (mock)"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        # Mock de usuários para o admin panel
        users = [
            {
                "id": 1,
                "name": "Admin BetFit",
                "email": "admin@betfit.com",
                "role": "admin",
                "created_at": "2024-01-01T00:00:00Z",
                "status": "active"
            },
            {
                "id": 2,
                "name": "Usuário Teste",
                "email": "teste@betfit.com",
                "role": "user",
                "created_at": "2024-01-02T00:00:00Z",
                "status": "active"
            }
        ]
        
        return jsonify({
            "users": users,
            "total": len(users)
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar usuários: {e}")
        return jsonify({"error": f"Erro ao buscar usuários: {str(e)}"}), 500

@app.route('/api/admin/dashboard/metrics', methods=['GET', 'OPTIONS'])
def admin_dashboard_metrics():
    """Métricas específicas para o dashboard admin"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        conn = get_db_connection()
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
        
        # Métricas adicionais para dashboard
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
        print(f"❌ Erro ao buscar métricas do dashboard: {e}")
        return jsonify({"error": f"Erro ao buscar métricas: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Iniciando BetFit Backend Corrigido...")
    print(f"📁 Banco de dados: {DATABASE_PATH}")
    print("🌐 Endpoints disponíveis:")
    print("   - GET /api/health")
    print("   - GET /api/challenges")
    print("   - GET /api/categories")
    print("   - GET /api/challenges/my-participations")
    print("   - GET/POST /api/admin/challenges")
    print("   - GET /api/admin/auth/me")
    print("   - GET /api/admin/stats")
    print("   - GET /users")
    print("   - GET /api/admin/dashboard/metrics")
    print("\n✅ Correções implementadas:")
    print("   - CORS configurado adequadamente")
    print("   - Endpoints em falta implementados")
    print("   - Persistência no banco corrigida")
    print("   - Campos corretos da tabela challenges")
    
    app.run(host='0.0.0.0', port=5001, debug=True)

