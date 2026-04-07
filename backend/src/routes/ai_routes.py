"""
AI routes — /api/ai/*
Handles: chat, description generation, approval letter generation.
These were previously in Next.js API routes — now correctly in Flask.
"""
from flask import Blueprint, request, jsonify
from src.services.ai_service import (
    chat_with_riya,
    generate_event_description,
    generate_approval_letter,
)

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")


@ai_bp.route("/chat", methods=["POST"])
def chat():
    """POST /api/ai/chat  — RIYA AI assistant (was /api/chat in Next.js)"""
    data = request.get_json(silent=True) or {}
    message = str(data.get("message", "")).strip()

    if not message:
        return jsonify({"error": "message is required"}), 400

    result = chat_with_riya(message)
    return jsonify(result)


@ai_bp.route("/description", methods=["POST"])
def description():
    """POST /api/ai/description  — AI event description generator (was /api/organizer/ai-description)"""
    data = request.get_json(silent=True) or {}
    title    = str(data.get("title",      "")).strip()
    category = str(data.get("category",   "")).strip()

    if not title or not category:
        return jsonify({"error": "title and category are required"}), 400

    result = generate_event_description(
        title=title,
        category=category,
        department=str(data.get("department", "")),
        venue=str(data.get("venue", "")),
    )
    return jsonify(result)


@ai_bp.route("/approval-letter", methods=["POST"])
def approval_letter():
    """POST /api/ai/approval-letter  — Formal letter generator (was /api/organizer/approval-letter)"""
    data = request.get_json(silent=True) or {}

    required = ["title", "category", "venue", "start_date"]
    for field in required:
        if not str(data.get(field, "")).strip():
            return jsonify({"error": f"{field} is required"}), 400

    result = generate_approval_letter(
        title=str(data.get("title", "")),
        category=str(data.get("category", "")),
        department=str(data.get("department", "")),
        venue=str(data.get("venue", "")),
        start_date=str(data.get("start_date", "")),
        end_date=str(data.get("end_date", "")),
        start_time=str(data.get("start_time", "")),
        end_time=str(data.get("end_time", "")),
        organizer=str(data.get("organizer", "")),
        description=str(data.get("description", "")),
        max_participants=data.get("max_participants"),
        guest_speakers=str(data.get("guest_speakers", "")),
    )
    return jsonify(result)
