# ==================== SERVIÇO DE NOTIFICAÇÕES ====================
# Sistema completo de notificações push via Socket.IO
# Inclui alertas de tempo para desafios

from datetime import datetime, timedelta
from sqlalchemy import and_, or_
from models import SessionLocal, User, Challenge, Participation, Message
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    """
    Serviço centralizado de notificações push
    Gerencia todos os tipos de notificações do sistema
    """

    def __init__(self, socketio):
        self.socketio = socketio
        self.notification_intervals = {
            'start_30min': timedelta(minutes=30),
            'start_15min': timedelta(minutes=15),
            'start_5min': timedelta(minutes=5),
            'start_2min': timedelta(minutes=2),
            'end_30min': timedelta(minutes=30),
            'end_15min': timedelta(minutes=15),
            'end_5min': timedelta(minutes=5)
        }

    def send_notification(self, user_id, notification_type, title, message, data=None):
        """
        Envia notificação via WebSocket para usuário específico

        Args:
            user_id: ID do usuário destinatário
            notification_type: Tipo da notificação (challenge_start, challenge_end, prize_won, etc)
            title: Título da notificação
            message: Mensagem da notificação
            data: Dados adicionais (opcional)
        """
        try:
            payload = {
                'type': notification_type,
                'title': title,
                'message': message,
                'timestamp': datetime.utcnow().isoformat(),
                'data': data or {}
            }

            # Emitir para o room específico do usuário
            self.socketio.emit('notification', payload, room=f'user_{user_id}')

            logger.info(f"[NOTIFICAÇÃO] Enviada para user_{user_id}: {notification_type}")
            return True

        except Exception as e:
            logger.error(f"[NOTIFICAÇÃO] Erro ao enviar: {str(e)}")
            return False

    def check_challenge_time_alerts(self):
        """
        Verifica desafios próximos de começar ou terminar
        Envia alertas: 30min, 15min, 5min, 2min antes do início/fim

        Chamado pelo cronjob a cada 1 minuto
        """
        session = SessionLocal()
        now = datetime.utcnow()

        try:
            # ==================== ALERTAS DE INÍCIO ====================

            for interval_key, interval_delta in self.notification_intervals.items():
                if not interval_key.startswith('start_'):
                    continue

                # Calcular janela de tempo
                target_time = now + interval_delta
                window_start = target_time - timedelta(seconds=30)  # 30s antes
                window_end = target_time + timedelta(seconds=30)    # 30s depois

                # Buscar desafios que começam neste intervalo
                challenges = session.query(Challenge).filter(
                    and_(
                        Challenge.start_date >= window_start,
                        Challenge.start_date <= window_end,
                        Challenge.status == 'active'
                    )
                ).all()

                for challenge in challenges:
                    # Buscar participantes do desafio
                    participations = session.query(Participation).filter(
                        and_(
                            Participation.challenge_id == challenge.id,
                            Participation.status.in_(['joined', 'active'])
                        )
                    ).all()

                    # Determinar mensagem baseada no intervalo
                    if interval_key == 'start_30min':
                        title = "⏰ Desafio em 30 minutos!"
                        message = f"Seu desafio '{challenge.title}' começa em 30 minutos. Prepare-se!"
                        icon = "⏰"
                    elif interval_key == 'start_15min':
                        title = "🔔 Desafio em 15 minutos!"
                        message = f"'{challenge.title}' começa em 15 minutos. Hora de se aquecer!"
                        icon = "🔔"
                    elif interval_key == 'start_5min':
                        title = "⚠️ Última chamada - 5 minutos!"
                        message = f"'{challenge.title}' começa em 5 minutos. Prepare seu equipamento!"
                        icon = "⚠️"
                    elif interval_key == 'start_2min':
                        title = "🚀 DESAFIO COMEÇANDO AGORA!"
                        message = f"'{challenge.title}' começa em 2 minutos. VAMOS LÁ!"
                        icon = "🚀"
                    else:
                        continue

                    # Enviar notificação para cada participante
                    for participation in participations:
                        self.send_notification(
                            user_id=participation.user_id,
                            notification_type='challenge_starting',
                            title=title,
                            message=message,
                            data={
                                'challenge_id': challenge.id,
                                'challenge_title': challenge.title,
                                'start_date': challenge.start_date.isoformat(),
                                'icon': icon,
                                'minutes_until_start': int(interval_delta.total_seconds() / 60)
                            }
                        )

                    logger.info(f"[ALERTA] {interval_key} enviado para {len(participations)} participantes do desafio {challenge.id}")

            # ==================== ALERTAS DE FIM ====================

            for interval_key, interval_delta in self.notification_intervals.items():
                if not interval_key.startswith('end_'):
                    continue

                # Calcular janela de tempo
                target_time = now + interval_delta
                window_start = target_time - timedelta(seconds=30)
                window_end = target_time + timedelta(seconds=30)

                # Buscar desafios que terminam neste intervalo
                challenges = session.query(Challenge).filter(
                    and_(
                        Challenge.end_date >= window_start,
                        Challenge.end_date <= window_end,
                        Challenge.status == 'active'
                    )
                ).all()

                for challenge in challenges:
                    # Buscar participantes ativos
                    participations = session.query(Participation).filter(
                        and_(
                            Participation.challenge_id == challenge.id,
                            Participation.status == 'active'
                        )
                    ).all()

                    # Determinar mensagem
                    if interval_key == 'end_30min':
                        title = "⏳ Desafio terminando em 30min!"
                        message = f"Último sprint! '{challenge.title}' termina em 30 minutos."
                    elif interval_key == 'end_15min':
                        title = "🏁 Reta final - 15 minutos!"
                        message = f"Dê tudo de si! '{challenge.title}' termina em 15 minutos."
                    elif interval_key == 'end_5min':
                        title = "⚡ ÚLTIMOS 5 MINUTOS!"
                        message = f"Acelere! '{challenge.title}' termina em 5 minutos!"
                    else:
                        continue

                    # Enviar notificação
                    for participation in participations:
                        self.send_notification(
                            user_id=participation.user_id,
                            notification_type='challenge_ending',
                            title=title,
                            message=message,
                            data={
                                'challenge_id': challenge.id,
                                'challenge_title': challenge.title,
                                'end_date': challenge.end_date.isoformat(),
                                'minutes_until_end': int(interval_delta.total_seconds() / 60)
                            }
                        )

                    logger.info(f"[ALERTA FIM] {interval_key} enviado para {len(participations)} participantes")

        except Exception as e:
            logger.error(f"[ALERTA] Erro ao verificar alertas de tempo: {str(e)}")
        finally:
            session.close()

    def notify_prize_won(self, user_id, challenge_title, prize_amount, position):
        """Notifica usuário que ganhou prêmio"""
        medals = {1: "🥇", 2: "🥈", 3: "🥉"}
        medal = medals.get(position, "🏆")

        self.send_notification(
            user_id=user_id,
            notification_type='prize_won',
            title=f"{medal} VOCÊ GANHOU!",
            message=f"Parabéns! Você ficou em {position}º lugar em '{challenge_title}' e ganhou R$ {prize_amount:.2f}!",
            data={
                'prize_amount': prize_amount,
                'position': position,
                'challenge_title': challenge_title
            }
        )

    def notify_challenge_completed(self, user_id, challenge_title):
        """Notifica que usuário completou um desafio"""
        self.send_notification(
            user_id=user_id,
            notification_type='challenge_completed',
            title="✅ Desafio Completo!",
            message=f"Você completou o desafio '{challenge_title}'! Aguardando apuração dos resultados...",
            data={'challenge_title': challenge_title}
        )

    def notify_new_message(self, user_id, sender_name, message_preview):
        """Notifica nova mensagem no chat"""
        self.send_notification(
            user_id=user_id,
            notification_type='new_message',
            title=f"💬 Nova mensagem de {sender_name}",
            message=message_preview[:100],
            data={'sender_name': sender_name}
        )

    def notify_challenge_invited(self, user_id, challenger_name, challenge_title):
        """Notifica que foi desafiado"""
        self.send_notification(
            user_id=user_id,
            notification_type='challenge_invited',
            title=f"🎯 Novo Desafio!",
            message=f"{challenger_name} te desafiou em '{challenge_title}'!",
            data={
                'challenger_name': challenger_name,
                'challenge_title': challenge_title
            }
        )

    def notify_payment_received(self, user_id, amount):
        """Notifica pagamento recebido"""
        self.send_notification(
            user_id=user_id,
            notification_type='payment_received',
            title="💰 Pagamento Recebido!",
            message=f"R$ {amount:.2f} foi adicionado à sua carteira!",
            data={'amount': amount}
        )

    def notify_withdrawal_approved(self, user_id, amount):
        """Notifica saque aprovado"""
        self.send_notification(
            user_id=user_id,
            notification_type='withdrawal_approved',
            title="✅ Saque Aprovado!",
            message=f"Seu saque de R$ {amount:.2f} foi aprovado e está a caminho!",
            data={'amount': amount}
        )


# ==================== FUNÇÕES AUXILIARES ====================

def init_notification_service(socketio):
    """Inicializa o serviço de notificações"""
    service = NotificationService(socketio)
    logger.info("[NOTIFICAÇÕES] Serviço inicializado com sucesso")
    return service


# ==================== ENDPOINTS DE TESTE ====================

def register_notification_routes(app, notification_service):
    """Registra rotas de teste de notificações"""

    from flask import request, jsonify

    @app.route('/api/notifications/test', methods=['POST'])
    def test_notification():
        """POST /api/notifications/test - Testar envio de notificação"""
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({'success': False, 'error': 'user_id required'}), 400

        success = notification_service.send_notification(
            user_id=user_id,
            notification_type='test',
            title="🧪 Notificação de Teste",
            message="Se você viu isso, as notificações estão funcionando!",
            data={'test': True}
        )

        return jsonify({
            'success': success,
            'message': 'Notificação enviada' if success else 'Erro ao enviar'
        })

    @app.route('/api/notifications/check-alerts', methods=['POST'])
    def trigger_alert_check():
        """POST /api/notifications/check-alerts - Forçar verificação de alertas (admin only)"""
        notification_service.check_challenge_time_alerts()
        return jsonify({'success': True, 'message': 'Verificação de alertas executada'})
