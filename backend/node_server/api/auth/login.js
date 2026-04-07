const { applyCors } = require("../_lib/cors");

module.exports = (req, res) => {
  if (applyCors(req, res)) {
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  if (email !== "admin@aieventmang.com" || password !== "admin123") {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  return res.status(200).json({
    token: "demo-token-123",
    user: {
      name: "Admin User",
      role: "admin",
      email: "admin@aieventmang.com"
    }
  });
};
