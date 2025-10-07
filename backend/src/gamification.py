# ==================== SISTEMA DE GAMIFICAÇÃO ====================
# Níveis, XP, Badges e Recompensas

from sqlalchemy import func
from datetime import datetime, timedelta
from models import SessionLocal, User, Participation, Challenge
import json

# ==================== CONSTANTES ====================

LEVELS = {
    'bronze': {'min_xp': 0, 'max_xp': 1000, 'name': 'Bronze', 'color': '#CD7F32'},
    'silver': {'min_xp': 1000, 'max_xp': 5000, 'name': 'Prata', 'color': '#C0C0C0'},
    'gold': {'min_xp': 5000, 'max_xp': 15000, 'name': 'Ouro', 'color': '#FFD700'},
    'diamond': {'min_xp': 15000, 'max_xp': float('inf'), 'name': 'Diamante', 'color': '#B9F2FF'}
}

XP_REWARDS = {
    'challenge_completed': 50,
    'challenge_won_1st': 200,
    'challenge_won_2nd': 150,
    'challenge_won_3rd': 100,
    'streak_7_days': 500,
    'streak_30_days': 2000,
    'referral': 100,
    'first_challenge': 100
}

BADGES = {
    'first_run': {'name': '🏃 Primeira Corrida', 'description': 'Completou seu primeiro desafio'},
    'streak_7': {'name': '🔥 Sequência de 7 dias', 'description': '7 dias consecutivos de atividade'},
    'streak_30': {'name': '💥 Maratonista', 'description': '30 dias consecutivos'},
    'challenges_10': {'name': '💪 Veterano', 'description': '10 desafios completados'},
    'challenges_50': {'name': '⚡ Profissional', 'description': '50 desafios completados'},
    'challenges_100': {'name': '🏆 Lenda', 'description': '100 desafios completados'},
    'first_place': {'name': '🥇 Campeão', 'description': 'Primeiro lugar em um desafio'},
    'earnings_1000': {'name': '💰 R$1000 Ganhos', 'description': 'Acumulou R$1000 em prêmios'},
    'earnings_5000': {'name': '💎 R$5000 Ganhos', 'description': 'Acumulou R$5000 em prêmios'},
    'speed_demon': {'name': '⚡ Relâmpago', 'description': 'Completou desafio em tempo recorde'}
}


# ==================== FUNÇÕES DE GAMIFICAÇÃO ====================

def get_user_level(xp):
    """Retorna o nível baseado no XP"""
    for level_key, level_data in LEVELS.items():
        if level_data['min_xp'] <= xp < level_data['max_xp']:
            return {
                'key': level_key,
                **level_data,
                'progress': ((xp - level_data['min_xp']) / (level_data['max_xp'] - level_data['min_xp'])) * 100 if level_data['max_xp'] != float('inf') else 100
            }
    return LEVELS['diamond']


def award_xp(user_email, xp_type, amount=None):
    """Adiciona XP ao usuário"""
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return {'success': False, 'error': 'Usuário não encontrado'}

        # Determinar quantidade de XP
        xp_amount = amount or XP_REWARDS.get(xp_type, 0)

        # Inicializar XP se não existir
        if not hasattr(user, 'xp') or user.xp is None:
            user.xp = 0

        old_level = get_user_level(user.xp)
        user.xp += xp_amount
        new_level = get_user_level(user.xp)

        session.commit()

        # Verificar se subiu de nível
        level_up = old_level['key'] != new_level['key']

        return {
            'success': True,
            'xp_awarded': xp_amount,
            'total_xp': user.xp,
            'level': new_level,
            'level_up': level_up
        }

    except Exception as e:
        session.rollback()
        return {'success': False, 'error': str(e)}
    finally:
        session.close()


def check_and_award_badges(user_email):
    """Verifica e concede badges ao usuário"""
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return {'success': False, 'error': 'Usuário não encontrado'}

        # Carregar badges atuais
        current_badges = json.loads(user.badges) if hasattr(user, 'badges') and user.badges else []
        new_badges = []

        # Contar desafios completados
        challenges_completed = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status.in_(['winner', 'completed'])
        ).scalar() or 0

        # Badge: Primeira corrida
        if challenges_completed >= 1 and 'first_run' not in current_badges:
            current_badges.append('first_run')
            new_badges.append(BADGES['first_run'])

        # Badge: 10 desafios
        if challenges_completed >= 10 and 'challenges_10' not in current_badges:
            current_badges.append('challenges_10')
            new_badges.append(BADGES['challenges_10'])

        # Badge: 50 desafios
        if challenges_completed >= 50 and 'challenges_50' not in current_badges:
            current_badges.append('challenges_50')
            new_badges.append(BADGES['challenges_50'])

        # Badge: 100 desafios
        if challenges_completed >= 100 and 'challenges_100' not in current_badges:
            current_badges.append('challenges_100')
            new_badges.append(BADGES['challenges_100'])

        # Badge: Primeiro lugar
        first_place_count = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner',
            Participation.position == 1
        ).scalar() or 0

        if first_place_count >= 1 and 'first_place' not in current_badges:
            current_badges.append('first_place')
            new_badges.append(BADGES['first_place'])

        # Badge: Ganhos
        total_earnings = session.query(func.sum(Participation.prize_amount)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner'
        ).scalar() or 0

        if total_earnings >= 1000 and 'earnings_1000' not in current_badges:
            current_badges.append('earnings_1000')
            new_badges.append(BADGES['earnings_1000'])

        if total_earnings >= 5000 and 'earnings_5000' not in current_badges:
            current_badges.append('earnings_5000')
            new_badges.append(BADGES['earnings_5000'])

        # Salvar badges
        if hasattr(user, 'badges'):
            user.badges = json.dumps(current_badges)
            session.commit()

        return {
            'success': True,
            'new_badges': new_badges,
            'total_badges': len(current_badges)
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}
    finally:
        session.close()


def get_user_gamification_stats(user_email):
    """Retorna estatísticas completas de gamificação do usuário"""
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return {'success': False, 'error': 'Usuário não encontrado'}

        # XP e Nível
        xp = user.xp if hasattr(user, 'xp') and user.xp else 0
        level = get_user_level(xp)

        # Badges
        badges = json.loads(user.badges) if hasattr(user, 'badges') and user.badges else []
        badge_details = [BADGES[badge_key] for badge_key in badges if badge_key in BADGES]

        # Estatísticas
        challenges_completed = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status.in_(['winner', 'completed'])
        ).scalar() or 0

        challenges_won = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner'
        ).scalar() or 0

        total_earned = session.query(func.sum(Participation.prize_amount)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner'
        ).scalar() or 0

        # Próximo nível
        next_level_xp = level['max_xp'] if level['max_xp'] != float('inf') else None

        return {
            'success': True,
            'xp': xp,
            'level': level,
            'next_level_xp': next_level_xp,
            'badges': badge_details,
            'total_badges': len(badges),
            'stats': {
                'challenges_completed': challenges_completed,
                'challenges_won': challenges_won,
                'total_earned': float(total_earned),
                'win_rate': (challenges_won / challenges_completed * 100) if challenges_completed > 0 else 0
            }
        }

    except Exception as e:
        return {'success': False, 'error': str(e)}
    finally:
        session.close()


# ==================== ENDPOINTS ====================

def register_gamification_routes(app):
    """Registra rotas de gamificação"""
    from flask import request, jsonify

    @app.route('/api/gamification/<user_email>', methods=['GET'])
    def get_gamification_stats(user_email):
        """GET /api/gamification/<user_email> - Estatísticas de gamificação"""
        result = get_user_gamification_stats(user_email)
        if result['success']:
            return jsonify(result)
        return jsonify(result), 404

    @app.route('/api/gamification/award-xp', methods=['POST'])
    def award_xp_endpoint():
        """POST /api/gamification/award-xp - Adicionar XP ao usuário"""
        data = request.get_json()
        user_email = data.get('user_email')
        xp_type = data.get('xp_type')
        amount = data.get('amount')

        if not user_email or not xp_type:
            return jsonify({'success': False, 'error': 'user_email e xp_type são obrigatórios'}), 400

        result = award_xp(user_email, xp_type, amount)
        return jsonify(result)

    @app.route('/api/gamification/check-badges', methods=['POST'])
    def check_badges_endpoint():
        """POST /api/gamification/check-badges - Verificar novos badges"""
        data = request.get_json()
        user_email = data.get('user_email')

        if not user_email:
            return jsonify({'success': False, 'error': 'user_email é obrigatório'}), 400

        result = check_and_award_badges(user_email)
        return jsonify(result)

    @app.route('/api/gamification/levels', methods=['GET'])
    def get_levels():
        """GET /api/gamification/levels - Listar todos os níveis"""
        return jsonify({
            'success': True,
            'levels': LEVELS
        })

    @app.route('/api/gamification/badges', methods=['GET'])
    def get_all_badges():
        """GET /api/gamification/badges - Listar todos os badges"""
        return jsonify({
            'success': True,
            'badges': BADGES
        })
