import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Send, X, Loader2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function ChatWindow({ currentUser, recipientId, recipientName, challengeId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Gerar room ID baseado no tipo de chat
  const getRoomId = () => {
    if (challengeId) {
      return `challenge_${challengeId}`;
    } else if (recipientId) {
      // Ordenar IDs para garantir mesma room para ambos usuários
      const ids = [currentUser.id, recipientId].sort();
      return `user_${ids[0]}_${ids[1]}`;
    }
    return null;
  };

  const roomId = getRoomId();

  // Scroll automático para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Conectar ao WebSocket
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('[CHAT] Conectado ao WebSocket');
      setIsConnected(true);

      // Entrar na sala
      if (roomId) {
        newSocket.emit('join', {
          room: roomId,
          username: currentUser.name || currentUser.email
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[CHAT] Desconectado do WebSocket');
      setIsConnected(false);
    });

    newSocket.on('new_message', (data) => {
      console.log('[CHAT] Nova mensagem recebida:', data);
      setMessages((prev) => [...prev, {
        id: data.id,
        sender_id: data.sender_id,
        sender_name: data.sender_name,
        sender_avatar: data.sender_avatar,
        content: data.content,
        created_at: data.created_at
      }]);
    });

    newSocket.on('user_typing', (data) => {
      if (data.room === roomId && data.is_typing) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on('error', (error) => {
      console.error('[CHAT] Erro:', error);
    });

    setSocket(newSocket);

    return () => {
      if (roomId && newSocket) {
        newSocket.emit('leave', {
          room: roomId,
          username: currentUser.name || currentUser.email
        });
      }
      newSocket.disconnect();
    };
  }, [currentUser, roomId]);

  // Carregar mensagens anteriores
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          user_email: currentUser.email,
          ...(challengeId ? { challenge_id: challengeId } : { other_user_id: recipientId })
        });

        const response = await fetch(`${BACKEND_URL}/api/chat/messages?${params}`);
        const data = await response.json();

        if (data.success) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('[CHAT] Erro ao carregar mensagens:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentUser, recipientId, challengeId]);

  // Enviar mensagem
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      room: roomId,
      sender_id: currentUser.id,
      sender_name: currentUser.name || currentUser.email,
      sender_avatar: currentUser.profile_picture,
      content: newMessage.trim(),
      message_type: 'text'
    };

    // Emitir via WebSocket para tempo real
    socket.emit('send_message', messageData);

    // Também salvar via REST API como fallback
    try {
      await fetch(`${BACKEND_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_email: currentUser.email,
          receiver_id: recipientId,
          challenge_id: challengeId,
          content: newMessage.trim(),
          message_type: 'text'
        })
      });
    } catch (error) {
      console.error('[CHAT] Erro ao enviar mensagem:', error);
    }

    setNewMessage('');
  };

  // Indicador de digitação
  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', {
      room: roomId,
      username: currentUser.name || currentUser.email,
      is_typing: true
    });

    // Cancelar timeout anterior
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Parar indicador após 2 segundos
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing', {
        room: roomId,
        username: currentUser.name || currentUser.email,
        is_typing: false
      });
    }, 2000);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
            {(recipientName || 'Chat')[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold">{recipientName || (challengeId ? 'Chat do Desafio' : 'Chat')}</h3>
            <p className="text-xs text-white/80">
              {isConnected ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-sm mt-2">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUser.id;

            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isOwnMessage
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 text-indigo-600 dark:text-indigo-400">
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            disabled={!isConnected}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send size={18} />
          </button>
        </div>
        {!isConnected && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            Reconectando ao chat...
          </p>
        )}
      </form>
    </div>
  );
}
