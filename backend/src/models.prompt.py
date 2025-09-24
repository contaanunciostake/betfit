from sqlalchemy import create_engine, Column, String, Float, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String, unique=True)
    password = Column(String)
    phone = Column(String)
    status = Column(String, default='active')
    kyc_status = Column(String, default='pending')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime)
    total_bets = Column(Integer, default=0)
    total_wins = Column(Integer, default=0)
    total_deposited = Column(Float, default=0.0)
    total_withdrawn = Column(Float, default=0.0)

class Wallet(Base):
    __tablename__ = 'wallets'
    id = Column(String, primary_key=True)
    user_id = Column(String)
    balance = Column(Float, default=0.0)
    available = Column(Float, default=0.0)
    pending = Column(Float, default=0.0)
    currency = Column(String, default='BRL')
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow)

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(String, primary_key=True)
    user_id = Column(String)
    type = Column(String)
    amount = Column(Float)
    description = Column(String)
    status = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    admin_id = Column(String, nullable=True)

# Engine e sessão
engine = create_engine('sqlite:///betfit.db')
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(engine)