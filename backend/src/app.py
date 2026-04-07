"""
Flask application entry point.
Run with: python src/app.py   (dev)
         gunicorn src.app:app  (prod)
"""
import os
from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ── Load .env ────────────────────────────────────────────────────────────────
load_dotenv()

# ── Create app ───────────────────────────────────────────────────────────────
app = Flask(__name__)

# ── CORS — allow Next.js dev/prod origins ────────────────────────────────────
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
CORS(app, resources={r"/api/*": {"origins": allowed_origins}}, supports_credentials=True)

# ── Register Blueprints ───────────────────────────────────────────────────────
from src.routes.ai_routes        import ai_bp
from src.routes.event_routes     import events_bp
from src.routes.analytics_routes import analytics_bp

app.register_blueprint(ai_bp)
app.register_blueprint(events_bp)
app.register_blueprint(analytics_bp)

# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    from src.services.mongo_service import ping
    try:
        db_ok = ping()
    except Exception:
        db_ok = False
    return jsonify({
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "unavailable",
        "service": "AUEventHub Flask Backend",
    }), 200 if db_ok else 503


# ── 404 handler ──────────────────────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found"}), 404


# ── 500 handler ──────────────────────────────────────────────────────────────
@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Internal server error", "detail": str(e)}), 500


# ── Dev entry ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_ENV", "development") == "development"
    print(f"🚀 AUEventHub Flask backend running on http://localhost:{port}")
    print(f"   CORS allowed: {allowed_origins}")
    app.run(host="0.0.0.0", port=port, debug=debug)
