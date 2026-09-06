"""Tiny SQLite layer. Two tables: users, connections (per-user provider tokens)."""

import json
import os
import sqlite3
import time
from contextvars import ContextVar
from pathlib import Path

DATA_DIR = Path(os.environ.get("PIPER_DATA_DIR", Path(__file__).parent))
DB_FILE = DATA_DIR / "piper.db"

# Set by the auth dependency (or by an OAuth callback from the signed state) for the current request.
current_user_id: ContextVar[int | None] = ContextVar("current_user_id", default=None)


def conn() -> sqlite3.Connection:
    c = sqlite3.connect(DB_FILE)
    c.row_factory = sqlite3.Row
    return c


def init():
    with conn() as c:
        c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS connections (
            user_id INTEGER NOT NULL REFERENCES users(id),
            provider TEXT NOT NULL,
            tokens TEXT NOT NULL,
            updated_at INTEGER NOT NULL,
            PRIMARY KEY (user_id, provider)
        );
        """)


# ---- users
def create_user(email: str, password_hash: str) -> int:
    with conn() as c:
        cur = c.execute("INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                        (email.lower().strip(), password_hash, int(time.time())))
        return cur.lastrowid


def get_user_by_email(email: str):
    with conn() as c:
        return c.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()


def get_user(user_id: int):
    with conn() as c:
        return c.execute("SELECT id, email, created_at FROM users WHERE id = ?", (user_id,)).fetchone()


# ---- connections (tokens)
def save_connection(user_id: int, provider: str, tokens: dict):
    with conn() as c:
        c.execute("""INSERT INTO connections (user_id, provider, tokens, updated_at) VALUES (?, ?, ?, ?)
                     ON CONFLICT(user_id, provider) DO UPDATE SET tokens = excluded.tokens, updated_at = excluded.updated_at""",
                  (user_id, provider, json.dumps(tokens), int(time.time())))


def load_connection(user_id: int, provider: str) -> dict | None:
    with conn() as c:
        row = c.execute("SELECT tokens FROM connections WHERE user_id = ? AND provider = ?", (user_id, provider)).fetchone()
        return json.loads(row["tokens"]) if row else None


def delete_connection(user_id: int, provider: str):
    with conn() as c:
        c.execute("DELETE FROM connections WHERE user_id = ? AND provider = ?", (user_id, provider))


def list_connections(user_id: int) -> dict[str, dict]:
    with conn() as c:
        rows = c.execute("SELECT provider, tokens, updated_at FROM connections WHERE user_id = ?", (user_id,)).fetchall()
        return {r["provider"]: {**json.loads(r["tokens"]), "updated_at": r["updated_at"]} for r in rows}


init()
