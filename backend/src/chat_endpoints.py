# ==================== ENDPOINTS E WEBSOCKET DO CHAT ====================
# Arquivo separado para manter main.py organizado

from flask import request, jsonify
from flask_socketio import emit, join_room, leave_room
from sqlalchemy import or_, and_
from datetime import datetime
from models import SessionLocal, User, Message, Challenge

# ==================== REST ENDPOINTS ====================

def send_message():
    """POST /api/chat/send - Enviar mensagem"""
    try:
        data = request.get_json()
        sender_email = data.get('sender_email')
        receiver_id = data.get('receiver_id')
        challenge_id = data.get('challenge_id')
        content = data.get('content')
        message_type = data.get('message_type', 'text')

        if not sender_email or not content:
            return jsonify({'success': False, 'message': 'sender_email e content são obrigatórios'}), 400

        if not receiver_id and not challenge_id:
            return jsonify({'success': False, 'message': 'Especifique receiver_id ou challenge_id'}), 400

        session = SessionLocal()

        # Buscar sender
        sender = session.query(User).filter_by(email=sender_email).first()
        if not sender:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

        # Criar mensagem
        message = Message(
            sender_id=sender.id,
            receiver_id=receiver_id,
            challenge_id=challenge_id,
            content=content,
            message_type=message_type
        )

        session.add(message)
        session.commit()

        message_dict = message.to_dict()
        session.close()

        return jsonify({
            'success': True,
            'message': 'Mensagem enviada',
            'data': message_dict
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def get_conversations():
    """GET /api/chat/conversations - Listar conversas do usuário"""
    try:
        user_email = request.args.get('user_email')

        if not user_email:
            return jsonify({'success': False, 'message': 'user_email é obrigatório'}), 400

        session = SessionLocal()

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

        # Buscar últimas mensagens de cada conversa
        conversations = session.query(Message).filter(
            or_(
                Message.sender_id == user.id,
                Message.receiver_id == user.id
            )
        ).order_by(Message.created_at.desc()).all()

        # Agrupar por usuário ou desafio
        grouped = {}
        for msg in conversations:
            if msg.challenge_id:
                key = f"challenge_{msg.challenge_id}"
            else:
                other_id = msg.receiver_id if msg.sender_id == user.id else msg.sender_id
                key = f"user_{other_id}"

            if key not in grouped:
                grouped[key] = msg.to_dict()

        result = list(grouped.values())
        session.close()

        return jsonify({
            'success': True,
            'conversations': result,
            'count': len(result)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def get_messages():
    """GET /api/chat/messages - Buscar mensagens de uma conversa"""
    try:
        user_email = request.args.get('user_email')
        other_user_id = request.args.get('other_user_id')
        challenge_id = request.args.get('challenge_id')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))

        if not user_email:
            return jsonify({'success': False, 'message': 'user_email é obrigatório'}), 400

        if not other_user_id and not challenge_id:
            return jsonify({'success': False, 'message': 'Especifique other_user_id ou challenge_id'}), 400

        session = SessionLocal()

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

        # Buscar mensagens
        query = session.query(Message)

        if challenge_id:
            # Chat do desafio
            query = query.filter(Message.challenge_id == challenge_id)
        else:
            # Chat 1-on-1
            query = query.filter(
                or_(
                    and_(Message.sender_id == user.id, Message.receiver_id == other_user_id),
                    and_(Message.sender_id == other_user_id, Message.receiver_id == user.id)
                )
            )

        messages = query.order_by(Message.created_at.desc()).limit(limit).offset(offset).all()
        messages.reverse()  # Ordem cronológica

        result = [msg.to_dict() for msg in messages]
        session.close()

        return jsonify({
            'success': True,
            'messages': result,
            'count': len(result)
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def mark_as_read():
    """PUT /api/chat/read - Marcar mensagens como lidas"""
    try:
        data = request.get_json()
        user_email = data.get('user_email')
        other_user_id = data.get('other_user_id')
        challenge_id = data.get('challenge_id')

        if not user_email:
            return jsonify({'success': False, 'message': 'user_email é obrigatório'}), 400

        session = SessionLocal()

        # Buscar usuário
        user = session.query(User).filter_by(email=user_email).first()
        if not user:
            return jsonify({'success': False, 'message': 'Usuário não encontrado'}), 404

        # Marcar mensagens como lidas
        query = session.query(Message).filter(
            Message.receiver_id == user.id,
            Message.is_read == False
        )

        if challenge_id:
            query = query.filter(Message.challenge_id == challenge_id)
        elif other_user_id:
            query = query.filter(Message.sender_id == other_user_id)

        count = query.update({'is_read': True, 'updated_at': datetime.utcnow()})
        session.commit()
        session.close()

        return jsonify({
            'success': True,
            'message': f'{count} mensagens marcadas como lidas'
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ==================== WEBSOCKET EVENTS ====================

def setup_socketio_events(socketio):
    """Configurar eventos do WebSocket"""

    @socketio.on('connect')
    def handle_connect():
        """Cliente conectado"""
        print(f'[CHAT] Cliente conectado: {request.sid}')
        emit('connected', {'message': 'Conectado ao chat'})


    @socketio.on('disconnect')
    def handle_disconnect():
        """Cliente desconectado"""
        print(f'[CHAT] Cliente desconectado: {request.sid}')


    @socketio.on('join')
    def handle_join(data):
        """Entrar numa sala (conversa 1-on-1 ou desafio)"""
        room = data.get('room')
        username = data.get('username', 'Anônimo')

        if not room:
            emit('error', {'message': 'room é obrigatório'})
            return

        join_room(room)
        print(f'[CHAT] {username} entrou na sala {room}')
        emit('user_joined', {
            'message': f'{username} entrou no chat',
            'room': room
        }, room=room)


    @socketio.on('leave')
    def handle_leave(data):
        """Sair de uma sala"""
        room = data.get('room')
        username = data.get('username', 'Anônimo')

        if not room:
            emit('error', {'message': 'room é obrigatório'})
            return

        leave_room(room)
        print(f'[CHAT] {username} saiu da sala {room}')
        emit('user_left', {
            'message': f'{username} saiu do chat',
            'room': room
        }, room=room)


    @socketio.on('send_message')
    def handle_send_message(data):
        """Enviar mensagem em tempo real"""
        room = data.get('room')
        sender_id = data.get('sender_id')
        sender_name = data.get('sender_name')
        sender_avatar = data.get('sender_avatar')
        content = data.get('content')
        message_type = data.get('message_type', 'text')

        if not room or not sender_id or not content:
            emit('error', {'message': 'room, sender_id e content são obrigatórios'})
            return

        # Salvar no banco
        try:
            session = SessionLocal()

            # Determinar se é chat 1-on-1 ou desafio
            receiver_id = None
            challenge_id = None

            if room.startswith('challenge_'):
                challenge_id = room.replace('challenge_', '')
            elif room.startswith('user_'):
                # Room format: user_{user1_id}_{user2_id}
                parts = room.split('_')
                if len(parts) == 3:
                    receiver_id = parts[2] if parts[1] == sender_id else parts[1]

            message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                challenge_id=challenge_id,
                content=content,
                message_type=message_type
            )

            session.add(message)
            session.commit()

            message_dict = message.to_dict()
            session.close()

            # Emitir para todos na sala
            emit('new_message', {
                'id': message_dict['id'],
                'sender_id': sender_id,
                'sender_name': sender_name,
                'sender_avatar': sender_avatar,
                'content': content,
                'message_type': message_type,
                'created_at': message_dict['created_at'],
                'room': room
            }, room=room)

            print(f'[CHAT] Mensagem enviada na sala {room} por {sender_name}')

        except Exception as e:
            print(f'[CHAT] Erro ao salvar mensagem: {str(e)}')
            emit('error', {'message': f'Erro ao enviar mensagem: {str(e)}'})


    @socketio.on('typing')
    def handle_typing(data):
        """Indicador de digitação"""
        room = data.get('room')
        username = data.get('username', 'Alguém')
        is_typing = data.get('is_typing', True)

        if not room:
            emit('error', {'message': 'room é obrigatório'})
            return

        # Emitir para todos na sala exceto o sender
        emit('user_typing', {
            'username': username,
            'is_typing': is_typing,
            'room': room
        }, room=room, include_self=False)


    print('[CHAT] WebSocket events configurados')


# ==================== FUNÇÕES DE REGISTRO ====================

def register_chat_routes(app):
    """Registrar rotas REST do chat"""
    app.add_url_rule('/api/chat/send', 'send_message', send_message, methods=['POST'])
    app.add_url_rule('/api/chat/conversations', 'get_conversations', get_conversations, methods=['GET'])
    app.add_url_rule('/api/chat/messages', 'get_messages', get_messages, methods=['GET'])
    app.add_url_rule('/api/chat/read', 'mark_as_read', mark_as_read, methods=['PUT'])
    print('[OK] Chat REST endpoints registrados')
