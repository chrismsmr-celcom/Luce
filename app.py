import os
import uuid

from dotenv import load_dotenv

from flask import (
    Flask,
    jsonify,
    redirect,
    render_template,
    request,
    session,
)

from agent import process_message

from composio_service import (
    authorize_toolkit,
    list_connected_accounts,
)

from database import (
    create_user,
    get_messages,
    init_db,
)


load_dotenv()


app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static",
)


app.secret_key = os.getenv("FLASK_SECRET_KEY")


if not app.secret_key:
    raise RuntimeError("FLASK_SECRET_KEY is missing")


init_db()


def get_user_id():
    """
    Return the persistent Luce user ID.

    This is a prototype identity system.

    In production, replace this with the authenticated
    user's real database ID.
    """

    if "user_id" not in session:

        user_id = "luce_" + uuid.uuid4().hex

        session.permanent = True
        session["user_id"] = user_id
        create_user(user_id)

    return session["user_id"]


@app.get("/")
def index():
    get_user_id()
    return render_template("index.html")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "luce"})


@app.post("/api/connect/<toolkit>")
def connect_toolkit(toolkit):

    # Tous les toolkits autorisés pour la connexion
    allowed_toolkits = {
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
    }

    if toolkit not in allowed_toolkits:
        return jsonify({"error": "Unsupported toolkit"}), 400

    user_id = get_user_id()

    try:

        callback_url = (
            request.host_url.rstrip("/")
            + "/api/composio/callback"
        )

        connection = authorize_toolkit(
            user_id=user_id,
            toolkit=toolkit,
            callback_url=callback_url,
        )

        return jsonify(connection)

    except Exception as exc:

        app.logger.exception("Composio authorization failed")
        return jsonify({"error": str(exc)}), 500


@app.get("/api/composio/callback")
def composio_callback():
    # Composio completes the connection flow.
    # We simply return the user to Luce.
    return redirect("/")


@app.get("/api/connections")
def connections():

    user_id = get_user_id()

    try:

        accounts = list_connected_accounts(user_id)

        # Tous les toolkits suivis dans le statut
        result = {
            "gmail": False,
            "googlecalendar": False,
            "googledrive": False,
            "github": False,
            "twitter": False,
            "whatsapp": False,
            "supabase": False,
            "googlesheets": False,
            "googlephotos": False,
            "googlesearchconsole": False,
        }

        for account in accounts:

            toolkit = getattr(
                getattr(account, "toolkit", None),
                "slug",
                "",
            )

            toolkit = str(toolkit).lower()

            if toolkit in result:
                result[toolkit] = True

        return jsonify(result)

    except Exception as exc:

        app.logger.exception("Could not retrieve connections")
        return jsonify({"error": str(exc)}), 500


@app.get("/api/history")
def history():

    user_id = get_user_id()
    messages = get_messages(user_id)

    return jsonify({"messages": messages})


@app.post("/api/chat")
def chat():

    user_id = get_user_id()

    data = request.get_json(silent=True) or {}

    message = str(data.get("message", "")).strip()

    if not message:
        return jsonify({"error": "Message is required"}), 400

    try:

        result = process_message(
            user_id=user_id,
            message=message,
        )

        return jsonify(result)

    except Exception as exc:

        app.logger.exception("Luce processing failed")
        return jsonify({"error": str(exc)}), 500


@app.post("/api/logout")
def logout():
    session.clear()
    return jsonify({"success": True})


if __name__ == "__main__":

    port = int(os.getenv("PORT", "10000"))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )
