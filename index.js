require("dotenv").config();
const express = require('express');
const app = express();
const { customAlphabet } = require("nanoid");
const { log, loggingMiddleware } = require("./middleware/logger");
const port = 3000;

app.use(express.json());
app.use(loggingMiddleware("router"));

const urlMap = {};
const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

app.post("/shorten", (req, res) => {
  const { originalUrl } = req.body;

  if (!originalUrl || typeof originalUrl !== "string") {
    log("backend", "error", "controller", "Invalid URL format");
    return res.status(400).json({ error: "Invalid URL" });
  }

  const shortCode = nanoid();
  urlMap[shortCode] = originalUrl;

  log("backend", "info", "service", `Short URL created for ${originalUrl}`);
  res.json({ shortUrl: `${req.protocol}://${req.get("host")}/${shortCode}` });
});

app.get("/:shortCode", (req, res) => {
  const { shortCode } = req.params;
  const originalUrl = urlMap[shortCode];

  if (!originalUrl) {
    log("backend", "warn", "controller", `Short code ${shortCode} not found`);
    return res.status(404).send("Short URL not found");
  }

  log("backend", "info", "service", `Redirecting ${shortCode} to ${originalUrl}`);
  res.redirect(originalUrl);
});

app.listen(port, () => {
    console.log(`Server is running at ${port}`);
})