"""
Event routes — /api/events/*
Handles: clash detection, venue schedule (heavy DB queries).
Was previously in Next.js API routes — correctly moved to Flask.
"""
import re
from flask import Blueprint, request, jsonify
from src.services.mongo_service import get_collection, EVENTS

events_bp = Blueprint("events", __name__, url_prefix="/api/events")


# ── Helpers ──────────────────────────────────────────────────────────────────

def _time_to_minutes(t: str) -> int:
    if not t:
        return 0
    parts = str(t).split(":")
    h = int(parts[0]) if parts else 0
    m = int(parts[1]) if len(parts) > 1 else 0
    return h * 60 + m


def _minutes_to_time(mins: int) -> str:
    h = mins // 60
    m = mins % 60
    ampm = "PM" if h >= 12 else "AM"
    display_h = h % 12 or 12
    return f"{display_h:02d}:{m:02d} {ampm}"


# ── Routes ───────────────────────────────────────────────────────────────────

@events_bp.route("/clash-detection", methods=["POST"])
def clash_detection():
    """
    POST /api/events/clash-detection
    Was: /api/organizer/clash-detection in Next.js.
    Heavy MongoDB query — correct to run in Flask.
    """
    data = request.get_json(silent=True) or {}
    venue      = str(data.get("venue",      "")).strip()
    start_date = str(data.get("start_date", "")).strip()
    end_date   = str(data.get("end_date",   start_date)).strip()
    start_time = str(data.get("start_time", "")).strip()
    end_time   = str(data.get("end_time",   "")).strip()

    if not venue or not start_date or not start_time:
        return jsonify({"error": "venue, start_date, and start_time are required"}), 400

    req_start = _time_to_minutes(start_time)
    req_end   = _time_to_minutes(end_time) if end_time else req_start + 60

    # Escape regex special chars in venue name
    safe_venue = re.escape(venue)
    query = {
        "venue":  {"$regex": f"^{safe_venue}$", "$options": "i"},
        "status": {"$nin": ["rejected", "cancelled"]},
        "$or": [
            {"start_date": {"$gte": start_date, "$lte": end_date}},
            {"end_date":   {"$gte": start_date, "$lte": end_date}},
            {"start_date": {"$lte": start_date}, "end_date": {"$gte": end_date}},
            {"date":       {"$gte": start_date, "$lte": end_date}},
        ],
    }

    try:
        collection = get_collection(EVENTS)
        overlapping = list(collection.find(query))
    except Exception as e:
        return jsonify({"error": "Database error", "detail": str(e)}), 500

    clashing = [
        ev for ev in overlapping
        if (lambda s, f: req_start < f and req_end > s)(
            _time_to_minutes(ev.get("start_time") or ev.get("time", "")),
            (_time_to_minutes(ev.get("end_time") or ev.get("start_time") or ev.get("time", "")) or
             _time_to_minutes(ev.get("start_time") or ev.get("time", "")) + 60),
        )
    ]

    if clashing:
        # Find first free slot
        busy = sorted(
            [
                (
                    _time_to_minutes(e.get("start_time") or e.get("time", "")),
                    _time_to_minutes(e.get("end_time") or e.get("start_time") or e.get("time", "")) or
                    _time_to_minutes(e.get("start_time") or e.get("time", "")) + 60,
                )
                for e in overlapping
            ],
            key=lambda x: x[0],
        )
        current = 480  # 8 AM
        duration = req_end - req_start
        suggestion = None
        for s, f in busy:
            if s - current >= duration:
                suggestion = _minutes_to_time(current)
                break
            current = max(current, f)
        if not suggestion:
            suggestion = _minutes_to_time(current)

        return jsonify({
            "hasClash": True,
            "message": f'Venue "{venue}" is busy at {start_time}.',
            "suggestion": f"Suggested: {suggestion} on {start_date}",
            "clashes": [
                {
                    "title": e.get("title"),
                    "start_date": e.get("start_date") or e.get("date"),
                    "start_time": e.get("start_time") or e.get("time"),
                    "end_time": e.get("end_time", ""),
                }
                for e in clashing
            ],
        })

    return jsonify({
        "hasClash": False,
        "message": f'No scheduling conflicts found at "{venue}".',
        "clashes": [],
    })


@events_bp.route("/venue-schedule", methods=["GET"])
def venue_schedule():
    """
    GET /api/events/venue-schedule?venue=Main+Auditorium&date=2025-10-01
    Returns all events scheduled at a venue on a given date.
    """
    venue = request.args.get("venue", "").strip()
    date  = request.args.get("date",  "").strip()

    if not venue or not date:
        return jsonify({"error": "venue and date are required"}), 400

    safe_venue = re.escape(venue)
    query = {
        "venue": {"$regex": f"^{safe_venue}$", "$options": "i"},
        "status": {"$nin": ["rejected", "cancelled"]},
        "$or": [
            {"start_date": date},
            {"date": date},
        ],
    }

    try:
        collection = get_collection(EVENTS)
        events = list(collection.find(query, {"_id": 1, "title": 1, "start_time": 1, "end_time": 1, "status": 1}))
        # Convert ObjectId to str
        for e in events:
            e["_id"] = str(e["_id"])
        return jsonify({"items": events})
    except Exception as e:
        return jsonify({"error": "Database error", "detail": str(e)}), 500
