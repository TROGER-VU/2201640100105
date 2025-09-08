require("dotenv").config();
const AUTH_TOKEN = process.env.AUTH_TOKEN || "my-secret-token";

function authMiddleware(req, res, next) {
  const token = req.headers["authorization"];
  if (!token || token !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

module.exports = authMiddleware;