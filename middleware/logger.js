require("dotenv").config();
const axios = require("axios");

const LOG_API_URL = process.env.LOG_API_URL;

function log(stack, level, pkg, message) {
  axios.post(LOG_API_URL, {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: pkg.toLowerCase(),
    message,
  }).catch(err => {
    console.error("Logging failed:", err.message);
  });
}

function loggingMiddleware(pkg) {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const message = `${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`;
      log("backend", "info", pkg, message);
    });

    next();
  };
}

module.exports = { log, loggingMiddleware };