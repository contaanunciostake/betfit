import hashlib
import datetime
import uuid
from models import SessionLocal, User

ADMIN_EMAIL = 'admin@betfit.com'
ADMIN_PLAIN = 'admin123'

def run():
    session = SessionLocal()
    try:
        existing = session.query(User).filter_by(email=ADMIN_EMAIL).first()
        if existing:
            print("Admin already exists:", existing.id)
            return
        admin = User(
            id='admin_001',
            name='Administrador BetFit',
            email=ADMIN_EMAIL,
            password=hashlib.sha256(ADMIN_PLAIN.encode()).hexdigest(),
            phone='',
            status='active',
            kyc_status='verified',
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow(),
            last_login=None,
            total_bets=0,
            total_wins=0,
            total_deposited=0.0,
            total_withdrawn=0.0
        )
        session.add(admin)
        session.commit()
        print("Admin created with id:", admin.id)
    except Exception as e:
        session.rollback()
        print("Error creating admin:", e)
    finally:
        session.close()

if __name__ == '__main__':
    run()