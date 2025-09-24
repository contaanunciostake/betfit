# language: python
# filepath: backend/src/migrate_json_to_db.py
# ...existing code...
import os
import json
from datetime import datetime
import uuid

# filepath: backend/src/migrate_json_to_db.py
from models import SessionLocal, User, Wallet, Transaction

def parse_iso(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except:
        return None

def load_json(path):
    if not os.path.exists(path):
        return {}
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def migrate():
    base = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data'))
    users_path = os.path.join(base, 'users.json')
    wallets_path = os.path.join(base, 'wallets.json')
    txs_path = os.path.join(base, 'transactions.json')

    users_json = load_json(users_path) or {}
    wallets_json = load_json(wallets_path) or {}
    txs_json = load_json(txs_path) or {}

    session = SessionLocal()
    try:
        # Users
        for uid, u in users_json.items():
            existing = session.query(User).filter_by(id=uid).first()
            if not existing:
                existing = User(id=uid)
            # map fields (ajuste se seus modelos tiverem nomes diferentes)
            existing.name = u.get('name')
            existing.email = u.get('email')
            existing.phone = u.get('phone')
            existing.password = u.get('password')  # já hash? se não, ajustar
            existing.status = u.get('status')
            existing.kyc_status = u.get('kyc_status')
            existing.total_bets = u.get('total_bets', 0)
            existing.total_wins = u.get('total_wins', 0)
            existing.total_deposited = u.get('total_deposited', 0.0)
            existing.total_withdrawn = u.get('total_withdrawn', 0.0)
            if u.get('created_at'):
                existing.created_at = parse_iso(u['created_at'])
            if u.get('updated_at'):
                existing.updated_at = parse_iso(u['updated_at'])
            if u.get('last_login'):
                existing.last_login = parse_iso(u['last_login'])
            session.merge(existing)

        # Wallets
        for uid, w in wallets_json.items():
            # wallets are keyed by user_id in the JSON
            user_id = uid
            existing = session.query(Wallet).filter_by(user_id=user_id).first()
            if not existing:
                existing = Wallet(id=w.get('id') or str(uuid.uuid4()), user_id=user_id)
            existing.balance = float(w.get('balance', 0.0))
            existing.available = float(w.get('available', 0.0))
            existing.pending = float(w.get('pending', 0.0))
            existing.currency = w.get('currency', 'BRL')
            if w.get('created_at'):
                existing.created_at = parse_iso(w['created_at'])
            if w.get('updated_at'):
                existing.updated_at = parse_iso(w['updated_at'])
            session.merge(existing)

        # Transactions
        # JSON expected: { user_id: [tx,...], ... }
        for uid, tx_list in txs_json.items():
            for tx in tx_list:
                tx_id = tx.get('id') or str(uuid.uuid4())
                existing = session.query(Transaction).filter_by(id=tx_id).first()
                if not existing:
                    existing = Transaction(id=tx_id, user_id=uid)
                existing.type = tx.get('type')
                existing.amount = float(tx.get('amount', 0))
                existing.description = tx.get('description')
                existing.status = tx.get('status')
                existing.admin_id = tx.get('admin_id')
                if tx.get('created_at'):
                    existing.created_at = parse_iso(tx['created_at'])
                session.merge(existing)

        session.commit()
        print("Migração concluída com sucesso.")
    except Exception as e:
        session.rollback()
        print("Erro na migração:", e)
    finally:
        session.close()

if __name__ == '__main__':
    migrate()