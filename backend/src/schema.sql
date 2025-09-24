CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    password TEXT NOT NULL,
    status TEXT NOT NULL,
    kyc_status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_login TEXT,
    total_bets INTEGER NOT NULL DEFAULT 0,
    total_wins INTEGER NOT NULL DEFAULT 0,
    total_deposited REAL NOT NULL DEFAULT 0.00,
    total_withdrawn REAL NOT NULL DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS wallets (
    user_id TEXT PRIMARY KEY,
    balance REAL NOT NULL DEFAULT 0.00,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
