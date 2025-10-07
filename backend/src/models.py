# MODELOS ATUALIZADOS COM INTEGRAÇÃO FITNESS - HealthKit e Health Connect + MÚLTIPLOS VENCEDORES
# CORREÇÃO: is_active agora é Boolean

from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime
import uuid
import json
import os

Base = declarative_base()

# MODELO EXISTENTE - User (sem alterações)
class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String, nullable=True)
    status = Column(String, default='active')
    kyc_status = Column(String, default='pending')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    total_bets = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_deposited = Column(Float, default=0.0)
    total_withdrawn = Column(Float, default=0.0)
    
    # Relacionamentos existentes
    wallets = relationship("Wallet", back_populates="user")
    transactions = relationship("Transaction", back_populates="user")
    challenge_participations = relationship("ChallengeParticipation", back_populates="user")
    
    # NOVOS relacionamentos para fitness
    fitness_connections = relationship("FitnessConnection", back_populates="user")
    fitness_data = relationship("FitnessData", back_populates="user")

# NOVOS MODELOS PARA INTEGRAÇÃO FITNESS

class FitnessConnection(Base):
    """Modelo para armazenar conexões dos usuários com apps de fitness"""
    __tablename__ = 'fitness_connections'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False, index=True)
    platform = Column(String, nullable=False)  # 'apple_health', 'health_connect', 'strava', etc.
    platform_user_id = Column(String, nullable=True)  # ID do usuário na plataforma externa
    access_token = Column(Text, nullable=True)  # Token de acesso (criptografado)
    refresh_token = Column(Text, nullable=True)  # Token de refresh (criptografado)
    token_expires_at = Column(DateTime, nullable=True)
    permissions = Column(Text, nullable=True)  # Permissões concedidas em JSON
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, nullable=True)
    sync_status = Column(String, default='connected')  # connected, error, disconnected
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relacionamentos
    user = relationship("User", back_populates="fitness_connections")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'platform': self.platform,
            'platform_user_id': self.platform_user_id,
            'permissions': json.loads(self.permissions) if self.permissions else [],
            'is_active': self.is_active,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'sync_status': self.sync_status,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class FitnessData(Base):
    """Modelo para armazenar dados de fitness recebidos dos apps"""
    __tablename__ = 'fitness_data'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False, index=True)
    connection_id = Column(String, ForeignKey('fitness_connections.id'), nullable=False)
    data_type = Column(String, nullable=False)  # 'steps', 'distance', 'calories', 'workout', etc.
    value = Column(Float, nullable=False)  # Valor numérico do dado
    unit = Column(String, nullable=True)  # Unidade (steps, meters, calories, minutes, etc.)
    start_time = Column(DateTime, nullable=False)  # Início da atividade
    end_time = Column(DateTime, nullable=True)  # Fim da atividade
    source_app = Column(String, nullable=True)  # App que gerou o dado (Apple Watch, Strava, etc.)
    device_info = Column(Text, nullable=True)  # Informações do dispositivo em JSON
    raw_data = Column(Text, nullable=True)  # Dados brutos em JSON para auditoria
    processed_at = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    user = relationship("User", back_populates="fitness_data")
    connection = relationship("FitnessConnection")
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'connection_id': self.connection_id,
            'data_type': self.data_type,
            'value': float(self.value),
            'unit': self.unit,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None,
            'source_app': self.source_app,
            'device_info': json.loads(self.device_info) if self.device_info else {},
            'processed_at': self.processed_at.isoformat() if self.processed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    


# ==================== MODELOS FITBIT ====================

class FitbitUser(Base):
    """Modelo para armazenar conexões Fitbit dos usuários"""
    __tablename__ = 'fitbit_users'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False, index=True)
    fitbit_user_id = Column(String(50), unique=True, nullable=False)
    access_token = Column(String(500), nullable=False)
    refresh_token = Column(String(500), nullable=False)
    token_expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relacionamento
    user = relationship('User', backref='fitbit_connection')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'fitbit_user_id': self.fitbit_user_id,
            'token_expires_at': self.token_expires_at.isoformat() if self.token_expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class FitbitActivity(Base):
    """Modelo para armazenar atividades do Fitbit"""
    __tablename__ = 'fitbit_activities'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    fitbit_user_id = Column(String, ForeignKey('fitbit_users.id'), nullable=False, index=True)
    activity_id = Column(String(50), unique=True, nullable=False)
    activity_type = Column(String(50))  # run, walk, bike, etc
    start_time = Column(DateTime, nullable=False)
    duration = Column(Integer)  # milissegundos
    distance = Column(Float)  # km
    calories = Column(Integer)
    steps = Column(Integer)
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    raw_data = Column(Text)  # JSON completo
    
    # Relacionamento
    fitbit_user = relationship('FitbitUser', backref='activities')
    
    def to_dict(self):
        return {
            'id': self.id,
            'fitbit_user_id': self.fitbit_user_id,
            'activity_id': self.activity_id,
            'activity_type': self.activity_type,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'duration': self.duration,
            'distance': float(self.distance) if self.distance else 0.0,
            'calories': self.calories,
            'steps': self.steps,
            'received_at': self.received_at.isoformat() if self.received_at else None
        }

class FitbitSubscription(Base):
    """Modelo para armazenar subscriptions de webhooks Fitbit"""
    __tablename__ = 'fitbit_subscriptions'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    fitbit_user_id = Column(String, ForeignKey('fitbit_users.id'), nullable=False, index=True)
    subscription_id = Column(String(100), unique=True, nullable=False)
    collection_type = Column(String(50))  # activities, sleep, body
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamento
    fitbit_user = relationship('FitbitUser', backref='subscriptions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'fitbit_user_id': self.fitbit_user_id,
            'subscription_id': self.subscription_id,
            'collection_type': self.collection_type,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ChallengeValidation(Base):
    """Modelo para validação automática de desafios usando dados de fitness"""
    __tablename__ = 'challenge_validations'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    participation_id = Column(String, ForeignKey('challenge_participations.id'), nullable=False)
    challenge_id = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    fitness_data_ids = Column(Text, nullable=True)  # IDs dos dados de fitness usados (JSON array)
    validation_type = Column(String, nullable=False)  # 'automatic', 'manual', 'hybrid'
    validation_status = Column(String, default='pending')  # pending, validated, rejected, reviewing
    validation_result = Column(Text, nullable=True)  # Resultado da validação em JSON
    target_value = Column(Float, nullable=False)  # Valor alvo do desafio
    achieved_value = Column(Float, nullable=True)  # Valor alcançado pelo usuário
    confidence_score = Column(Float, nullable=True)  # Score de confiança da validação (0-1)
    validation_notes = Column(Text, nullable=True)  # Notas da validação
    validated_by = Column(String, nullable=True)  # ID do admin que validou (se manual)
    validated_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relacionamentos
    user = relationship("User")
    participation = relationship("ChallengeParticipation")
    
    def to_dict(self):
        return {
            'id': self.id,
            'participation_id': self.participation_id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'fitness_data_ids': json.loads(self.fitness_data_ids) if self.fitness_data_ids else [],
            'validation_type': self.validation_type,
            'validation_status': self.validation_status,
            'validation_result': json.loads(self.validation_result) if self.validation_result else {},
            'target_value': float(self.target_value),
            'achieved_value': float(self.achieved_value) if self.achieved_value else None,
            'confidence_score': float(self.confidence_score) if self.confidence_score else None,
            'validation_notes': self.validation_notes,
            'validated_by': self.validated_by,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# MODELOS EXISTENTES (mantidos sem alteração)
class Wallet(Base):
    __tablename__ = 'wallets'
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'), index=True)
    balance = Column(Float, default=0.0)
    available = Column(Float, default=0.0)
    pending = Column(Float, default=0.0)
    currency = Column(String, default='BRL')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="wallets")

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey('users.id'), index=True)
    type = Column(String)
    amount = Column(Float)
    description = Column(Text)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    admin_id = Column(String, nullable=True)
    
    user = relationship("User", back_populates="transactions")

class ChallengeParticipation(Base):
    __tablename__ = 'challenge_participations'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False, index=True)
    stake_amount = Column(Float, nullable=False)
    status = Column(String, default='active')
    result_value = Column(Float, nullable=True)
    result_submitted_at = Column(DateTime, nullable=True)
    validation_status = Column(String, default='pending')
    validation_data = Column(Text, nullable=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user_email = Column(String, nullable=True)
    
    # NOVOS CAMPOS PARA MÚLTIPLOS VENCEDORES
    final_position = Column(Integer, nullable=True)  # Posição final do usuário (1º, 2º, 3º, etc.)
    is_winner = Column(Boolean, default=False)  # Se é um dos vencedores
    
    user = relationship("User", back_populates="challenge_participations")
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'user_email': self.user_email,
            'stake_amount': float(self.stake_amount) if self.stake_amount else 0.0,
            'status': self.status,
            'result_value': float(self.result_value) if self.result_value else None,
            'result_submitted_at': self.result_submitted_at.isoformat() if self.result_submitted_at else None,
            'validation_status': self.validation_status,
            'validation_data': self.validation_data,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            # NOVOS CAMPOS
            'final_position': self.final_position,
            'is_winner': self.is_winner
        }

class Challenge(Base):
    __tablename__ = 'challenges'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    difficulty = Column(String, default='medium')
    entry_fee = Column(Float, nullable=False)
    total_pool = Column(Float, default=0.0)
    max_participants = Column(Integer, default=100)
    current_participants = Column(Integer, default=0)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    status = Column(String, default='active')
    rules = Column(Text, nullable=True)
    prize_distribution = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    created_by = Column(String, nullable=True)
    
    # CAMPOS PARA VALIDAÇÃO AUTOMÁTICA
    auto_validation = Column(Boolean, default=True)  # Se permite validação automática
    target_metric = Column(String, nullable=True)  # Métrica alvo (steps, distance, calories, etc.)
    target_value = Column(Float, nullable=True)  # Valor alvo
    target_unit = Column(String, nullable=True)  # Unidade do valor alvo
    validation_rules = Column(Text, nullable=True)  # Regras de validação em JSON
    
    # CAMPO EXISTENTE
    required_app_category = Column(String(50), nullable=True) # Ex: 'running', 'steps', 'cycling'
    
    # =====================================================================
    # NOVOS CAMPOS PARA MÚLTIPLOS VENCEDORES
    # =====================================================================
    max_winners = Column(Integer, default=1)  # Número máximo de vencedores (1-50)
    winner_selection_type = Column(String, default='first_to_complete')  # Tipo de seleção de vencedores
    prize_distribution_type = Column(String, default='equal')  # Tipo de distribuição de prêmios
    # =====================================================================
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'difficulty': self.difficulty,
            'entry_fee': float(self.entry_fee) if self.entry_fee else 0.0,
            'total_pool': float(self.total_pool) if self.total_pool else 0.0,
            'max_participants': self.max_participants,
            'current_participants': self.current_participants,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'status': self.status,
            'rules': self.rules,
            'prize_distribution': self.prize_distribution,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'created_by': self.created_by,
            'auto_validation': self.auto_validation,
            'target_metric': self.target_metric,
            'target_value': float(self.target_value) if self.target_value else None,
            'target_unit': self.target_unit,
            'validation_rules': json.loads(self.validation_rules) if self.validation_rules else {},
            'required_app_category': self.required_app_category,
            # NOVOS CAMPOS PARA MÚLTIPLOS VENCEDORES
            'max_winners': self.max_winners,
            'winner_selection_type': self.winner_selection_type,
            'prize_distribution_type': self.prize_distribution_type,
            'multiple_winners_enabled': self.max_winners > 1 if self.max_winners else False
        }

# NOVO MODELO PARA REGISTRAR VENCEDORES
class ChallengeWinner(Base):
    """Modelo para registrar os vencedores de cada desafio"""
    __tablename__ = 'challenge_winners'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False, index=True)
    participation_id = Column(String, ForeignKey('challenge_participations.id'), nullable=False)
    position = Column(Integer, nullable=False)  # 1º lugar, 2º lugar, etc.
    result_value = Column(Float, nullable=False)  # Score/performance do usuário
    prize_amount = Column(Float, nullable=False)  # Prêmio que recebeu
    prize_percentage = Column(Float, nullable=False)  # % do pool total que recebeu
    completed_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relacionamentos
    user = relationship("User")
    participation = relationship("ChallengeParticipation")
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'user_id': self.user_id,
            'participation_id': self.participation_id,
            'position': self.position,
            'result_value': float(self.result_value),
            'prize_amount': float(self.prize_amount),
            'prize_percentage': float(self.prize_percentage),
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# =====================================================================
# CORREÇÃO PRINCIPAL: ChallengeCategory com is_active como Boolean
# =====================================================================
class ChallengeCategory(Base):
    __tablename__ = 'challenge_categories'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)  # ✅ CORRIGIDO: Boolean ao invés de String
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'icon': self.icon,
            'color': self.color,
            'is_active': self.is_active,  # ✅ Agora retorna True/False
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ChallengePool(Base):
    __tablename__ = 'challenge_pools'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, nullable=False, index=True)
    total_pool = Column(Float, default=0.0)
    total_participants = Column(Integer, default=0)
    total_stakes = Column(Float, default=0.0)
    prize_pool = Column(Float, default=0.0)
    platform_fee = Column(Float, default=0.0)
    fee_percentage = Column(Float, default=5.0)
    status = Column(String, default='active')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'total_pool': float(self.total_pool) if self.total_pool else 0.0,
            'total_participants': self.total_participants,
            'total_stakes': float(self.total_stakes) if self.total_stakes else 0.0,
            'prize_pool': float(self.prize_pool) if self.prize_pool else 0.0,
            'platform_fee': float(self.platform_fee) if self.platform_fee else 0.0,
            'fee_percentage': float(self.fee_percentage) if self.fee_percentage else 5.0,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ChallengeResult(Base):
    __tablename__ = 'challenge_results'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    challenge_id = Column(String, nullable=False, index=True)
    participation_id = Column(String, ForeignKey('challenge_participations.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    result_value = Column(Float, nullable=False)
    result_unit = Column(String, nullable=True)
    evidence_data = Column(Text, nullable=True)
    validation_status = Column(String, default='pending')
    validated_by = Column(String, nullable=True)
    validated_at = Column(DateTime, nullable=True)
    ranking_position = Column(Integer, nullable=True)
    prize_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'challenge_id': self.challenge_id,
            'participation_id': self.participation_id,
            'user_id': self.user_id,
            'result_value': float(self.result_value) if self.result_value else 0.0,
            'result_unit': self.result_unit,
            'evidence_data': self.evidence_data,
            'validation_status': self.validation_status,
            'validated_by': self.validated_by,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'ranking_position': self.ranking_position,
            'prize_amount': float(self.prize_amount) if self.prize_amount else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class GlobalActivity(Base):
    __tablename__ = 'global_activities'
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    activity_type = Column(String, nullable=False)
    description = Column(String, nullable=False)
    challenge_id = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    extra_data = Column(Text, nullable=True)
    is_public = Column(String, default='true')  # Mantido como String por compatibilidade
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'activity_type': self.activity_type,
            'description': self.description,
            'challenge_id': self.challenge_id,
            'amount': float(self.amount) if self.amount else None,
            'extra_data': self.extra_data,
            'is_public': self.is_public,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Configuração do banco - PostgreSQL em produção, SQLite em desenvolvimento
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///c:/Temp/BetFit/backend/src/betfit.db')

if DATABASE_URL.startswith('postgresql'):
    # PostgreSQL - sem check_same_thread
    engine = create_engine(DATABASE_URL)
else:
    # SQLite - com check_same_thread=False
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(bind=engine)

# Criar todas as tabelas
Base.metadata.create_all(engine)

print("✅ Modelos corrigidos - is_active agora é Boolean!")
print("📊 CORREÇÃO APLICADA:")
print("   - ChallengeCategory.is_active: String -> Boolean")
print("   - FitnessConnection.is_active: já era Boolean")
print("   - ChallengeParticipation.is_winner: Boolean")
print("🏆 RECURSOS MANTIDOS:")
print("   - Múltiplos vencedores")
print("   - Integração fitness")
print("   - Validação automática")
print("💾 Banco: PostgreSQL (produção) | SQLite (desenvolvimento)")
