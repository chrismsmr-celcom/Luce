import logging
import os
import time
from collections import defaultdict, deque
from datetime import timedelta
from threading import Lock

from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request
from flask_cors import CORS

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

from agent import process_message, run_confirmed_action  # noqa: E402
import auth  # noqa: E402
from composio_service import (  # noqa: E402
    authorize_toolkit,
    get_tools,
    list_connected_accounts,
)
from database import (  # noqa: E402
    AUTONOMY_LEVELS,
    claim_pending_action,
    clear_messages,
    create_user,
    delete_user,
    get_autonomy,
    get_messages,
    get_pending_action,
    init_db,
    list_pending_actions,
    set_autonomy,
)
from toolkits import TOOLKIT_SET, TOOLKITS  # noqa: E402

PRODUCTION = os.getenv("LUCE_ENV", "development").lower() == "production"

# Browser origins allowed to call the API.
ALLOWED_ORIGINS = [
    o.strip().rstrip("/")
    for o in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if o.strip()
]

# Where to send the user after the OAuth flow.
FRONTEND_URL = os.getenv("FRONTEND_URL", "/connexions")

# Public URL of this API, used for the OAuth callback.
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")

MAX_MESSAGE_CHARS = int(os.getenv("LUCE_MAX_MESSAGE_CHARS", "4000"))
CHAT_RATE_LIMIT = int(os.getenv("LUCE_CHAT_RATE_LIMIT", "20"))
CHAT_RATE_WINDOW = int(os.getenv("LUCE_CHAT_RATE_WINDOW", "60"))

app = Flask(__name__)

app.secret_key = os.getenv("FLASK_SECRET_KEY")
if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY is missing")

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE=os.getenv(
        "SESSION_COOKIE_SAMESITE",
        "None" if ALLOWED_ORIGINS else "Lax",
    ),
    SESSION_COOKIE_SECURE=PRODUCTION,
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    MAX_CONTENT_LENGTH=64 * 1024,
)

if ALLOWED_ORIGINS:
    CORS(
        app,
        resources={r"/api/*": {"origins": ALLOWED_ORIGINS}},
        supports_credentials=True,
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Luce-Client",
        ],
    )

init_db()

# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------


@app.before_request
def csrf_guard():
    """
    CSRF defence for state-changing API requests.

    The frontend must send X-Luce-Client: web.
    Cross-origin requests must also come from an allowed origin.
    """
    if (
        request.method in ("GET", "HEAD", "OPTIONS")
        or not request.path.startswith("/api/")
    ):
        return None

    if request.headers.get("X-Luce-Client") != "web":
        return jsonify({"error": "Missing client header"}), 403

    origin = request.headers.get("Origin")

    if origin:
        origin = origin.rstrip("/")
        same_origin = origin == request.host_url.rstrip("/")

        if not same_origin and origin not in ALLOWED_ORIGINS:
            return jsonify({"error": "Origin not allowed"}), 403

    return None


@app.errorhandler(auth.AuthError)
def unauthorized(exc):
    return jsonify(
        {
            "error": "Authentification requise",
            "reason": str(exc),
        }
    ), 401


def get_user_id() -> str:
    """
    Development identity based on the Bearer token.

    The current auth.py treats the token as an opaque development
    session identifier and deterministically derives a user UUID from it.

    This is intentionally simple for development and is NOT production
    authentication.
    """
    if auth.ENABLED:
        user_id = auth.user_from_authorization(
            request.headers.get("Authorization")
        )

        # Create the local Luce user the first time we see this identity.
        create_user(user_id)

        return user_id

    # Anonymous fallback if auth is explicitly disabled.
    user_id = "anonymous"
    create_user(user_id)
    return user_id


# ---------------------------------------------------------------------------
# Security headers
# ---------------------------------------------------------------------------


@app.after_request
def security_headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "no-referrer")
    resp.headers.setdefault("Cache-Control", "no-store")
    return resp


# ---------------------------------------------------------------------------
# Rate limiting
# ---------------------------------------------------------------------------

_hits: dict[str, deque] = defaultdict(deque)
_hits_lock = Lock()


def rate_limited(
    key: str,
    limit: int | None = None,
    window: int | None = None,
) -> bool:
    """Sliding-window limiter. In-memory: per worker."""
    limit = CHAT_RATE_LIMIT if limit is None else limit
    window = CHAT_RATE_WINDOW if window is None else window

    now = time.monotonic()

    with _hits_lock:
        q = _hits[key]

        while q and now - q[0] > window:
            q.popleft()

        if len(q) >= limit:
            return True

        q.append(now)
        return False


# ---------------------------------------------------------------------------
# OAuth / Composio helpers
# ---------------------------------------------------------------------------


def callback_url() -> str:
    base = PUBLIC_BASE_URL or request.host_url.rstrip("/")
    return base + "/api/composio/callback"


def server_error(message: str, exc: Exception):
    app.logger.exception(message)
    return jsonify({"error": message}), 500


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "service": "luce",
        }
    )


@app.get("/api/me")
def me():
    user_id = get_user_id()

    return jsonify(
        {
            "toolkits": TOOLKITS,
            "autonomy": get_autonomy(user_id),
            "auth": "development" if auth.ENABLED else "anonymous",
            "pending_actions": list_pending_actions(user_id),
        }
    )


@app.post("/api/connect/<toolkit>")
def connect_toolkit(toolkit):
    if toolkit not in TOOLKIT_SET:
        return jsonify({"error": "Unsupported toolkit"}), 400

    user_id = get_user_id()

    try:
        return jsonify(
            authorize_toolkit(
                user_id=user_id,
                toolkit=toolkit,
                callback_url=callback_url(),
            )
        )
    except Exception as exc:
        return server_error(
            "Impossible de démarrer la connexion",
            exc,
        )


@app.get("/api/composio/callback")
def composio_callback():
    # Composio has completed the OAuth flow; send the user back to the app.
    return redirect(FRONTEND_URL)


@app.get("/api/connections")
def connections():
    """
    Return the connection status of every configured toolkit.
    """
    user_id = get_user_id()

    try:
        result = {name: False for name in TOOLKITS}

        for account in list_connected_accounts(user_id):
            slug = str(
                getattr(
                    getattr(account, "toolkit", None),
                    "slug",
                    "",
                )
            ).lower()

            if slug in result:
                result[slug] = True

        return jsonify(result)

    except Exception as exc:
        return server_error(
            "Impossible de lire les connexions",
            exc,
        )


@app.get("/api/tools")
def tools():
    """
    Diagnostic endpoint.

    Returns the real tools exposed by the user's Composio session.
    This is used to identify the exact Gmail, Slack, Drive, Calendar,
    etc. tool names before creating the real data endpoints.
    """
    user_id = get_user_id()

    try:
        available_tools = get_tools(user_id)
        result = []

        for tool in available_tools:
            if isinstance(tool, dict):
                result.append(
                    {
                        "name": tool.get("name"),
                        "description": tool.get("description"),
                    }
                )
            else:
                result.append(
                    {
                        "name": getattr(tool, "name", str(tool)),
                        "description": getattr(
                            tool,
                            "description",
                            "",
                        ),
                    }
                )

        return jsonify(result)

    except Exception as exc:
        return server_error(
            "Impossible de lire les outils Composio",
            exc,
        )


@app.get("/api/history")
def history():
    return jsonify(
        {
            "messages": get_messages(get_user_id()),
        }
    )


@app.post("/api/history/clear")
def history_clear():
    clear_messages(get_user_id())
    return jsonify({"success": True})


@app.post("/api/settings")
def settings():
    user_id = get_user_id()

    data = request.get_json(silent=True) or {}
    level = data.get("autonomy")

    if level not in AUTONOMY_LEVELS:
        return jsonify({"error": "Invalid autonomy level"}), 400

    set_autonomy(user_id, level)

    return jsonify(
        {
            "autonomy": level,
        }
    )


@app.post("/api/chat")
def chat():
    user_id = get_user_id()

    if rate_limited(f"chat:{user_id}") or rate_limited(
        f"chat-ip:{request.remote_addr}",
        limit=CHAT_RATE_LIMIT * 3,
    ):
        return jsonify(
            {
                "error": "Trop de requêtes, réessaie dans un instant.",
            }
        ), 429

    data = request.get_json(silent=True) or {}
    message = data.get("message")

    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "Message is required"}), 400

    message = message.strip()

    if len(message) > MAX_MESSAGE_CHARS:
        return jsonify(
            {
                "error": (
                    f"Message trop long "
                    f"(max {MAX_MESSAGE_CHARS} caractères)"
                ),
            }
        ), 413

    try:
        return jsonify(
            process_message(
                user_id=user_id,
                message=message,
            )
        )
    except Exception as exc:
        return server_error(
            "Luce n'a pas pu traiter la demande",
            exc,
        )


@app.get("/api/actions")
def actions():
    return jsonify(
        {
            "pending_actions": list_pending_actions(
                get_user_id()
            ),
        }
    )


@app.post("/api/actions/<action_id>/confirm")
def confirm_action(action_id):
    """The user explicitly approves an action Luce proposed."""
    user_id = get_user_id()

    action = get_pending_action(user_id, action_id)

    if action is None:
        return jsonify({"error": "Action not found"}), 404

    # Atomic claim: a double click or replay cannot execute twice.
    if not claim_pending_action(
        user_id,
        action_id,
        "confirmed",
    ):
        return jsonify(
            {
                "error": "Action already handled",
            }
        ), 409

    try:
        result = run_confirmed_action(
            user_id,
            action["tool"],
            action["arguments"],
        )
    except Exception as exc:
        return server_error(
            "L'action a échoué",
            exc,
        )

    return jsonify(
        {
            "success": bool(result.get("success")),
            "pending_approval": bool(
                result.get("pending_approval")
            ),
            "blocked": bool(result.get("blocked")),
            "error": result.get("error"),
        }
    )


@app.post("/api/actions/<action_id>/reject")
def reject_action(action_id):
    user_id = get_user_id()

    if get_pending_action(user_id, action_id) is None:
        return jsonify({"error": "Action not found"}), 404

    if not claim_pending_action(
        user_id,
        action_id,
        "rejected",
    ):
        return jsonify(
            {
                "error": "Action already handled",
            }
        ), 409

    return jsonify({"success": True})


@app.post("/api/logout")
def logout():
    # The development Bearer identity lives on the frontend.
    # Nothing needs to be cleared server-side.
    return jsonify({"success": True})


@app.post("/api/account/delete")
def account_delete():
    """
    Delete this user's messages and pending actions.
    """
    user_id = get_user_id()

    delete_user(user_id)

    return jsonify(
        {
            "success": True,
        }
    )


# ---------------------------------------------------------------------------
# Error handlers
# ---------------------------------------------------------------------------


@app.errorhandler(404)
def not_found(_):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "Request too large"}), 413


# ---------------------------------------------------------------------------
# Development server
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Development server only.
    # Production: gunicorn app:app
    app.run(
        host="127.0.0.1",
        port=int(os.getenv("PORT", "10000")),
        debug=False,
    )
