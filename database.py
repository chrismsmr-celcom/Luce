import sqlite3
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "luce.db"


def get_db():
    connection = sqlite3.connect(
        DB_PATH,
        check_same_thread=False,
    )
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    db = get_db()

    db.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    db.execute(
        """
        CREATE TABLE IF NOT EXISTS conversations (
            user_id TEXT PRIMARY KEY,
            composio_session_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    db.execute(
        """
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """
    )

    db.commit()
    db.close()


def create_user(user_id: str):
    db = get_db()

    db.execute(
        """
        INSERT OR IGNORE INTO users (id)
        VALUES (?)
        """,
        (user_id,),
    )

    db.commit()
    db.close()


def get_composio_session_id(user_id: str):
    db = get_db()

    row = db.execute(
        """
        SELECT composio_session_id
        FROM conversations
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    db.close()

    if row is None:
        return None

    return row["composio_session_id"]


def save_composio_session_id(
    user_id: str,
    session_id: str,
):
    db = get_db()

    db.execute(
        """
        INSERT INTO conversations (
            user_id,
            composio_session_id
        )
        VALUES (?, ?)
        ON CONFLICT(user_id)
        DO UPDATE SET
            composio_session_id = excluded.composio_session_id,
            updated_at = CURRENT_TIMESTAMP
        """,
        (
            user_id,
            session_id,
        ),
    )

    db.commit()
    db.close()


def save_message(
    user_id: str,
    role: str,
    content: str,
):
    db = get_db()

    db.execute(
        """
        INSERT INTO messages (
            user_id,
            role,
            content
        )
        VALUES (?, ?, ?)
        """,
        (
            user_id,
            role,
            content,
        ),
    )

    db.commit()
    db.close()


def get_messages(user_id: str):
    db = get_db()

    rows = db.execute(
        """
        SELECT role, content
        FROM messages
        WHERE user_id = ?
        ORDER BY id ASC
        """,
        (user_id,),
    ).fetchall()

    db.close()

    return [
        {
            "role": row["role"],
            "content": row["content"],
        }
        for row in rows
    ]
