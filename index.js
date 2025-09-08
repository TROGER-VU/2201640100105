require("dotenv").config();
const express = require("express");
const { customAlphabet } = require("nanoid");
const { log, loggingMiddleware } = require("./middleware/logger");
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(express.json());
app.use(loggingMiddleware("router"));
const port = process.env.PORT || 3000;

const urlStore = {};
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

function getExpiry(validityMinutes = 30) {
  const now = new Date();
  return new Date(now.getTime() + Math.min(validityMinutes, 30) * 60000);
}

app.post("/shorturls", authMiddleware, (req, res) => {
  const { url, validity = 30, shortcode } = req.body;

  if (!url || typeof url !== "string") {
    log("backend", "error", "controller", "Malformed request: missing or invalid URL");
    return res.status(400).json({ error: "Invalid URL" });
  }

  const code = shortcode || nanoid();

  if (urlStore[code]) {
    log("backend", "error", "controller", `Shortcode collision: ${code}`);
    return res.status(409).json({ error: "Shortcode already in use" });
  }

  const expiry = getExpiry(validity);
  const createdAt = new Date();

  urlStore[code] = {
    url,
    createdAt,
    expiry,
    clicks: 0,
    history: [],
  };

  log("backend", "info", "service", `Short URL created: ${code}`);
  res.json({
    shortUrl: `${req.protocol}://${req.get("host")}/${code}`,
    expiry: expiry.toISOString(),
  });
});

app.get("/:shortcode", authMiddleware, (req, res) => {
  const { shortcode } = req.params;
  const entry = urlStore[shortcode];

  if (!entry) {
    log("backend", "warn", "controller", `Shortcode not found: ${shortcode}`);
    return res.status(404).json({ error: "Short URL not found" });
  }

  const now = new Date();
  if (now > entry.expiry) {
    log("backend", "warn", "controller", `Expired link: ${shortcode}`);
    return res.status(410).json({ error: "Link expired" });
  }

  entry.clicks += 1;
  entry.history.push({
    timestamp: now.toISOString(),
    referrer: req.get("referer") || "direct",
  });

  log("backend", "info", "service", `Redirecting ${shortcode} to ${entry.url}`);
  res.redirect(entry.url);
});


app.get("/shorturls/:shortcode", authMiddleware, (req, res) => {
  const { shortcode } = req.params;
  const entry = urlStore[shortcode];

  if (!entry) {
    return res.status(404).json({ error: "Short URL not found" });
  }

  res.json({
    originalUrl: entry.url,
    createdAt: entry.createdAt.toISOString(),
    expiry: entry.expiry.toISOString(),
    clicks: entry.clicks,
    history: entry.history,
  });
});

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
});