import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
# Point LUCE_DB_PATH at a persistent volume in production (ephemeral disks lose data).
DB_PATH = Path(os.getenv("LUCE_DB_PATH", BASE_DIR / "luce.db"))

AUTONOMY_LEVELS = ("ask", "draft", "auto")


@contextmanager
def get_db():
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with get_db() as db:
        db.execute("PRAGMA journal_mode = WAL")
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                autonomy TEXT NOT NULL DEFAULT 'ask',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS conversations (
                user_id TEXT PRIMARY KEY,
                composio_session_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id, id);
            CREATE TABLE IF NOT EXISTS pending_actions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                tool TEXT NOT NULL,
                arguments TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_actions(user_id, status);
            """
        )
        # Migration for databases created before the autonomy column existed.
        cols = {r["name"] for r in db.execute("PRAGMA table_info(users)")}
        if "autonomy" not in cols:
            db.execute("ALTER TABLE users ADD COLUMN autonomy TEXT NOT NULL DEFAULT 'ask'")


# ---- users -----------------------------------------------------------------

def create_user(user_id: str):
    with get_db() as db:
        db.execute("INSERT OR IGNORE INTO users (id) VALUES (?)", (user_id,))


def delete_user(user_id: str):
    """Delete a user and everything attached to them (messages, session, actions)."""
    with get_db() as db:
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))


def get_autonomy(user_id: str) -> str:
    with get_db() as db:
        row = db.execute("SELECT autonomy FROM users WHERE id = ?", (user_id,)).fetchone()
    return row["autonomy"] if row and row["autonomy"] in AUTONOMY_LEVELS else "ask"


def set_autonomy(user_id: str, level: str):
    if level not in AUTONOMY_LEVELS:
        raise ValueError("invalid autonomy level")
    with get_db() as db:
        db.execute("UPDATE users SET autonomy = ? WHERE id = ?", (level, user_id))


# ---- composio session ------------------------------------------------------

def get_composio_session_id(user_id: str):
    with get_db() as db:
        row = db.execute(
            "SELECT composio_session_id FROM conversations WHERE user_id = ?", (user_id,)
        ).fetchone()
    return row["composio_session_id"] if row else None


def save_composio_session_id(user_id: str, session_id: str):
    with get_db() as db:
        db.execute(
            """
            INSERT INTO conversations (user_id, composio_session_id) VALUES (?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                composio_session_id = excluded.composio_session_id,
                updated_at = CURRENT_TIMESTAMP
            """,
            (user_id, session_id),
        )


# ---- messages --------------------------------------------------------------

def save_message(user_id: str, role: str, content: str):
    with get_db() as db:
        db.execute(
            "INSERT INTO messages (user_id, role, content) VALUES (?, ?, ?)",
            (user_id, role, content),
        )


def get_messages(user_id: str, limit: int | None = None):
    """Oldest-first. With `limit`, return only the most recent `limit` messages."""
    with get_db() as db:
        if limit:
            rows = db.execute(
                """
                SELECT role, content FROM (
                    SELECT id, role, content FROM messages
                    WHERE user_id = ? ORDER BY id DESC LIMIT ?
                ) ORDER BY id ASC
                """,
                (user_id, limit),
            ).fetchall()
        else:
            rows = db.execute(
                "SELECT role, content FROM messages WHERE user_id = ? ORDER BY id ASC",
                (user_id,),
            ).fetchall()
    return [{"role": r["role"], "content": r["content"]} for r in rows]


def clear_messages(user_id: str):
    with get_db() as db:
        db.execute("DELETE FROM messages WHERE user_id = ?", (user_id,))


# ---- pending actions (human confirmation) ----------------------------------

def create_pending_action(user_id: str, tool: str, arguments: dict) -> str:
    action_id = uuid.uuid4().hex
    with get_db() as db:
        db.execute(
            "INSERT INTO pending_actions (id, user_id, tool, arguments) VALUES (?, ?, ?, ?)",
            (action_id, user_id, tool, json.dumps(arguments, default=str)),
        )
    return action_id


def _action_row(row):
    return {
        "id": row["id"],
        "tool": row["tool"],
        "arguments": json.loads(row["arguments"]),
        "status": row["status"],
        "created_at": row["created_at"],
    }


def list_pending_actions(user_id: str):
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM pending_actions WHERE user_id = ? AND status = 'pending' ORDER BY created_at",
            (user_id,),
        ).fetchall()
    return [_action_row(r) for r in rows]


def get_pending_action(user_id: str, action_id: str):
    """Scoped to the user: a user can never read someone else's action."""
    with get_db() as db:
        row = db.execute(
            "SELECT * FROM pending_actions WHERE id = ? AND user_id = ?", (action_id, user_id)
        ).fetchone()
    return _action_row(row) if row else None


def claim_pending_action(user_id: str, action_id: str, new_status: str) -> bool:
    """Atomically move pending -> new_status. False if it was not pending (double click, replay)."""
    with get_db() as db:
        cur = db.execute(
            "UPDATE pending_actions SET status = ? WHERE id = ? AND user_id = ? AND status = 'pending'",
            (new_status, action_id, user_id),
        )
        return cur.rowcount == 1
