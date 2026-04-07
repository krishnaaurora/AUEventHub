const { applyCors } = require("./_lib/cors");

const events = [
  {
    id: "evt-001",
    title: "AI Innovation Summit",
    category: "Technology",
    date: "2026-04-12",
    venue: "Main Auditorium"
  },
  {
    id: "evt-002",
    title: "Cultural Fest",
    category: "Culture",
    date: "2026-04-20",
    venue: "Open Air Theater"
  },
  {
    id: "evt-003",
    title: "Startup Pitch Day",
    category: "Entrepreneurship",
    date: "2026-05-05",
    venue: "Innovation Hub"
  }
];

module.exports = (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method === "GET") {
    return res.status(200).json({ items: events, count: events.length });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "object" && req.body ? req.body : {};
    const title = String(body.title || "Untitled Event");

    return res.status(201).json({
      id: `evt-${Date.now()}`,
      title,
      category: String(body.category || "General"),
      date: String(body.date || new Date().toISOString().slice(0, 10)),
      venue: String(body.venue || "TBD"),
      persisted: false,
      note: "This demo endpoint is stateless on serverless runtime."
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
