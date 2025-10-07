# ==================== LEADERBOARD ENDPOINTS ====================
# Sistema de ranking global de usuários

from flask import request, jsonify
from sqlalchemy import func
from datetime import datetime, timedelta
from models import SessionLocal, User, Participation

def get_leaderboard():
    """GET /api/leaderboard - Retorna ranking de usuários"""
    try:
        period = request.args.get('period', 'all')  # all, month, week
        limit = int(request.args.get('limit', 10))

        session = SessionLocal()

        # Determinar data de início baseada no período
        if period == 'month':
            start_date = datetime.utcnow() - timedelta(days=30)
        elif period == 'week':
            start_date = datetime.utcnow() - timedelta(days=7)
        else:
            start_date = None

        # Query base
        query = session.query(
            User.id,
            User.name,
            User.profile_picture,
            func.count(Participation.id).label('challenges_completed'),
            func.sum(Participation.prize_amount).label('total_earned')
        ).join(
            Participation, User.id == Participation.user_id
        ).filter(
            Participation.status == 'winner'
        )

        # Filtrar por período se necessário
        if start_date:
            query = query.filter(Participation.completed_at >= start_date)

        # Agrupar e ordenar
        leaderboard = query.group_by(User.id, User.name, User.profile_picture).order_by(
            func.sum(Participation.prize_amount).desc()
        ).limit(limit).all()

        # Formatar resultado
        result = [
            {
                'position': idx + 1,
                'user_id': user.id,
                'name': user.name,
                'avatar': user.profile_picture or '/default-avatar.png',
                'challenges_completed': int(user.challenges_completed),
                'total_earned': float(user.total_earned or 0)
            }
            for idx, user in enumerate(leaderboard)
        ]

        session.close()

        return jsonify({
            'success': True,
            'period': period,
            'leaderboard': result
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def get_user_rank(user_email):
    """GET /api/leaderboard/rank/<user_email> - Posição do usuário no ranking"""
    try:
        session = SessionLocal()

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404

        # Calcular total ganho do usuário
        user_total = session.query(
            func.sum(Participation.prize_amount).label('total')
        ).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner'
        ).scalar() or 0

        # Contar quantos usuários têm total maior
        rank = session.query(func.count(func.distinct(User.id))).select_from(User).join(
            Participation, User.id == Participation.user_id
        ).filter(
            Participation.status == 'winner'
        ).group_by(User.id).having(
            func.sum(Participation.prize_amount) > user_total
        ).count() + 1

        # Contar desafios completados
        challenges_completed = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status.in_(['winner', 'completed'])
        ).scalar()

        session.close()

        return jsonify({
            'success': True,
            'user': {
                'name': user.name,
                'rank': rank,
                'total_earned': float(user_total),
                'challenges_completed': challenges_completed
            }
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def register_leaderboard_routes(app):
    """Registra rotas do leaderboard"""
    app.route('/api/leaderboard', methods=['GET'])(get_leaderboard)
    app.route('/api/leaderboard/rank/<user_email>', methods=['GET'])(get_user_rank)
