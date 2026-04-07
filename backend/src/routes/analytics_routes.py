"""
Analytics routes — /api/analytics/*
Heavy MongoDB aggregation pipelines. These should NEVER run in Next.js.
"""
from bson import ObjectId
from flask import Blueprint, request, jsonify
from src.services.mongo_service import get_collection, EVENTS, EVENT_APPROVALS, FEEDBACK

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


def _oid(v):
    try:
        return ObjectId(v)
    except Exception:
        return None


@analytics_bp.route("/organizer", methods=["GET"])
def organizer_analytics():
    """
    GET /api/analytics/organizer?organizer_id=<id>
    Returns comprehensive event analytics for an organizer.
    Heavy aggregation — was previously done client-side in Next.js useEffect chains.
    """
    organizer_id = request.args.get("organizer_id", "").strip()
    organizer    = request.args.get("organizer",    "").strip()

    if not organizer_id and not organizer:
        return jsonify({"error": "organizer_id or organizer is required"}), 400

    # Build match filter
    match = {}
    if organizer_id:
        match["$or"] = [
            {"organizer_id": organizer_id},
            {"organizer_id": _oid(organizer_id)},
        ]
    else:
        match["organizer"] = {"$regex": f"^{organizer}$", "$options": "i"}

    try:
        events_col = get_collection(EVENTS)

        # ── 1. Pipeline: status breakdown + registration counts ──────────────
        pipeline = [
            {"$match": match},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                }
            },
        ]
        status_agg = list(events_col.aggregate(pipeline))
        status_map = {item["_id"]: item["count"] for item in status_agg}

        # ── 2. Total events ──────────────────────────────────────────────────
        total = sum(status_map.values())

        # ── 3. Monthly trend ─────────────────────────────────────────────────
        trend_pipeline = [
            {"$match": match},
            {
                "$group": {
                    "_id": {
                        "month": {"$substr": [{"$ifNull": ["$start_date", "$date"]}, 0, 7]}
                    },
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id.month": 1}},
            {"$limit": 12},
        ]
        monthly_trend = [
            {"month": item["_id"]["month"], "events": item["count"]}
            for item in events_col.aggregate(trend_pipeline)
        ]

        # ── 4. Category breakdown ────────────────────────────────────────────
        cat_pipeline = [
            {"$match": match},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
        ]
        categories = [
            {"category": item["_id"] or "Other", "count": item["count"]}
            for item in events_col.aggregate(cat_pipeline)
        ]

        return jsonify({
            "total": total,
            "pending": status_map.get("pending_dean", 0)
                     + status_map.get("pending_registrar", 0)
                     + status_map.get("pending_vc", 0)
                     + status_map.get("pending", 0),
            "approved": status_map.get("approved", 0) + status_map.get("published", 0),
            "rejected": status_map.get("rejected", 0),
            "monthly_trend": monthly_trend,
            "categories": categories,
        })

    except Exception as e:
        return jsonify({"error": "Analytics aggregation failed", "detail": str(e)}), 500


@analytics_bp.route("/platform", methods=["GET"])
def platform_analytics():
    """
    GET /api/analytics/platform
    Admin-level platform-wide stats with pre-calculated aggregations.
    """
    try:
        db = get_collection(EVENTS).database
        events_col = db[EVENTS]
        regs_col = db["registrations"]
        views_col = db["event_views"]

        # Basic counts
        total = events_col.count_documents({})
        approved = events_col.count_documents({"status": {"$in": ["approved", "published"]}})
        pending = events_col.count_documents(
            {"status": {"$in": ["pending_dean", "pending_registrar", "pending_vc", "pending"]}}
        )
        rejected = events_col.count_documents({"status": "rejected"})

        # Top categories
        cat_pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        top_categories = [
            {"category": item["_id"] or "Other", "count": item["count"]}
            for item in events_col.aggregate(cat_pipeline)
        ]

        # Department breakdown
        dept_pipeline = [
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5},
        ]
        top_departments = [
            {"department": item["_id"] or "Other", "count": item["count"]}
            for item in events_col.aggregate(dept_pipeline)
        ]

        # Total registrations across all events
        total_registrations = regs_col.count_documents({})

        # Platform trending score (sum of all event trending scores)
        trending_pipeline = [
            {"$group": {"_id": None, "total": {"$sum": {"$toDouble": {"$ifNull": ["$trending_score", 0]}}}}}
        ]
        trending_result = list(views_col.aggregate(trending_pipeline))
        platform_trending_score = round(trending_result[0]["total"], 2) if trending_result else 0

        # Monthly event creation trend
        monthly_pipeline = [
            {"$group": {
                "_id": {
                    "month": {"$substr": [{"$ifNull": ["$created_at", "$start_date"]}, 0, 7]}
                },
                "count": {"$sum": 1},
            }},
            {"$sort": {"_id.month": 1}},
            {"$limit": 12},
        ]
        monthly_trend = [
            {"month": item["_id"]["month"], "events": item["count"]}
            for item in events_col.aggregate(monthly_pipeline)
        ]

        return jsonify({
            "total": total,
            "approved": approved,
            "pending": pending,
            "rejected": rejected,
            "total_registrations": total_registrations,
            "platform_trending_score": platform_trending_score,
            "top_categories": top_categories,
            "top_departments": top_departments,
            "monthly_trend": monthly_trend,
        })

    except Exception as e:
        return jsonify({"error": "Platform analytics failed", "detail": str(e)}), 500


@analytics_bp.route("/organizer-stats", methods=["GET"])
def organizer_stats():
    """
    GET /api/analytics/organizer-stats?organizer_id=<id>
    Pre-calculated stats for the organizer dashboard server component.
    Replaces JS-side filtering in Next.js OrganizerDashboardPage.

    Returns:
      stats   – { total, pending, approved, rejected, registrations, trendingScore }
      upcoming – next 5 upcoming events with embedded approval + view data
    """
    organizer_id = request.args.get("organizer_id", "").strip()
    organizer    = request.args.get("organizer",    "").strip()
    limit        = int(request.args.get("limit", 5))

    if not organizer_id and not organizer:
        return jsonify({"error": "organizer_id or organizer is required"}), 400

    # Build event match
    match = {}
    if organizer_id:
        match["$or"] = [
            {"organizer_id": organizer_id},
            {"organizer_id": _oid(organizer_id)},
        ]
    else:
        match["organizer"] = {"$regex": f"^{organizer}$", "$options": "i"}

    try:
        db            = get_collection(EVENTS).database
        events_col    = db[EVENTS]
        approvals_col = db[EVENT_APPROVALS]
        views_col     = db["event_views"]
        regs_col      = db["registrations"]

        # ── 1. Status counts (single aggregation) ───────────────────────────
        status_pipeline = [
            {"$match": match},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                }
            },
        ]
        status_map = {
            item["_id"]: item["count"]
            for item in events_col.aggregate(status_pipeline)
        }
        total    = sum(status_map.values())
        pending  = sum(status_map.get(s, 0) for s in ["pending_dean", "pending_registrar", "pending_vc", "pending"])
        approved = sum(status_map.get(s, 0) for s in ["approved", "published"])
        rejected = status_map.get("rejected", 0)

        # ── 2. Collect event IDs for this organizer ──────────────────────────
        event_ids = [
            str(e["_id"])
            for e in events_col.find(match, {"_id": 1})
        ]

        # ── 3. Total registrations & trending score (parallel-style) ─────────
        registrations = regs_col.count_documents({"event_id": {"$in": event_ids}}) if event_ids else 0

        trending_pipeline = [
            {"$match": {"event_id": {"$in": event_ids}}},
            {"$group": {"_id": None, "total": {"$sum": {"$toDouble": {"$ifNull": ["$trending_score", 0]}}}}}
        ]
        trending_result   = list(views_col.aggregate(trending_pipeline))
        trending_score    = round(trending_result[0]["total"], 2) if trending_result else 0

        # ── 4. Upcoming events with approval + view data embedded ────────────
        today = __import__("datetime").date.today().isoformat()
        upcoming_events = list(
            events_col.find(
                {**match, "start_date": {"$gte": today}},
                {"poster": 0}  # exclude heavy base64 poster from dashboard payload
            )
            .sort("start_date", 1)
            .limit(limit)
        )

        upcoming_ids  = [str(e["_id"]) for e in upcoming_events]
        approval_map  = {
            str(a["event_id"]): a
            for a in approvals_col.find({"event_id": {"$in": upcoming_ids}})
        }
        views_map = {
            str(v["event_id"]): v
            for v in views_col.find({"event_id": {"$in": upcoming_ids}})
        }

        upcoming = []
        for ev in upcoming_events:
            eid = str(ev["_id"])
            ev["_id"] = eid
            ev["approval"] = approval_map.get(eid)
            ev["views"]    = views_map.get(eid)
            upcoming.append(ev)

        return jsonify({
            "stats": {
                "total":         total,
                "pending":       pending,
                "approved":      approved,
                "rejected":      rejected,
                "registrations": registrations,
                "trendingScore": trending_score,
            },
            "upcoming": upcoming,
        })

    except Exception as e:
        return jsonify({"error": "Organizer stats failed", "detail": str(e)}), 500


# ── Constants re-exported for convenience ───────────────────────────────────
from src.services.mongo_service import EVENT_APPROVALS  # noqa (already imported above via EVENTS)
