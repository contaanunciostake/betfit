# ==================== ANALYTICS ENDPOINTS ====================
# Estatísticas e análises do usuário

from flask import request, jsonify
from sqlalchemy import func
from datetime import datetime, timedelta
from models import SessionLocal, User, ChallengeParticipation as Participation, Transaction, Challenge

def get_user_analytics(user_email):
    """GET /api/analytics/<user_email> - Estatísticas completas do usuário"""
    session = SessionLocal()
    try:
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'success': False, 'error': 'Usuário não encontrado'}), 404

        # Período de análise
        last_30_days = datetime.utcnow() - timedelta(days=30)
        last_7_days = datetime.utcnow() - timedelta(days=7)

        # Total ganho
        total_earned = session.query(func.sum(Participation.prize_amount)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner'
        ).scalar() or 0

        total_earned_30d = session.query(func.sum(Participation.prize_amount)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner',
            Participation.completed_at >= last_30_days
        ).scalar() or 0

        # Desafios
        challenges_total = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id
        ).scalar() or 0

        challenges_completed = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status.in_(['winner', 'completed'])
        ).scalar() or 0

        challenges_won = session.query(func.count(Participation.id)).filter(
            Participation.user_id == user.id,
            Participation.status == 'winner'
        ).scalar() or 0

        # Taxa de vitória
        win_rate = (challenges_won / challenges_completed * 100) if challenges_completed > 0 else 0

        # Streak (sequência de dias)
        # Simplificado: contar desafios nos últimos 7 dias
        active_days_7 = session.query(
            func.count(func.distinct(func.date(Participation.joined_at)))
        ).filter(
            Participation.user_id == user.id,
            Participation.joined_at >= last_7_days
        ).scalar() or 0

        # Evolução mensal (dados para gráfico)
        monthly_data = []
        for i in range(30, -1, -1):
            date = datetime.utcnow() - timedelta(days=i)
            daily_earned = session.query(func.sum(Participation.prize_amount)).filter(
                Participation.user_id == user.id,
                Participation.status == 'winner',
                func.date(Participation.completed_at) == date.date()
            ).scalar() or 0

            monthly_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'earned': float(daily_earned)
            })

        # Posições conquistadas
        positions = {
            '1st': session.query(func.count(Participation.id)).filter(
                Participation.user_id == user.id,
                Participation.status == 'winner',
                Participation.position == 1
            ).scalar() or 0,
            '2nd': session.query(func.count(Participation.id)).filter(
                Participation.user_id == user.id,
                Participation.status == 'winner',
                Participation.position == 2
            ).scalar() or 0,
            '3rd': session.query(func.count(Participation.id)).filter(
                Participation.user_id == user.id,
                Participation.status == 'winner',
                Participation.position == 3
            ).scalar() or 0
        }

        # Média de usuários (para comparação)
        avg_earned = session.query(func.avg(func.sum(Participation.prize_amount))).filter(
            Participation.status == 'winner'
        ).group_by(Participation.user_id).scalar() or 0

        session.close()

        return jsonify({
            'success': True,
            'user': {
                'name': user.name,
                'email': user.email
            },
            'earnings': {
                'total': float(total_earned),
                'last_30_days': float(total_earned_30d),
                'average_comparison': float(avg_earned)
            },
            'challenges': {
                'total': challenges_total,
                'completed': challenges_completed,
                'won': challenges_won,
                'win_rate': round(win_rate, 2)
            },
            'positions': positions,
            'activity': {
                'streak_days': active_days_7,
                'last_7_days_active': active_days_7
            },
            'monthly_evolution': monthly_data
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


def register_analytics_routes(app):
    """Registra rotas de analytics"""
    app.route('/api/analytics/<user_email>', methods=['GET'])(get_user_analytics)
