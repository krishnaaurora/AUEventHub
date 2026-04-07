"""
MongoDB service — single connection pool shared across all Flask requests.
Uses pymongo's built-in connection pooling (thread-safe).
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv

load_dotenv()

_client: MongoClient = None
_db = None


def get_db():
    """Return a cached MongoDB database instance."""
    global _client, _db
    if _db is None:
        uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        db_name = os.getenv("MONGODB_DB", "ai_eventmang")
        _client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        _db = _client[db_name]
    return _db


def get_collection(name: str):
    """Shortcut to get a collection by name."""
    return get_db()[name]


# ── Collection name constants ────────────────────────────────────────────────
EVENTS          = "events"
EVENT_DETAILS   = "event_details"
EVENT_APPROVALS = "event_approvals"
EVENT_VIEWS     = "event_views"
NOTIFICATIONS   = "notifications"
USERS           = "users"
AI_DATA         = "event_ai_data"
FEEDBACK        = "event_feedback"


def ping():
    """Health-check: returns True if MongoDB is reachable."""
    try:
        get_db().command("ping")
        return True
    except ConnectionFailure:
        return False
