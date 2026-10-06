import os
from typing import Any

from dotenv import load_dotenv
from composio import Composio

from database import (
    get_composio_session_id,
    save_composio_session_id,
)

load_dotenv()


COMPOSIO_API_KEY = os.getenv("COMPOSIO_API_KEY")

if not COMPOSIO_API_KEY:
    raise RuntimeError("COMPOSIO_API_KEY is missing")


composio = Composio(
    api_key=COMPOSIO_API_KEY
)

# Tous les toolkits disponibles pour Luce
# ⚠️ Slugs exacts Composio : "googlesearchconsole" (pas gsearchconsole).
# "googlemaps" n'est pas un slug valide Composio — retiré.
TOOLKITS = [
    "gmail",
    "googlecalendar",
    "googledrive",
    "github",
    "twitter",
    "whatsapp",
    "supabase",
    "googlesheets",
    "googlephotos",
    "googlesearchconsole",
]

# Bump this number whenever TOOLKITS changes.
# Sessions saved with an older version are NOT restored:
# a new session (with the new toolkits) is created instead.
# This fixes: "Toolkit 'X' is not allowed for this session"
SESSION_VERSION = 6


def _toolkit_not_allowed(exc: Exception) -> bool:
    """Detect Composio's session-restriction error (code 4324)."""
    text = str(exc)
    return (
        "ToolkitNotAllowed" in text
        or "is not allowed for this session" in text
    )


def _invalid_toolkit_slugs(exc: Exception) -> set:
    """
    Detect Composio error 4305 (InvalidToolkitSlugs) and
    extract the offending slugs, e.g.:
    "Invalid toolkit slugs: googlemaps, gsearchconsole."
    """
    text = str(exc)
    if "Invalid toolkit slugs" not in text:
        return set()
    import re
    m = re.search(r"Invalid toolkit slugs:\s*([a-zA-Z0-9_,\s]+?)\.", text)
    if not m:
        return set()
    return {
        name.strip()
        for name in m.group(1).split(",")
        if name.strip()
    }


def _create_session(user_id: str, toolkits: list):
    """
    Create a Composio session. Some toolkits (e.g. "twitter")
    require a pre-existing auth config (error 4300:
    "require auth configs but none exist and cannot be
    auto-created"). When that happens, retry without the
    problematic toolkits instead of crashing.
    """

    try:
        return composio.create(
            user_id=user_id,
            toolkits=toolkits,
            sandbox={"enable": False},
        )
    except Exception as exc:

        # Case 1: invalid toolkit slugs (error 4305) — drop them and retry
        invalid = _invalid_toolkit_slugs(exc)
        if invalid:
            remaining = [t for t in toolkits if t not in invalid]
            print(
                f"[Composio] Invalid toolkit slugs, excluded: {sorted(invalid)}"
            )
            if not remaining:
                raise
            return composio.create(
                user_id=user_id,
                toolkits=remaining,
                sandbox={"enable": False},
            )

        text = str(exc)

        if "auth configs" in text and "cannot be auto-created" in text:

            import re
            rejected = re.findall(
                r"cannot be auto-created: ([a-zA-Z0-9_,\s]+?)\.",
                text,
            )

            rejected_names = set()
            for chunk in rejected:
                rejected_names.update(
                    name.strip()
                    for name in chunk.split(",")
                    if name.strip()
                )

            if rejected_names:
                remaining = [
                    name for name in toolkits
                    if name not in rejected_names
                ]

                print(
                    f"[Composio] Toolkits requiring an auth config, "
                    f"excluded from session: {sorted(rejected_names)}"
                )

                if not remaining:
                    raise

                return composio.create(
                    user_id=user_id,
                    toolkits=remaining,
                    sandbox={"enable": False},
                )

        raise


def get_or_create_session(user_id: str):
    """
    Get the existing Composio session for the user.
    Create one if it does not exist.

    The session ID is stored with a version prefix.
    If SESSION_VERSION changed (toolkits added/removed),
    the old session is discarded and a new one is created
    with the updated toolkit list.
    """

    if not user_id:
        raise ValueError("user_id is required")

    version_prefix = f"v{SESSION_VERSION}:"

    # 1. Try to restore an existing session (only if same version)

    stored = get_composio_session_id(user_id)

    if stored and stored.startswith(version_prefix):

        session_id = stored[len(version_prefix):]

        try:
            session = composio.use(session_id)
            print(f"[Composio] Restored session {session_id} for user {user_id}")
            return session
        except Exception as exc:
            print(f"[Composio] Could not restore session {session_id}: {exc}")

    elif stored:
        print(
            f"[Composio] Session version mismatch (stored: {stored.split(':')[0]}, "
            f"current: v{SESSION_VERSION}). Creating a new session."
        )

    # 2. Create a new session

    session = _create_session(user_id, TOOLKITS)

    # 3. Persist the session ID (versioned)

    save_composio_session_id(
        user_id=user_id,
        session_id=version_prefix + session.session_id,
    )

    print(f"[Composio] Created session {session.session_id} for user {user_id}")

    return session


def get_tools(user_id: str):
    """
    Return tools exposed by the user's Composio session.
    """
    session = get_or_create_session(user_id)
    return session.tools()


def authorize_toolkit(
    user_id: str,
    toolkit: str,
    callback_url: str | None = None,
):
    """
    Start OAuth authorization for a toolkit.
    """
    session = get_or_create_session(user_id)

    connection_request = session.authorize(
        toolkit,
        callback_url=callback_url,
    )

    return {
        "id": getattr(connection_request, "id", None),
        "redirect_url": connection_request.redirect_url,
    }


def execute_tool(
    user_id: str,
    tool_slug: str,
    arguments: dict[str, Any],
):
    """
    Execute a Composio tool inside the user's session.

    If Composio rejects the tool because the session was
    created with an older toolkit list, recreate the session
    and retry once.
    """
    session = get_or_create_session(user_id)

    try:
        return session.execute(tool_slug, arguments=arguments)
    except Exception as exc:

        if not _toolkit_not_allowed(exc):
            raise

        print(
            f"[Composio] Toolkit not allowed on current session "
            f"({tool_slug}). Recreating session and retrying..."
        )

        # Force a fresh session (bypasses the versioned restore)
        save_composio_session_id(user_id=user_id, session_id="")
        session = get_or_create_session(user_id)

        return session.execute(tool_slug, arguments=arguments)


def _toolkit_needs_auth_config(exc: Exception) -> bool:
    """Detect Composio error 4300 (toolkit requires auth config)."""
    text = str(exc)
    return (
        "auth configs" in text
        and "cannot be auto-created" in text
    )


def list_connected_accounts(user_id: str):
    """
    Return active Composio connected accounts for this user.
    """
    response = composio.connected_accounts.list(
        user_ids=[user_id],
        statuses=["ACTIVE"],
    )
    return getattr(response, "items", [])
