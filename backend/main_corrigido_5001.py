import hashlib
import uuid
import secrets
import json
import os
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import User, Wallet, Transaction, ChallengeParticipation, SessionLocal


app = Flask(__name__)
app.secret_key = '1657victOr@'

# Habilitar CORS para localhost - CONFIGURAÇÃO ORIGINAL
CORS(app, 
     origins=["http://localhost:5173", "http://localhost:8080", "http://192.168.1.69:8080", "http://localhost:5174", "http://localhost:3000"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Cache-Control"],
     supports_credentials=True)

# ==================== HANDLERS OPTIONS PARA APOSTAS ====================

@app.route('/api/challenges/<challenge_id>/join', methods=['OPTIONS'])
def join_challenge_options(challenge_id):
    """Handler para requisições OPTIONS do endpoint join"""
    return '', 200

@app.route('/api/challenges/<challenge_id>/complete', methods=['OPTIONS'])
def complete_challenge_options(challenge_id):
    """Handler para requisições OPTIONS do endpoint complete"""
    return '', 200

# ===== CORREÇÃO: HANDLER OPTIONS PARA ADMIN =====
@app.route('/api/admin/dashboard/metrics', methods=['OPTIONS'])
def admin_dashboard_metrics_options():
    """Handler para requisições OPTIONS do endpoint admin"""
    return '', 200

@app.route('/api/admin/challenges', methods=['OPTIONS'])
def admin_challenges_options():
    """Handler para requisições OPTIONS do endpoint admin challenges"""
    return '', 200

@app.route('/api/challenges/all-participations', methods=['OPTIONS'])
def all_participations_options():
    """Handler para requisições OPTIONS do endpoint all participations"""
    return '', 200

@app.route('/', methods=['GET'])
def root():
    """Rota raiz da API - informações básicas"""
    return jsonify({
        "api": "BetFit Backend",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/api/health",
            "admin_metrics": "/api/admin/dashboard/metrics",
            "admin_challenges": "/api/admin/challenges",
            "all_participations": "/api/challenges/all-participations",
            "challenges": "/api/challenges",
            "wallet": "/api/wallet",
            "auth": "/api/auth"
        },
        "message": "BetFit API está funcionando corretamente!"
    })

# ==================== UTILITY FUNCTIONS ====================

def hash_password(password):
    """Hash da senha usando SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def model_user_to_dict(u):
    """Converte modelo User para dict"""
    return {
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'phone': u.phone,
        'password': u.password,
        'status': u.status,
        'kyc_status': u.kyc_status,
        'created_at': u.created_at.isoformat() if u.created_at else None,
        'updated_at': u.updated_at.isoformat() if u.updated_at else None,
        'last_login': u.last_login.isoformat() if u.last_login else None,
        'total_bets': u.total_bets or 0,
        'total_wins': u.total_wins or 0,
        'total_deposited': u.total_deposited or 0.0,
        'total_withdrawn': u.total_withdrawn or 0.0
    }

def model_wallet_to_dict(w):
    """Converte modelo Wallet para dict"""
    return {
        'id': w.id,
        'user_id': w.user_id,
        'balance': w.balance or 0.0,
        'available': w.available or 0.0,
        'pending': w.pending or 0.0,
        'currency': w.currency or 'BRL',
        'created_at': w.created_at.isoformat() if w.created_at else None,
        'updated_at': w.updated_at.isoformat() if w.updated_at else None
    }

def model_tx_to_dict(t):
    """Converte modelo Transaction para dict"""
    return {
        'id': t.id,
        'user_id': t.user_id,
        'type': t.type,
        'amount': t.amount,
        'description': t.description,
        'status': t.status,
        'created_at': t.created_at.isoformat() if t.created_at else None,
        'updated_at': t.updated_at.isoformat() if t.updated_at else None,
        'admin_id': t.admin_id
    }

# ==================== CHALLENGES ROUTES ====================

@app.route('/api/challenges', methods=['GET'])
def get_challenges():
    """Busca todos os desafios disponíveis"""
    try:
        print("🎮 [CHALLENGES] Buscando desafios...")
        
        # Mock de desafios com dados mais realistas
        challenges = [
            {
                'id': 'challenge_001',
                'title': 'Corrida 5km em 30min',
                'description': 'Complete uma corrida de 5km em até 30 minutos',
                'category': 'running',
                'difficulty': 'medium',
                'entry_fee': 25.00,
                'total_pool': 1250.00,
                'participants': 50,
                'max_participants': 100,
                'start_date': (datetime.now() + timedelta(hours=1)).isoformat(),
                'end_date': (datetime.now() + timedelta(days=1)).isoformat(),
                'status': 'active'
            },
            {
                'id': 'challenge_002',
                'title': 'Battle Royale 10k Steps',
                'description': 'Seja um dos primeiros 10 a completar 10.000 passos',
                'category': 'walking',
                'difficulty': 'easy',
                'entry_fee': 15.00,
                'total_pool': 750.00,
                'participants': 50,
                'max_participants': 100,
                'start_date': datetime.now().isoformat(),
                'end_date': (datetime.now() + timedelta(days=1)).isoformat(),
                'status': 'active'
            },
            {
                'id': 'challenge_003',
                'title': 'Treino HIIT 45min',
                'description': 'Complete um treino HIIT de 45 minutos com frequência cardíaca elevada',
                'category': 'fitness',
                'difficulty': 'hard',
                'entry_fee': 35.00,
                'total_pool': 1750.00,
                'participants': 50,
                'max_participants': 100,
                'start_date': (datetime.now() + timedelta(hours=2)).isoformat(),
                'end_date': (datetime.now() + timedelta(days=1)).isoformat(),
                'status': 'active'
            }
        ]
        
        return jsonify({
            "challenges": challenges,
            "total": len(challenges)
        })
        
    except Exception as e:
        print(f"❌ [CHALLENGES] Erro ao buscar desafios: {e}")
        return jsonify({"error": f"Erro ao buscar desafios: {str(e)}"}), 500

# ==================== NOVO ENDPOINT PARA ADMIN - TODAS AS PARTICIPAÇÕES ====================

@app.route('/api/challenges/all-participations', methods=['GET'])
def get_all_participations():
    """Busca TODAS as participações para o painel admin - SEM PRECISAR DE EMAIL"""
    session = SessionLocal()
    try:
        print("🎯 [ALL PARTICIPATIONS] Buscando todas as participações para admin...")
        
        # Buscar TODAS as participações do banco
        participations = session.query(ChallengeParticipation).all()
        
        # Agrupar participações por challenge_id
        participation_counts = {}
        total_pools = {}
        
        # Definir entry fees por desafio
        entry_fees = {
            'challenge_001': 25.00,  # Corrida 5km
            'challenge_002': 15.00,  # Battle Royale Steps
            'challenge_003': 35.00,  # Treino HIIT
            'challenge_004': 20.00,  # Yoga Flow
            'challenge_005': 30.00,  # Ciclismo
            'challenge_006': 40.00   # Natação
        }
        
        for participation in participations:
            challenge_id = participation.challenge_id
            
            # Contar participações por desafio
            if challenge_id not in participation_counts:
                participation_counts[challenge_id] = 0
            participation_counts[challenge_id] += 1
            
            # Calcular pool total
            entry_fee = entry_fees.get(challenge_id, 25.00)
            total_pools[challenge_id] = participation_counts[challenge_id] * entry_fee
        
        # Definir desafios com dados dinâmicos
        challenges_data = [
            {
                'id': 'challenge_001',
                'title': 'Corrida 5km em 30min',
                'description': 'Complete uma corrida de 5km em até 30 minutos',
                'category': 'running',
                'difficulty': 'medium',
                'entry_fee': 25.00,
                'max_participants': 100,
                'status': 'active'
            },
            {
                'id': 'challenge_002',
                'title': 'Battle Royale 10k Steps',
                'description': 'Seja um dos primeiros 10 a completar 10.000 passos',
                'category': 'steps',
                'difficulty': 'easy',
                'entry_fee': 15.00,
                'max_participants': 100,
                'status': 'active'
            },
            {
                'id': 'challenge_003',
                'title': 'Treino HIIT 45min',
                'description': 'Complete um treino HIIT de 45 minutos com frequência cardíaca elevada',
                'category': 'workouts',
                'difficulty': 'hard',
                'entry_fee': 35.00,
                'max_participants': 100,
                'status': 'active'
            },
            {
                'id': 'challenge_004',
                'title': 'Yoga Flow 60min',
                'description': 'Complete uma sessão de yoga flow de 60 minutos',
                'category': 'yoga',
                'difficulty': 'easy',
                'entry_fee': 20.00,
                'max_participants': 80,
                'status': 'active'
            },
            {
                'id': 'challenge_005',
                'title': 'Ciclismo 20km',
                'description': 'Complete um percurso de 20km de bicicleta',
                'category': 'cycling',
                'difficulty': 'medium',
                'entry_fee': 30.00,
                'max_participants': 100,
                'status': 'active'
            },
            {
                'id': 'challenge_006',
                'title': 'Natação 1km',
                'description': 'Nade 1km em piscina ou mar aberto',
                'category': 'swimming',
                'difficulty': 'hard',
                'entry_fee': 40.00,
                'max_participants': 100,
                'status': 'active'
            }
        ]
        
        # Formatar dados para o painel admin
        challenges = []
        for challenge in challenges_data:
            challenge_id = challenge['id']
            current_participants = participation_counts.get(challenge_id, 0)
            total_pool = total_pools.get(challenge_id, 0.0)
            
            admin_challenge = {
                'id': challenge['id'],
                'title': challenge['title'],
                'description': challenge['description'],
                'category': challenge['category'],
                'status': challenge['status'],
                'current_participants': current_participants,
                'participant_count': current_participants,
                'max_participants': challenge['max_participants'],
                'total_pool': total_pool,
                'entry_fee': challenge['entry_fee'],
                'start_date': (datetime.now() - timedelta(hours=1)).isoformat(),
                'end_date': (datetime.now() + timedelta(days=1)).isoformat(),
                'created_at': (datetime.now() - timedelta(hours=2)).isoformat(),
                'difficulty': challenge['difficulty']
            }
            challenges.append(admin_challenge)
        
        total_participants = sum(participation_counts.values())
        total_pool_sum = sum(total_pools.values())
        
        print(f"✅ [ALL PARTICIPATIONS] Dados coletados: {len(challenges)} desafios, {total_participants} participantes, R$ {total_pool_sum:.2f} em pools")
        
        return jsonify({
            'challenges': challenges,
            'total_count': len(challenges),
            'total_participants': total_participants,
            'total_pool': total_pool_sum,
            'summary': {
                'total_challenges': len(challenges),
                'total_participants': total_participants,
                'total_pool_value': total_pool_sum,
                'active_challenges': len([c for c in challenges if c['status'] == 'active'])
            }
        }), 200
        
    except Exception as e:
        print(f"❌ [ALL PARTICIPATIONS] Erro ao buscar participações: {e}")
        import traceback
        print(f"❌ [ALL PARTICIPATIONS] Stack trace: {traceback.format_exc()}")
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500
    finally:
        session.close()

# ==================== ENDPOINT ORIGINAL CORRIGIDO ====================

@app.route('/api/challenges/my-participations', methods=['GET'])
def get_user_participations():
    """Busca participações do usuário com detalhes completos dos desafios"""
    session = SessionLocal()
    try:
        user_email = request.args.get('user_email')
        
        # Se não tiver email, retorna todas as participações (para admin)
        if not user_email:
            print("🎯 [PARTICIPATIONS] Sem email fornecido, retornando todas as participações...")
            
            # Buscar TODAS as participações
            participations = session.query(ChallengeParticipation).all()
            
            # Mock de detalhes dos desafios
            challenges_details = {
                'challenge_001': {
                    'title': 'Corrida 5km em 30min',
                    'description': 'Complete uma corrida de 5km em até 30 minutos',
                    'category': 'running',
                    'difficulty': 'medium'
                },
                'challenge_002': {
                    'title': 'Battle Royale 10k Steps',
                    'description': 'Seja um dos primeiros 10 a completar 10.000 passos',
                    'category': 'walking',
                    'difficulty': 'easy'
                },
                'challenge_003': {
                    'title': 'Treino HIIT 45min',
                    'description': 'Complete um treino HIIT de 45 minutos com frequência cardíaca elevada',
                    'category': 'fitness',
                    'difficulty': 'hard'
                },
                'challenge_004': {
                    'title': 'Yoga Flow 60min',
                    'description': 'Complete uma sessão de yoga flow de 60 minutos',
                    'category': 'yoga',
                    'difficulty': 'easy'
                },
                'challenge_005': {
                    'title': 'Ciclismo 20km',
                    'description': 'Complete um percurso de 20km de bicicleta',
                    'category': 'cycling',
                    'difficulty': 'medium'
                },
                'challenge_006': {
                    'title': 'Natação 1km',
                    'description': 'Nade 1km em piscina ou mar aberto',
                    'category': 'swimming',
                    'difficulty': 'hard'
                }
            }
            
            participations_list = []
            for participation in participations:
                # Buscar detalhes do desafio
                challenge_detail = challenges_details.get(participation.challenge_id, {
                    'title': f'Desafio {participation.challenge_id}',
                    'description': 'Desafio personalizado',
                    'category': 'general',
                    'difficulty': 'medium'
                })
                
                participations_list.append({
                    'id': participation.id,
                    'challenge_id': participation.challenge_id,
                    'challenge_title': challenge_detail['title'],
                    'challenge_description': challenge_detail['description'],
                    'challenge_category': challenge_detail['category'],
                    'challenge_difficulty': challenge_detail['difficulty'],
                    'user_email': participation.user_email or f'user_{participation.user_id}@test.com',
                    'user_id': participation.user_id,
                    'stake_amount': float(participation.stake_amount or 0),
                    'status': participation.status,
                    'joined_at': participation.joined_at.isoformat() if participation.joined_at else None,
                    'completed_at': participation.completed_at.isoformat() if participation.completed_at else None,
                    'result_value': float(participation.result_value or 0) if participation.result_value else None,
                    'is_active': participation.status == 'active',
                    'is_completed': participation.status == 'completed'
                })
            
            print(f"✅ [PARTICIPATIONS] Encontradas {len(participations_list)} participações totais")
            
            # Separar participações ativas e completadas
            active_participations = [p for p in participations_list if p['is_active']]
            completed_participations = [p for p in participations_list if p['is_completed']]
            
            return jsonify({
                "participations": participations_list,
                "active_participations": active_participations,
                "completed_participations": completed_participations,
                "total": len(participations_list),
                "active_count": len(active_participations),
                "completed_count": len(completed_participations),
                "message": f"Todas as participações encontradas: {len(participations_list)}"
            })
        
        # Código original para usuário específico
        print(f"🎯 [PARTICIPATIONS] Buscando participações para: {user_email}")
        
        # Buscar usuário por email
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            print(f"❌ [PARTICIPATIONS] Usuário não encontrado: {user_email}")
            return jsonify({
                "participations": [],
                "active_participations": [],
                "completed_participations": [],
                "total": 0,
                "active_count": 0,
                "completed_count": 0,
                "message": "Usuário não encontrado"
            }), 404
        
        # Buscar participações do usuário
        participations = session.query(ChallengeParticipation).filter_by(user_id=user.id).all()
        
        # Mock de detalhes dos desafios (em produção, viria de uma tabela challenges)
        challenges_details = {
            'challenge_001': {
                'title': 'Corrida 5km em 30min',
                'description': 'Complete uma corrida de 5km em até 30 minutos',
                'category': 'running',
                'difficulty': 'medium'
            },
            'challenge_002': {
                'title': 'Battle Royale 10k Steps',
                'description': 'Seja um dos primeiros 10 a completar 10.000 passos',
                'category': 'walking',
                'difficulty': 'easy'
            },
            'challenge_003': {
                'title': 'Treino HIIT 45min',
                'description': 'Complete um treino HIIT de 45 minutos com frequência cardíaca elevada',
                'category': 'fitness',
                'difficulty': 'hard'
            }
        }
        
        participations_list = []
        for participation in participations:
            # Buscar detalhes do desafio
            challenge_detail = challenges_details.get(participation.challenge_id, {
                'title': f'Desafio {participation.challenge_id}',
                'description': 'Desafio personalizado',
                'category': 'general',
                'difficulty': 'medium'
            })
            
            participations_list.append({
                'id': participation.id,
                'challenge_id': participation.challenge_id,
                'challenge_title': challenge_detail['title'],
                'challenge_description': challenge_detail['description'],
                'challenge_category': challenge_detail['category'],
                'challenge_difficulty': challenge_detail['difficulty'],
                'user_email': user_email,
                'stake_amount': float(participation.stake_amount or 0),
                'status': participation.status,
                'joined_at': participation.joined_at.isoformat() if participation.joined_at else None,
                'completed_at': participation.completed_at.isoformat() if participation.completed_at else None,
                'result_value': float(participation.result_value or 0) if participation.result_value else None,
                'is_active': participation.status == 'active',
                'is_completed': participation.status == 'completed'
            })
        
        print(f"✅ [PARTICIPATIONS] Encontradas {len(participations_list)} participações para {user_email}")
        
        # Separar participações ativas e completadas
        active_participations = [p for p in participations_list if p['is_active']]
        completed_participations = [p for p in participations_list if p['is_completed']]
        
        print(f"📊 [PARTICIPATIONS] Ativas: {len(active_participations)}, Completadas: {len(completed_participations)}")
        
        return jsonify({
            "participations": participations_list,
            "active_participations": active_participations,
            "completed_participations": completed_participations,
            "total": len(participations_list),
            "active_count": len(active_participations),
            "completed_count": len(completed_participations),
            "message": f"Participações encontradas para {user_email}"
        })
        
    except Exception as e:
        print(f"❌ [PARTICIPATIONS] Erro ao buscar participações: {e}")
        import traceback
        print(f"❌ [PARTICIPATIONS] Stack trace: {traceback.format_exc()}")
        return jsonify({"error": f"Erro ao buscar participações: {str(e)}"}), 500
    finally:
        session.close()

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'BetFit API está funcionando',
        'timestamp': datetime.utcnow().isoformat(),
        'endpoints': [
            '/api/auth/register',
            '/api/auth/login',
            '/api/challenges',
            '/api/challenges/my-participations',
            '/api/challenges/all-participations',
            '/api/admin/dashboard/metrics'
        ]
    }), 200

# ==================== CORS HANDLER - ORIGINAL ====================

@app.after_request
def after_request(response):
    """Middleware para adicionar headers CORS em todas as respostas"""
    # Não adicionar Access-Control-Allow-Origin pois flask-cors já gerencia
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Cache-Control')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# ==================== MAIN ====================

if __name__ == '__main__':
    print("🚀 Iniciando BetFit Backend...")
    print("📊 Banco de dados: SQLite com SQLAlchemy")
    print("🌐 CORS habilitado para localhost:5173, localhost:8080 e localhost:3000")
    print("🔧 Rotas disponíveis:")
    print("   - GET /api/challenges/my-participations (CORRIGIDO - funciona sem email)")
    print("   - GET /api/challenges/all-participations (NOVO - todas as participações)")
    print("   - GET /api/health")
    print("✅ ENDPOINTS PARA VER PARTICIPAÇÕES:")
    print("   📊 Todas as participações: http://localhost:5001/api/challenges/all-participations")
    print("   👤 Por usuário: http://localhost:5001/api/challenges/my-participations?user_email=EMAIL")
    print("   📋 Sem email (todas): http://localhost:5001/api/challenges/my-participations")
    print("🎯 PARTICIPANTES DOS DESAFIOS PUXADOS DINAMICAMENTE DO BANCO!")
    app.run(host='0.0.0.0', port=5001, debug=True)

